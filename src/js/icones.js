// icones.js — icônes d'action des étapes de préparation (couper, battre, poêler…).
// Assets fournis dans src/icones_etapes/ (trait encre #16171B + accent jaune #FFC400,
// fond transparent). Sélection pilotée par icones_etapes/mapping.json.

let _mapping = null;

/** Charge le mapping (une seule fois). À appeler au démarrage. */
export async function chargerMappingIcones() {
  if (_mapping) return _mapping;
  const res = await fetch('./icones_etapes/mapping.json');
  if (!res.ok) throw new Error('Impossible de charger le mapping des icônes');
  _mapping = await res.json();
  return _mapping;
}

/**
 * Chemin de l'icône correspondant à l'action d'une étape : texte en minuscules,
 * on parcourt `priorite` dans l'ordre et on retient la 1re entrée dont un mot-clé
 * est contenu dans le texte. Sinon `defaut`.
 */
export function iconePourEtape(texte = '') {
  const t = texte.toLowerCase();
  const m = _mapping;
  if (!m) return './icones_etapes/defaut.svg';
  for (const icone of m.priorite) {
    if ((m.mots_cles[icone] || []).some((k) => t.includes(k))) {
      return `./icones_etapes/${icone}.svg`;
    }
  }
  return `./icones_etapes/${m.defaut}.svg`;
}
