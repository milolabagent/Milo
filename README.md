# PadelStats

PadelStats est une web app mobile-first pour suivre sa progression au padel :
- historique des matchs
- évolution du niveau
- coûts par partie
- terrains de Genève
- estimation du niveau via quiz

## Structure
- `index.html` — application statique principale
- `netlify.toml` — configuration Netlify
- `.gitignore` — fichiers locaux à ignorer
- `manifest.webmanifest` — base PWA
- `icon.svg` — icône d’app
- `favicon.svg` — favicon

## Déploiement GitHub + Netlify

### 1. Créer le dépôt GitHub
Tu peux créer un repo du type :
- `elopad`

### 2. Y mettre le contenu du projet
Le dossier à publier est :
- `padel-tracker/`

Le plus simple est d’utiliser ce dossier comme racine du repo GitHub.

### 3. Connecter Netlify
Sur Netlify :
- **Add new project**
- **Import from Git**
- choisir ton repo GitHub

### 4. Réglages Netlify
Réglages recommandés :
- **Base directory** : *(laisser vide si le repo contient directement les fichiers du projet)*
- **Build command** : *(laisser vide)*
- **Publish directory** : `.`

Si tu mets le projet dans un repo plus large, alors :
- **Base directory** : `padel-tracker`
- **Publish directory** : `.`

### 5. Résultat
Netlify déploiera automatiquement le site à chaque push sur GitHub.

## Workflow conseillé
1. on modifie EloPad dans le workspace
2. on commit les changements
3. on met à jour la version texte dans :
   - `/Volumes/Family/Milo/SORTIES/VibeCoding/EloPad/`
4. tu pushes le code sur GitHub
5. Netlify republie automatiquement

## Étapes suivantes utiles
- ajouter de vraies photos de terrains
- ajouter des adresses précises
- transformer EloPad en PWA
- ajouter une vraie icône d’app et un manifest
