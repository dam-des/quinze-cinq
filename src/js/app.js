// app.js — bootstrap, état applicatif, routage des écrans, intégration
// moteur / persistance / pub / notifications. Aucun calcul métier ici : tout
// passe par engine.js (pur). Les écrans ne font qu'afficher l'état + appeler ctx.

import { genererProposition } from './engine.js';
import * as storage from './storage.js';
import * as ads from './ads.js';
import {
  chargerCatalogue,
  gardeMangerParDefaut,
  preferencesParDefaut,
  equipementsParDefaut,
} from './data.js';
import { annoncer } from './ui.js';

import renderOnboarding from './screens/onboarding.js';
import renderHome from './screens/home.js';
import renderDetail from './screens/detail.js';
import renderCuisine from './screens/cooking.js';
import renderReglages from './screens/settings.js';
import renderConfidentialite from './screens/privacy.js';

const ECRANS = {
  onboarding: renderOnboarding,
  home: renderHome,
  detail: renderDetail,
  cuisine: renderCuisine,
  reglages: renderReglages,
  confidentialite: renderConfidentialite,
};

const ctx = {
  catalogue: null,
  etat: null,
  session: [], // ids déjà proposés dans la session courante (anti-répétition)
  proposition: null, // résultat courant de genererProposition()
  ecranCourant: null,

  // ── Navigation ─────────────────────────────────────────────────────────
  aller(nom, params = {}) {
    const root = document.getElementById('screen-root');
    root.innerHTML = '';
    ctx.ecranCourant = nom;
    const ecran = ECRANS[nom](ctx, params);
    root.appendChild(ecran);
    // Met le focus en tête d'écran pour le lecteur d'écran.
    const titre = ecran.querySelector('h1, h2, [data-autofocus]');
    if (titre) {
      titre.setAttribute('tabindex', '-1');
      titre.focus({ preventScroll: true });
    }
  },

  // ── Moteur ─────────────────────────────────────────────────────────────
  calculerProposition() {
    ctx.proposition = genererProposition(
      ctx.catalogue.recettes,
      ctx.etat,
      Date.now(),
      ctx.session,
      Math.random
    );
    return ctx.proposition;
  },

  autreChose() {
    const prec = ctx.proposition && ctx.proposition.recette;
    if (prec) {
      ctx.session.push(prec.id);
      ctx.marquerAffichage(prec.id);
    }
    ads.signalerAutreChose(); // interstitiel cadencé (jamais pendant détail/cuisine)
    ctx.calculerProposition();
    ctx.aller('home');
    const r = ctx.proposition.recette;
    annoncer(r ? `Nouvelle proposition : ${r.nom}` : 'Aucune proposition');
  },

  /** Coche/décoche un frais et relance le matching vers cet ingrédient. */
  toggleFrais(nom) {
    const f = ctx.etat.frais_du_jour;
    const i = f.indexOf(nom);
    if (i >= 0) f.splice(i, 1);
    else f.push(nom);
    ctx.session = []; // nouvelle orientation → proposition fraîche
    ctx.calculerProposition();
    ctx.aller('home');
  },

  // ── Historique / persistance ─────────────────────────────────────────────
  _hist(id) {
    if (!ctx.etat.historique[id]) ctx.etat.historique[id] = { appreciation: null };
    return ctx.etat.historique[id];
  },
  async marquerAffichage(id) {
    ctx._hist(id).affichage = Date.now();
    await storage.ecrire(storage.CLES.HISTORIQUE, ctx.etat.historique);
  },
  async marquerValidation(id) {
    ctx._hist(id).validation = Date.now();
    await storage.ecrire(storage.CLES.HISTORIQUE, ctx.etat.historique);
  },
  async noter(id, appreciation) {
    ctx._hist(id).appreciation = appreciation; // 'aime' | 'naime_pas' | null
    await storage.ecrire(storage.CLES.HISTORIQUE, ctx.etat.historique);
  },
  async sauver(cle, valeur) {
    await storage.ecrire(cle, valeur);
  },

  // ── Détail / cuisine ─────────────────────────────────────────────────────
  ouvrirDetail(recette) {
    ctx.marquerAffichage(recette.id); // ouverture sans cuisiner = simple affichage
    ctx.aller('detail', { recette });
  },
  async cuisiner(recette) {
    await ctx.marquerValidation(recette.id);
    ctx.aller('cuisine', { recette });
  },

  // ── Onboarding terminé ────────────────────────────────────────────────────
  async terminerOnboarding() {
    await storage.ecrire(storage.CLES.ONBOARDING, true);
    await ads.initialiser(); // consentement UMP au tout dernier moment
    ads.afficherBanniere();
    ctx.session = [];
    ctx.calculerProposition();
    ctx.aller('home');
  },
};

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function demarrer() {
  ctx.catalogue = await chargerCatalogue();

  const onboardingFait = await storage.lire(storage.CLES.ONBOARDING, false);

  ctx.etat = {
    garde_manger: await storage.lire(
      storage.CLES.GARDE_MANGER,
      gardeMangerParDefaut(ctx.catalogue)
    ),
    equipements: await storage.lire(storage.CLES.EQUIPEMENTS, equipementsParDefaut()),
    preferences: await storage.lire(storage.CLES.PREFERENCES, preferencesParDefaut()),
    historique: await storage.lire(storage.CLES.HISTORIQUE, {}),
    reglage_notif: await storage.lire(storage.CLES.REGLAGE_NOTIF, {
      actif: false,
      heure: '18:00',
    }),
    frais_du_jour: [], // jamais persisté : propre à la soirée
  };

  if (!onboardingFait) {
    ctx.aller('onboarding');
  } else {
    await ads.initialiser();
    ads.afficherBanniere();
    ctx.calculerProposition();
    ctx.aller('home');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  demarrer().catch((e) => {
    const root = document.getElementById('screen-root');
    root.innerHTML = `<div style="padding:40px">Erreur de démarrage : ${e.message}</div>`;
    console.error(e);
  });
});
