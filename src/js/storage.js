// storage.js — persistance locale (cadrage §9).
// Utilise Capacitor Preferences en natif ; repli transparent sur localStorage
// pour la prévisualisation en navigateur. Aucune donnée ne quitte l'appareil.

const PREFIX = 'q5.';

// Clés de persistance (§9).
export const CLES = {
  ONBOARDING: 'onboarding_done',
  GARDE_MANGER: 'garde_manger',
  EQUIPEMENTS: 'equipements',
  PREFERENCES: 'preferences',
  HISTORIQUE: 'historique',
  REGLAGE_NOTIF: 'reglage_notif',
  CONSENTEMENT_PUB: 'consentement_pub',
};

function preferencesPlugin() {
  const cap = globalThis.Capacitor;
  return cap && cap.Plugins && cap.Plugins.Preferences ? cap.Plugins.Preferences : null;
}

async function brut_get(cle) {
  const plugin = preferencesPlugin();
  if (plugin) {
    const { value } = await plugin.get({ key: PREFIX + cle });
    return value ?? null;
  }
  return globalThis.localStorage?.getItem(PREFIX + cle) ?? null;
}

async function brut_set(cle, valeur) {
  const plugin = preferencesPlugin();
  if (plugin) return plugin.set({ key: PREFIX + cle, value: valeur });
  globalThis.localStorage?.setItem(PREFIX + cle, valeur);
}

async function brut_remove(cle) {
  const plugin = preferencesPlugin();
  if (plugin) return plugin.remove({ key: PREFIX + cle });
  globalThis.localStorage?.removeItem(PREFIX + cle);
}

/** Lit une valeur JSON (ou `defaut` si absente/illisible). */
export async function lire(cle, defaut = null) {
  const raw = await brut_get(cle);
  if (raw == null) return defaut;
  try {
    return JSON.parse(raw);
  } catch {
    return defaut;
  }
}

/** Écrit une valeur (sérialisée en JSON). */
export async function ecrire(cle, valeur) {
  await brut_set(cle, JSON.stringify(valeur));
}

export async function effacer(cle) {
  await brut_remove(cle);
}
