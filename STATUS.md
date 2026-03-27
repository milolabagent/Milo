# STATUS.md — PadelStats

## Objectif
Livrer une version mobile-first stable avec vraie persistance Supabase : compte → niveau/quiz → matchs → reconnexion.

## État actuel
- Front réécrit sur une base plus propre
- Supabase branché pour auth, profils, matchs
- Reprise mobile-first en cours avec flux local/LAN utilisable sans Netlify
- Bloc auth/session client simplifié et durci pour mieux tenir le refresh / retour de session
- Ajout de match renforcé avec file d’attente locale si la synchro cloud tombe temporairement
- Préparation packaging stores enclenchée : base Capacitor, manifest renforcé, icônes PNG, service worker, bannière d’installation

## Décisions validées
- Netlify reste la cible principale quand dispo
- Le LAN local n’est qu’un fallback de test
- L’app doit rester neutre si non connectée
- Après reconnexion, les stats du compte doivent revenir
- Il faut stabiliser le bloc auth/session proprement, pas par patchs successifs

## Blocages
- Auth/session encore instable côté client
- Netlify suspendu au moment des tests

## Prochaine action
Tester de bout en bout sur smartphone Android/iPhone : login, persistance de session, passage hors ligne/en ligne, file d’attente locale puis resynchro réelle. Ensuite seulement verrouiller privacy policy + assets natifs Play Store.

## Fichiers clés
- `padelstats-source/index.html`
- `padelstats-source/supabase-schema.sql`
- `padelstats-source/supabase-schema-minimal.sql`
- `padelstats-source/supabase-policies-fix.sql`
èrement le bloc auth/session, puis tester de bout en bout sur smartphone.

## Fichiers clés
- `padelstats-source/index.html`
- `padelstats-source/supabase-schema.sql`
- `padelstats-source/supabase-schema-minimal.sql`
- `padelstats-source/supabase-policies-fix.sql`
