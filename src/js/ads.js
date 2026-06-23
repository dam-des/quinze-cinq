// ads.js — AdMob (bannière + interstitiel) avec ATT (iOS) + consentement UMP.
// Jamais d'interstitiel au lancement ni pendant une action ; bannière discrète en
// bas de l'accueil ; interstitiel toutes les CADENCE_INTERSTITIEL « Autre chose ».
// Dégrade en no-op hors natif.

// ─── BASCULE PROD ────────────────────────────────────────────────────────────
// Passer à true UNE FOIS les vrais blocs AdMob créés et remplis ci-dessous,
// ET les App IDs renseignés dans ios/App/App/Info.plist (GADApplicationIdentifier)
// et android/app/src/main/AndroidManifest.xml (APPLICATION_ID).
const PROD = true;

// Identifiants de BLOCS publicitaires (≠ App ID). TEST = blocs publics Google
// (identiques iOS/Android). PROD = blocs réels AdMob, un par plateforme.
const BLOCS = {
  test: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  prod: {
    ios: {
      banner: 'ca-app-pub-3773782948374050/7411672454',
      interstitial: 'ca-app-pub-3773782948374050/5332459552',
    },
    android: {
      banner: 'ca-app-pub-3773782948374050/9124364901',
      interstitial: 'ca-app-pub-3773782948374050/2350917461',
    },
  },
};

function plateforme() {
  const cap = globalThis.Capacitor;
  return (cap && cap.getPlatform && cap.getPlatform()) || 'web';
}

/** Id du bloc (test, ou prod selon la plateforme). */
function blocId(type) {
  if (!PROD) return BLOCS.test[type];
  return BLOCS.prod[plateforme() === 'android' ? 'android' : 'ios'][type];
}

export const CADENCE_INTERSTITIEL = 4; // 1 interstitiel tous les 4 « Autre chose » (moins intrusif).

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
    // App Tracking Transparency (iOS 14+) : requise par Apple avant pubs personnalisées.
    if (p.requestTrackingAuthorization) {
      try { await p.requestTrackingAuthorization(); } catch { /* refus = pub non personnalisée */ }
    }
    await p.initialize({ initializeForTesting: !PROD });
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
      adId: blocId('banner'),
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      isTesting: !PROD,
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
    await p.prepareInterstitial({ adId: blocId('interstitial'), isTesting: !PROD });
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
