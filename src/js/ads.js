// ads.js — AdMob (bannière + interstitiel) avec consentement UMP (cadrage §14).
// POC : identifiants de TEST. Jamais d'interstitiel au lancement ni pendant une
// action ; bannière discrète en bas de l'accueil ; interstitiel toutes les
// CADENCE_INTERSTITIEL occurrences de « Autre chose ». Dégrade en no-op hors natif.

// Identifiants AdMob de TEST (publics, fournis par Google).
const TEST = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

export const CADENCE_INTERSTITIEL = 2; // 1 interstitiel tous les 2 « Autre chose ».

let _compteurAutreChose = 0;
let _bannereAffichee = false;

function plugin() {
  const cap = globalThis.Capacitor;
  return cap && cap.Plugins && cap.Plugins.AdMob ? cap.Plugins.AdMob : null;
}

export function disponible() {
  return !!plugin();
}

/** Initialise l'SDK et recueille le consentement UMP AVANT toute pub. */
export async function initialiser() {
  const p = plugin();
  if (!p) return { ok: false };
  try {
    await p.initialize({ initializeForTesting: true });
    // UMP : recueil/affichage du formulaire de consentement si nécessaire.
    if (p.requestConsentInfo) {
      await p.requestConsentInfo({});
      if (p.showConsentForm) await p.showConsentForm().catch(() => {});
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: String(e) };
  }
}

export async function afficherBanniere() {
  const p = plugin();
  if (!p || _bannereAffichee) return;
  try {
    await p.showBanner({
      adId: TEST.banner,
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      isTesting: true,
    });
    _bannereAffichee = true;
  } catch {
    /* pub non bloquante */
  }
}

export async function masquerBanniere() {
  const p = plugin();
  if (!p || !_bannereAffichee) return;
  try {
    await p.hideBanner();
    _bannereAffichee = false;
  } catch {
    /* ignore */
  }
}

/**
 * À appeler à chaque « Autre chose ». Déclenche un interstitiel une fois sur
 * CADENCE_INTERSTITIEL — jamais au 1er affichage, jamais pendant le détail/cuisine.
 */
export async function signalerAutreChose() {
  _compteurAutreChose++;
  if (_compteurAutreChose % CADENCE_INTERSTITIEL !== 0) return;
  const p = plugin();
  if (!p) return;
  try {
    await p.prepareInterstitial({ adId: TEST.interstitial, isTesting: true });
    await p.showInterstitial();
  } catch {
    /* pub non bloquante */
  }
}

export function reinitialiserCadence() {
  _compteurAutreChose = 0;
}

/**
 * Permet à l'utilisateur de revoir/modifier son consentement publicitaire.
 * Renvoie un message lisible à afficher (le bouton réglages ne doit jamais
 * sembler « mort »).
 */
export async function revoirConsentement() {
  const p = plugin();
  if (!p) return { ok: false, message: 'Le consentement publicitaire sera disponible dans l’app installée.' };
  try {
    if (p.resetConsentInfo) await p.resetConsentInfo();
    let info = {};
    if (p.requestConsentInfo) info = await p.requestConsentInfo({});
    if (p.showConsentForm && (info.isConsentFormAvailable ?? true)) {
      await p.showConsentForm();
      return { ok: true, message: 'Ton choix de consentement a été mis à jour.' };
    }
    if (p.showPrivacyOptionsForm) {
      await p.showPrivacyOptionsForm();
      return { ok: true, message: 'Ton choix de consentement a été mis à jour.' };
    }
    return { ok: true, message: 'Consentement déjà enregistré : aucun formulaire à afficher.' };
  } catch (e) {
    return { ok: false, message: 'Impossible d’ouvrir le formulaire de consentement.' };
  }
}
