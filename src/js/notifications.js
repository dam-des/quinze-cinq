// notifications.js — rappel quotidien LOCAL (cadrage §7, §11, cas H).
// Aucune donnée transmise. Permission demandée en opt-in contextuel.
// Dégrade proprement hors natif (no-op).

const NOTIF_ID = 1505; // id stable, reprogrammé chaque jour.

function plugin() {
  const cap = globalThis.Capacitor;
  return cap && cap.Plugins && cap.Plugins.LocalNotifications
    ? cap.Plugins.LocalNotifications
    : null;
}

export function disponible() {
  return !!plugin();
}

/** Demande la permission (opt-in contextuel). @returns {boolean} accordée ? */
export async function demanderPermission() {
  const p = plugin();
  if (!p) return false;
  try {
    const res = await p.requestPermissions();
    return res.display === 'granted';
  } catch {
    return false;
  }
}

export async function permissionAccordee() {
  const p = plugin();
  if (!p) return false;
  try {
    const res = await p.checkPermissions();
    return res.display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Planifie le rappel quotidien à l'heure donnée (HH:MM), répété chaque jour.
 * Annule d'abord toute planification existante pour éviter les doublons.
 */
export async function planifierQuotidien(heure = '18:00') {
  const p = plugin();
  if (!p) return;
  await annuler();
  const [h, m] = heure.split(':').map((n) => parseInt(n, 10));
  await p.schedule({
    notifications: [
      {
        id: NOTIF_ID,
        title: 'Quinze Cinq',
        body: 'On a choisi ton dîner — prêt en 15 min 🍳',
        schedule: { on: { hour: h, minute: m }, repeats: true, every: 'day' },
      },
    ],
  });
}

/** Enregistre un callback exécuté quand l'utilisateur tape la notification. */
export function surOuverture(callback) {
  const p = plugin();
  if (!p) return;
  try {
    p.addListener('localNotificationActionPerformed', () => callback());
  } catch {
    /* listener indisponible */
  }
}

export async function annuler() {
  const p = plugin();
  if (!p) return;
  try {
    await p.cancel({ notifications: [{ id: NOTIF_ID }] });
  } catch {
    /* rien à annuler */
  }
}
