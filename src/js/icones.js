// icones.js — icônes d'action des étapes de préparation (couper, battre, poêler…).
// Assets fournis dans src/icones_etapes/ (trait encre #16171B + accent jaune #FFC400,
// fond transparent). Sélection pilotée par icones_etapes/mapping.json.
//
// Les SVG sont injectés EN INLINE (et non via <img>) : on remplace le trait encre
// #16171B par `currentColor`, ce qui laisse le CSS recoloriser le trait selon le
// thème (--ink : sombre en clair, clair en sombre). Le jaune et les aplats blancs
// restent inchangés. On passe par l'inline car une media-query dans un <img> SVG
// suivrait le réglage système, pas le bouton de thème de l'app.

let _mapping = null;
const _svg = new Map(); // nom d'icône → markup inline (trait = currentColor)

/** Trait encre des assets, basculé en currentColor pour suivre le thème. */
function inliner(markup) {
  return markup.replace(/#16171B/gi, 'currentColor');
}

/** Charge le mapping et précharge les SVG (une seule fois). À appeler au démarrage. */
export async function chargerMappingIcones() {
  if (_mapping) return _mapping;
  const res = await fetch('./icones_etapes/mapping.json');
  if (!res.ok) throw new Error('Impossible de charger le mapping des icônes');
  _mapping = await res.json();

  const noms = [...new Set([..._mapping.priorite, _mapping.defaut])];
  await Promise.all(
    noms.map(async (nom) => {
      try {
        const r = await fetch(`./icones_etapes/${nom}.svg`);
        if (r.ok) _svg.set(nom, inliner(await r.text()));
      } catch {
        /* asset manquant : on retombera sur le fallback à l'usage */
      }
    })
  );
  return _mapping;
}

/** Nom d'icône correspondant au texte d'une étape (parcourt `priorite`). */
function nomPourEtape(texte = '') {
  const t = texte.toLowerCase();
  const m = _mapping;
  if (!m) return null;
  for (const icone of m.priorite) {
    if ((m.mots_cles[icone] || []).some((k) => t.includes(k))) return icone;
  }
  return m.defaut;
}

/**
 * Chemin de l'icône correspondant à l'action d'une étape (compat / fallback <img>).
 */
export function iconePourEtape(texte = '') {
  return `./icones_etapes/${nomPourEtape(texte) ?? 'defaut'}.svg`;
}

/**
 * Markup SVG INLINE de l'icône (trait = currentColor), à insérer directement dans
 * le DOM. Retombe sur un <img> si le SVG n'a pas pu être préchargé.
 */
export function iconeSvgPourEtape(texte = '') {
  const nom = nomPourEtape(texte) ?? 'defaut';
  const svg = _svg.get(nom);
  return svg ?? `<img src="./icones_etapes/${nom}.svg" alt="" aria-hidden="true" />`;
}
