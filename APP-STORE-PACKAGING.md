# PadelStats — prochaine marche vers iPhone + Android

Objectif : ne pas réécrire l’app, mais préparer un vrai passage en shell natif publiable.

## Ce qui a été préparé

- **Base Capacitor ajoutée** avec `package.json` + `capacitor.config.json`
- **Manifest renforcé** : `id`, orientation portrait, catégories, icônes 192/512
- **Icônes PNG générées** pour PWA / futur packaging (`assets/icons/`)
- **Service worker ajouté** pour garder un shell installable/offline-friendly
- **Bannière d’installation** dans l’UI pour tester le mode “app installée” dès maintenant
- **Apple touch icon** branchée pour le test iPhone/iPad “Ajouter à l’écran d’accueil”

## Commandes de départ

```bash
cd padelstats-source
npm install
npx cap add ios
npx cap add android
npm run cap:sync
```

Puis selon la cible :

```bash
npm run cap:open:ios
npm run cap:open:android
```

## Pourquoi cette voie

- garde la base web actuelle
- permet d’embarquer la même UI sur Android et iPhone
- évite de repartir sur React Native / Flutter / refonte complète
- rapproche directement le projet d’un packaging testable dans Xcode et Android Studio

## État concret au 27 mars 2026

- `npm install` exécuté
- shell **Android** généré dans `android/` puis synchronisé avec les assets web préparés dans `www/`
- shell **iOS** généré dans `ios/` avec workspace Xcode, Podfile et copie des assets web
- script ajouté : `npm run build:mobile` pour produire un `www/` propre avant `cap copy/sync`
- `capacitor.config.json` pointe maintenant vers `www` au lieu de la racine du repo

### Blocage actuel iPhone

La synchro iOS complète s’arrête encore au niveau natif local car la machine n’a pas **Xcode** actif (`xcodebuild` indisponible via `xcode-select`). Le projet iOS existe bien, mais l’ouverture/build final côté iPhone demande l’installation/activation de Xcode.

## Étape concrète suivante recommandée

1. lancer `npm install`
2. créer les shells natifs via Capacitor
3. tester sur téléphone réel les points sensibles :
   - session Supabase persistée
   - safe areas iPhone
   - clavier dans les formulaires
   - comportement offline / reprise réseau
4. ensuite seulement préparer les métadonnées stores (screenshots, privacy, icônes natives finales, splash screens)

## Points encore à faire avant publication

- générer les ressources natives finales (app icon / splash) pour iOS et Android
- valider la politique de confidentialité + mentions liées à Supabase/auth
- tester la persistance de session dans les shells natifs
- vérifier les permissions / liens externes (Maps)
- préparer screenshots et textes App Store / Play Store
