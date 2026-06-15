// engine.js — Moteur de matching de Quinze Cinq (cf. cadrage §10).
//
// Code PUR : entrées → sortie, sans effet de bord, sans accès aux plugins natifs
// ni au DOM. Tout est injectable (date du jour `now`, générateur aléatoire `rng`)
// pour être testable isolément (cf. docs/cas_de_test_moteur.md).
//
// Principes non négociables :
//  - Les FILTRES DURS (équipement, végé, exclusions) ne sont JAMAIS relâchés.
//  - La récence est gérée par DECAY (pas d'exclusion, pas de « sac mélangé ») :
//    un plat cuisiné redevient un candidat normal après ~4 jours, quelle que
//    soit la taille de la base.
//  - Le 👎 est un malus fort mais DURABLE et non définitif : le plat retombe en
//    bas du classement et n'est relâché qu'en TOUT dernier recours.
//  - Jamais d'écran vide : relâchement progressif des malus soft (§10.5).

// ── Constantes de scoring ────────────────────────────────────────────────────
export const SCORE_BASE = 100;

// Préférence apprise (durable, indépendante du timing).
export const BONUS_AIME = 25;      // 👍 : favorise durablement.
export const MALUS_NAIME = 10000;  // 👎 : envoie le plat tout en bas (pas exclu).

// Récence du plat validé (temporaire, decay linéaire sur RECENCE_JOURS jours).
export const RECENCE_MALUS_MAX = 60;
export const RECENCE_JOURS = 4;

// Plat seulement affiché (zappé) récemment : petit malus court.
export const AFFICHAGE_MALUS = 12;
export const AFFICHAGE_JOURS = 2;

// Diversité de catégorie : malus léger si la catégorie a été vue il y a peu.
export const DIVERSITE_MALUS = 15;
export const DIVERSITE_JOURS = 3;

// Appoint : léger malus par ingrédient manquant.
export const APPOINT_MALUS = 14;

// Frais explicitement coché ce soir et utilisé par le plat : bonus net, PAR frais
// matché (le plat qui utilise le plus d'ingrédients cochés remonte en tête).
export const BONUS_FRAIS_COCHE = 45;

// Préférence « plats pour enfants » : bonus doux (non filtrant).
export const BONUS_ENFANT = 20;

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Nombre de jours (réel, décimal) écoulés entre `ts` et `now`. */
function joursDepuis(ts, now) {
  return (now - ts) / MS_PAR_JOUR;
}

// ── Étape 1 — Filtres durs (JAMAIS relâchés) ─────────────────────────────────
/**
 * @returns {boolean} true si le plat passe TOUS les filtres durs.
 *  - équipement requis non possédé → éliminé ;
 *  - préférence végé active et plat non tagué `vegetarien` → éliminé ;
 *  - un tag d'exclusion (contenu, ex. `porc`) présent sur le plat → éliminé.
 */
export function passeFiltresDurs(recette, preferences = {}, equipements = {}) {
  for (const eq of recette.equipement_requis || []) {
    if (!equipements[eq]) return false;
  }
  if (preferences.vegetarien && !(recette.tags || []).includes('vegetarien')) {
    return false;
  }
  for (const exclusion of preferences.exclusions || []) {
    if ((recette.tags || []).includes(exclusion)) return false;
  }
  return true;
}

// ── Étape 2 — Réalisabilité ingrédients ──────────────────────────────────────
/**
 * Liste les ingrédients manquants d'un plat selon l'état :
 *  - `base`  manquant si absent du garde-manger possédé ;
 *  - `frais` manquant si non coché dans `frais_du_jour`.
 * Les basiques de fond (sel/poivre/huile/eau/beurre) ne sont pas comptés ici :
 * ils n'apparaissent pas comme ingrédients comptables dans les recettes.
 */
export function ingredientsManquants(recette, garde_manger = [], frais_du_jour = []) {
  const manquants = [];
  for (const ing of recette.ingredients || []) {
    if (ing.type === 'base' && !garde_manger.includes(ing.nom)) manquants.push(ing);
    else if (ing.type === 'frais' && !frais_du_jour.includes(ing.nom)) manquants.push(ing);
  }
  return manquants;
}

/**
 * Frais qui « mènent quelque part » : noms d'ingrédients frais utilisés par au
 * moins une recette passant les filtres durs (préférences + équipement). Sert à
 * masquer dans l'UI les frais sans issue (ex. viande quand végé est actif).
 */
export function fraisPertinents(recettes, etat) {
  const set = new Set();
  for (const r of recettes) {
    if (!passeFiltresDurs(r, etat.preferences, etat.equipements)) continue;
    for (const i of r.ingredients || []) if (i.type === 'frais') set.add(i.nom);
  }
  return set;
}

/** Ensemble des catégories validées dans les `jours` derniers jours. */
function categoriesRecentes(recettes, historique = {}, now, jours) {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  const cats = new Set();
  for (const [id, h] of Object.entries(historique)) {
    if (h && h.validation && joursDepuis(h.validation, now) < jours) {
      const r = parId.get(id);
      if (r) cats.add(r.categorie);
    }
  }
  return cats;
}

// ── Étape 3 — Évaluation/scoring d'un plat ───────────────────────────────────
/**
 * Évalue un plat (déjà passé par les filtres durs) : éligibilité + score + raisons.
 * @param {object} options { maxManquants, applyRecence, applyDiversite, applyDislike }
 */
function evaluer(recette, etat, now, options, catsRecentes, rng) {
  const fraisCoches = etat.frais_du_jour || [];
  const manquants = ingredientsManquants(recette, etat.garde_manger, fraisCoches);
  const baseManquants = manquants.filter((m) => m.type === 'base').length;
  // Frais explicitement cochés ET utilisés par ce plat (orientation utilisateur).
  const nbMatch = (recette.ingredients || []).filter(
    (i) => i.type === 'frais' && fraisCoches.includes(i.nom)
  ).length;
  const oriente = fraisCoches.length > 0 && nbMatch > 0;
  // Plat orienté : éligible tant que les BASE sont là — les autres frais sont
  // « à acheter » (signalés), pas un motif d'exclusion. Sinon : appoint classique.
  const eligible = oriente
    ? baseManquants <= options.maxManquants
    : manquants.length <= options.maxManquants;

  let score = SCORE_BASE;
  const raisons = [];
  const h = (etat.historique && etat.historique[recette.id]) || {};

  // (a) Préférence apprise — durable.
  if (h.appreciation === 'aime') {
    score += BONUS_AIME;
    raisons.push('aimé');
  }
  if (h.appreciation === 'naime_pas' && options.applyDislike) {
    score -= MALUS_NAIME;
    raisons.push('pas aimé');
  }

  // (b) Récence du plat validé — temporaire, decay.
  if (options.applyRecence && h.validation) {
    const d = joursDepuis(h.validation, now);
    const decay = Math.max(0, 1 - d / RECENCE_JOURS);
    if (decay > 0) {
      score -= RECENCE_MALUS_MAX * decay;
      raisons.push('cuisiné récemment');
    }
  }

  // (c) Affichage récent (zappé) — petit malus court.
  if (options.applyRecence && h.affichage) {
    const d = joursDepuis(h.affichage, now);
    if (d < AFFICHAGE_JOURS) {
      score -= AFFICHAGE_MALUS * (1 - d / AFFICHAGE_JOURS);
      raisons.push('vu récemment');
    }
  }

  // (d) Diversité de catégorie.
  if (options.applyDiversite && catsRecentes.has(recette.categorie)) {
    score -= DIVERSITE_MALUS;
    raisons.push('catégorie récente');
  }

  // (e) Appoint — léger malus par ingrédient manquant (sur les BASE seulement
  // pour un plat orienté : les frais à acheter ne sont pas pénalisés).
  const nbAppoint = oriente ? baseManquants : manquants.length;
  if (nbAppoint > 0) {
    score -= APPOINT_MALUS * nbAppoint;
    raisons.push('appoint');
  }

  // (f) Frais cochés utilisés : bonus PAR frais matché → le plat couvrant le
  // plus d'ingrédients cochés remonte en tête.
  if (nbMatch > 0) {
    score += BONUS_FRAIS_COCHE * nbMatch;
    raisons.push('frais coché');
  }

  // (g) Préférence « plats pour enfants » (douce, non filtrante).
  if (
    etat.preferences &&
    etat.preferences.enfant_friendly &&
    (recette.tags || []).includes('enfant_friendly')
  ) {
    score += BONUS_ENFANT;
    raisons.push('enfant');
  }

  return {
    recette,
    eligible,
    score,
    manquants,
    realisablePleinement: manquants.length === 0,
    raisons,
    alea: rng(), // figé pour départager les égalités de façon reproductible
  };
}

// ── Classement (un niveau de relâchement donné) ──────────────────────────────
/**
 * Classe les plats ÉLIGIBLES par score décroissant (égalités départagées
 * aléatoirement via `rng`). N'inclut jamais un plat recalé par un filtre dur.
 */
export function classer(recettes, etat, now = Date.now(), options = {}, rng = Math.random) {
  const opt = {
    maxManquants: 1,
    applyRecence: true,
    applyDiversite: true,
    applyDislike: true,
    ...options,
  };
  const catsRecentes = opt.applyDiversite
    ? categoriesRecentes(recettes, etat.historique, now, DIVERSITE_JOURS)
    : new Set();

  return recettes
    .filter((r) => passeFiltresDurs(r, etat.preferences, etat.equipements))
    .map((r) => evaluer(r, etat, now, opt, catsRecentes, rng))
    .filter((e) => e.eligible)
    .sort((a, b) => b.score - a.score || b.alea - a.alea);
}

// ── Étape 5 — Relâchement anti-écran-vide (§10.5) ────────────────────────────
// Ordre des niveaux : appoint (≤2) → diversité → récence → 👎 → appoint illimité.
// Les filtres durs ne sont JAMAIS dans cette liste.
const NIVEAUX_RELACHEMENT = [
  { maxManquants: 1, applyRecence: true, applyDiversite: true, applyDislike: true },
  { maxManquants: 2, applyRecence: true, applyDiversite: true, applyDislike: true },
  { maxManquants: 2, applyRecence: true, applyDiversite: false, applyDislike: true },
  { maxManquants: 2, applyRecence: false, applyDiversite: false, applyDislike: true },
  { maxManquants: 3, applyRecence: false, applyDiversite: false, applyDislike: false },
  { maxManquants: Infinity, applyRecence: false, applyDiversite: false, applyDislike: false },
];

/**
 * Génère LA proposition du moment (un seul plat), en respectant :
 *  - la session : on ne répète pas un plat déjà montré (`sessionShown`) tant
 *    que d'autres candidats existent ;
 *  - le relâchement progressif : on n'autorise un plat à appoint, puis on
 *    annule diversité/récence, puis le 👎, puis on autorise la répétition de
 *    session, que si aucun candidat « meilleur » n'est disponible.
 *
 * @returns {{ recette, evaluation, niveauRelache, repetitionSession, classement }}
 *          `recette` vaut null seulement si la base est vide après filtres durs.
 */
export function genererProposition(
  recettes,
  etat,
  now = Date.now(),
  sessionShown = [],
  rng = Math.random
) {
  for (let niveau = 0; niveau < NIVEAUX_RELACHEMENT.length; niveau++) {
    const classement = classer(recettes, etat, now, NIVEAUX_RELACHEMENT[niveau], rng);
    const horsSession = classement.filter((e) => !sessionShown.includes(e.recette.id));
    if (horsSession.length > 0) {
      return {
        recette: horsSession[0].recette,
        evaluation: horsSession[0],
        niveauRelache: niveau,
        repetitionSession: false,
        classement,
      };
    }
  }

  // Tout est filtré par la session : dernier recours, on autorise la répétition
  // au niveau le plus relâché (garantit ≥ 1 proposition — jamais d'écran vide).
  const ultime = classer(
    recettes,
    etat,
    now,
    NIVEAUX_RELACHEMENT[NIVEAUX_RELACHEMENT.length - 1],
    rng
  );
  if (ultime.length > 0) {
    return {
      recette: ultime[0].recette,
      evaluation: ultime[0],
      niveauRelache: NIVEAUX_RELACHEMENT.length - 1,
      repetitionSession: true,
      classement: ultime,
    };
  }

  return { recette: null, evaluation: null, niveauRelache: -1, repetitionSession: false, classement: [] };
}

export const _internals = { joursDepuis, categoriesRecentes, evaluer, NIVEAUX_RELACHEMENT };
