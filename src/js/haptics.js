// haptics.js — retours haptiques (Capacitor Haptics). No-op hors natif.

function plugin() {
  const c = globalThis.Capacitor;
  return c && c.Plugins && c.Plugins.Haptics ? c.Plugins.Haptics : null;
}

export async function impact(style = 'LIGHT') {
  const p = plugin();
  if (!p) return;
  try {
    await p.impact({ style });
  } catch {
    /* ignore */
  }
}

export async function notif(type = 'SUCCESS') {
  const p = plugin();
  if (!p) return;
  try {
    await p.notification({ type });
  } catch {
    /* ignore */
  }
}

export async function selection() {
  const p = plugin();
  if (!p) return;
  try {
    await p.selectionStart();
    await p.selectionChanged();
    await p.selectionEnd();
  } catch {
    /* ignore */
  }
}
