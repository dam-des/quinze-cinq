// Ajoute un lot de recettes airfryer en restant STRICTEMENT dans le vocabulaire
// d'ingrédients déjà présent dans la base. Valide les invariants puis réécrit
// recettes_50.json (indentation 2 espaces). Idempotent : ignore les id déjà présents.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHIER = join(ROOT, 'src/data/recettes_50.json');
const cat = JSON.parse(readFileSync(FICHIER, 'utf8'));

// Vocabulaire autorisé = ce qui existe déjà (base + frais), par type.
const baseExistants = new Set();
const fraisExistants = new Set();
for (const r of cat.recettes)
  for (const i of r.ingredients)
    (i.type === 'base' ? baseExistants : fraisExistants).add(i.nom);

const CATS = new Set(['feculent', 'oeufs', 'volaille', 'poisson', 'viande', 'vegetarien', 'soupe']);

// Raccourcis ingrédients (nom, valeur, unité) — le type est résolu par le vocabulaire.
const b = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'base' });
const f = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'frais' });

// ── Lot de recettes airfryer ────────────────────────────────────────────────
const nouvelles = [
  // Volaille
  ['poulet-croustillant-moutarde-airfryer', 'Poulet croustillant moutarde airfryer', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), b('moutarde', 1, 'c. à soupe'), b('chapelure', 4, 'c. à soupe')], ['enfant_friendly'],
    ['Badigeonner le poulet de moutarde, enrober de chapelure.', "Airfryer 15 min à 190 °C en retournant à mi-cuisson.", 'Vérifier la cuisson et servir.']],
  ['dinde-panee-airfryer', 'Aiguillettes de dinde panées airfryer', 'volaille', 15, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), b('œufs', 1), b('chapelure', 5, 'c. à soupe'), b('riz cuit', 1, 'bol')], ['enfant_friendly'],
    ["Passer les aiguillettes dans l'œuf battu puis la chapelure.", 'Airfryer 12 min à 190 °C en retournant à mi-cuisson.', 'Réchauffer le riz.', 'Servir.']],
  ['dinde-laquee-miel-soja-airfryer', 'Dinde laquée miel-soja airfryer', 'volaille', 15, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('miel', 1, 'c. à soupe'), f('sauce soja', 2, 'c. à soupe'), b('riz cuit', 1, 'bol')], ['enfant_friendly'],
    ['Mélanger miel et sauce soja, enrober la dinde.', 'Airfryer 12 min à 190 °C en retournant à mi-cuisson.', 'Servir sur le riz réchauffé.']],

  // Poisson
  ['cabillaud-citron-airfryer', 'Cabillaud rôti au citron airfryer', 'poisson', 14, 'dos de cabillaud',
    [f('dos de cabillaud', 2), f('citron', 1), b('riz cuit', 1, 'bol')], ['enfant_friendly'],
    ['Arroser le cabillaud de jus de citron, saler, poivrer.', 'Airfryer 12 min à 180 °C.', 'Servir avec le riz réchauffé.']],
  ['crevettes-croustillantes-airfryer', 'Crevettes croustillantes ail airfryer', 'poisson', 12, 'crevettes',
    [f('crevettes', 200, 'g'), b('ail', 2, 'gousses'), b('chapelure', 3, 'c. à soupe')], [],
    ["Mélanger crevettes, ail écrasé, chapelure et un filet d'huile.", 'Airfryer 8 min à 200 °C en secouant à mi-cuisson.', 'Servir aussitôt.']],
  ['saumon-croustillant-airfryer', 'Saumon croustillant airfryer', 'poisson', 14, 'pavé de saumon',
    [f('pavé de saumon', 2), b('chapelure', 3, 'c. à soupe'), f('citron', 1)], ['enfant_friendly'],
    ['Presser le citron sur le saumon, parsemer de chapelure.', 'Airfryer 12 min à 190 °C.', 'Servir.']],

  // Viande
  ['boulettes-boeuf-airfryer', 'Boulettes de bœuf airfryer', 'viande', 15, 'steak haché',
    [f('steak haché', 250, 'g'), b('chapelure', 3, 'c. à soupe'), b('œufs', 1), b('oignon', 1)], ['enfant_friendly'],
    ["Mélanger viande, chapelure, œuf et oignon haché, former des boulettes.", 'Airfryer 12 min à 190 °C en secouant à mi-cuisson.', 'Servir.']],
  ['cote-porc-panee-airfryer', 'Côte de porc panée airfryer', 'viande', 15, 'côte de porc',
    [f('côte de porc', 2), b('œufs', 1), b('chapelure', 5, 'c. à soupe')], ['porc', 'enfant_friendly'],
    ["Tremper les côtes dans l'œuf battu puis la chapelure.", 'Airfryer 14 min à 190 °C en retournant à mi-cuisson.', 'Vérifier la cuisson et servir.']],
  ['lardons-pdt-airfryer', 'Pommes de terre lardons airfryer', 'viande', 15, 'lardons',
    [f('lardons', 150, 'g'), f('pommes de terre', 3), b('oignon', 1)], ['porc', 'enfant_friendly'],
    ['Couper les pommes de terre en cubes, mélanger avec lardons et oignon.', 'Airfryer 15 min à 200 °C en secouant à mi-cuisson.', 'Servir.']],
  ['saucisses-pdt-airfryer', 'Saucisses & pommes de terre airfryer', 'viande', 15, 'saucisses',
    [f('saucisses', 2), f('pommes de terre', 3), b('oignon', 1)], ['porc', 'enfant_friendly'],
    ['Couper les pommes de terre en quartiers, ajouter oignon et saucisses.', 'Airfryer 15 min à 200 °C en retournant à mi-cuisson.', 'Servir.']],

  // Végétarien
  ['pdt-roties-parmesan-airfryer', 'Pommes de terre rôties au parmesan airfryer', 'vegetarien', 15, 'pommes de terre',
    [f('pommes de terre', 4), f('parmesan', 30, 'g'), b('ail', 1, 'gousse')], ['vegetarien'],
    ["Couper en quartiers, mélanger avec ail, parmesan et un filet d'huile.", 'Airfryer 15 min à 200 °C en secouant à mi-cuisson.', 'Servir.']],
  ['courgettes-panees-airfryer', 'Courgettes panées airfryer', 'vegetarien', 13, 'courgette',
    [f('courgette', 1), b('chapelure', 4, 'c. à soupe'), b('œufs', 1), f('parmesan', 20, 'g')], ['vegetarien', 'enfant_friendly'],
    ["Couper la courgette en bâtonnets, passer dans l'œuf puis chapelure-parmesan.", 'Airfryer 10 min à 200 °C en retournant à mi-cuisson.', 'Servir.']],
  ['pois-chiches-curry-airfryer', 'Pois chiches croustillants curry airfryer', 'vegetarien', 15, 'pois chiches',
    [f('pois chiches', 1, 'boîte'), f('curry', 1, 'c. à café'), b('riz cuit', 1, 'bol')], ['vegetarien'],
    ["Égoutter les pois chiches, mélanger avec curry et un filet d'huile.", 'Airfryer 14 min à 200 °C en secouant à mi-cuisson.', 'Servir sur le riz réchauffé.']],
  ['poivrons-chevre-airfryer', 'Poivrons rôtis au chèvre airfryer', 'vegetarien', 15, 'poivron',
    [f('poivron', 2), f('bûche de chèvre', 80, 'g'), f('miel', 1, 'c. à café')], ['vegetarien'],
    ['Couper les poivrons, déposer des tranches de chèvre, filet de miel.', 'Airfryer 13 min à 190 °C.', 'Servir.']],
  ['champignons-farcis-airfryer', 'Champignons farcis airfryer', 'vegetarien', 14, 'champignons',
    [f('champignons', 6), f('fromage râpé', 40, 'g'), b('chapelure', 2, 'c. à soupe'), b('ail', 1, 'gousse')], ['vegetarien'],
    ['Garnir les chapeaux de champignons de fromage, chapelure et ail.', 'Airfryer 10 min à 180 °C.', 'Servir.']],
  ['mozza-panee-airfryer', 'Mozzarella panée airfryer', 'vegetarien', 12, 'mozzarella',
    [f('mozzarella', 1, 'boule'), b('farine', 2, 'c. à soupe'), b('œufs', 1), b('chapelure', 4, 'c. à soupe')], ['vegetarien', 'enfant_friendly'],
    ['Couper la mozzarella, passer dans farine, œuf puis chapelure.', 'Airfryer 8 min à 200 °C.', 'Servir aussitôt.']],
  ['patate-douce-pois-chiches-airfryer', 'Patate douce & pois chiches rôtis airfryer', 'vegetarien', 15, 'patate douce',
    [f('patate douce', 1), f('pois chiches', 1, 'boîte'), f('curry', 1, 'c. à café')], ['vegetarien'],
    ['Couper la patate douce en cubes, mélanger avec pois chiches et curry.', 'Airfryer 15 min à 200 °C en secouant à mi-cuisson.', 'Servir.']],
  ['gnocchi-rotis-tomates-airfryer', 'Gnocchi rôtis tomates-mozza airfryer', 'vegetarien', 15, 'gnocchi',
    [f('gnocchi', 400, 'g'), f('tomates cerises', 1, 'poignée'), f('mozzarella', 1, 'boule')], ['vegetarien', 'enfant_friendly'],
    ["Mélanger gnocchi et tomates cerises avec un filet d'huile.", 'Airfryer 12 min à 200 °C, ajouter la mozzarella 2 min avant la fin.', 'Servir.']],
  ['tomates-farcies-riz-airfryer', 'Tomates farcies au riz airfryer', 'vegetarien', 15, 'tomate',
    [f('tomate', 3), b('riz cuit', 1, 'bol'), f('fromage râpé', 30, 'g'), b('ail', 1, 'gousse')], ['vegetarien'],
    ['Évider les tomates, garnir de riz mélangé à ail et fromage.', 'Airfryer 13 min à 180 °C.', 'Servir.']],

  // Œufs
  ['oeufs-cocotte-airfryer', 'Œufs cocotte airfryer', 'oeufs', 12, null,
    [b('œufs', 2), f('crème fraîche', 2, 'c. à soupe'), f('fromage râpé', 30, 'g')], ['vegetarien'],
    ['Dans deux ramequins, verser crème, casser un œuf, parsemer de fromage.', 'Airfryer 10 min à 180 °C.', 'Servir avec du pain.']],
  ['oeufs-cocotte-epinards-airfryer', 'Œufs cocotte aux épinards airfryer', 'oeufs', 13, 'épinards',
    [b('œufs', 2), f('épinards', 1, 'poignée'), f('crème fraîche', 2, 'c. à soupe')], ['vegetarien'],
    ['Répartir épinards et crème dans deux ramequins, casser un œuf dessus.', 'Airfryer 11 min à 180 °C.', 'Servir.']],
];

// ── Construction + validation ────────────────────────────────────────────────
const idsExistants = new Set(cat.recettes.map((r) => r.id));
const erreurs = [];
const ajoutees = [];

for (const [id, nom, categorie, temps_min, vedette, ings, tags, etapes] of nouvelles) {
  if (idsExistants.has(id)) continue; // idempotent
  if (!CATS.has(categorie)) erreurs.push(`${id}: catégorie inconnue « ${categorie} »`);
  if (temps_min > 15) erreurs.push(`${id}: ${temps_min} min > 15`);
  if (ings.length > 5) erreurs.push(`${id}: ${ings.length} ingrédients > 5`);
  for (const i of ings) {
    const vocab = i.type === 'base' ? baseExistants : fraisExistants;
    if (!vocab.has(i.nom)) erreurs.push(`${id}: ingrédient hors vocabulaire (${i.type}) « ${i.nom} »`);
  }
  if (vedette && !ings.some((i) => i.nom === vedette))
    erreurs.push(`${id}: ingredient_vedette « ${vedette} » absent des ingrédients`);

  ajoutees.push({
    id,
    nom,
    temps_min,
    portions: 2,
    ingredient_vedette: vedette,
    categorie,
    ingredients: ings.map((i) => ({
      nom: i.nom,
      type: i.type,
      quantite: { valeur: i.valeur, unite: i.unite },
    })),
    nb_comptables: ings.length,
    equipement_requis: ['airfryer'],
    etapes,
    tags,
  });
  idsExistants.add(id);
}

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');

const airfryer = cat.recettes.filter((r) => (r.equipement_requis || []).includes('airfryer')).length;
console.log(`✅ ${ajoutees.length} recettes ajoutées. Total : ${cat.recettes.length} recettes, dont ${airfryer} airfryer.`);
