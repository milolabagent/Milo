# PadelStats

PadelStats est une web app mobile-first pour suivre sa progression au padel :
- historique des matchs
- évolution du niveau
- coûts par partie
- terrains
- estimation du niveau via quiz
- connexion utilisateur via Supabase
- persistance des stats liée au compte

## Fichiers principaux
- `index.html` — application statique principale
- `manifest.webmanifest` — base PWA
- `favicon.svg` — favicon
- `icon.svg` — icône d’app
- `netlify.toml` — configuration Netlify
- `supabase-schema.sql` — schéma SQL à exécuter dans Supabase

## Flux produit actuel
1. utilisateur non connecté → accueil neutre
2. création de compte ou connexion
3. définition manuelle du niveau ou estimation via l’onglet Niveau
4. enregistrement des matchs après chaque partie
5. déconnexion → retour à l’accueil neutre
6. reconnexion → récupération des statistiques du compte

## Supabase
L’application attend deux tables :
- `profiles`
- `matches`

Le schéma de base est fourni dans :
- `supabase-schema.sql`

## Déploiement Netlify
Projet statique, sans build :
- Publish directory : `.`
- Build command : *(vide)*

## Nom produit
Le nom produit actuel est :
- **PadelStats**
