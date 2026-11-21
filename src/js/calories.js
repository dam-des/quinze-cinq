// Module pur d'estimation calorique par portion.
// Aucune dépendance au DOM ni à l'I/O : consomme une recette (telle que
// src/data/recettes_50.json) et une table de correspondance ingrédient -> kcal/100g.

// Équivalences grammes génériques par unité, utilisées en repli quand
// l'ingrédient n'a pas de `poidsUnite` propre dans la table (ex: ingrédients
// utilisés avec deux unités différentes selon la recette, comme la crème
// fraîche en `cl` ou en `c. à soupe`).
const UNITE_GRAMMES = {
  cl: 10,
  'c. à soupe': 15,
  'c. à café': 5,
  poignée: 30,
  poignées: 30,
  gousse: 5,
  gousses: 5,
  tranche: 25,
  tranches: 25,
  bol: 250,
  boule: 125,
  sachet: 100,
  boîte: 200,
  boîtes: 200,
};

// Repli pour un compte nu (`unite: null`, ex. « 1 oignon ») quand l'ingrédient
// n'a pas de `poidsUnite` propre.
const COMPTE_NU_DEFAUT = 100;

// Table des 75 noms d'ingrédients du vocabulaire fermé (BASE_CONNU ∪ FRAIS_CONNU,
// Task 1), avec kcal/100g (estimations culinaires courantes) et, pour les
// ingrédients utilisés avec une unité autre que `g`, un `poidsUnite` (grammes
// pour 1 unité de la quantité, ex. 1 gousse, 1 boîte, 1 tranche...).
export const TABLE_KCAL = {
  // --- BASE_CONNU (15) ---
  ail: { kcal100g: 150, poidsUnite: 5 },
  'bouillon cube': { kcal100g: 250, poidsUnite: 10 },
  chapelure: { kcal100g: 380, poidsUnite: 10 },
  farine: { kcal100g: 350, poidsUnite: 10 },
  lait: { kcal100g: 65, poidsUnite: 10 },
  maïs: { kcal100g: 90, poidsUnite: 15 },
  moutarde: { kcal100g: 90 },
  oignon: { kcal100g: 40, poidsUnite: 100 },
  pâtes: { kcal100g: 350 },
  riz: { kcal100g: 350 },
  'riz cuit': { kcal100g: 130, poidsUnite: 250 },
  'thon en conserve': { kcal100g: 130, poidsUnite: 130 },
  'tomates concassées': { kcal100g: 30, poidsUnite: 400 },
  vermicelles: { kcal100g: 350 },
  œufs: { kcal100g: 155, poidsUnite: 55 },

  // --- FRAIS_CONNU (60) ---
  'aiguillettes de dinde': { kcal100g: 110 },
  avocat: { kcal100g: 160, poidsUnite: 150 },
  'bûche de chèvre': { kcal100g: 300 },
  'bœuf émincé': { kcal100g: 190 },
  carotte: { kcal100g: 40, poidsUnite: 80 },
  champignons: { kcal100g: 25, poidsUnite: 20 },
  chipolatas: { kcal100g: 280, poidsUnite: 50 },
  chorizo: { kcal100g: 400 },
  ciboulette: { kcal100g: 30, poidsUnite: 5 },
  citron: { kcal100g: 30, poidsUnite: 100 },
  courgette: { kcal100g: 20, poidsUnite: 200 },
  crevettes: { kcal100g: 90 },
  croûtons: { kcal100g: 400, poidsUnite: 15 },
  'crème fraîche': { kcal100g: 290 },
  curry: { kcal100g: 300 },
  câpres: { kcal100g: 25, poidsUnite: 10 },
  'côte de porc': { kcal100g: 250, poidsUnite: 200 },
  'dos de cabillaud': { kcal100g: 85, poidsUnite: 150 },
  'escalope de poulet': { kcal100g: 110, poidsUnite: 150 },
  feta: { kcal100g: 260 },
  'filet de colin': { kcal100g: 85, poidsUnite: 150 },
  'frites surgelées': { kcal100g: 280 },
  'fromage râpé': { kcal100g: 350 },
  'galette de sarrasin': { kcal100g: 220, poidsUnite: 80 },
  gnocchi: { kcal100g: 170 },
  'haricots rouges': { kcal100g: 115, poidsUnite: 240 },
  jambon: { kcal100g: 145, poidsUnite: 25 },
  'lait de coco': { kcal100g: 200, poidsUnite: 10 },
  lardons: { kcal100g: 320 },
  'lentilles corail': { kcal100g: 115 },
  mayonnaise: { kcal100g: 680, poidsUnite: 15 },
  merguez: { kcal100g: 300, poidsUnite: 50 },
  miel: { kcal100g: 310 },
  mozzarella: { kcal100g: 280, poidsUnite: 125 },
  'nouilles chinoises': { kcal100g: 350 },
  'pain de campagne': { kcal100g: 250, poidsUnite: 40 },
  'pain de mie': { kcal100g: 270, poidsUnite: 25 },
  parmesan: { kcal100g: 400 },
  'patate douce': { kcal100g: 85, poidsUnite: 200 },
  'pavé de saumon': { kcal100g: 200, poidsUnite: 150 },
  persil: { kcal100g: 35, poidsUnite: 5 },
  pesto: { kcal100g: 450, poidsUnite: 15 },
  'petits pois': { kcal100g: 80 },
  'pois chiches': { kcal100g: 160, poidsUnite: 240 },
  poivron: { kcal100g: 30, poidsUnite: 150 },
  'pommes de terre': { kcal100g: 80, poidsUnite: 150 },
  potiron: { kcal100g: 25 },
  'quinoa cuit': { kcal100g: 120 },
  salade: { kcal100g: 15 },
  'salade romaine': { kcal100g: 17 },
  'sardines en boîte': { kcal100g: 200, poidsUnite: 100 },
  'sauce soja': { kcal100g: 60, poidsUnite: 15 },
  saucisses: { kcal100g: 300, poidsUnite: 50 },
  'saumon fumé': { kcal100g: 180, poidsUnite: 25 },
  semoule: { kcal100g: 350 },
  'steak haché': { kcal100g: 230, poidsUnite: 125 },
  tomate: { kcal100g: 20, poidsUnite: 120 },
  'tomates cerises': { kcal100g: 20, poidsUnite: 150 },
  tortillas: { kcal100g: 310, poidsUnite: 40 },
  épinards: { kcal100g: 25, poidsUnite: 125 },
};

/**
 * Convertit la quantité d'un ingrédient en grammes.
 * - `unite === 'g'` : retourne `valeur` tel quel.
 * - sinon : utilise `table[nom].poidsUnite` (grammes pour 1 unité) si défini ;
 *   sinon un repli générique par type d'unité (ou par compte nu) ;
 *   sinon `0` (jamais `NaN`/`Infinity`).
 * @param {string} nom
 * @param {{valeur: number, unite: string|null}} quantite
 * @param {object} table
 * @returns {number}
 */
export function grammesPourQuantite(nom, quantite, table = TABLE_KCAL) {
  if (!quantite) return 0;
  const valeur = Number(quantite.valeur);
  const v = Number.isFinite(valeur) ? valeur : 0;
  const unite = quantite.unite;

  if (unite === 'g') return v;

  const poidsUnite = table?.[nom]?.poidsUnite;
  if (typeof poidsUnite === 'number' && Number.isFinite(poidsUnite)) {
    return v * poidsUnite;
  }

  const repli = unite == null ? COMPTE_NU_DEFAUT : UNITE_GRAMMES[unite];
  if (typeof repli === 'number' && Number.isFinite(repli)) {
    return v * repli;
  }

  return 0;
}

/**
 * Estime les calories par portion d'une recette.
 * @param {{ingredients: Array<{nom: string, quantite: object}>, portions?: number}} recette
 * @param {object} table
 * @returns {number} arrondi à la dizaine la plus proche
 */
export function estimerCalories(recette, table = TABLE_KCAL) {
  const ingredients = recette?.ingredients ?? [];
  let total = 0;
  for (const i of ingredients) {
    const grammes = grammesPourQuantite(i.nom, i.quantite, table);
    const kcal100g = table?.[i.nom]?.kcal100g ?? 0;
    total += (grammes / 100) * kcal100g;
  }
  const portions = Math.max(1, recette?.portions || 1);
  const parPortion = total / portions;
  if (!Number.isFinite(parPortion)) return 0;
  return Math.round(parPortion / 10) * 10;
}
