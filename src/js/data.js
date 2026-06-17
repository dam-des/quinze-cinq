// data.js — chargement de la base de recettes embarquée (offline) et
// utilitaires de dérivation (garde-manger par défaut, illustration par catégorie).

let _cache = null;

/** Charge recettes_50.json (62 recettes, embarqué — aucune requête réseau « métier »). */
export async function chargerCatalogue() {
  if (_cache) return _cache;
  const res = await fetch('./data/recettes_50.json');
  if (!res.ok) throw new Error('Impossible de charger la base de recettes');
  _cache = await res.json();
  return _cache;
}

/**
 * Garde-manger possédé par défaut = tous les ingrédients `base` référencés par
 * la base de recettes (union avec la liste canonique). Garantit qu'un plat
 * 100 % placard est pleinement réalisable tant que l'utilisateur n'a rien retiré.
 */
export function gardeMangerParDefaut(catalogue) {
  const noms = new Set(catalogue.garde_manger_base);
  for (const r of catalogue.recettes)
    for (const i of r.ingredients) if (i.type === 'base') noms.add(i.nom);
  return [...noms];
}

/** Basiques affichés/éditables dans l'onboarding (liste canonique courte). */
export function basiquesEditables(catalogue) {
  return [...catalogue.garde_manger_base];
}

/** Préférences par défaut. `mode_appareil` : null | 'airfryer' | 'cookeo'. */
export function preferencesParDefaut() {
  return { vegetarien: false, enfant_friendly: false, exclusions: [], mode_appareil: null };
}

/** Équipements par défaut (poêle/plaque toujours supposés). */
export function equipementsParDefaut() {
  return { four: true, airfryer: false, cookeo: false };
}

// Catégorie → fichier d'illustration (les 7 SVG fournis, intégrés tels quels).
const ILLUSTRATIONS = {
  feculent: 'feculent.svg',
  oeufs: 'oeufs.svg',
  volaille: 'volaille.svg',
  poisson: 'poisson.svg',
  viande: 'viande.svg',
  vegetarien: 'vegetarien.svg',
  soupe: 'soupe.svg',
};

/** Chemin de l'illustration d'un plat (override `illustration` sinon catégorie). */
export function illustrationPour(recette) {
  if (recette.illustration) return `./illustrations/${recette.illustration}`;
  return `./illustrations/${ILLUSTRATIONS[recette.categorie] || 'feculent.svg'}`;
}

/** Libellé d'équipement requis pour les badges (poêle par défaut). */
export function libelleEquipement(recette) {
  const eq = recette.equipement_requis || [];
  if (eq.includes('airfryer')) return 'Airfryer';
  if (eq.includes('cookeo')) return 'Cookeo';
  if (eq.includes('four')) return 'Four';
  return 'Poêle';
}

/** Quantité lisible : « 4 », « 200 g », « 1 boîte »… */
export function formatQuantite(q) {
  if (!q || q.valeur == null) return '';
  return q.unite ? `${q.valeur} ${q.unite}` : `${q.valeur}`;
}

// Arrondi d'une quantité mise à l'échelle, selon l'unité (lisible en cuisine).
function arrondirQuantite(valeur, unite) {
  if (unite === 'g' || unite === 'cl') return Math.max(10, Math.round(valeur / 10) * 10);
  if (unite === 'c. à soupe' || unite === 'c. à café') return Math.max(0.5, Math.round(valeur * 2) / 2);
  // dénombrables (œufs, boîtes, tranches, gousses, poignées, sachets, unités…)
  return Math.max(1, Math.round(valeur));
}

/**
 * Quantité ramenée à `portions` convives (la recette est écrite pour `base`).
 * Ex. 200 g pour 2 → « 300 g » pour 3.
 */
export function formatQuantitePortions(q, portions, base = 2) {
  if (!q || q.valeur == null) return '';
  const facteur = base ? portions / base : 1;
  const v = arrondirQuantite(q.valeur * facteur, q.unite);
  const aff = Number.isInteger(v) ? v : v.toFixed(1).replace('.0', '');
  return q.unite ? `${aff} ${q.unite}` : `${aff}`;
}
