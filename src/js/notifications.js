// notifications.js — rappel quotidien LOCAL (cadrage §7, §11, cas H).
// Aucune donnée transmise. Permission demandée en opt-in contextuel.
// Dégrade proprement hors natif (no-op).

const NOTIF_ID = 1505; // rappel quotidien : id stable, reprogrammé chaque jour.
const MINUTEUR_ID = 1506; // minuteur de cuisine : notification unique de fin.

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
export async function planifierQuotidien(heure = '18:00', nomPlat = null) {
  const p = plugin();
  if (!p) return;
  await annuler();
  const [h, m] = heure.split(':').map((n) => parseInt(n, 10));
  const body = nomPlat
    ? `Ce soir : ${nomPlat} — prêt en 15 min 🍳`
    : 'On a choisi ton dîner — prêt en 15 min 🍳';
  await p.schedule({
    notifications: [
      {
        id: NOTIF_ID,
        title: 'Quinze Cinq',
        body,
        schedule: { on: { hour: h, minute: m }, repeats: true, every: 'day' },
      },
    ],
  });
}

/**
 * Minuteur « comme le téléphone » : programme une notification locale (son +
 * vibration système) à la fin du décompte, pour alerter même app en arrière-plan
 * ou écran éteint. Best-effort : demande la permission au 1er usage ; si refusée,
 * le décompte interne + haptique de l'app prend le relais. @returns {boolean} programmé ?
 */
export async function lancerMinuteur(secondes, texte = 'C’est prêt !') {
  const p = plugin();
  if (!p || !secondes || secondes <= 0) return false;
  if (!(await permissionAccordee()) && !(await demanderPermission())) return false;
  await annulerMinuteur();
  try {
    await p.schedule({
      notifications: [
        {
          id: MINUTEUR_ID,
          title: '⏱ Minuteur Quinze Cinq',
          body: texte,
          schedule: { at: new Date(Date.now() + secondes * 1000) },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function annulerMinuteur() {
  const p = plugin();
  if (!p) return;
  try {
    await p.cancel({ notifications: [{ id: MINUTEUR_ID }] });
  } catch {
    /* rien à annuler */
  }
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
