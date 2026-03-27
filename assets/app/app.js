import {
  createDefaultState,
  normalizeState,
  normalizeMatch,
  normalizeAccessoryCost,
  computeMatchDraft,
  computeAccessoryDraft,
  applyLevel,
  appendMatch,
  appendAccessoryCost,
  getStats,
  getCostEntries,
  filterCostEntries,
  summarizeCostEntries,
  groupMatchCosts,
  groupAccessoryCosts,
  formatMoney,
  monthLabel,
  parsePeriod
} from './core.js';

const SUPABASE_URL = 'https://gyujokyeanbznzrroigr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dWpva3llYW5iem56cnJvaWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Njk4OTksImV4cCI6MjA4OTE0NTg5OX0.eg9ci6hUnfozuPJWLFon-rYOyPTwm6CzcINb_ao8zrU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'padelstats-auth-v2' }
});

const APP_KEY = 'padelstats-user-state-v3';
const REMEMBER_KEY = 'padelstats-remember-me';
const PENDING_MATCHES_KEY = 'padelstats-pending-matches-v1';
const PENDING_ACCESSORY_COSTS_KEY = 'padelstats-pending-accessory-costs-v1';
const PENDING_PROFILE_KEY = 'padelstats-pending-profile-v1';
const INSTALL_DISMISSED_KEY = 'padelstats-install-dismissed-v1';
const LAST_SYNC_KEY = 'padelstats-last-sync-v1';
const ACCESSORY_CATEGORIES = ['Balles', 'Location matériel', 'Boisson', 'Coaching', 'Transport', 'Autre'];
const viewMeta = {
  home: { title: 'Accueil', copy: 'Cockpit mobile priorisant niveau, ajout rapide et lecture instantanée des stats.' },
  courts: { title: 'Terrains', copy: 'Liste claire des spots avec détail rapide et accès Maps.' },
  level: { title: 'Niveau', copy: 'Écran centré sur la définition du niveau de départ et son estimation.' },
  costs: { title: 'Coûts', copy: 'Dépenses match et accessoires séparées, lisibles, filtrables.' },
  events: { title: 'Plus', copy: 'Espace séparé pour les prochaines briques produit sans polluer le cœur mobile.' }
};
const courtDetails = [
  {name:'AirPad La Praille',address:'Rte des Jeunes 28, 1212 Grand-Lancy',photo:'AirPad La Praille',image:'./assets/courts/airpad-lapraille.svg',sourceLabel:'Repérage local · vue type maps',desc:'Repérage visuel provisoire centré sur le site de La Praille, pour rendre la fiche plus concrète en démo locale/LAN en attendant la vraie photo officielle.'},
  {name:'AirPad Les Acacias',address:'Rue Boissonnas 11, 1227 Genève',photo:'AirPad Les Acacias',image:'./assets/courts/airpad-acacias.svg',sourceLabel:'Repérage local · vue type maps',desc:'Visuel de contexte provisoire autour des Acacias, utile pour distinguer rapidement le spot dans l’interface et les projections produit.'},
  {name:'Champel',address:'Champel, Genève',photo:'Champel',image:'./assets/courts/champel.svg',sourceLabel:'Repérage local · vue type maps',desc:'Vue de repérage provisoire pour Champel, plus crédible qu’un placeholder générique et mieux adaptée aux tests mobile-first.'},
  {name:'Vessy',address:'Route de Vessy 31, 1234 Vessy',photo:'Vessy',image:'./assets/courts/vessy.svg',sourceLabel:'Repérage local · vue type maps',desc:'Visuel de contexte provisoire pour Vessy avec repère terrain, afin de garder une navigation cohérente avant l’arrivée des photos officielles.'},
  {name:'Chambésy',address:'Chambésy, Genève',photo:'Chambésy',image:'./assets/courts/chambesy.svg',sourceLabel:'Repérage local · vue type maps',desc:'Repérage provisoire spécifique à Chambésy, pour éviter les doublons visuels et renforcer l’impression de produit déjà concret.'},
  {name:'La Jonction',address:'La Jonction, Genève',photo:'La Jonction',image:'./assets/courts/jonction.svg',sourceLabel:'Repérage local · vue type maps',desc:'Vue de contexte urbaine provisoire pour La Jonction, pensée pour rester propre dans la grille Terrains et le détail modal.'},
  {name:'Bernex',address:'Bernex, Genève',photo:'Bernex',image:'./assets/courts/bernex.svg',sourceLabel:'Repérage local · vue type maps',desc:'Repérage visuel provisoire côté Bernex, avec une identité distincte pour que chaque terrain paraisse réel dès la démo locale.'},
  {name:'Les Évaux',address:'Chemin François-Chavaz 110, 1213 Onex',photo:'Les Évaux',image:'./assets/courts/evaux.svg',sourceLabel:'Repérage local · vue type maps',desc:'Visuel provisoire de contexte pour Les Évaux, cohérent avec le reste de la section Terrains et prêt pour la projection produit.'}
];

const $ = (id) => document.getElementById(id);
const els = {
  publicLanding:$('publicLanding'), appArea:$('appArea'), bottomNav:$('bottomNav'), openAuth:$('openAuth'), logoutBtn:$('logoutBtn'), mobileLogoutBtn:$('mobileLogoutBtn'), authStatus:$('authStatus'), syncBanner:$('syncBanner'), installBanner:$('installBanner'), installBannerTitle:$('installBannerTitle'), installBannerText:$('installBannerText'), installAppBtn:$('installAppBtn'), installLaterBtn:$('installLaterBtn'),
  ratingValue:$('ratingValue'), ratingDelta:$('ratingDelta'), progressBar:$('progressBar'), statMatches:$('statMatches'), statWinRate:$('statWinRate'), statSpent:$('statSpent'), favShort:$('favShort'), historyList:$('historyList'), allCourts:$('allCourts'), courtSelect:$('courtSelect'), startRating:$('startRating'), matchDate:$('matchDate'), costInput:$('costInput'), notes:$('notes'), quickWin:$('quickWin'), quickLoss:$('quickLoss'),
  authModal:$('authModal'), showLogin:$('showLogin'), showSignup:$('showSignup'), loginPanel:$('loginPanel'), signupPanel:$('signupPanel'), closeAuth:$('closeAuth'), closeAuth2:$('closeAuth2'), loginEmail:$('loginEmail'), loginPassword:$('loginPassword'), rememberMe:$('rememberMe'), signupEmail:$('signupEmail'), signupPassword:$('signupPassword'), loginSubmit:$('loginSubmit'), signupSubmit:$('signupSubmit'),
  courtModal:$('courtModal'), modalPhoto:$('modalPhoto'), modalTitle:$('modalTitle'), modalAddress:$('modalAddress'), modalDesc:$('modalDesc'), mapsLink:$('mapsLink'), closeModal:$('closeModal'), quizLevelTitle:$('quizLevelTitle'), quizLevelText:$('quizLevelText'), applyEstimatedLevel:$('applyEstimatedLevel'), manualLevel:$('manualLevel'), saveManualLevel:$('saveManualLevel'), accountSummary:$('accountSummary'), goToLevel:$('goToLevel'),
  costYearFilter:$('costYearFilter'), costMonthFilter:$('costMonthFilter'), costScopeFilter:$('costScopeFilter'), costHistoryList:$('costHistoryList'), accessoryHistoryList:$('accessoryHistoryList'), costPeriodLabel:$('costPeriodLabel'), costPeriodTotal:$('costPeriodTotal'), costCourtsCount:$('costCourtsCount'), costMatchesTotal:$('costMatchesTotal'), costAccessoriesTotal:$('costAccessoriesTotal'),
  accessoryDate:$('accessoryDate'), accessoryAmount:$('accessoryAmount'), accessoryCategory:$('accessoryCategory'), accessoryCourt:$('accessoryCourt'), accessoryNotes:$('accessoryNotes'), addAccessoryCost:$('addAccessoryCost'),
  mobileViewTitle:$('mobileViewTitle'), mobileViewCopy:$('mobileViewCopy'), heroRatingValue:$('heroRatingValue'), heroRatingDelta:$('heroRatingDelta'),
  focusTitle:$('focusTitle'), focusCopy:$('focusCopy'), recentForm:$('recentForm'), openQuickMatch:$('openQuickMatch'), quickMatchModal:$('quickMatchModal'), closeQuickMatch:$('closeQuickMatch'), quickCourtSelect:$('quickCourtSelect'), quickMatchDate:$('quickMatchDate'), quickCostInput:$('quickCostInput'), quickNotes:$('quickNotes'), quickFillFromMain:$('quickFillFromMain'), saveQuickMatch:$('saveQuickMatch'), bottomQuickAdd:$('bottomQuickAdd'), appToast:$('appToast'),
  trendHeadline:$('trendHeadline'), trendCopy:$('trendCopy'), trendChip:$('trendChip'), trendAreaPath:$('trendAreaPath'), trendLinePath:$('trendLinePath'), trendDots:$('trendDots'), trendStart:$('trendStart'), trendCurrent:$('trendCurrent'), trendDeltaValue:$('trendDeltaValue'),
  insightPrimaryTitle:$('insightPrimaryTitle'), insightPrimaryText:$('insightPrimaryText'), insightPrimaryChips:$('insightPrimaryChips'), budgetHeadline:$('budgetHeadline'), budgetCopy:$('budgetCopy'), budgetBarFill:$('budgetBarFill'), budgetChip:$('budgetChip'),
  appConnectionBadge:$('appConnectionBadge'), appConnectionTitle:$('appConnectionTitle'), appConnectionText:$('appConnectionText'),
  appSyncBadge:$('appSyncBadge'), appSyncTitle:$('appSyncTitle'), appSyncText:$('appSyncText'),
  appInstallBadge:$('appInstallBadge'), appInstallTitle:$('appInstallTitle'), appInstallText:$('appInstallText'),
  appAccountTitle:$('appAccountTitle'), appAccountText:$('appAccountText'), appLastSyncTitle:$('appLastSyncTitle'), appLastSyncText:$('appLastSyncText'),
  forceSyncBtn:$('forceSyncBtn'), revealInstallBtn:$('revealInstallBtn')
};

let state = createDefaultState();
let currentUser = null;
let syncError = null;
let booting = true;
let authRefreshLock = false;
let matchSaving = false;
let accessorySaving = false;
let deferredInstallPrompt = null;
let quickResult = 'win';
let toastTimer = null;
let syncInFlight = false;

function userStorageKey(uid){ return `${APP_KEY}:${uid}`; }
function lastSyncStorageKey(uid){ return `${LAST_SYNC_KEY}:${uid}`; }
function markLastSync(uid){ if(uid) localStorage.setItem(lastSyncStorageKey(uid), new Date().toISOString()); }
function readLastSync(uid){ return uid ? localStorage.getItem(lastSyncStorageKey(uid)) : ''; }
function formatRelativeDate(value){
  if(!value) return 'Pas encore';
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return 'Date inconnue';
  const diff = Date.now() - date.getTime();
  if(diff < 60_000) return 'À l’instant';
  if(diff < 3_600_000) return `Il y a ${Math.round(diff / 60_000)} min`;
  if(diff < 86_400_000) return `Il y a ${Math.round(diff / 3_600_000)} h`;
  return `Le ${date.toLocaleDateString('fr-CH')} à ${date.toLocaleTimeString('fr-CH', { hour:'2-digit', minute:'2-digit' })}`;
}
function getPendingCount(uid){ return uid ? getPendingMatches(uid).length + getPendingAccessoryCosts(uid).length : 0; }
function getNetworkState(){ return navigator.onLine ? 'online' : 'offline'; }
function pendingStorageKey(uid){ return `${PENDING_MATCHES_KEY}:${uid}`; }
function pendingAccessoryStorageKey(uid){ return `${PENDING_ACCESSORY_COSTS_KEY}:${uid}`; }
function pendingProfileStorageKey(uid){ return `${PENDING_PROFILE_KEY}:${uid}`; }
function getTodayLocalDate(){ const now = new Date(); const tz = now.getTimezoneOffset() * 60000; return new Date(now - tz).toISOString().slice(0,10); }
function fmt(n){ return Number(n).toFixed(2); }
function getStoredState(uid){ try { return normalizeState(JSON.parse(localStorage.getItem(userStorageKey(uid))||'{}')); } catch { return createDefaultState(); } }
function getPendingMatches(uid){ try { return (JSON.parse(localStorage.getItem(pendingStorageKey(uid))||'[]') || []).map(normalizeMatch).filter(Boolean); } catch { return []; } }
function setPendingMatches(uid, matches){ localStorage.setItem(pendingStorageKey(uid), JSON.stringify(matches)); }
function getPendingAccessoryCosts(uid){ try { return (JSON.parse(localStorage.getItem(pendingAccessoryStorageKey(uid))||'[]') || []).map(normalizeAccessoryCost).filter(Boolean); } catch { return []; } }
function setPendingAccessoryCosts(uid, items){ localStorage.setItem(pendingAccessoryStorageKey(uid), JSON.stringify(items)); }
function getPendingProfile(uid){ try { return normalizeState(JSON.parse(localStorage.getItem(pendingProfileStorageKey(uid))||'{}')); } catch { return null; } }
function setPendingProfile(uid, nextState){ if(!uid || !nextState) return; localStorage.setItem(pendingProfileStorageKey(uid), JSON.stringify({ startRating: nextState.startRating, currentRating: nextState.currentRating, delta: nextState.delta, lossDelta: nextState.lossDelta, levelDefined: nextState.levelDefined })); }
function clearPendingProfile(uid){ if(uid) localStorage.removeItem(pendingProfileStorageKey(uid)); }
function saveCache(){ if(currentUser) localStorage.setItem(userStorageKey(currentUser.id), JSON.stringify(state)); }
function setBusy(button, busy, busyText){ if(!button) return; if(!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent; button.disabled = busy; button.textContent = busy ? busyText : button.dataset.defaultLabel; }
function setBanner(kind, text){ if(!text){ els.syncBanner.className='status-banner hidden'; els.syncBanner.textContent=''; return; } els.syncBanner.className=`status-banner ${kind}`; els.syncBanner.textContent=text; }
function isStandaloneMode(){ return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function showToast(title, text=''){
  if(!els.appToast) return;
  els.appToast.innerHTML = `<strong>${title}</strong>${text ? `<span>${text}</span>` : ''}`;
  els.appToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(()=>els.appToast.classList.remove('show'), 2600);
}
function syncQuickMatchCourtOptions(){
  if(!els.quickCourtSelect) return;
  els.quickCourtSelect.innerHTML = els.courtSelect.innerHTML;
  if(els.courtSelect.value) els.quickCourtSelect.value = els.courtSelect.value;
}
function setQuickResult(next){
  quickResult = next === 'loss' ? 'loss' : 'win';
  document.querySelectorAll('[data-quick-result]').forEach((btn)=>btn.classList.toggle('active', btn.dataset.quickResult === quickResult));
}
function openQuickMatchModal(){
  syncQuickMatchCourtOptions();
  els.quickMatchDate.value = els.matchDate.value || getTodayLocalDate();
  els.quickCostInput.value = els.costInput.value || '';
  els.quickNotes.value = els.notes.value || '';
  els.quickMatchModal.classList.add('open');
}
function closeQuickMatchModal(){
  els.quickMatchModal.classList.remove('open');
}
function refreshFocusCard(stats){
  const recent = [...state.matches].slice(-5).reverse();
  if(!recent.length){
    els.focusTitle.textContent = state.levelDefined ? 'Ajoute ton premier match pour voir ta dynamique.' : 'Définis ton niveau pour lancer la progression.';
    els.focusCopy.textContent = state.levelDefined ? 'L’ajout rapide central donne maintenant une sensation plus app mobile et met à jour l’accueil immédiatement.' : 'Commence par fixer un niveau, puis utilise l’ajout rapide central pour alimenter la progression.';
    els.recentForm.innerHTML = '<span class="empty-streak">Aucune forme récente pour l’instant.</span>';
    return;
  }
  const wins = recent.filter((item)=>item.result === 'win').length;
  els.focusTitle.textContent = wins >= 3 ? 'Bonne dynamique : ton historique récent est positif.' : wins === 0 ? 'Série difficile : ajuste ton niveau ou enregistre le prochain rebond.' : 'Ta forme récente est partagée : lecture rapide prête.';
  els.focusCopy.textContent = `${recent.length} dernier(s) match(s) visibles d’un coup. ${stats.winRate}% de victoires sur l’ensemble actuel.`;
  els.recentForm.innerHTML = recent.map((item)=>`<span class="${item.result}">${item.result === 'win' ? 'W' : 'L'}</span>`).join('');
}
function refreshInstallBanner(){
  if(!els.installBanner) return;
  const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
  if(isStandaloneMode()){
    els.installBanner.hidden = false;
    els.installBannerTitle.textContent = 'Mode app actif';
    els.installBannerText.textContent = 'PadelStats tourne déjà comme une app installée, prêt pour un futur shell iPhone/Android.';
    els.installAppBtn.hidden = true;
    return;
  }
  if(deferredInstallPrompt && !dismissed){
    els.installBanner.hidden = false;
    els.installBannerTitle.textContent = 'Installer PadelStats';
    els.installBannerText.textContent = 'La base PWA est prête : tu peux déjà tester une installation locale avant le packaging store.';
    els.installAppBtn.hidden = false;
    return;
  }
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
  if(isIos && !dismissed){
    els.installBanner.hidden = false;
    els.installBannerTitle.textContent = 'Ajouter à l’écran d’accueil';
    els.installBannerText.textContent = 'Sur iPhone/iPad, utilise Partager → Sur l’écran d’accueil pour tester la future expérience app.';
    els.installAppBtn.hidden = true;
    return;
  }
  els.installBanner.hidden = true;
}
function openAuth(mode='login'){ els.authModal.classList.add('open'); const login = mode==='login'; els.loginPanel.classList.toggle('hidden', !login); els.signupPanel.classList.toggle('hidden', login); els.showLogin.classList.toggle('primary', login); els.showSignup.classList.toggle('primary', !login); }
window.openAuth = openAuth;
window.logoutUser = logoutUser;

function updateSyncBanner(){
  if(!currentUser){ setBanner('', ''); return; }
  const pending = getPendingCount(currentUser.id);
  if(!navigator.onLine){ setBanner('warn', pending ? `Hors ligne : ${pending} élément(s) restent en attente de synchro.` : 'Hors ligne : le shell reste utilisable, la synchro reprendra plus tard.'); return; }
  if(syncError && pending){ setBanner('warn', `Mode test local : ${pending} élément(s) en attente de synchro.`); return; }
  if(syncError){ setBanner('error', `Connexion cloud partielle : ${syncError}`); return; }
  if(pending){ setBanner('warn', `${pending} élément(s) en attente de synchro.`); return; }
  setBanner('ok', 'Session stable et données synchronisées.');
}

function setView(view){
  document.querySelectorAll('.view').forEach((v)=>v.classList.toggle('active', v.id==='view-'+view));
  document.querySelectorAll('[data-view]').forEach((b)=>b.classList.toggle('active', b.dataset.view===view));
  const meta = viewMeta[view] || viewMeta.home;
  els.mobileViewTitle.textContent = meta.title;
  els.mobileViewCopy.textContent = meta.copy;
  window.scrollTo({top:0, behavior:'smooth'});
}

async function logoutUser(){
  setBusy(els.logoutBtn, true, 'Déconnexion…');
  setBusy(els.mobileLogoutBtn, true, 'Quitte…');
  localStorage.setItem(REMEMBER_KEY,'false');
  try { await supabaseClient.auth.signOut(); } finally { resetToPublicMode(); setBusy(els.logoutBtn, false, ''); setBusy(els.mobileLogoutBtn, false, ''); }
}

function resetToPublicMode(){
  currentUser=null; state=createDefaultState(); syncError=null;
  els.publicLanding.classList.remove('hidden'); els.appArea.classList.add('hidden'); els.bottomNav.classList.add('hidden'); els.openAuth.classList.remove('hidden'); els.logoutBtn.classList.add('hidden');
  els.authStatus.style.display='none'; updateSyncBanner();
}
function switchToAppMode(user){
  currentUser=user; els.publicLanding.classList.add('hidden'); els.appArea.classList.remove('hidden'); els.bottomNav.classList.remove('hidden'); els.openAuth.classList.add('hidden'); els.logoutBtn.classList.remove('hidden');
  els.authStatus.style.display='block'; els.authStatus.textContent = syncError ? `Connecté : ${user.email} — mode dégradé local/LAN` : `Connecté : ${user.email}`; updateSyncBanner(); render();
}
async function ensureProfile(user){
  const {data:profile,error}=await supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if(error) throw error; if(profile) return profile;
  const cached=getStoredState(user.id);
  const payload={id:user.id,email:user.email,start_rating:cached.startRating,current_rating:cached.currentRating,delta:cached.delta,loss_delta:cached.lossDelta,level_defined:!!cached.levelDefined};
  const {data, error:insertError}=await supabaseClient.from('profiles').insert(payload).select('*').single();
  if(insertError) throw insertError; return data;
}
async function syncPendingMatches(user){
  const pending = [...getPendingMatches(user.id)]; if(!pending.length) return;
  while(pending.length){
    const match = pending[0];
    const { error } = await supabaseClient.from('matches').insert({user_id:user.id,result:match.result,court:match.court,match_date:match.date,cost:match.cost,notes:match.notes,before_rating:match.before,after_rating:match.after,rating_change:match.change});
    if(error) throw error;
    pending.shift();
    setPendingMatches(user.id, pending);
  }
}
async function syncPendingAccessoryCosts(user){
  const pending = [...getPendingAccessoryCosts(user.id)]; if(!pending.length) return;
  while(pending.length){
    const item = pending[0];
    const { error } = await supabaseClient.from('accessory_costs').insert({user_id:user.id,cost_date:item.date,amount:item.amount,category:item.category,court:item.court || null,notes:item.notes || null});
    if(error) throw error;
    pending.shift();
    setPendingAccessoryCosts(user.id, pending);
  }
}
async function syncPendingProfile(user){
  const pendingProfile = getPendingProfile(user.id);
  if(!pendingProfile?.levelDefined && pendingProfile?.startRating == null && pendingProfile?.currentRating == null) return;
  const payload={id:user.id,email:user.email,start_rating:pendingProfile.startRating,current_rating:pendingProfile.currentRating,delta:pendingProfile.delta,loss_delta:pendingProfile.lossDelta,level_defined:!!pendingProfile.levelDefined,updated_at:new Date().toISOString()};
  const {error}=await supabaseClient.from('profiles').upsert(payload);
  if(error) throw error;
  clearPendingProfile(user.id);
}
async function loadCloudState(user){
  const profile = await ensureProfile(user);
  await syncPendingMatches(user);
  await syncPendingAccessoryCosts(user);
  await syncPendingProfile(user);
  const [{data:matches,error:matchError},{data:accessories,error:accessoryError}] = await Promise.all([
    supabaseClient.from('matches').select('*').eq('user_id', user.id).order('match_date',{ascending:true}).order('id',{ascending:true}),
    supabaseClient.from('accessory_costs').select('*').eq('user_id', user.id).order('cost_date',{ascending:true}).order('id',{ascending:true})
  ]);
  if(matchError) throw matchError;
  if(accessoryError) throw accessoryError;
  const normalizedMatches = (matches||[]).map((m)=>({id:m.id,result:m.result,court:m.court,date:m.match_date,cost:m.cost,notes:m.notes,before:m.before_rating,after:m.after_rating,change:m.rating_change}));
  const lastMatch = normalizedMatches[normalizedMatches.length - 1] || null;
  state = normalizeState({
    startRating: profile.start_rating ?? lastMatch?.before ?? null,
    currentRating: lastMatch?.after ?? profile.current_rating,
    delta: profile.delta,
    lossDelta: profile.loss_delta,
    levelDefined: profile.level_defined || !!lastMatch,
    matches: normalizedMatches,
    accessoryCosts: (accessories||[]).map((item)=>({id:item.id,date:item.cost_date,amount:item.amount,category:item.category,court:item.court,notes:item.notes}))
  });
  markLastSync(user.id);
  saveCache();
}
async function saveProfile(snapshot = state){ if(!currentUser) return; const payload={id:currentUser.id,email:currentUser.email,start_rating:snapshot.startRating,current_rating:snapshot.currentRating,delta:snapshot.delta,loss_delta:snapshot.lossDelta,level_defined:!!snapshot.levelDefined,updated_at:new Date().toISOString()}; const {error}=await supabaseClient.from('profiles').upsert(payload); if(error) throw error; clearPendingProfile(currentUser.id); }
async function persistMatch(match){ const {error}=await supabaseClient.from('matches').insert({user_id:currentUser.id,result:match.result,court:match.court,match_date:match.date,cost:match.cost,notes:match.notes,before_rating:match.before,after_rating:match.after,rating_change:match.change}); if(error) throw error; }
async function persistAccessoryCost(item){ const {error}=await supabaseClient.from('accessory_costs').insert({user_id:currentUser.id,cost_date:item.date,amount:item.amount,category:item.category,court:item.court || null,notes:item.notes || null}); if(error) throw error; }

async function applySession(session){
  if(authRefreshLock) return;
  authRefreshLock = true;
  try {
    const remember = localStorage.getItem(REMEMBER_KEY) !== 'false';
    if(session?.user){
      if(!remember && booting){
        await supabaseClient.auth.signOut();
        resetToPublicMode();
        return;
      }
      currentUser=session.user;
      try { await loadCloudState(session.user); syncError=null; }
      catch(error){ state=getStoredState(session.user.id); syncError=error?.message || 'synchronisation impossible'; }
      switchToAppMode(session.user);
    } else {
      resetToPublicMode();
    }
  } finally { authRefreshLock = false; booting = false; }
}

function renderCourts(){
  els.courtSelect.innerHTML=''; els.accessoryCourt.innerHTML='<option value="">Sans terrain précis</option>'; els.allCourts.innerHTML='';
  courtDetails.forEach((c)=>{
    const option=document.createElement('option'); option.value=c.name; option.textContent=c.name; els.courtSelect.appendChild(option);
    const accessoryOption=document.createElement('option'); accessoryOption.value=c.name; accessoryOption.textContent=c.name; els.accessoryCourt.appendChild(accessoryOption);
    const card=document.createElement('article'); card.className='court-card'; const bg=c.image ? `style="background-image:url('${c.image}')"` : '';
    card.innerHTML=`<div class="court-photo" ${bg}><span>${c.photo}</span></div><div class="court-body"><div class="court-name">${c.name}</div><div class="court-meta">${c.address}</div>${c.sourceLabel?`<div class="court-source">Visuel provisoire · ${c.sourceLabel}</div>`:''}</div>`;
    card.onclick=()=>openCourt(c); els.allCourts.appendChild(card);
  });
}
function openCourt(c){ if(c.image){ els.modalPhoto.style.backgroundImage=`linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.45)), url('${c.image}')`; els.modalPhoto.style.backgroundSize='cover'; els.modalPhoto.style.backgroundPosition='center'; } else { els.modalPhoto.style.backgroundImage='linear-gradient(135deg,#31578b,#1d2e4d)'; } els.modalPhoto.textContent=c.photo; els.modalTitle.textContent=c.name; els.modalAddress.textContent=c.address; els.modalDesc.textContent=c.sourceLabel ? `${c.desc} Source visuelle : ${c.sourceLabel}.` : c.desc; els.mapsLink.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.address); els.courtModal.classList.add('open'); }

function renderStats(){
  const stats = getStats(state);
  const ratingText=state.currentRating?fmt(state.currentRating):'—';
  els.ratingValue.textContent=ratingText; els.heroRatingValue.textContent=ratingText;
  if(state.currentRating&&state.startRating){ const diff=state.currentRating-state.startRating; const diffText=`${diff>=0?'+':''}${fmt(diff)} depuis le départ`; els.ratingDelta.textContent=diffText; els.heroRatingDelta.textContent=diffText; els.progressBar.style.width=Math.max(4,Math.min(100,((state.currentRating-1)/9)*100))+'%'; } else { els.ratingDelta.textContent='définis ton niveau pour commencer'; els.heroRatingDelta.textContent='Définis ton niveau pour commencer'; els.progressBar.style.width='4%'; }
  els.statMatches.textContent=state.matches.length; els.statWinRate.textContent=stats.winRate+'%'; els.statSpent.textContent=Math.round(stats.spent)+' CHF'; els.favShort.textContent=stats.fav; els.startRating.value=state.startRating?fmt(state.startRating):'4.00'; els.manualLevel.value=state.startRating?fmt(state.startRating):'';
  els.accountSummary.textContent = state.levelDefined ? `Niveau ${fmt(state.currentRating)} · ${state.matches.length} match(s) · ${formatMoney(stats.spentAccessories)} d’accessoires.` : 'Ton niveau n’est pas encore défini. Va dans l’onglet Niveau pour le fixer ou l’estimer.';
  refreshFocusCard(stats);
  renderTrendCard(stats);
  renderInsights(stats);
}
function renderHistory(){
  els.historyList.innerHTML='';
  if(!state.matches.length){ els.historyList.innerHTML='<div class="panel muted">Aucun match enregistré pour l’instant.</div>'; return; }
  [...state.matches].reverse().slice(0,8).forEach((m)=>{ const pos=m.change>0; const el=document.createElement('article'); el.className='match'; el.innerHTML=`<div class="badge ${pos?'win':'loss'}">${pos?'+':'−'}</div><div><div class="match-title">${pos?'Victoire':'Défaite'} — ${m.court}</div><div class="match-meta">${m.date} · ${m.cost||0} CHF · ${m.notes||'sans note'} · niveau ${fmt(m.before)} → ${fmt(m.after)}</div></div><div class="delta ${pos?'pos':'neg'}">${pos?'+':''}${fmt(m.change)}</div>`; els.historyList.appendChild(el); });
}
function renderTrendCard(stats){
  const recent = state.matches.slice(-7);
  if(!recent.length){
    els.trendHeadline.textContent = 'En attente de données';
    els.trendCopy.textContent = 'Ajoute quelques matchs pour voir une vraie courbe de progression.';
    els.trendChip.textContent = 'Pas assez de matchs';
    els.trendChip.className = 'insight-chip';
    els.trendLinePath.setAttribute('d','');
    els.trendAreaPath.setAttribute('d','');
    els.trendDots.innerHTML = '';
    els.trendStart.textContent = '—';
    els.trendCurrent.textContent = state.currentRating ? fmt(state.currentRating) : '—';
    els.trendDeltaValue.textContent = '—';
    return;
  }
  const points = recent.map((match, index)=>({ x: recent.length === 1 ? 160 : 20 + (280 / (recent.length - 1)) * index, rating: match.after }));
  const ratings = points.map((item)=>item.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const spread = Math.max(0.08, max - min);
  const mapped = points.map((item)=>({ ...item, y: 96 - (((item.rating - min) / spread) * 72) }));
  const linePath = mapped.map((point, index)=>`${index===0?'M':'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${mapped[mapped.length-1].x.toFixed(1)} 108 L ${mapped[0].x.toFixed(1)} 108 Z`;
  els.trendLinePath.setAttribute('d', linePath);
  els.trendAreaPath.setAttribute('d', areaPath);
  els.trendDots.innerHTML = mapped.map((point)=>`<circle class="trend-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4.5"></circle>`).join('');
  const start = recent[0].before || recent[0].after;
  const current = recent[recent.length-1].after;
  const delta = current - start;
  els.trendHeadline.textContent = delta > 0.01 ? 'Courbe positive' : delta < -0.01 ? 'Courbe en retrait' : 'Courbe stable';
  els.trendCopy.textContent = `${recent.length} match(s) visibles d’un coup pour lire la trajectoire sans scroller l’historique.`;
  els.trendChip.textContent = delta > 0.01 ? `${stats.winRate}% de victoires` : delta < -0.01 ? 'À relancer au prochain match' : 'Équilibre en cours';
  els.trendChip.className = `insight-chip ${delta > 0.01 ? 'good' : delta < -0.01 ? 'bad' : 'warn'}`;
  els.trendStart.textContent = fmt(start);
  els.trendCurrent.textContent = fmt(current);
  els.trendDeltaValue.textContent = `${delta >= 0 ? '+' : ''}${fmt(delta)}`;
}
function renderInsights(stats){
  const recent = state.matches.slice(-5);
  const wins = recent.filter((item)=>item.result === 'win').length;
  const losses = recent.filter((item)=>item.result === 'loss').length;
  const lastMatch = recent[recent.length-1] || null;
  if(!recent.length){
    els.insightPrimaryTitle.textContent = 'Commence le journal de jeu';
    els.insightPrimaryText.textContent = 'Le cockpit affichera ensuite forme, rythme et budget au lieu de simples blocs statiques.';
    els.insightPrimaryChips.innerHTML = '<span class="insight-chip">Niveau</span><span class="insight-chip">Matchs</span><span class="insight-chip">Budget</span>';
  } else {
    const formText = wins >= 4 ? 'forme forte' : wins >= losses ? 'forme correcte' : 'forme fragile';
    els.insightPrimaryTitle.textContent = `Lecture rapide : ${formText}`;
    els.insightPrimaryText.textContent = lastMatch ? `Dernier match : ${lastMatch.result === 'win' ? 'victoire' : 'défaite'} à ${lastMatch.court}. L’écran d’accueil commence à ressembler à un vrai cockpit joueur.` : 'Lecture récente prête.';
    els.insightPrimaryChips.innerHTML = [`<span class="insight-chip ${wins >= losses ? 'good' : 'bad'}">${wins}V / ${losses}D</span>`,`<span class="insight-chip">${stats.fav === '—' ? 'Terrain à définir' : stats.fav}</span>`,`<span class="insight-chip ${state.levelDefined ? 'warn' : ''}">Niveau ${state.currentRating ? fmt(state.currentRating) : '—'}</span>`].join('');
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2,'0');
  const monthly = getCostEntries(state).filter((item)=>String(item.date || '').startsWith(`${year}-${month}`));
  const totalMonth = monthly.reduce((sum, item)=>sum + Number(item.amount || 0), 0);
  const budgetTarget = 120;
  const budgetRatio = Math.max(0, Math.min(100, (totalMonth / budgetTarget) * 100));
  els.budgetHeadline.textContent = `Budget de ${monthLabel(Number(month))}`;
  els.budgetCopy.textContent = monthly.length ? `${formatMoney(totalMonth)} dépensés ce mois-ci sur un repère simple de ${budgetTarget} CHF.` : 'Aucune dépense ce mois-ci pour l’instant.';
  els.budgetBarFill.style.width = `${Math.max(monthly.length ? 6 : 0, budgetRatio)}%`;
  els.budgetChip.textContent = `${Math.round(budgetRatio)}% du repère ${budgetTarget} CHF`;
  els.budgetChip.className = `insight-chip ${budgetRatio >= 85 ? 'bad' : budgetRatio >= 50 ? 'warn' : 'good'}`;
}
function renderQuiz(){ document.querySelectorAll('#levelQuiz label').forEach((label)=>{ const input=label.querySelector('input'); label.classList.toggle('selected', !!input?.checked); }); const vals=['q1','q2','q3','q4','q5'].map((q)=>Number((document.querySelector(`input[name="${q}"]:checked`)||{}).value||0)); const answered=vals.filter(Boolean).length; if(!answered){ state.estimatedLevel=null; els.quizLevelTitle.textContent='Estimation rapide'; els.quizLevelText.textContent='Réponds aux questions ci-dessous pour obtenir une estimation simple de ton niveau.'; return; } const avg=vals.reduce((a,b)=>a+b,0)/answered; const level=Math.max(1,Math.min(10,Number(avg.toFixed(1)))); state.estimatedLevel=level; els.quizLevelTitle.textContent=`Niveau estimé : ${level}/10`; els.quizLevelText.textContent='Tu peux utiliser cette estimation directement comme niveau de départ.'; }
function populateCostFilters(){
  const entries = getCostEntries(state);
  const years = [...new Set(entries.map((item)=>parsePeriod(item.date).year).filter(Boolean))].sort((a,b)=>b-a);
  const selectedYear = els.costYearFilter.value || 'all';
  const selectedMonth = els.costMonthFilter.value || 'all';
  els.costYearFilter.innerHTML = `<option value="all">Total · toutes les années</option>${years.map((year)=>`<option value="${year}">${year}</option>`).join('')}`;
  els.costYearFilter.value = years.includes(Number(selectedYear)) ? selectedYear : 'all';
  const activeYear = els.costYearFilter.value;
  const months = [...new Set(entries.filter((item)=>activeYear==='all' || parsePeriod(item.date).year===Number(activeYear)).map((item)=>parsePeriod(item.date).month).filter(Boolean))].sort((a,b)=>a-b);
  els.costMonthFilter.innerHTML = `<option value="all">${activeYear==='all' ? 'Total · tous les mois' : 'Toute l’année'}</option>${months.map((month)=>`<option value="${month}">${monthLabel(month)}</option>`).join('')}`;
  els.costMonthFilter.value = months.includes(Number(selectedMonth)) ? selectedMonth : 'all';
}
function renderCostHistory(){
  populateCostFilters();
  const year = els.costYearFilter.value || 'all';
  const month = els.costMonthFilter.value || 'all';
  const scope = els.costScopeFilter.value || 'all';
  const allEntries = getCostEntries(state);
  const filtered = filterCostEntries(allEntries, { year, month, scope });
  const summary = summarizeCostEntries(filtered);
  const periodLabel = month !== 'all' ? `${monthLabel(Number(month))} ${year}` : year !== 'all' ? `Année ${year}` : 'Total';
  const matchGroups = groupMatchCosts(filtered, summary.total || 0);
  const accessoryGroups = groupAccessoryCosts(filtered, summary.total || 0);
  els.costPeriodLabel.textContent = periodLabel;
  els.costPeriodTotal.textContent = formatMoney(summary.total);
  els.costCourtsCount.textContent = String(matchGroups.length);
  els.costMatchesTotal.textContent = formatMoney(summary.matchesTotal);
  els.costAccessoriesTotal.textContent = formatMoney(summary.accessoriesTotal);
  if(!allEntries.length){
    els.costHistoryList.innerHTML = '<div class="cost-history-empty panel">Aucun coût enregistré pour l’instant.</div>';
    els.accessoryHistoryList.innerHTML = '<div class="cost-history-empty panel">Aucun coût accessoire enregistré.</div>';
    return;
  }
  els.costHistoryList.innerHTML = matchGroups.length ? matchGroups.map((item)=>`<article class="cost-history-item"><div class="cost-history-top"><div><h3>${item.label}</h3><div class="cost-history-meta">${item.count} match(s) · dernière partie ${item.lastDate}</div></div><div class="cost-history-total">${formatMoney(item.total)}</div></div><div class="cost-history-stats"><div class="cost-pill"><strong>${item.count}</strong><span>Parties</span></div><div class="cost-pill"><strong>${formatMoney(item.average)}</strong><span>Coût moyen</span></div><div class="cost-pill"><strong>${item.share.toFixed(0)} %</strong><span>Part du budget</span></div></div></article>`).join('') : '<div class="cost-history-empty panel">Aucun coût de match pour ce filtre.</div>';
  els.accessoryHistoryList.innerHTML = accessoryGroups.length ? accessoryGroups.map((item)=>`<article class="cost-history-item"><div class="cost-history-top"><div><h3>${item.label}</h3><div class="cost-history-meta">${item.count} coût(s) · dernière entrée ${item.lastDate}</div></div><div class="cost-history-total">${formatMoney(item.total)}</div></div><div class="cost-history-stats"><div class="cost-pill"><strong>${item.count}</strong><span>Entrées</span></div><div class="cost-pill"><strong>${formatMoney(item.average)}</strong><span>Coût moyen</span></div><div class="cost-pill"><strong>${item.share.toFixed(0)} %</strong><span>Part du budget</span></div></div></article>`).join('') : '<div class="cost-history-empty panel">Aucun accessoire pour ce filtre.</div>';
}
function renderReadinessPanel(){
  const userId = currentUser?.id;
  const pendingCount = getPendingCount(userId);
  const networkState = getNetworkState();
  const standalone = isStandaloneMode();
  const lastSync = readLastSync(userId);
  if(els.appConnectionBadge) els.appConnectionBadge.textContent = networkState === 'online' ? 'En ligne' : 'Hors ligne';
  if(els.appConnectionTitle) els.appConnectionTitle.textContent = networkState === 'online' ? 'Connexion disponible' : 'Connexion coupée';
  if(els.appConnectionText) els.appConnectionText.textContent = networkState === 'online' ? 'L’app peut synchroniser avec Supabase et rafraîchir les données du compte.' : 'Le shell reste exploitable en local. Les nouvelles entrées attendront le retour du réseau.';
  if(els.appSyncBadge) els.appSyncBadge.textContent = pendingCount ? `${pendingCount} en attente` : (syncError ? 'Dégradé' : 'À jour');
  if(els.appSyncTitle) els.appSyncTitle.textContent = pendingCount ? 'File locale active' : (syncError ? 'Connexion cloud partielle' : 'Synchronisation propre');
  if(els.appSyncText) els.appSyncText.textContent = pendingCount ? `${pendingCount} élément(s) locaux seront renvoyés au cloud dès qu’une synchro réussit.` : (syncError ? `${syncError}` : 'Aucune donnée en attente : la session actuelle paraît stable.');
  if(els.appInstallBadge) els.appInstallBadge.textContent = standalone ? 'Installée' : deferredInstallPrompt ? 'Installable' : 'Web';
  if(els.appInstallTitle) els.appInstallTitle.textContent = standalone ? 'Mode app actif' : deferredInstallPrompt ? 'Installation prête' : 'Mode navigateur';
  if(els.appInstallText) els.appInstallText.textContent = standalone ? 'PadelStats tourne déjà comme une app plein écran, proche du ressenti store.' : deferredInstallPrompt ? 'Le prompt d’installation est prêt pour un test PWA immédiat sur appareil compatible.' : 'Le shell reste testable dans le navigateur, avec bannière d’installation ou futur emballage Capacitor.';
  if(els.appAccountTitle) els.appAccountTitle.textContent = currentUser ? currentUser.email : 'Aucun compte actif';
  if(els.appAccountText) els.appAccountText.textContent = currentUser ? `Session ${localStorage.getItem(REMEMBER_KEY) === 'false' ? 'temporaire' : 'persistée'} · ${state.matches.length} match(s) · ${state.accessoryCosts.length} coût(s) accessoire(s).` : 'Connecte-toi pour récupérer ton niveau, ton historique et tester la persistance réelle de session.';
  if(els.appLastSyncTitle) els.appLastSyncTitle.textContent = currentUser ? formatRelativeDate(lastSync) : 'Pas de compte connecté';
  if(els.appLastSyncText) els.appLastSyncText.textContent = currentUser ? (lastSync ? 'Repère utile pour tester la stabilité du client et les retours de session.' : 'La prochaine synchro cloud réussie enregistrera un horodatage local.') : 'Le suivi de synchro s’active automatiquement dès qu’une session utilisateur existe.';
  if(els.forceSyncBtn) els.forceSyncBtn.disabled = !currentUser || syncInFlight;
}
function render(){ renderCourts(); renderStats(); renderHistory(); renderQuiz(); renderCostHistory(); renderReadinessPanel(); saveCache(); updateSyncBanner(); refreshInstallBanner(); }

async function defineLevelAndSave(level){
  const next = applyLevel(state, level); if(next.error){ alert(next.error); return; }
  setBusy(els.saveManualLevel, true, 'Enregistrement…'); setBusy(els.applyEstimatedLevel, true, 'Enregistrement…');
  state = next; saveCache();
  try { await saveProfile(state); syncError=null; }
  catch(error){ syncError=error.message; if(currentUser) setPendingProfile(currentUser.id, state); }
  finally { setBusy(els.saveManualLevel, false, ''); setBusy(els.applyEstimatedLevel, false, ''); }
  render(); setView('home'); showToast('Niveau enregistré', `Base fixée à ${fmt(state.currentRating)}.`);
}
async function addMatch(result, formOverride = null, options = {}){
  if(matchSaving) return;
  const form = formOverride || { court: els.courtSelect.value, date: els.matchDate.value || getTodayLocalDate(), cost: els.costInput.value || 0, notes: els.notes.value.trim() };
  const draft = computeMatchDraft(state, result, form);
  if(draft.error){ alert(draft.error); if(draft.error.includes('niveau')) setView('level'); return; }
  const match = draft.value; matchSaving = true; setBusy(els.quickWin, true, 'Sauvegarde…'); setBusy(els.quickLoss, true, 'Sauvegarde…'); setBusy(els.saveQuickMatch, true, 'Sauvegarde…');
  state = appendMatch(state, match); els.costInput.value=''; els.notes.value=''; els.matchDate.value=getTodayLocalDate();
  els.quickCostInput.value=''; els.quickNotes.value=''; els.quickMatchDate.value=getTodayLocalDate();
  saveCache();
  let matchStoredInCloud = false;
  try {
    await persistMatch(match);
    matchStoredInCloud = true;
    await saveProfile(state);
    syncError=null;
  }
  catch(error){
    syncError=error?.message || 'match enregistré localement';
    if(currentUser){
      if(!matchStoredInCloud){
        const pending = getPendingMatches(currentUser.id);
        pending.push(match);
        setPendingMatches(currentUser.id, pending);
      }
      setPendingProfile(currentUser.id, state);
    }
  }
  finally { matchSaving = false; setBusy(els.quickWin, false, ''); setBusy(els.quickLoss, false, ''); setBusy(els.saveQuickMatch, false, ''); }
  render();
  showToast(match.result === 'win' ? 'Victoire enregistrée' : 'Défaite enregistrée', `Niveau ${fmt(match.before)} → ${fmt(match.after)} · ${match.court}`);
  if(options.closeQuickModal) closeQuickMatchModal();
}
async function addAccessoryCost(){
  if(accessorySaving) return;
  const draft = computeAccessoryDraft({ date: els.accessoryDate.value || getTodayLocalDate(), amount: els.accessoryAmount.value || 0, category: els.accessoryCategory.value || 'Accessoire', court: els.accessoryCourt.value || '', notes: els.accessoryNotes.value.trim() });
  if(draft.error){ alert(draft.error); return; }
  const item = draft.value; accessorySaving = true; setBusy(els.addAccessoryCost, true, 'Ajout…');
  state = appendAccessoryCost(state, item); els.accessoryAmount.value=''; els.accessoryNotes.value=''; els.accessoryDate.value=getTodayLocalDate(); saveCache();
  let accessoryStoredInCloud = false;
  try {
    await persistAccessoryCost(item);
    accessoryStoredInCloud = true;
    await saveProfile(state);
    syncError=null;
  }
  catch(error){
    syncError=error?.message || 'coût accessoire enregistré localement';
    if(currentUser){
      if(!accessoryStoredInCloud){
        const pending = getPendingAccessoryCosts(currentUser.id);
        pending.push(item);
        setPendingAccessoryCosts(currentUser.id, pending);
      }
      setPendingProfile(currentUser.id, state);
    }
  }
  finally { accessorySaving = false; setBusy(els.addAccessoryCost, false, ''); }
  render(); showToast('Coût accessoire ajouté', `${formatMoney(item.amount)} · ${item.category}`);
}

async function attemptSyncNow({ silent = false } = {}){
  if(!currentUser || syncInFlight) return;
  syncInFlight = true;
  setBusy(els.forceSyncBtn, true, 'Synchro…');
  try {
    await loadCloudState(currentUser);
    syncError = null;
    if(!silent) showToast('Synchro relancée', 'Les données locales et cloud ont été relues.');
  } catch(error){
    syncError = error?.message || 'synchronisation impossible';
    if(!silent) showToast('Synchro incomplète', syncError);
  } finally {
    syncInFlight = false;
    setBusy(els.forceSyncBtn, false, '');
    render();
  }
}

function bindEvents(){
  document.querySelectorAll('[data-view]').forEach((btn)=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
  document.querySelectorAll('[data-jump-view]').forEach((btn)=>btn.addEventListener('click',()=>setView(btn.dataset.jumpView)));
  document.querySelectorAll('[data-cost-preset]').forEach((btn)=>btn.addEventListener('click',()=>{ els.costInput.value = btn.dataset.costPreset; els.quickCostInput.value = btn.dataset.costPreset; }));
  document.querySelectorAll('[data-quick-result]').forEach((btn)=>btn.addEventListener('click',()=>setQuickResult(btn.dataset.quickResult)));
  els.openQuickMatch?.addEventListener('click', openQuickMatchModal); els.bottomQuickAdd?.addEventListener('click', openQuickMatchModal); els.closeQuickMatch?.addEventListener('click', closeQuickMatchModal); els.quickMatchModal?.addEventListener('click', (e)=>{ if(e.target===els.quickMatchModal) closeQuickMatchModal(); });
  els.quickFillFromMain?.addEventListener('click', ()=>{ syncQuickMatchCourtOptions(); els.quickMatchDate.value = els.matchDate.value || getTodayLocalDate(); els.quickCostInput.value = els.costInput.value || ''; els.quickNotes.value = els.notes.value || ''; });
  els.saveQuickMatch?.addEventListener('click', ()=> addMatch(quickResult, { court: els.quickCourtSelect.value, date: els.quickMatchDate.value || getTodayLocalDate(), cost: els.quickCostInput.value || 0, notes: els.quickNotes.value.trim() }, { closeQuickModal:true }));
  els.closeAuth.onclick=()=>els.authModal.classList.remove('open'); els.closeAuth2.onclick=()=>els.authModal.classList.remove('open'); els.authModal.onclick=(e)=>{ if(e.target===els.authModal) els.authModal.classList.remove('open'); };
  els.showLogin.onclick=()=>openAuth('login'); els.showSignup.onclick=()=>openAuth('signup');
  els.quickWin.addEventListener('click', ()=> addMatch('win')); els.quickLoss.addEventListener('click', ()=> addMatch('loss'));
  els.applyEstimatedLevel.addEventListener('click', ()=> { if(state.estimatedLevel) defineLevelAndSave(state.estimatedLevel); else alert('Commence par répondre au questionnaire.'); });
  els.saveManualLevel.addEventListener('click', ()=> defineLevelAndSave(els.manualLevel.value)); els.goToLevel.addEventListener('click', ()=> setView('level'));
  document.querySelectorAll('#levelQuiz input').forEach((i)=>i.addEventListener('change',renderQuiz));
  els.costYearFilter.addEventListener('change', renderCostHistory); els.costMonthFilter.addEventListener('change', renderCostHistory); els.costScopeFilter.addEventListener('change', renderCostHistory);
  els.addAccessoryCost.addEventListener('click', addAccessoryCost);
  els.installAppBtn?.addEventListener('click', async()=>{
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch {}
    deferredInstallPrompt = null;
    refreshInstallBanner();
  });
  els.installLaterBtn?.addEventListener('click', ()=>{ localStorage.setItem(INSTALL_DISMISSED_KEY, 'true'); refreshInstallBanner(); renderReadinessPanel(); });
  els.forceSyncBtn?.addEventListener('click', ()=>attemptSyncNow());
  els.revealInstallBtn?.addEventListener('click', ()=>{
    localStorage.removeItem(INSTALL_DISMISSED_KEY);
    refreshInstallBanner();
    setView('home');
    showToast('Installation', 'La bannière d’installation est de nouveau visible sur l’accueil.');
  });
  window.addEventListener('online', ()=>attemptSyncNow({ silent:true }));
  window.addEventListener('offline', ()=>render());
  els.closeModal.onclick=()=>els.courtModal.classList.remove('open'); els.courtModal.onclick=(e)=>{ if(e.target===els.courtModal) els.courtModal.classList.remove('open'); };
  els.loginPanel?.addEventListener('submit', async(event)=>{ event.preventDefault(); const email=els.loginEmail.value.trim(); const password=els.loginPassword.value; if(!email||!password){ alert('Entre ton email et ton mot de passe.'); return; } localStorage.setItem(REMEMBER_KEY,(els.rememberMe&&els.rememberMe.checked)?'true':'false'); setBusy(els.loginSubmit, true, 'Connexion…'); try { const {error}=await supabaseClient.auth.signInWithPassword({email,password}); if(error){ alert('Connexion impossible : '+error.message); return; } els.authModal.classList.remove('open'); const { data:{ session } } = await supabaseClient.auth.getSession(); await applySession(session); } catch(err){ alert('Connexion impossible : '+err.message); } finally { setBusy(els.loginSubmit, false, ''); } });
  els.signupPanel?.addEventListener('submit', async(event)=>{ event.preventDefault(); const email=els.signupEmail.value.trim(); const password=els.signupPassword.value; if(!email || !password){ alert('Entre un email et un mot de passe.'); return; } setBusy(els.signupSubmit, true, 'Création…'); try { const {error,data}=await supabaseClient.auth.signUp({email,password}); if(error){ alert('Création impossible : '+error.message); return; } els.authModal.classList.remove('open'); if(data?.session?.user){ localStorage.setItem(REMEMBER_KEY,'true'); await applySession(data.session); } else { alert('Compte créé. Vérifie ton email si une confirmation est demandée, puis connecte-toi.'); } } finally { setBusy(els.signupSubmit, false, ''); } });
}

function initAccessoryCategories(){
  els.accessoryCategory.innerHTML = ACCESSORY_CATEGORIES.map((label)=>`<option value="${label}">${label}</option>`).join('');
}

async function init(){
  setQuickResult('win');
  window.addEventListener('beforeinstallprompt', (event)=>{
    event.preventDefault();
    deferredInstallPrompt = event;
    localStorage.removeItem(INSTALL_DISMISSED_KEY);
    refreshInstallBanner();
  });
  window.addEventListener('appinstalled', ()=>{
    deferredInstallPrompt = null;
    refreshInstallBanner();
  });
  renderCourts(); initAccessoryCategories(); bindEvents(); els.matchDate.value=getTodayLocalDate(); els.quickMatchDate.value=getTodayLocalDate(); els.accessoryDate.value=getTodayLocalDate(); syncQuickMatchCourtOptions(); render();
  supabaseClient.auth.onAuthStateChange(async(event, session)=>{ if(booting && event !== 'INITIAL_SESSION') return; if(['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED','SIGNED_OUT','USER_UPDATED'].includes(event)) await applySession(session); });
  const { data:{ session } } = await supabaseClient.auth.getSession(); await applySession(session);
}

init();
