// Ajoute un accompagnement (riz cuit, base de placard) aux plats « protéine seule »
// (volaille/poisson/viande sans féculent ni salade) → des repas complets.
// Idempotent. riz cuit étant une base seedée, aucune réalisabilité n'est cassée.
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../src/data/recettes_50.json', import.meta.url);
const d = JSON.parse(readFileSync(path, 'utf8'));

const FECULENTS = new Set([
  'riz cuit', 'pâtes', 'semoule', 'quinoa cuit', 'gnocchi', 'nouilles chinoises',
  'frites surgelées', 'pomme de terre', 'pommes de terre', 'patate douce',
  'pain de mie', 'pain de campagne', 'tortillas', 'vermicelles',
]);
const PROTEINES = new Set(['volaille', 'poisson', 'viande']);
const aSalade = (r) => r.ingredients.some((i) => /salade/i.test(i.nom));
const aFeculent = (r) => r.ingredients.some((i) => FECULENTS.has(i.nom));

let modif = 0;
for (const r of d.recettes) {
  if (!PROTEINES.has(r.categorie)) continue;
  if (aFeculent(r) || aSalade(r)) continue;
  if (r.ingredients.some((i) => i.nom === 'riz cuit')) continue;
  r.ingredients.push({ nom: 'riz cuit', type: 'base', quantite: { valeur: 250, unite: 'g' } });
  r.nb_comptables = r.ingredients.length;
  if (!/riz/i.test(r.etapes[r.etapes.length - 1])) r.etapes.push('Servir avec le riz.');
  modif++;
}
writeFileSync(path, JSON.stringify(d, null, 2) + '\n');
console.log('plats complétés avec accompagnement:', modif);
