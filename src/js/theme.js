// theme.js — apparence claire / sombre / auto, persistante et sans flash.
// Stocké en localStorage (présent en navigateur ET dans la WebView native) pour
// pouvoir être appliqué dès le premier rendu par le script inline d'index.html.
// Aucune donnée ne quitte l'appareil.

const CLE = 'q5.theme'; // 'auto' | 'clair' | 'sombre'
const mql = globalThis.matchMedia?.('(prefers-color-scheme: dark)');

/** Mode choisi par l'utilisateur (défaut : 'auto', qui suit le système). */
export function lireTheme() {
  const v = globalThis.localStorage?.getItem(CLE);
  return v === 'clair' || v === 'sombre' ? v : 'auto';
}

/** Le mode demandé se traduit-il par un affichage sombre, ici et maintenant ? */
function sombreEffectif(mode) {
  if (mode === 'sombre') return true;
  if (mode === 'clair') return false;
  return !!mql?.matches; // auto → réglage système
}

/** Applique le thème au DOM (classe + couleur de la barre d'état). */
export function appliquerTheme(mode = lireTheme()) {
  const sombre = sombreEffectif(mode);
  document.documentElement.classList.toggle('theme-dark', sombre);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', sombre ? '#0E0F12' : '#EEEDE7');
  return sombre;
}

/** Mémorise et applique un nouveau mode. */
export function definirTheme(mode) {
  globalThis.localStorage?.setItem(CLE, mode);
  appliquerTheme(mode);
}

// En mode « Auto », suit les changements de réglage système en direct.
mql?.addEventListener?.('change', () => {
  if (lireTheme() === 'auto') appliquerTheme('auto');
});
