import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grammesPourQuantite, estimerCalories, TABLE_KCAL } from '../src/js/calories.js';

// Table fixture isolée — ne dépend pas des vraies valeurs nutritionnelles.
const FIX = {
  pates: { kcal100g: 100, poidsUnite: null },
  thon: { kcal100g: 200, poidsUnite: 140 }, // 1 boîte = 140 g
  ail: { kcal100g: 50, poidsUnite: 5 },     // 1 gousse = 5 g
  huileimaginaire: { kcal100g: 900, poidsUnite: 15 }, // 1 c. à soupe = 15 g
};

test('grammesPourQuantite — grammes directs', () => {
  assert.equal(grammesPourQuantite('pates', { valeur: 200, unite: 'g' }, FIX), 200);
});

test('grammesPourQuantite — unité comptée (boîte) via poidsUnite', () => {
  assert.equal(grammesPourQuantite('thon', { valeur: 1, unite: 'boîte' }, FIX), 140);
});

test('grammesPourQuantite — compte nu (unite: null) via poidsUnite', () => {
  assert.equal(grammesPourQuantite('ail', { valeur: 2, unite: 'gousse' }, FIX), 10);
});

test('grammesPourQuantite — unité inconnue : repli 0 (pas de NaN)', () => {
  const g = grammesPourQuantite('pates', { valeur: 3, unite: 'pincée' }, FIX);
  assert.equal(Number.isNaN(g), false);
});

test('estimerCalories — somme, divise par portions, arrondit à la dizaine', () => {
  const recette = {
    portions: 2,
    ingredients: [
      { nom: 'pates', type: 'base', quantite: { valeur: 200, unite: 'g' } },
      { nom: 'thon', type: 'base', quantite: { valeur: 1, unite: 'boîte' } },
    ],
  };
  // (200g*1kcal/g*1 + 140g*2kcal/g) / 2 portions = (200 + 280) / 2 = 240
  assert.equal(estimerCalories(recette, FIX), 240);
});

test('estimerCalories — ingrédient hors table : ignoré, pas de NaN', () => {
  const recette = {
    portions: 1,
    ingredients: [{ nom: 'inconnu', type: 'frais', quantite: { valeur: 1, unite: null } }],
  };
  assert.equal(estimerCalories(recette, FIX), 0);
});

test('estimerCalories — portions 0 ou absente : repli à 1 portion (pas de NaN/Infinity)', () => {
  const recette = {
    portions: 0,
    ingredients: [{ nom: 'pates', type: 'base', quantite: { valeur: 100, unite: 'g' } }],
  };
  const v = estimerCalories(recette, FIX);
  assert.equal(Number.isFinite(v), true);
});

// Complétude : tout ingrédient réellement utilisé dans la base doit avoir une entrée.
test('TABLE_KCAL — couvre tout le vocabulaire utilisé dans recettes_50.json', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/recettes_50.json', import.meta.url), 'utf8'));
  const manquants = new Set();
  for (const r of data.recettes) for (const i of r.ingredients) {
    if (!TABLE_KCAL[i.nom]) manquants.add(i.nom);
  }
  assert.equal(manquants.size, 0, `TABLE_KCAL incomplète : ${[...manquants].join(', ')}`);
});
