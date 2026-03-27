export const DEFAULT_STATE = Object.freeze({
  currentRating: null,
  startRating: null,
  delta: 0.03,
  lossDelta: 0.05,
  matches: [],
  accessoryCosts: [],
  levelDefined: false,
  estimatedLevel: null
});

export function createDefaultState() {
  return {
    currentRating: null,
    startRating: null,
    delta: 0.03,
    lossDelta: 0.05,
    matches: [],
    accessoryCosts: [],
    levelDefined: false,
    estimatedLevel: null
  };
}

export function normalizeState(raw = {}) {
  const state = createDefaultState();
  state.currentRating = toNullableNumber(raw.currentRating);
  state.startRating = toNullableNumber(raw.startRating);
  state.delta = toNumber(raw.delta, 0.03);
  state.lossDelta = toNumber(raw.lossDelta, 0.05);
  state.levelDefined = !!raw.levelDefined;
  state.estimatedLevel = toNullableNumber(raw.estimatedLevel);
  state.matches = Array.isArray(raw.matches) ? raw.matches.map(normalizeMatch).filter(Boolean) : [];
  state.accessoryCosts = Array.isArray(raw.accessoryCosts) ? raw.accessoryCosts.map(normalizeAccessoryCost).filter(Boolean) : [];
  return state;
}

export function normalizeMatch(match) {
  if (!match) return null;
  return {
    id: match.id ?? null,
    result: match.result === 'loss' ? 'loss' : 'win',
    court: String(match.court || '').trim() || 'Terrain inconnu',
    date: String(match.date || '').slice(0, 10),
    cost: roundMoney(match.cost || 0),
    notes: String(match.notes || '').trim(),
    before: toNumber(match.before, 0),
    after: toNumber(match.after, 0),
    change: toNumber(match.change, 0)
  };
}

export function normalizeAccessoryCost(item) {
  if (!item) return null;
  return {
    id: item.id ?? null,
    date: String(item.date || '').slice(0, 10),
    amount: roundMoney(item.amount || 0),
    category: String(item.category || 'Accessoire').trim() || 'Accessoire',
    court: String(item.court || '').trim(),
    notes: String(item.notes || '').trim()
  };
}

export function computeMatchDraft(state, result, form) {
  if (!state.levelDefined || !state.currentRating) {
    return { error: 'Définis d’abord ton niveau avant d’enregistrer un match.' };
  }
  const cost = toNumber(form.cost, 0);
  if (cost < 0) return { error: 'Le coût ne peut pas être négatif.' };
  const before = toNumber(state.currentRating, 0);
  const change = result === 'win' ? toNumber(state.delta, 0.03) : -toNumber(state.lossDelta, 0.05);
  const after = Math.max(0, Number((before + change).toFixed(2)));
  return {
    value: normalizeMatch({
      result,
      court: form.court,
      date: form.date,
      cost,
      notes: form.notes,
      before,
      after,
      change
    })
  };
}

export function computeAccessoryDraft(form) {
  const amount = toNumber(form.amount, 0);
  if (amount <= 0) return { error: 'Entre un coût accessoire supérieur à 0.' };
  return {
    value: normalizeAccessoryCost({
      date: form.date,
      amount,
      category: form.category,
      court: form.court,
      notes: form.notes
    })
  };
}

export function applyLevel(state, level) {
  const numeric = Number(level);
  if (!numeric || Number.isNaN(numeric) || numeric < 1 || numeric > 10) {
    return { error: 'Entre un niveau entre 1 et 10.' };
  }
  const value = Number(numeric.toFixed(2));
  return {
    ...state,
    startRating: value,
    currentRating: value,
    levelDefined: true
  };
}

export function appendMatch(state, match) {
  return {
    ...state,
    matches: [...state.matches, normalizeMatch(match)],
    currentRating: normalizeMatch(match).after
  };
}

export function appendAccessoryCost(state, item) {
  return {
    ...state,
    accessoryCosts: [...state.accessoryCosts, normalizeAccessoryCost(item)]
  };
}

export function getStats(state) {
  const wins = state.matches.filter((m) => m.result === 'win').length;
  const spentMatches = state.matches.reduce((sum, item) => sum + toNumber(item.cost, 0), 0);
  const spentAccessories = state.accessoryCosts.reduce((sum, item) => sum + toNumber(item.amount, 0), 0);
  const spent = spentMatches + spentAccessories;
  const winRate = state.matches.length ? Math.round((wins / state.matches.length) * 100) : 0;
  const counts = {};
  state.matches.forEach((match) => {
    counts[match.court] = (counts[match.court] || 0) + 1;
  });
  const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  return { wins, spent, spentMatches, spentAccessories, winRate, fav };
}

export function getCostEntries(state) {
  const matchEntries = state.matches.map((match) => ({
    type: 'match',
    id: match.id ?? `match-${match.date}-${match.court}-${match.before}`,
    date: match.date,
    amount: roundMoney(match.cost),
    title: match.court,
    subtitle: match.result === 'win' ? 'Match gagné' : 'Match perdu',
    notes: match.notes,
    groupKey: match.court,
    groupLabel: match.court,
    meta: match.result === 'win' ? 'Match' : 'Match'
  }));
  const accessoryEntries = state.accessoryCosts.map((item) => ({
    type: 'accessory',
    id: item.id ?? `accessory-${item.date}-${item.category}-${item.amount}`,
    date: item.date,
    amount: roundMoney(item.amount),
    title: item.category,
    subtitle: item.court ? `Lié à ${item.court}` : 'Accessoire / extra',
    notes: item.notes,
    groupKey: item.category,
    groupLabel: item.category,
    meta: 'Accessoire'
  }));
  return [...matchEntries, ...accessoryEntries].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.amount - a.amount);
}

export function parsePeriod(dateString) {
  const [year, month] = String(dateString || '').split('-').map(Number);
  return { year: Number.isFinite(year) ? year : null, month: Number.isFinite(month) ? month : null };
}

export function filterCostEntries(entries, { year = 'all', month = 'all', scope = 'all' } = {}) {
  return entries.filter((entry) => {
    const period = parsePeriod(entry.date);
    if (scope !== 'all' && entry.type !== scope) return false;
    if (year !== 'all' && period.year !== Number(year)) return false;
    if (month !== 'all' && period.month !== Number(month)) return false;
    return true;
  });
}

export function summarizeCostEntries(entries) {
  const total = entries.reduce((sum, item) => sum + toNumber(item.amount, 0), 0);
  const matchesTotal = entries.filter((item) => item.type === 'match').reduce((sum, item) => sum + item.amount, 0);
  const accessoriesTotal = entries.filter((item) => item.type === 'accessory').reduce((sum, item) => sum + item.amount, 0);
  return { total: roundMoney(total), matchesTotal: roundMoney(matchesTotal), accessoriesTotal: roundMoney(accessoriesTotal) };
}

export function groupMatchCosts(entries, overallTotal) {
  const grouped = {};
  entries.filter((entry) => entry.type === 'match').forEach((entry) => {
    if (!grouped[entry.groupKey]) grouped[entry.groupKey] = { label: entry.groupLabel, total: 0, count: 0, lastDate: entry.date };
    grouped[entry.groupKey].total += entry.amount;
    grouped[entry.groupKey].count += 1;
    if (entry.date > grouped[entry.groupKey].lastDate) grouped[entry.groupKey].lastDate = entry.date;
  });
  return Object.values(grouped)
    .map((item) => ({ ...item, average: item.count ? roundMoney(item.total / item.count) : 0, share: overallTotal ? (item.total / overallTotal) * 100 : 0 }))
    .sort((a, b) => b.total - a.total || b.count - a.count || a.label.localeCompare(b.label));
}

export function groupAccessoryCosts(entries, overallTotal) {
  const grouped = {};
  entries.filter((entry) => entry.type === 'accessory').forEach((entry) => {
    if (!grouped[entry.groupKey]) grouped[entry.groupKey] = { label: entry.groupLabel, total: 0, count: 0, lastDate: entry.date };
    grouped[entry.groupKey].total += entry.amount;
    grouped[entry.groupKey].count += 1;
    if (entry.date > grouped[entry.groupKey].lastDate) grouped[entry.groupKey].lastDate = entry.date;
  });
  return Object.values(grouped)
    .map((item) => ({ ...item, average: item.count ? roundMoney(item.total / item.count) : 0, share: overallTotal ? (item.total / overallTotal) * 100 : 0 }))
    .sort((a, b) => b.total - a.total || b.count - a.count || a.label.localeCompare(b.label));
}

export function formatMoney(value) {
  return `${roundMoney(value).toFixed(2)} CHF`;
}

export function monthLabel(month) {
  return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][month - 1] || `Mois ${month}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toNullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundMoney(value) {
  return Number(toNumber(value, 0).toFixed(2));
}
