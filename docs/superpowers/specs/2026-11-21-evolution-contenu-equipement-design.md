# Design — Évolution contenu & équipement (sortie rapide, en jours)

## Intention & pourquoi

L'app vient de passer en prod (AdMob actif, 275 recettes). Objectif de cette évolution :
**garantir que la proposition du soir « convient » réellement**, pas seulement qu'elle existe
(le moteur garantit déjà qu'il n'y a jamais d'écran vide — cf. `engine.js` §10.5). Constat chiffré :
avec les réglages par défaut (seul « Four » actif, 0 recette n'y est conditionnée), un utilisateur
qui n'a ni airfryer ni Cookeo ne pioche en réalité que dans **74 recettes** sur 275 — et seulement
**35** s'il est aussi végétarien. C'est le principal facteur de propositions peu satisfaisantes.

Décision produit (validée) : **A + B** côté contenu (étoffer le pool sans équipement **et** ouvrir
un nouvel équipement), **A** côté design (polish ciblé, pas de refonte visuelle). Ajout en cours de
conversation : une **estimation de calories par portion** affichée sur chaque recette, et une
**préférence « plats légers »** qui met en avant les recettes estimées sous un seuil.

## Objectifs

- Faire remonter le pool « sans équipement spécial » de 74 à **~150** recettes, en rééquilibrant les
  catégories sous-représentées (volaille, œufs, poisson, viande, soupe, végétarien) plutôt qu'en
  empilant sur féculent (déjà le plus riche).
- Ouvrir un **4ᵉ équipement : la plancha** (~45 recettes), pertinent pour le 15 min/5 ingrédients
  (grillades rapides viande/poisson/volaille/légumes), avec une seule bascule de réglage en plus.
- Différencier visuellement les badges équipement (icône par type au lieu de l'icône poêle générique
  partout) — polish peu coûteux, pas de nouvel axe graphique.
- Afficher une **estimation de calories par portion** sur chaque recette (badge, comme temps/ingrédients),
  et une **préférence douce « plats légers »** qui favorise les recettes sous un seuil bas.

## Non-objectifs (ce tour-ci)

- Pas de refonte des illustrations de catégorie ni de la charte « Encre & citron ».
- Pas de nouvelles captures App Store/Play ni de page vitrine dans ce lot — à proposer en session
  séparée une fois le contenu stabilisé (cf. règle « page vitrine à chaque projet »).
- Pas d'équivalences d'ingrédients ni de télémétrie (approche C écartée : nécessiterait une collecte
  contraire au zéro-collecte du cadrage, et le filet anti-écran-vide existe déjà).
- Pas d'autre équipement que la plancha (micro-ondes, wok, robot cuiseur) — laissés pour une itération
  suivante si la plancha performe.
- Pas de données nutritionnelles certifiées (macros, allergènes) : seulement une estimation calorique
  indicative, pas une promesse de précision diététique.

## Contraintes

- Moteur `engine.js` **inchangé** (pur, testé) : les filtres durs équipement/végé/exclusions
  s'appliquent tels quels à la plancha, aucune nouvelle logique de scoring nécessaire.
- Vocabulaire d'ingrédients : rester **strictement dans le vocabulaire existant** (`base`/`frais`
  déjà présents dans `recettes_50.json`) comme le font les scripts actuels (`add-bulk-recipes.mjs`,
  `add-airfryer-recipes.mjs`) — pas de nouvel onboarding de garde-manger.
- 100% offline, aucune dépendance réseau ajoutée.
- Chaque recette : ≤15 min, ≤5 ingrédients comptables, id unique, catégorie connue, vedette présente
  dans ses ingrédients si définie — mêmes invariants que les scripts existants valident déjà.

## Approches considérées (rappel de la conversation)

- **Contenu** : (A) sprint sans-équipement — retenu ; (B) nouvel équipement — retenu en complément ;
  (C) moteur d'équivalences — écarté (cf. non-objectifs).
- **Équipement B** : plancha retenue plutôt que micro-ondes (trop universel, risquait d'être aussi
  « inerte » que Four aujourd'hui) ou robot multifonction (trop de modes différents à modéliser
  correctement en peu de jours). La plancha est un équipement distinct et répandu, et couvre bien les
  catégories protéines/légumes du 15 min.
- **Design** : (A) polish ciblé — retenu ; (B) refonte visuelle complète — écartée pour cette sortie
  (incompatible avec le délai en jours sans bâcler la cohérence de style).
- **Calories** : (A) saisie manuelle d'une calorie par recette — écartée : 396 recettes à estimer à
  la main, pas de source fiable, ne se maintient pas pour les prochains ajouts. (B) **calcul dérivé,
  pur, à partir d'une table kcal/100g par ingrédient** — retenue : le vocabulaire d'ingrédients est
  fermé et petit (15 `base` + 60 `frais` ≈ 75 entrées aujourd'hui), donc une table est raisonnable à
  constituer en un jour, couvre les 396 recettes existantes sans y toucher, et couvre automatiquement
  toute future recette qui reste dans le vocabulaire. Limite assumée et à afficher : les basiques de
  placard (huile, beurre...) ne sont pas trackés comme ingrédients structurés → l'estimation est
  **indicative, probablement légèrement sous-évaluée**, à libeller comme telle (pas une donnée
  nutritionnelle certifiée).
- **Seuil « léger »** : filtre dur (exclusion stricte au-dessus du seuil) vs préférence douce (bonus
  de score, comme `enfant_friendly`). Le filtre dur est écarté : combiné à végétarien + équipement, il
  risquerait de réduire le pool au point de heurter le principe « jamais d'écran vide ». Retenu :
  **préférence douce**, même mécanique que `enfant_friendly` (bonus, non filtrante).
- **Valeur du seuil** : constante fixe (450 kcal/portion) vs **paramétrable par l'utilisateur**.
  Retenu, à la demande : **paramétrable**, stocké dans les préférences (pas codé en dur dans le
  moteur), avec une valeur par défaut de 450 kcal/portion. Exposé en réglages via 3 presets en chips
  (350 / 450 / 550 kcal), même motif visuel que le sélecteur multi-appareils existant — pas de champ
  numérique libre (cohérent avec l'absence de saisie manuelle ailleurs dans l'app).

## Ce qui est décidé (mes choix, à corriger si besoin)

- Répartition des +76 recettes « sans équipement » : féculent +5 (20→25), volaille +15 (10→25),
  végétarien +15 (10→25), œufs +11 (9→20), poisson +11 (9→20), viande +11 (9→20), soupe +8 (7→15).
  → pool total sans équipement 74→150, mieux réparti.
  **Cible croisée végétarien** : le pool « sans équipement + tag `vegetarien` » est aujourd'hui de
  35/74 — un facteur cité comme aussi important que le total brut. Pour qu'il suive la même
  progression (≈×2) plutôt que de retomber à ~43 % du nouveau total, ≥30 des recettes ajoutées hors
  de la catégorie « végétarien » elle-même doivent aussi porter le tag `vegetarien` (naturel côté
  œufs/féculent/soupe, pas côté viande/poisson/volaille) : ex. œufs 8/11, féculent 3/5, soupe 5/8.
  Avec les 15 de la catégorie végétarien, le pool croisé passe de 35 à ~65-70.
- +45 recettes plancha, réparties viande 12 / poisson 10 / volaille 12 / végétarien 11 (pas de
  féculent/œufs/soupe en plancha — hors du bon sens culinaire de l'équipement).
- Icônes badge (style `ui.js` ICONS, trait 24×24 `currentColor`, cohérent avec l'existant) : **4
  types distincts** (classique/airfryer/cookeo/plancha), donc **3 nouvelles icônes** — `airfryer`
  n'existe pas non plus aujourd'hui comme icône de badge (le badge réutilise toujours `ICONS.poele`
  en dur, sans branche, même pour l'airfryer/le Cookeo). Le switch home/detail aura donc 4 branches.
- `equipementsParDefaut()` : `plancha: false` (comme airfryer/cookeo — équipement non universel,
  l'utilisateur l'active s'il le possède).
- Calories : seuil « léger » **paramétrable** (preset 350/450/550 kcal/portion en réglages, défaut
  450, stocké dans les préférences) ; bonus doux identique en ordre de grandeur à `BONUS_ENFANT`
  (ex. +20) plutôt qu'un filtre dur. Badge affiché systématiquement (pas seulement si
  léger), libellé « ≈ XXX kcal » avec mention « estimation » au survol/détail pour ne pas sur-promettre
  une précision nutritionnelle (basiques de placard non comptés).

## Plan technique (pour la phase de plan détaillé)

- `scripts/add-classique-recipes.mjs` (nouveau, même squelette de validation que
  `add-bulk-recipes.mjs` : vocabulaire strict, unicité id, invariants ≤15 min/≤5 ingrédients/vedette
  présente) → +76 recettes, `equipement_requis: []`.
- `scripts/add-plancha-recipes.mjs` (nouveau, même squelette) → +45 recettes,
  `equipement_requis: ['plancha']`.
- `src/js/data.js` : `equipementsParDefaut()` +`plancha:false` ; `libelleEquipement()` +branche
  `plancha` → `'Plancha'`.
- `src/js/ui.js` : `ICONS` +`airfryer`, +`cookeo`, +`plancha` (icônes trait 24×24 cohérentes avec
  l'existant).
- `src/js/screens/home.js` + `src/js/screens/detail.js` : le badge équipement choisit l'icône selon
  `libelleEquipement(recette)` au lieu de toujours `ICONS.poele`.
- `src/js/screens/settings.js` : ligne toggle « Plancha » (même motif que Four/Airfryer/Cookeo) +
  ajout dans le sélecteur multi-appareils (Tous/Classiques/Airfryer/Cookeo/Plancha).
- `test/engine.test.mjs` : vérifier que les filtres durs existants couvrent la plancha sans
  modification (test de non-régression, pas de nouveau cas de scoring).
- Validation finale : relancer les scripts, vérifier `node --test`, vérifier les décomptes
  (sans-équip ~150, plancha ~45, total ~396) et l'absence de doublons d'id sur l'ensemble du fichier.
- `src/js/calories.js` (nouveau, **module pur**, même esprit qu'`engine.js`) : table
  `kcal100g` + `poidsUnite` par ingrédient (~75-90 entrées, à étoffer si de nouveaux ingrédients
  apparaissent dans les scripts d'ajout) ; `estimerCalories(recette)` = somme
  `ingredients[].quantite → grammes → kcal`, divisée par `portions`, arrondie à la dizaine.
- `engine.js` : nouveau bonus doux `BONUS_LEGER` (même mécanique que `BONUS_ENFANT`, pas de filtre
  dur), appliqué si `preferences.leger` actif et `estimerCalories(recette) < preferences.seuil_leger_kcal`
  (seuil lu dans les préférences, pas codé en dur).
- `src/js/data.js` : `preferencesParDefaut()` +`leger: false`, +`seuil_leger_kcal: 450`.
- `src/js/screens/settings.js` : sous le toggle « Plats légers », 3 chips presets (350/450/550 kcal)
  pour choisir `seuil_leger_kcal`, même motif que le sélecteur multi-appareils.
- `src/js/ui.js` : `ICONS` +`calories` (icône trait 24×24, ex. flamme simple).
- `src/js/screens/home.js` + `src/js/screens/detail.js` : badge `≈ XXX kcal` à côté des badges
  existants.
- `src/js/screens/settings.js` : ligne toggle « Plats légers » (même motif que le toggle
  `enfant_friendly` existant, lignes ~165-180).
- `test/engine.test.mjs` : cas de test pour `BONUS_LEGER` (non filtrant : un plat au-dessus du seuil
  reste éligible, juste moins bien classé) + cas pour `estimerCalories` (valeurs connues, somme
  correcte, division par portions).

## Reste à la charge du développeur (détails d'implémentation)

- Texte exact des ~121 nouvelles recettes (noms, étapes, quantités) — à générer en respectant le
  vocabulaire et les invariants ; variété réelle (pas de quasi-doublons avec l'existant).
- Tracé SVG exact des icônes cookeo/plancha (style trait, cohérent visuellement avec les icônes
  `ui.js` existantes).
- Libellé exact du sélecteur multi-appareils en réglages (reprendre le motif texte déjà en place).
- Valeurs exactes de la table kcal/100g et poids-unité par ingrédient (estimations culinaires
  standard, pas de source externe à intégrer — zéro dépendance réseau).

## Post-scriptum (revue finale de branche)

La revue finale a mesuré qu'avec les presets 350/450/550 décrits ci-dessus, le seuil par défaut
(450) qualifiait « léger » 75 % du catalogue final (396 recettes) — 90 % à 550 — car les matières
grasses de cuisson restent hors calcul (cf. limite assumée plus haut). Decision (Damien) : baisser
les presets à **300/350/450** (défaut 350) plutôt que d'ajouter un forfait matières grasses au
calcul, pour rester sur un changement simple et sans risque. `SEUIL_LEGER_KCAL_DEFAUT` (engine.js)
et `SEUILS_LEGER` (settings.js) ont été mis à jour en conséquence ; le reste de ce document garde la
valeur d'origine (450) pour l'historique de la décision de conception.
