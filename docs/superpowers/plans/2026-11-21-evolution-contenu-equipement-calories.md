# Évolution contenu, équipement & calories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire en sorte que la proposition du soir « convienne » davantage (pool de recettes sans
équipement spécial plus large et mieux réparti, nouvel équipement plancha), différencier les badges
équipement, et afficher une estimation de calories par portion avec une préférence douce « plats
légers » dont le seuil est paramétrable par l'utilisateur (pas une constante figée).

**Architecture:** Contenu ajouté via des scripts Node idempotents qui valident vocabulaire/
invariants puis réécrivent `src/data/recettes_50.json` (motif déjà en place dans
`scripts/add-bulk-recipes.mjs`). `engine.js` reste pur et inchangé pour le filtrage équipement
(générique sur `equipement_requis`) ; un nouveau module pur `calories.js` calcule une estimation à la
demande (pas de champ stocké), et le moteur gagne un bonus doux non filtrant basé sur ce calcul,
injectable comme `now`/`rng` pour rester testable isolément.

**Tech Stack:** Vanilla JS (ESM), Node `node:test`, aucune dépendance ajoutée.

**Spec:** [docs/superpowers/specs/2026-11-21-evolution-contenu-equipement-design.md](../specs/2026-11-21-evolution-contenu-equipement-design.md)

## Global Constraints

- Chaque recette ajoutée : ≤15 min, ≤5 ingrédients comptables, id unique, catégorie parmi
  `feculent|oeufs|volaille|poisson|viande|vegetarien|soupe`, `ingredient_vedette` présent dans ses
  propres ingrédients si non `null`.
- Vocabulaire d'ingrédients fermé : tout `ingredients[].nom` doit appartenir à l'ensemble existant
  (15 `base` + 60 `frais`, listés au Task 1) — aucun nouveau nom introduit.
- +76 recettes sans équipement (`equipement_requis: []`) réparties : féculent +5 (20→25), volaille
  +15 (10→25), végétarien +15 (10→25), œufs +11 (9→20), poisson +11 (9→20), viande +11 (9→20), soupe
  +8 (7→15) ; ≥30 de ces 76 (hors catégorie végétarien) doivent aussi porter le tag `vegetarien`.
- +45 recettes `equipement_requis: ['plancha']`, réparties viande 12 / poisson 10 / volaille 12 /
  végétarien 11.
- 100 % offline, zéro dépendance réseau ajoutée.
- `engine.js` reste pur : aucun effet de bord, toute entrée temporelle/aléatoire/calorique injectable.
- Les filtres durs ne sont jamais relâchés ; la préférence « léger » est un **bonus non filtrant**
  (bonus **+20**), jamais une exclusion. Le seuil est **paramétrable par l'utilisateur** (3 presets
  en réglages : 350 / 450 / 550 kcal/portion, défaut **450**) — jamais une constante figée dans le
  moteur.
- Estimation calorique indicative (basiques de placard — huile, beurre — non comptés) : le libellé
  affiché doit le signaler, ce n'est pas une donnée nutritionnelle certifiée.

## Review Focus

- Un ingrédient de recette sans entrée dans la table de calories retomberait silencieusement à 0 kcal
  (sous-estimation invisible, fausse le bonus « léger ») → test de complétude au Task 4.
- Une recette avec `portions` à 0/absent ferait planter ou afficher `NaN kcal` → garde + test au
  Task 4.
- `settings.js` construit `nb = { classique: 0, airfryer: 0, cookeo: 0 }` (ligne ~111) : incrémenter
  `nb[categorieAppareil(r)]` pour une recette plancha sans ajouter la clé donnerait `NaN` affiché sur
  le chip « Plancha (NaN) » → corrigé et testé au Task 2.
- Une unité de quantité non reconnue (ex. future recette avec une unité inédite) dans
  `grammesPourQuantite` doit avoir un repli défini plutôt qu'un `NaN` propagé → test au Task 4.
- La préférence « léger » combinée à végétarien + un seul équipement actif ne doit jamais réduire le
  classement à zéro candidat (elle doit rester un bonus, jamais un filtre) → test explicite au Task 5.

---

## File Structure

- Create `scripts/add-classique-recipes.mjs` — ajoute les 76 recettes sans équipement (Task 1).
- Create `scripts/add-plancha-recipes.mjs` — ajoute les 45 recettes plancha (Task 2).
- Modify `src/data/recettes_50.json` — réécrit par les deux scripts ci-dessus (jamais à la main).
- Create `test/contenu.test.mjs` — invariants et décomptes de contenu (Tasks 1 et 2).
- Modify `src/js/data.js` — `APPAREILS`, `categorieAppareil`, `libelleEquipement`,
  `equipementsParDefaut`, `preferencesParDefaut` (Tasks 2 et 5).
- Modify `src/js/screens/settings.js` — toggle « Plancha », correctif du compteur `nb`, inclusion
  dans le multi-sélecteur d'appareils (Task 2) ; toggle « Plats légers » (Task 6).
- Modify `src/js/ui.js` — `ICONS` (+`airfryer`, +`cookeo`, +`plancha`, +`calories`) et
  `ICONES_APPAREIL` (Tasks 3 et 6).
- Modify `src/js/screens/home.js`, `src/js/screens/detail.js` — badge équipement différencié
  (Task 3), badge calories (Task 6).
- Create `src/js/calories.js` — `TABLE_KCAL`, `grammesPourQuantite`, `estimerCalories` (Task 4).
- Create `test/calories.test.mjs` — tests du module calories (Task 4).
- Modify `src/js/engine.js` — `BONUS_LEGER`, `SEUIL_LEGER_KCAL_DEFAUT`, `estimerCalories` injectable
  dans `evaluer`/`classer`/`genererProposition` (Task 5).
- Modify `test/engine.test.mjs` — cas de test pour la préférence « léger » (Task 5).

---

### Task 1: Contenu — pool « sans équipement » (+76 recettes)

**Files:**
- Create: `scripts/add-classique-recipes.mjs`
- Create: `test/contenu.test.mjs`
- Modify: `src/data/recettes_50.json` (via le script, pas à la main)

**Interfaces:**
- Consumes: structure JSON existante (`cat.recettes`, `cat.garde_manger_base`), motif de validation
  de `scripts/add-bulk-recipes.mjs:160-198` (vocabulaire strict, unicité id, invariants).
- Produces: `src/data/recettes_50.json` avec 76 recettes `equipement_requis: []` en plus, consommé
  tel quel par `engine.js` (aucune API nouvelle).

- [ ] **Step 1: Écrire le test de contenu (échoue d'abord)**

Dans `test/contenu.test.mjs` (nouveau fichier) :

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DATA = JSON.parse(readFileSync(new URL('../src/data/recettes_50.json', import.meta.url), 'utf8'));
const R = DATA.recettes;

const BASE_CONNU = new Set(['ail','bouillon cube','chapelure','farine','lait','maïs','moutarde',
  'oignon','pâtes','riz','riz cuit','thon en conserve','tomates concassées','vermicelles','œufs']);
const FRAIS_CONNU = new Set(['aiguillettes de dinde','avocat','bûche de chèvre','bœuf émincé',
  'carotte','champignons','chipolatas','chorizo','ciboulette','citron','courgette','crevettes',
  'croûtons','crème fraîche','curry','câpres','côte de porc','dos de cabillaud',
  'escalope de poulet','feta','filet de colin','frites surgelées','fromage râpé',
  'galette de sarrasin','gnocchi','haricots rouges','jambon','lait de coco','lardons',
  'lentilles corail','mayonnaise','merguez','miel','mozzarella','nouilles chinoises',
  'pain de campagne','pain de mie','parmesan','patate douce','pavé de saumon','persil','pesto',
  'petits pois','pois chiches','poivron','pommes de terre','potiron','quinoa cuit','salade',
  'salade romaine','sardines en boîte','sauce soja','saucisses','saumon fumé','semoule',
  'steak haché','tomate','tomates cerises','tortillas','épinards']);

test('contenu — aucun ingrédient hors vocabulaire fermé', () => {
  for (const r of R) for (const i of r.ingredients) {
    const vocab = i.type === 'base' ? BASE_CONNU : FRAIS_CONNU;
    assert.ok(vocab.has(i.nom), `${r.id}: ingrédient hors vocabulaire « ${i.nom} »`);
  }
});

test('contenu — ids uniques sur tout le fichier', () => {
  const ids = R.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('contenu — invariants (temps, nb ingrédients, vedette)', () => {
  for (const r of R) {
    assert.ok(r.temps_min <= 15, `${r.id}: ${r.temps_min} min`);
    assert.ok(r.ingredients.length <= 5, `${r.id}: ${r.ingredients.length} ingrédients`);
    if (r.ingredient_vedette) {
      assert.ok(r.ingredients.some((i) => i.nom === r.ingredient_vedette), `${r.id}: vedette absente`);
    }
  }
});

function sansEquip(cat) {
  return R.filter((r) => (r.equipement_requis || []).length === 0 && (!cat || r.categorie === cat));
}

test('contenu — pool sans équipement : 150 au total, réparti par catégorie', () => {
  assert.equal(sansEquip().length, 150);
  assert.equal(sansEquip('feculent').length, 25);
  assert.equal(sansEquip('volaille').length, 25);
  assert.equal(sansEquip('vegetarien').length, 25);
  assert.equal(sansEquip('oeufs').length, 20);
  assert.equal(sansEquip('poisson').length, 20);
  assert.equal(sansEquip('viande').length, 20);
  assert.equal(sansEquip('soupe').length, 15);
});

test('contenu — pool sans équipement : au moins 65 taguées vegetarien', () => {
  const n = sansEquip().filter((r) => (r.tags || []).includes('vegetarien')).length;
  assert.ok(n >= 65, `seulement ${n} recettes sans équipement taguées vegetarien`);
});
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `node --test test/contenu.test.mjs`
Expected: FAIL sur les deux derniers tests (74 et 35 au lieu de 150 et ≥65) ; les trois premiers
(vocabulaire/ids/invariants) passent déjà sur les données actuelles.

- [ ] **Step 3: Écrire `scripts/add-classique-recipes.mjs`**

Même squelette que `scripts/add-bulk-recipes.mjs` (charger le JSON, construire `baseExistants`/
`fraisExistants` depuis les recettes déjà présentes, valider vocabulaire + invariants + unicité
avant d'écrire). 76 recettes, `equipement_requis: []`, respectant exactement la répartition par
catégorie et la cible végétarien du Step 1. N'utiliser que des noms de `BASE_CONNU`/`FRAIS_CONNU`
listés au Step 1 (pas de nouvel ingrédient).

- [ ] **Step 4: Lancer le script**

Run: `node scripts/add-classique-recipes.mjs`
Expected: le script affiche le nombre de recettes ajoutées et sort en succès (pas d'« ❌ Validation
échouée »).

- [ ] **Step 5: Lancer le test, vérifier qu'il passe**

Run: `node --test test/contenu.test.mjs`
Expected: PASS (5/5).

- [ ] **Step 6: Lancer la suite existante (non-régression)**

Run: `npm test`
Expected: PASS — `test/engine.test.mjs` ne doit montrer aucune régression (les nouvelles recettes
sans équipement ne changent aucun filtre dur).

- [ ] **Step 7: Commit**

```bash
git add scripts/add-classique-recipes.mjs test/contenu.test.mjs src/data/recettes_50.json
git commit -m "feat(contenu): +76 recettes sans équipement spécial, pool rééquilibré"
```

---

### Task 2: Nouvel équipement — Plancha (données + réglages + contenu, +45 recettes)

**Files:**
- Create: `scripts/add-plancha-recipes.mjs`
- Modify: `src/js/data.js:38-55` (`APPAREILS`, `categorieAppareil`, `equipementsParDefaut`) et
  `src/js/data.js:75-81` (`libelleEquipement`)
- Modify: `src/js/screens/settings.js:75-150` (toggle Plancha, compteur `nb`, multi-sélecteur)
- Modify: `test/contenu.test.mjs` (décompte plancha + total)
- Modify: `src/data/recettes_50.json` (via le script)

**Interfaces:**
- Consumes: `APPAREILS` (array `{cle, label}`), `categorieAppareil(recette) -> string`,
  `libelleEquipement(recette) -> string`, `equipementsParDefaut() -> object` — tous définis dans
  `src/js/data.js`, utilisés tels quels par `settings.js`, `home.js`, `detail.js`, `engine.js`.
- Produces: `categorieAppareil` et `libelleEquipement` reconnaissent désormais `'plancha'` ;
  `equipementsParDefaut()` inclut `plancha: false` ; aucune autre fonction n'a besoin de changer
  (le filtre dur `passeFiltresDurs` d'`engine.js` est déjà générique sur `equipement_requis`).

- [ ] **Step 1: Étendre le test de contenu (échoue d'abord)**

Dans `test/contenu.test.mjs`, ajouter :

```js
test('contenu — plancha : 45 recettes, réparties, total 396', () => {
  const plancha = R.filter((r) => (r.equipement_requis || []).includes('plancha'));
  assert.equal(plancha.length, 45);
  const par = (cat) => plancha.filter((r) => r.categorie === cat).length;
  assert.equal(par('viande'), 12);
  assert.equal(par('poisson'), 10);
  assert.equal(par('volaille'), 12);
  assert.equal(par('vegetarien'), 11);
  assert.equal(R.length, 396);
});
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `node --test test/contenu.test.mjs`
Expected: FAIL (0 recette plancha, total 351 après le Task 1).

- [ ] **Step 3: Écrire `scripts/add-plancha-recipes.mjs`**

Même squelette que `scripts/add-classique-recipes.mjs`, `equipement_requis: ['plancha']`, 45
recettes réparties viande 12 / poisson 10 / volaille 12 / vegetarien 11, vocabulaire fermé
(`BASE_CONNU`/`FRAIS_CONNU` du Task 1 — pas de féculent/œufs/soupe en plancha).

- [ ] **Step 4: Lancer le script**

Run: `node scripts/add-plancha-recipes.mjs`
Expected: succès, décompte affiché.

- [ ] **Step 5: Lancer le test, vérifier qu'il passe**

Run: `node --test test/contenu.test.mjs`
Expected: PASS (toutes les assertions de contenu, Task 1 + Task 2).

- [ ] **Step 6: Câbler l'équipement « plancha » dans `src/js/data.js`**

Modifier :
- `APPAREILS` (ligne 38) : ajouter `{ cle: 'plancha', label: 'Plancha' }`.
- `categorieAppareil(recette)` (ligne 45) : ajouter `if (eq.includes('plancha')) return 'plancha';`
  avant le `return 'classique'` final.
- `libelleEquipement(recette)` (`src/js/data.js:75-81`) : ajouter la branche `plancha` →
  `'Plancha'`, avant la branche `four`.
- `equipementsParDefaut()` (ligne 53) : ajouter `plancha: false`.

- [ ] **Step 7: Câbler le toggle et le compteur dans `src/js/screens/settings.js`**

- Ajouter une `rowPlancha` (même motif que `rowAir`/`rowCookeo`, lignes ~81-87) juste après
  `rowCookeo`, et l'inclure dans `cardEquip.append(...)` (ligne ~89).
- Corriger `const nb = { classique: 0, airfryer: 0, cookeo: 0 };` (ligne ~111) en
  `{ classique: 0, airfryer: 0, cookeo: 0, plancha: 0 }` — sans ce correctif le chip « Plancha »
  afficherait `NaN` (cf. Review Focus).
- Dans `forcerEquip` (lignes ~95-101) et la boucle sur `APPAREILS` (ligne ~134,
  `if (ap.cle === 'airfryer' || ap.cle === 'cookeo') forcerEquip(ap.cle);`) : étendre la condition à
  `'plancha'` et étendre le `row = nom === 'airfryer' ? rowAir : rowCookeo;` (ligne ~98) pour gérer
  `rowPlancha`.

- [ ] **Step 8: Vérification manuelle en navigateur**

Lancer `npm run serve`, ouvrir Réglages : vérifier que le toggle « Plancha » apparaît, que le chip
« Plancha (45) » s'affiche sans `NaN`, et qu'activer le chip « Plancha » dans le multi-sélecteur
active aussi le toggle équipement (comme pour Airfryer/Cookeo).

- [ ] **Step 9: Lancer la suite complète**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add scripts/add-plancha-recipes.mjs src/js/data.js src/js/screens/settings.js \
  test/contenu.test.mjs src/data/recettes_50.json
git commit -m "feat(equipement): ajoute la plancha (45 recettes, réglage, multi-sélecteur)"
```

---

### Task 3: Badges équipement différenciés

**Files:**
- Modify: `src/js/ui.js:18-35` (`ICONS` + nouvelle `ICONES_APPAREIL`)
- Modify: `src/js/screens/home.js:55-58`
- Modify: `src/js/screens/detail.js:39`
- Create: `test/data.test.mjs`

**Interfaces:**
- Consumes: `categorieAppareil(recette) -> 'classique'|'airfryer'|'cookeo'|'plancha'`
  (`src/js/data.js`, étendu au Task 2).
- Produces: `ICONES_APPAREIL` (objet `{classique, airfryer, cookeo, plancha}` de chaînes SVG),
  exporté par `src/js/ui.js`, consommé par `home.js` et `detail.js`.

- [ ] **Step 1: Écrire le test (échoue d'abord)**

Dans `test/data.test.mjs` (nouveau fichier) :

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { categorieAppareil } from '../src/js/data.js';
import { ICONES_APPAREIL } from '../src/js/ui.js';

test('categorieAppareil — reconnaît les 4 types', () => {
  assert.equal(categorieAppareil({ equipement_requis: ['airfryer'] }), 'airfryer');
  assert.equal(categorieAppareil({ equipement_requis: ['cookeo'] }), 'cookeo');
  assert.equal(categorieAppareil({ equipement_requis: ['plancha'] }), 'plancha');
  assert.equal(categorieAppareil({ equipement_requis: [] }), 'classique');
});

test('ICONES_APPAREIL — une icône définie pour chacun des 4 types', () => {
  for (const cle of ['classique', 'airfryer', 'cookeo', 'plancha']) {
    assert.ok(ICONES_APPAREIL[cle], `icône manquante pour « ${cle} »`);
  }
});
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `node --test test/data.test.mjs`
Expected: FAIL sur le second test (`ICONES_APPAREIL` n'existe pas encore).

- [ ] **Step 3: Ajouter les icônes et `ICONES_APPAREIL` dans `src/js/ui.js`**

Ajouter à `ICONS` (ligne 18) trois nouvelles entrées `airfryer`, `cookeo`, `plancha` — même format
que les entrées existantes (`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ...>`),
trait cohérent avec le reste du fichier. Puis exporter :

```js
export const ICONES_APPAREIL = {
  classique: ICONS.poele,
  airfryer: ICONS.airfryer,
  cookeo: ICONS.cookeo,
  plancha: ICONS.plancha,
};
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

Run: `node --test test/data.test.mjs`
Expected: PASS.

- [ ] **Step 5: Utiliser `ICONES_APPAREIL` dans `home.js` et `detail.js`**

Remplacer `${ICONS.poele}` (badge équipement, `home.js:58` et `detail.js:39`) par
`${ICONES_APPAREIL[categorieAppareil(recette)]}` (importer `categorieAppareil` depuis `data.js` et
`ICONES_APPAREIL` depuis `ui.js` dans les deux fichiers).

- [ ] **Step 6: Vérification manuelle en navigateur**

`npm run serve` : vérifier qu'une recette classique, une airfryer, une cookeo et une plancha
affichent chacune une icône de badge différente (accueil et détail).

- [ ] **Step 7: Lancer la suite complète**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/js/ui.js src/js/screens/home.js src/js/screens/detail.js test/data.test.mjs
git commit -m "feat(ui): icône de badge équipement différenciée par type"
```

---

### Task 4: Module calories (estimation pure)

**Files:**
- Create: `src/js/calories.js`
- Create: `test/calories.test.mjs`

**Interfaces:**
- Consumes: forme d'une recette (`{ ingredients: [{nom, type, quantite: {valeur, unite}}], portions }`)
  telle que définie dans `src/data/recettes_50.json`.
- Produces: `export const TABLE_KCAL` (objet `{ [nom]: { kcal100g: number, poidsUnite?: number } }`) ;
  `export function grammesPourQuantite(nom, quantite, table = TABLE_KCAL) -> number` ;
  `export function estimerCalories(recette, table = TABLE_KCAL) -> number` (arrondi à la dizaine,
  par portion). Consommé par `engine.js` au Task 5 et par l'UI au Task 6.

- [ ] **Step 1: Écrire les tests (échouent d'abord)**

Dans `test/calories.test.mjs` (nouveau fichier) :

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grammesPourQuantite, estimerCalories, TABLE_KCAL } from '../src/js/calories.js';

// Table fixture isolée — ne dépend pas des vraies valeurs nutritionnelles.
const FIX = {
  pates: { kcal100g: 100, poidsUnite: null },
  thon: { kcal100g: 200, poidsUnite: 140 }, // 1 boîte = 140 g
  ail: { kcal100g: 50, poidsUnite: 5 },     // 1 gousse = 5 g
  huileimaginaire: { kcal100g: 900, poidsUnite: 15 }, // 1 c. à soupe = 15 g
};

test('grammesPourQuantite — grammes directs', () => {
  assert.equal(grammesPourQuantite('pates', { valeur: 200, unite: 'g' }, FIX), 200);
});

test('grammesPourQuantite — unité comptée (boîte) via poidsUnite', () => {
  assert.equal(grammesPourQuantite('thon', { valeur: 1, unite: 'boîte' }, FIX), 140);
});

test('grammesPourQuantite — compte nu (unite: null) via poidsUnite', () => {
  assert.equal(grammesPourQuantite('ail', { valeur: 2, unite: 'gousse' }, FIX), 10);
});

test('grammesPourQuantite — unité inconnue : repli 0 (pas de NaN)', () => {
  const g = grammesPourQuantite('pates', { valeur: 3, unite: 'pincée' }, FIX);
  assert.equal(Number.isNaN(g), false);
});

test('estimerCalories — somme, divise par portions, arrondit à la dizaine', () => {
  const recette = {
    portions: 2,
    ingredients: [
      { nom: 'pates', type: 'base', quantite: { valeur: 200, unite: 'g' } },
      { nom: 'thon', type: 'base', quantite: { valeur: 1, unite: 'boîte' } },
    ],
  };
  // (200g*1kcal/g*1 + 140g*2kcal/g) / 2 portions = (200 + 280) / 2 = 240
  assert.equal(estimerCalories(recette, FIX), 240);
});

test('estimerCalories — ingrédient hors table : ignoré, pas de NaN', () => {
  const recette = {
    portions: 1,
    ingredients: [{ nom: 'inconnu', type: 'frais', quantite: { valeur: 1, unite: null } }],
  };
  assert.equal(estimerCalories(recette, FIX), 0);
});

test('estimerCalories — portions 0 ou absente : repli à 1 portion (pas de NaN/Infinity)', () => {
  const recette = {
    portions: 0,
    ingredients: [{ nom: 'pates', type: 'base', quantite: { valeur: 100, unite: 'g' } }],
  };
  const v = estimerCalories(recette, FIX);
  assert.equal(Number.isFinite(v), true);
});

// Complétude : tout ingrédient réellement utilisé dans la base doit avoir une entrée.
test('TABLE_KCAL — couvre tout le vocabulaire utilisé dans recettes_50.json', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/recettes_50.json', import.meta.url), 'utf8'));
  const manquants = new Set();
  for (const r of data.recettes) for (const i of r.ingredients) {
    if (!TABLE_KCAL[i.nom]) manquants.add(i.nom);
  }
  assert.equal(manquants.size, 0, `TABLE_KCAL incomplète : ${[...manquants].join(', ')}`);
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `node --test test/calories.test.mjs`
Expected: FAIL (`src/js/calories.js` n'existe pas encore).

- [ ] **Step 3: Implémenter `src/js/calories.js`**

- `grammesPourQuantite(nom, quantite, table = TABLE_KCAL)` : si `quantite.unite === 'g'`, retourne
  `quantite.valeur` ; sinon cherche `table[nom]?.poidsUnite` et retourne `valeur * poidsUnite` (après
  conversion si l'unité est `cl`/`c. à soupe`/`c. à café`/`poignée`/`gousse`/`tranche(s)`/`bol`/
  `boule`/`sachet`/`boîte(s)`/count nu — l'implémenteur choisit la conversion par unité, sauf
  `poidsUnite` fixé par ingrédient qui prime) ; si rien n'est trouvé, retourne `0` (jamais `NaN`).
- `estimerCalories(recette, table = TABLE_KCAL)` : somme sur `recette.ingredients` de
  `grammesPourQuantite(...) / 100 * (table[nom]?.kcal100g ?? 0)`, divisée par
  `Math.max(1, recette.portions || 1)`, arrondie à la dizaine la plus proche
  (`Math.round(x / 10) * 10`).
- `TABLE_KCAL` : une entrée `{ kcal100g, poidsUnite }` pour chacun des 75 noms listés au Task 1
  (`BASE_CONNU` ∪ `FRAIS_CONNU`), valeurs nutritionnelles standard (estimations culinaires
  courantes), `poidsUnite` renseigné pour les ingrédients utilisés avec une unité autre que `g`.

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `node --test test/calories.test.mjs`
Expected: PASS (8/8), y compris le test de complétude sur les 396 recettes réelles.

- [ ] **Step 5: Lancer la suite complète**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/js/calories.js test/calories.test.mjs
git commit -m "feat(calories): module pur d'estimation calorique par portion"
```

---

### Task 5: Préférence douce « Plats légers » dans le moteur

**Files:**
- Modify: `src/js/engine.js:17-44` (constantes), `~120-200` (`evaluer`), `~205-230` (`classer`),
  `~240-290` (`genererProposition`)
- Modify: `src/js/data.js:33-35` (`preferencesParDefaut`)
- Modify: `test/engine.test.mjs`

**Interfaces:**
- Consumes: `estimerCalories(recette, table?) -> number` de `src/js/calories.js` (Task 4).
- Produces: `evaluer`/`classer`/`genererProposition` acceptent un paramètre optionnel
  `estimerCaloriesFn` (par défaut `estimerCalories` importé), pour rester testables comme `now`/`rng` ;
  `preferencesParDefaut()` inclut `leger: false` et `seuil_leger_kcal: 450` (le seuil vit dans les
  préférences utilisateur, jamais en constante figée dans le moteur).

- [ ] **Step 1: Écrire le test (échoue d'abord)**

Dans `test/engine.test.mjs`, ajouter (après les sections existantes, import
`estimerCalories`-compatible stub local) :

```js
test('G1 — préférence légère : bonus non filtrant, jamais d\'exclusion', () => {
  const data = CINQUANTE;
  const deux = data.recettes.slice(0, 2); // peu importe lesquelles : calories stubées
  const stubCalories = (r) => (r.id === deux[0].id ? 900 : 200); // 900 = lourd, 200 = léger
  const e = etat(data, {
    preferences: { vegetarien: false, enfant_friendly: false, leger: true, exclusions: [] },
  });
  const classement = classer(deux, e, NOW, {}, rng(), stubCalories);
  // Non filtrant : les deux restent éligibles.
  assert.equal(classement.length, 2);
  const scoreLourd = classement.find((c) => c.recette.id === deux[0].id).score;
  const scoreLeger = classement.find((c) => c.recette.id === deux[1].id).score;
  assert.ok(scoreLeger > scoreLourd, 'le plat léger doit être mieux classé que le lourd');
});

test('G2 — préférence légère désactivée : aucun bonus appliqué', () => {
  const data = CINQUANTE;
  const deux = data.recettes.slice(0, 2);
  const stubCalories = (r) => (r.id === deux[0].id ? 900 : 200);
  const e = etat(data, {
    preferences: { vegetarien: false, enfant_friendly: false, leger: false, exclusions: [] },
  });
  const avecLeger = classer(deux, { ...e, preferences: { ...e.preferences, leger: true } }, NOW, {}, rng(), stubCalories);
  const sansLeger = classer(deux, e, NOW, {}, rng(), stubCalories);
  const diffAvec = avecLeger[0].score - avecLeger[1].score;
  const diffSans = sansLeger[0].score - sansLeger[1].score;
  assert.notEqual(diffAvec, diffSans, 'le bonus doit changer l\'écart de score');
});

test('G3 — seuil paramétrable : lu dans les préférences, pas figé dans le moteur', () => {
  const data = CINQUANTE;
  const deux = data.recettes.slice(0, 2);
  const stubCalories = () => 400; // entre les deux presets 350 et 450
  const basePrefs = { vegetarien: false, enfant_friendly: false, leger: true, exclusions: [] };
  const seuilBas = classer(deux, etat(data, { preferences: { ...basePrefs, seuil_leger_kcal: 350 } }), NOW, {}, rng(), stubCalories);
  const seuilHaut = classer(deux, etat(data, { preferences: { ...basePrefs, seuil_leger_kcal: 450 } }), NOW, {}, rng(), stubCalories);
  // À 400 kcal : pas de bonus sous un seuil de 350, bonus sous un seuil de 450.
  assert.notEqual(seuilBas[0].score, seuilHaut[0].score);
});
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `node --test test/engine.test.mjs`
Expected: FAIL (`classer` ne connaît pas encore le 6ᵉ paramètre, `preferences.leger` ignoré).

- [ ] **Step 3: Implémenter dans `src/js/engine.js`**

- Import en tête de fichier : `import { estimerCalories } from './calories.js';`
- Ajouter les constantes (groupées avec `BONUS_ENFANT`) : `export const BONUS_LEGER = 20;` et
  `export const SEUIL_LEGER_KCAL_DEFAUT = 450;` (valeur de repli si la préférence n'est pas définie —
  jamais la valeur utilisée directement dans la condition, cf. point suivant).
- `evaluer(recette, etat, now, options, catsRecentes, rng, restreindreAuxMatches, estimerCaloriesFn = estimerCalories)` :
  après le bloc `(g) Préférence « plats pour enfants »`, ajouter un bloc `(h)` : si
  `etat.preferences?.leger`, calculer `seuil = etat.preferences.seuil_leger_kcal ?? SEUIL_LEGER_KCAL_DEFAUT`
  puis, si `estimerCaloriesFn(recette) < seuil`, `score += BONUS_LEGER` et `raisons.push('léger')`.
  Ne jamais toucher à `eligible`.
- `classer(recettes, etat, now, options, rng, estimerCaloriesFn = estimerCalories)` : transmettre
  `estimerCaloriesFn` à chaque appel d'`evaluer`.
- `genererProposition(recettes, etat, now, sessionShown, rng, estimerCaloriesFn = estimerCalories)` :
  transmettre `estimerCaloriesFn` à chaque appel de `classer`.

- [ ] **Step 4: Mettre à jour `preferencesParDefaut` dans `src/js/data.js`**

`preferencesParDefaut()` (ligne 33) → `{ vegetarien: false, enfant_friendly: false, leger: false, seuil_leger_kcal: 450, exclusions: [], modes_appareil: [] }`.

- [ ] **Step 5: Lancer le test, vérifier qu'il passe**

Run: `node --test test/engine.test.mjs`
Expected: PASS, y compris G1/G2/G3 et l'ensemble des tests A à F existants (non-régression).

- [ ] **Step 6: Lancer la suite complète**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/js/engine.js src/js/data.js test/engine.test.mjs
git commit -m "feat(moteur): préférence douce « plats légers » (bonus non filtrant)"
```

---

### Task 6: UI calories — badge et réglage

**Files:**
- Modify: `src/js/ui.js` (`ICONS.calories`)
- Modify: `src/js/screens/home.js:55-58`, `src/js/screens/detail.js:39`
- Modify: `src/js/screens/settings.js:160-182` (toggle « Plats légers »)

**Interfaces:**
- Consumes: `estimerCalories(recette)` (Task 4), `ICONS.calories` (ce task), `prefs.leger` et
  `prefs.seuil_leger_kcal` (Task 5/`preferencesParDefaut`).
- Produces: badge visuel visible par l'utilisateur ; aucune interface consommée par d'autres tasks
  (dernier task de la chaîne).

- [ ] **Step 1: Ajouter `ICONS.calories` dans `src/js/ui.js`**

Même format que les entrées existantes (trait 24×24, `stroke="currentColor"`), motif simple (ex.
flamme) cohérent visuellement avec le reste du set.

- [ ] **Step 2: Ajouter le badge calories sur `home.js` et `detail.js`**

Importer `estimerCalories` depuis `../calories.js` (les deux fichiers sont dans `src/js/screens/`,
`calories.js` dans `src/js/`) dans `home.js` et `detail.js`. Ajouter, à côté des badges existants
(`home.js:55-58`, `detail.js:39`) :
`<span class="badge">${ICONS.calories} ≈ ${estimerCalories(recette)} kcal</span>`. Ajouter un
attribut `title="Estimation, hors matières grasses de cuisson"` sur ce badge (pas une donnée
nutritionnelle certifiée, cf. contraintes globales).

- [ ] **Step 3: Ajouter le toggle « Plats légers » dans `src/js/screens/settings.js`**

Dans `cardPref` (après le toggle « Plats pour enfants », ligne ~182), même motif :

```js
cardPref.appendChild(
  toggleRow(
    'Plats légers',
    prefs.leger,
    async (v) => {
      prefs.leger = v;
      await ctx.sauver(storage.CLES.PREFERENCES, prefs);
    },
    'Les plats estimés sous le seuil choisi ci-dessous sont mis en avant (les autres restent proposés).'
  )
);
```

- [ ] **Step 4: Ajouter les presets de seuil (chips) dans `src/js/screens/settings.js`**

Juste après le toggle « Plats légers », un sélecteur à 3 chips (350 / 450 / 550 kcal), même motif
que le multi-sélecteur d'appareils existant (`chipsM`/boutons `.chip` avec classe `on` et
`aria-pressed`, lignes ~113-150) : un clic sur un preset écrit `prefs.seuil_leger_kcal` (350, 450 ou
550), sauvegarde (`ctx.sauver(storage.CLES.PREFERENCES, prefs)`), et met à jour l'état visuel `on`
des 3 chips (un seul actif à la fois — pas de cumul, contrairement aux chips d'appareils). Le preset
correspondant à `prefs.seuil_leger_kcal` (défaut 450) est actif à l'ouverture de l'écran.

- [ ] **Step 5: Vérification manuelle en navigateur**

`npm run serve` : vérifier que chaque recette (accueil et détail) affiche un badge `≈ XXX kcal`
plausible (ni `NaN`, ni `0` systématique), que le toggle « Plats légers » apparaît en réglages et
persiste après rechargement, et que les 3 chips de seuil s'affichent avec « 450 » actif par défaut et
changent bien l'état visuel au clic (un seul actif à la fois).

- [ ] **Step 6: Lancer la suite complète**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/js/ui.js src/js/screens/home.js src/js/screens/detail.js src/js/screens/settings.js
git commit -m "feat(ui): badge calories par portion + réglage « plats légers »"
```
