// keepawake.js — empêche la mise en veille de l'écran pendant le mode cuisine
// (Capacitor Community KeepAwake). No-op hors natif.

function plugin() {
  const c = globalThis.Capacitor;
  return c && c.Plugins && c.Plugins.KeepAwake ? c.Plugins.KeepAwake : null;
}

export async function garderEveille() {
  const p = plugin();
  if (!p) return;
  try {
    await p.keepAwake();
  } catch {
    /* ignore */
  }
}

export async function laisserDormir() {
  const p = plugin();
  if (!p) return;
  try {
    await p.allowSleep();
  } catch {
    /* ignore */
  }
}
