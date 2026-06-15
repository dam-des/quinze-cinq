// Tests unitaires du moteur (docs/cas_de_test_moteur.md).
// Lancement : `npm test` (aucune dépendance — node:test intégré).
//
// Le moteur étant pur, on injecte un état, une « date du jour » (now) et un
// générateur aléatoire déterministe (mulberry32) — sans UI ni plugin natif.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  classer,
  genererProposition,
  passeFiltresDurs,
  ingredientsManquants,
} from '../src/js/engine.js';

// ── Données ──────────────────────────────────────────────────────────────────
const lire = (rel) =>
  JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
const POC = lire('../src/data/recettes_poc.json');
const CINQUANTE = lire('../src/data/recettes_50.json');

/** Garde-manger « plein » = tous les ingrédients base référencés par la base.
 *  (Reproduit le seeding par défaut : aucun `base` manquant tant qu'on ne
 *  retire rien — indispensable pour que les plats 100 % placard soient
 *  pleinement réalisables, cf. B1.) */
function gardeMangerComplet(data) {
  const noms = new Set(data.garde_manger_base);
  for (const r of data.recettes)
    for (const i of r.ingredients) if (i.type === 'base') noms.add(i.nom);
  return [...noms];
}

const JOUR = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 5, 15, 18, 0, 0); // 2026-06-15 18:00, date fixe.

/** PRNG déterministe (mulberry32) pour reproduire les départages d'égalité. */
function rng(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Construit un état moteur avec des valeurs par défaut raisonnables. */
function etat(data, over = {}) {
  return {
    garde_manger: gardeMangerComplet(data),
    equipements: { four: true, airfryer: false },
    frais_du_jour: [],
    preferences: { vegetarien: false, enfant_friendly: false, exclusions: [] },
    historique: {},
    ...over,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// A. Filtres durs (jamais relâchés)
// ════════════════════════════════════════════════════════════════════════════

test('A1 — équipement airfryer manquant : jamais proposé', () => {
  const e = etat(CINQUANTE, { equipements: { four: true, airfryer: false } });
  const session = [];
  for (let i = 0; i < 30; i++) {
    const p = genererProposition(CINQUANTE.recettes, e, NOW, session, rng(i + 1));
    assert.ok(p.recette, 'une proposition existe toujours');
    assert.ok(
      !(p.recette.equipement_requis || []).includes('airfryer'),
      `plat airfryer proposé : ${p.recette.id}`
    );
    session.push(p.recette.id);
  }
});

test('A2 — préférence végé : uniquement des plats végé sur 15 « Autre chose »', () => {
  const e = etat(POC, {
    preferences: { vegetarien: true, exclusions: [] },
    frais_du_jour: ['champignons', 'carotte', 'poivron', 'courgette', 'pomme de terre'],
  });
  const session = [];
  for (let i = 0; i < 15; i++) {
    const p = genererProposition(POC.recettes, e, NOW, session, rng(i + 7));
    assert.ok(p.recette, 'jamais d’écran vide');
    assert.ok(
      (p.recette.tags || []).includes('vegetarien'),
      `plat non-végé proposé : ${p.recette.id}`
    );
    session.push(p.recette.id);
  }
});

test('A3 — exclusion porc : les plats tagués porc ne sont jamais proposés', () => {
  const e = etat(CINQUANTE, {
    preferences: { vegetarien: false, exclusions: ['porc'] },
    equipements: { four: true, airfryer: true },
  });
  const interdits = CINQUANTE.recettes
    .filter((r) => (r.tags || []).includes('porc'))
    .map((r) => r.id);
  assert.ok(interdits.length >= 3, 'la base de test contient des plats porc');
  const session = [];
  for (let i = 0; i < 60; i++) {
    const p = genererProposition(CINQUANTE.recettes, e, NOW, session, rng(i + 1));
    assert.ok(!interdits.includes(p.recette.id), `plat porc proposé : ${p.recette.id}`);
    session.push(p.recette.id);
  }
});

test('A4 — cumul végé + pas d’airfryer : intersection correcte', () => {
  const e = etat(CINQUANTE, {
    preferences: { vegetarien: true, exclusions: [] },
    equipements: { four: true, airfryer: false },
  });
  const classement = classer(CINQUANTE.recettes, e, NOW, { maxManquants: 5 }, rng());
  for (const c of classement) {
    assert.ok((c.recette.tags || []).includes('vegetarien'));
    assert.ok(!(c.recette.equipement_requis || []).includes('airfryer'));
  }
});

// ════════════════════════════════════════════════════════════════════════════
// B. Réalisabilité & garde-manger
// ════════════════════════════════════════════════════════════════════════════

test('B1 — Surprends-moi placard standard : top = plat 100 % placard', () => {
  const e = etat(POC);
  const p = genererProposition(POC.recettes, e, NOW, [], rng(3));
  assert.ok(p.recette);
  assert.equal(p.evaluation.manquants.length, 0, 'plat pleinement réalisable');
  assert.equal(p.recette.ingredient_vedette, null, 'plat 100 % placard prioritaire');
});

test('B2 — basique retiré : plat dépendant signalé en appoint', () => {
  const gm = gardeMangerComplet(POC).filter((n) => n !== 'tomates concassées');
  const e = etat(POC, { garde_manger: gm });
  const pates = classer(POC.recettes, e, NOW, { maxManquants: 2 }, rng()).find(
    (c) => c.recette.id === 'pates-thon-tomate'
  );
  assert.ok(pates, 'le plat reste proposable via appoint');
  assert.equal(pates.realisablePleinement, false);
  assert.ok(pates.manquants.some((m) => m.nom === 'tomates concassées'));
});

test('B3 — frais coché : le plat qui l’utilise remonte en tête', () => {
  const e = etat(POC, { frais_du_jour: ['champignons'] });
  const classement = classer(POC.recettes, e, NOW, {}, rng(5));
  assert.equal(classement[0].recette.id, 'omelette-champignons');
});

test('B4 — frais coché sans plat correspondant : pas d’écran vide', () => {
  const e = etat(POC, { frais_du_jour: ['betterave'] });
  const p = genererProposition(POC.recettes, e, NOW, [], rng());
  assert.ok(p.recette, 'une proposition de repli est fournie');
});

// ════════════════════════════════════════════════════════════════════════════
// C. Récence (decay)
// ════════════════════════════════════════════════════════════════════════════

test('C1 — un plat cuisiné le jour même ne ressort pas en premier', () => {
  const e = etat(POC, {
    frais_du_jour: ['champignons'],
    historique: { 'omelette-champignons': { validation: NOW } },
  });
  const p = genererProposition(POC.recettes, e, NOW, [], rng(9));
  assert.notEqual(p.recette.id, 'omelette-champignons');
});

test('C2 — le plat revient après le decay (~6 j) sans épuiser la base', () => {
  const e = etat(POC, {
    frais_du_jour: ['champignons'],
    historique: { 'omelette-champignons': { validation: NOW - 6 * JOUR } },
  });
  const omelette = classer(POC.recettes, e, NOW, {}, rng()).find(
    (c) => c.recette.id === 'omelette-champignons'
  );
  assert.ok(omelette, 'redevenue candidate normale');
  assert.ok(
    !omelette.raisons.includes('cuisiné récemment'),
    'plus de malus de récence après le decay'
  );
  // Et de fait elle redevient la tête de liste (frais coché), sans qu’on ait
  // dû parcourir toute la base entre-temps.
  assert.equal(omelette.recette.id, 'omelette-champignons');
});

test('C3 — petite base saturée : toujours une proposition (anti-écran-vide)', () => {
  // 8 des 10 plats validés aujourd’hui.
  const ids = POC.recettes.slice(0, 8).map((r) => r.id);
  const historique = Object.fromEntries(ids.map((id) => [id, { validation: NOW }]));
  const e = etat(POC, { historique });
  const session = [];
  for (let i = 0; i < 14; i++) {
    const p = genererProposition(POC.recettes, e, NOW, session, rng(i + 1));
    assert.ok(p.recette, `écran vide à l’itération ${i}`);
    session.push(p.recette.id);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// D. Diversité de catégorie
// ════════════════════════════════════════════════════════════════════════════

test('D1 — éviter la même catégorie deux soirs de suite', () => {
  const e = etat(POC, {
    frais_du_jour: ['escalope de poulet', 'citron', 'champignons'],
    historique: {
      'poulet-poele-citron': { validation: NOW - 1 * JOUR },
    },
  });
  const p = genererProposition(POC.recettes, e, NOW, [], rng(2));
  assert.notEqual(p.recette.categorie, 'volaille', 'la volaille est retardée, pas bannie');
});

test('D2 — la diversité cède au manque de choix (toujours une proposition)', () => {
  const e = etat(POC, {
    preferences: { vegetarien: true, exclusions: [] },
    equipements: { four: true, airfryer: false },
  });
  const p = genererProposition(POC.recettes, e, NOW, [], rng());
  assert.ok(p.recette);
  assert.ok((p.recette.tags || []).includes('vegetarien'));
});

// ════════════════════════════════════════════════════════════════════════════
// E. Préférence apprise (👍 / 👎)
// ════════════════════════════════════════════════════════════════════════════

test('E1 — 👎 : le plat tombe tout en bas (dernier recours)', () => {
  const e = etat(POC, {
    historique: { 'steak-hache-poele': { appreciation: 'naime_pas' } },
  });
  const classement = classer(POC.recettes, e, NOW, { maxManquants: 1 }, rng());
  assert.equal(
    classement[classement.length - 1].recette.id,
    'steak-hache-poele',
    'le 👎 est classé dernier'
  );
  // Mais il n’est pas supprimé : il reste un candidat éligible.
  assert.ok(classement.some((c) => c.recette.id === 'steak-hache-poele'));
});

test('E2 — 👍 favorise durablement (à conditions égales)', () => {
  const e = etat(POC, {
    frais_du_jour: ['carotte'],
    historique: { 'riz-saute-express': { appreciation: 'aime' } },
  });
  const classement = classer(POC.recettes, e, NOW, {}, rng());
  const rang = (id) => classement.findIndex((c) => c.recette.id === id);
  assert.ok(
    rang('riz-saute-express') < rang('pates-thon-tomate'),
    'le plat aimé passe devant un plat neutre comparable'
  );
});

test('E3 — récence l’emporte sur le 👍 à court terme', () => {
  const e = etat(POC, {
    historique: { 'riz-saute-express': { appreciation: 'aime', validation: NOW - 1 * JOUR } },
  });
  const classement = classer(POC.recettes, e, NOW, {}, rng());
  const rang = (id) => classement.findIndex((c) => c.recette.id === id);
  assert.ok(
    rang('pates-thon-tomate') < rang('riz-saute-express'),
    'malgré le 👍, le plat cuisiné hier reste défavorisé ce soir'
  );
});

// ════════════════════════════════════════════════════════════════════════════
// F. « Autre chose » & session
// ════════════════════════════════════════════════════════════════════════════

test('F1 — pas de répétition dans la session tant que le stock le permet', () => {
  const e = etat(POC, { equipements: { four: true, airfryer: false } });
  const session = [];
  for (let i = 0; i < 5; i++) {
    const p = genererProposition(POC.recettes, e, NOW, session, rng(i + 1));
    assert.ok(p.recette);
    assert.ok(!session.includes(p.recette.id), `répétition au tour ${i} : ${p.recette.id}`);
    session.push(p.recette.id);
  }
  assert.equal(new Set(session).size, 5, '5 plats distincts');
});

// ════════════════════════════════════════════════════════════════════════════
// Helpers unitaires (sanity)
// ════════════════════════════════════════════════════════════════════════════

test('passeFiltresDurs / ingredientsManquants — comportements de base', () => {
  const omelette = POC.recettes.find((r) => r.id === 'omelette-champignons');
  assert.equal(passeFiltresDurs(omelette, { vegetarien: true, exclusions: [] }, {}), true);
  const tenders = POC.recettes.find((r) => r.id === 'tenders-frites-airfryer');
  assert.equal(passeFiltresDurs(tenders, {}, { airfryer: false }), false);
  assert.equal(passeFiltresDurs(tenders, {}, { airfryer: true }), true);

  const manq = ingredientsManquants(omelette, ['œufs', 'oignon'], []);
  assert.equal(manq.length, 1);
  assert.equal(manq[0].nom, 'champignons');
});
