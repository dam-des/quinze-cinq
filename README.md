# Quinze Cinq — POC

> « Le soir, on décide pour toi. Toujours un plat, prêt en 15 minutes, 5 ingrédients max. »

App mobile **100 % offline**, sans compte ni backend : HTML/CSS/JS vanilla wrappé via
**Capacitor** (iOS + Android). Conception figée dans `docs/cadrage.md`.

## Démarrage rapide (prévisualisation navigateur)

```bash
npm run serve   # sert ./src sur http://127.0.0.1:8765
npm test        # tests unitaires du moteur (node --test, 0 dépendance)
```

En navigateur, AdMob et les notifications locales sont des **no-op** (plugins natifs absents) ;
la persistance bascule sur `localStorage`. Le reste (onboarding, matching, détail, mode cuisine,
👍/👎, réglages) est pleinement fonctionnel.

## Build natif (Capacitor)

```bash
npm install
npx cap add ios
npx cap add android
npm run cap:sync
npm run cap:ios       # ou: npm run cap:android
```

`capacitor.config.json` pointe `webDir: "src"` (pas d'étape de build : on copie `src/` tel quel).

## Architecture

```
src/
  index.html
  css/styles.css            # tokens « Encre & citron » (§13)
  js/
    app.js                  # bootstrap, routage, intégration moteur/persistance/pub/notif
    engine.js               # MOTEUR DE MATCHING — pur, testable isolément (§10)
    data.js                 # chargement recettes + dérivations (garde-manger, illustrations)
    storage.js              # Capacitor Preferences + repli localStorage (§9)
    notifications.js        # rappel quotidien local (opt-in contextuel)
    ads.js                  # AdMob (test) + UMP, bannière + interstitiel cadencé
    ui.js                   # helpers DOM + icônes + annonces lecteur d'écran
    screens/                # onboarding, home, detail, cooking, settings, privacy
  data/recettes_poc.json    # 10 recettes (POC) + recettes_50.json (MVP)
  illustrations/            # 7 SVG par catégorie (fournis, intégrés tels quels)
docs/                       # cadrage, cas de test, maquettes, prompt de relais
test/engine.test.mjs        # couverture A→F des cas de test
```

## Moteur (`engine.js`) — garanties testées

- **Filtres durs jamais relâchés** : équipement, végétarien, exclusions (ex. porc).
- **Récence par decay** (≈4 j) : un plat cuisiné ne ressort pas le soir même mais revient
  ensuite *sans vider la base* (pas de « sac mélangé »).
- **👎 = malus fort durable, non définitif** : relâché en tout dernier recours.
- **Jamais d'écran vide** : relâchement progressif appoint → diversité → récence → 👎.

Tests : `npm test` (18 cas, couvrant `docs/cas_de_test_moteur.md` A→F).

## Points POC / TODO MVP

- **Polices** : chargées via Google Fonts (repli `system-ui`). À **self-héberger** pour un vrai
  offline avant le MVP.
- **AdMob** : identifiants de **test** (`ads.js`). Remplacer par les identifiants réels + activer
  UMP en production.
- **Garde-manger** : `riz cuit` et `vermicelles` (ingrédients `base` de recettes hors liste
  canonique) sont seedés silencieusement comme staples afin que les plats 100 % placard restent
  réalisables (cf. `gardeMangerParDefaut`).
- Test fermé Google Play (12 testeurs, 14 j) à prévoir avant production.
```
