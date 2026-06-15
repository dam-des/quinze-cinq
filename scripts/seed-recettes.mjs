// Script ponctuel : ajoute des recettes réutilisant le vocabulaire d'ingrédients
// existant (aucun nouveau frais). Idempotent (skip si l'id existe déjà).
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../src/data/recettes_50.json', import.meta.url);
const d = JSON.parse(readFileSync(path, 'utf8'));

const B = (nom, valeur, unite = null) => ({ nom, type: 'base', quantite: { valeur, unite } });
const F = (nom, valeur, unite = null) => ({ nom, type: 'frais', quantite: { valeur, unite } });
const R = (id, nom, temps, vedette, categorie, ingredients, etapes, tags) => ({
  id, nom, temps_min: temps, portions: 2, ingredient_vedette: vedette, categorie,
  ingredients, nb_comptables: ingredients.length, equipement_requis: [], etapes, tags,
});

const nouvelles = [
  R('pates-pesto-tomates-cerises', 'Pâtes pesto & tomates cerises', 13, 'pesto', 'feculent',
    [B('pâtes', 200, 'g'), F('pesto', 3, 'c. à soupe'), F('tomates cerises', 150, 'g'), F('parmesan', 40, 'g')],
    ['Cuire les pâtes.', 'Couper les tomates cerises en deux.', 'Mélanger pâtes, pesto et tomates, parsemer de parmesan.'],
    ['vegetarien', 'enfant_friendly']),
  R('oeufs-brouilles-ciboulette', 'Œufs brouillés à la ciboulette', 8, 'ciboulette', 'oeufs',
    [B('œufs', 4), F('crème fraîche', 2, 'c. à soupe'), F('ciboulette', 1, 'c. à soupe')],
    ['Battre les œufs avec la crème.', 'Cuire à feu doux en remuant.', 'Ajouter la ciboulette ciselée hors du feu.'],
    ['vegetarien', 'enfant_friendly']),
  R('poulet-soja-miel', 'Poulet sauté soja-miel', 15, 'escalope de poulet', 'volaille',
    [F('escalope de poulet', 2), F('sauce soja', 2, 'c. à soupe'), F('miel', 1, 'c. à soupe'), B('riz cuit', 300, 'g')],
    ['Couper le poulet en lanières, poêler 8 min.', "Ajouter soja et miel, laisser glacer 3 min.", 'Servir sur le riz réchauffé.'],
    ['enfant_friendly']),
  R('cabillaud-citron-persil', 'Cabillaud poêlé citron-persil', 14, 'dos de cabillaud', 'poisson',
    [F('dos de cabillaud', 2), F('citron', 1), F('persil', 1, 'poignée')],
    ['Poêler le cabillaud 5 min de chaque côté.', 'Arroser de jus de citron.', 'Parsemer de persil ciselé.'],
    []),
  R('boeuf-saute-poivron', 'Bœuf sauté aux poivrons', 15, 'bœuf émincé', 'viande',
    [F('bœuf émincé', 250, 'g'), F('poivron', 1), F('sauce soja', 2, 'c. à soupe'), F('nouilles chinoises', 200, 'g')],
    ['Cuire les nouilles.', 'Saisir le bœuf et le poivron émincé 5 min.', 'Déglacer au soja, mélanger aux nouilles.'],
    ['enfant_friendly']),
  R('gnocchi-epinards-chevre', 'Gnocchi épinards & chèvre', 13, 'gnocchi', 'vegetarien',
    [F('gnocchi', 400, 'g'), F('épinards', 150, 'g'), F('bûche de chèvre', 80, 'g'), F('crème fraîche', 2, 'c. à soupe')],
    ['Poêler les gnocchi 6 min.', "Ajouter les épinards jusqu'à ce qu'ils tombent.", 'Incorporer chèvre et crème, fondre 2 min.'],
    ['vegetarien']),
  R('soupe-potiron-coco', 'Soupe potiron-coco', 15, 'potiron', 'soupe',
    [F('potiron', 400, 'g'), F('lait de coco', 20, 'cl'), B('oignon', 1), B('bouillon cube', 1)],
    ["Faire revenir l'oignon, ajouter le potiron en dés.", 'Couvrir de bouillon, cuire 12 min.', 'Mixer avec le lait de coco.'],
    ['vegetarien']),
  R('riz-saute-petits-pois', 'Riz sauté petits pois & œuf', 13, 'petits pois', 'feculent',
    [B('riz cuit', 300, 'g'), F('petits pois', 150, 'g'), B('œufs', 2), F('sauce soja', 2, 'c. à soupe')],
    ['Sauter le riz et les petits pois 4 min.', 'Pousser sur le côté, brouiller les œufs.', 'Mélanger, déglacer au soja.'],
    ['vegetarien', 'enfant_friendly']),
  R('quinoa-avocat-tomates', 'Bowl quinoa avocat', 10, 'avocat', 'vegetarien',
    [F('quinoa cuit', 250, 'g'), F('avocat', 1), F('tomates cerises', 150, 'g'), F('citron', 1)],
    ['Disposer le quinoa dans un bol.', 'Ajouter avocat en lamelles et tomates coupées.', 'Arroser de jus de citron.'],
    ['vegetarien']),
  R('tartine-saumon-avocat', 'Tartine saumon fumé-avocat', 8, 'saumon fumé', 'poisson',
    [F('pain de campagne', 2, 'tranches'), F('saumon fumé', 2, 'tranches'), F('avocat', 1), F('citron', 1)],
    ['Toaster le pain.', "Écraser l'avocat avec un filet de citron.", 'Tartiner et déposer le saumon fumé.'],
    []),
  R('wrap-dinde-crudites', 'Wrap dinde & crudités', 12, 'aiguillettes de dinde', 'volaille',
    [F('tortillas', 2), F('aiguillettes de dinde', 200, 'g'), F('salade', 1, 'poignée'), F('mayonnaise', 1, 'c. à soupe')],
    ['Poêler les aiguillettes 6 min.', 'Garnir les tortillas de salade et mayonnaise.', 'Ajouter la dinde et rouler.'],
    ['enfant_friendly']),
  R('omelette-epinards-parmesan', 'Omelette épinards-parmesan', 12, 'épinards', 'oeufs',
    [B('œufs', 4), F('épinards', 100, 'g'), F('parmesan', 40, 'g')],
    ['Faire tomber les épinards à la poêle.', 'Battre les œufs, verser dessus.', 'Parsemer de parmesan, plier.'],
    ['vegetarien', 'enfant_friendly']),
  R('semoule-courgette-pois-chiches', 'Semoule courgette & pois chiches', 14, 'courgette', 'feculent',
    [F('semoule', 200, 'g'), F('courgette', 1), F('pois chiches', 1, 'boîte'), F('citron', 1)],
    ["Hydrater la semoule à l'eau bouillante.", 'Poêler la courgette en dés 6 min.', 'Mélanger semoule, courgette, pois chiches, citron.'],
    ['vegetarien']),
  R('veloute-carotte-coco', 'Velouté carotte-coco', 15, 'carotte', 'soupe',
    [F('carotte', 3), F('lait de coco', 20, 'cl'), B('oignon', 1), B('bouillon cube', 1)],
    ["Revenir l'oignon, ajouter les carottes en rondelles.", 'Couvrir de bouillon, cuire 12 min.', 'Mixer avec le lait de coco.'],
    ['vegetarien']),
];

// Garde-fou : refuser tout ingrédient hors vocabulaire existant.
const vocab = new Set();
for (const r of d.recettes) for (const i of r.ingredients) vocab.add(i.nom);
const ids = new Set(d.recettes.map((r) => r.id));
let ajout = 0;
for (const r of nouvelles) {
  if (ids.has(r.id)) continue;
  const inconnus = r.ingredients.map((i) => i.nom).filter((n) => !vocab.has(n));
  if (inconnus.length) {
    console.error(`SKIP ${r.id} — ingrédients hors vocabulaire : ${inconnus.join(', ')}`);
    continue;
  }
  d.recettes.push(r);
  ajout++;
}
writeFileSync(path, JSON.stringify(d, null, 2) + '\n');
console.log('ajoutées:', ajout, '| total:', d.recettes.length);
