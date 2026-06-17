// Étoffe airfryer (→50) et cookeo (→50) en restant STRICTEMENT dans le vocabulaire
// d'ingrédients déjà présent. Valide vocabulaire + invariants + unicité, puis réécrit.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHIER = join(ROOT, 'src/data/recettes_50.json');
const cat = JSON.parse(readFileSync(FICHIER, 'utf8'));

const baseExistants = new Set();
const fraisExistants = new Set();
for (const r of cat.recettes)
  for (const i of r.ingredients) (i.type === 'base' ? baseExistants : fraisExistants).add(i.nom);

const CATS = new Set(['feculent', 'oeufs', 'volaille', 'poisson', 'viande', 'vegetarien', 'soupe']);
const b = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'base' });
const f = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'frais' });

// Étapes génériques (gardent des verbes reconnus par le mapping d'icônes).
const AF = (temps, quoi) => [
  `Préparer ${quoi}.`,
  `Airfryer ${temps} min à 190 °C en retournant à mi-cuisson.`,
  'Servir.',
];
const CK = (min, quoi) => [
  `Dorer ${quoi} en mode dorer.`,
  'Ajouter le reste et un peu d’eau/bouillon à hauteur.',
  `Cuisson sous pression ${min} min.`,
  'Mélanger et servir.',
];

// [id, nom, categorie, temps_min, vedette, ingredients, tags, etapes]
const airfryer = [
  ['merguez-poivrons-airfryer', 'Merguez & poivrons airfryer', 'viande', 15, 'merguez',
    [f('merguez', 4), f('poivron', 1), b('oignon', 1), b('riz cuit', 1, 'bol')], [], AF(15, 'merguez, poivron et oignon')],
  ['chorizo-pdt-airfryer', 'Pommes de terre & chorizo airfryer', 'viande', 15, 'chorizo',
    [f('chorizo', 80, 'g'), f('pommes de terre', 3), b('oignon', 1)], ['porc'], AF(15, 'pommes de terre, chorizo et oignon en morceaux')],
  ['poulet-curry-airfryer', 'Poulet au curry airfryer', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), f('curry', 1, 'c. à café'), b('riz cuit', 1, 'bol')], ['enfant_friendly'], AF(15, 'le poulet enrobé de curry')],
  ['poulet-parmesan-airfryer', 'Poulet pané parmesan airfryer', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), b('œufs', 1), b('chapelure', 4, 'c. à soupe'), f('parmesan', 30, 'g')], ['enfant_friendly'], AF(14, "le poulet pané à l'œuf, chapelure et parmesan")],
  ['dinde-curry-airfryer', 'Dinde au curry airfryer', 'volaille', 15, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('curry', 1, 'c. à café'), b('riz cuit', 1, 'bol')], [], AF(13, 'la dinde enrobée de curry')],
  ['crevettes-curry-airfryer', 'Crevettes au curry airfryer', 'poisson', 12, 'crevettes',
    [f('crevettes', 200, 'g'), f('curry', 1, 'c. à café'), b('riz cuit', 1, 'bol')], [], AF(8, 'les crevettes au curry')],
  ['cabillaud-tomates-cerises-airfryer', 'Cabillaud & tomates cerises airfryer', 'poisson', 15, 'dos de cabillaud',
    [f('dos de cabillaud', 2), f('tomates cerises', 1, 'poignée'), b('ail', 1, 'gousse'), b('riz cuit', 1, 'bol')], ['enfant_friendly'], AF(12, 'le cabillaud, les tomates cerises et l’ail')],
  ['colin-citron-airfryer', 'Colin au citron airfryer', 'poisson', 14, 'filet de colin',
    [f('filet de colin', 2), f('citron', 1), b('riz cuit', 1, 'bol')], ['enfant_friendly'], AF(12, 'le colin arrosé de citron')],
  ['sardines-tomates-airfryer', 'Sardines & tomates rôties airfryer', 'poisson', 12, 'sardines en boîte',
    [f('sardines en boîte', 1, 'boîte'), f('tomates cerises', 1, 'poignée'), f('pain de campagne', 2, 'tranches')], [], AF(8, 'les tomates cerises et le pain')],
  ['saumon-pesto-airfryer', 'Saumon au pesto airfryer', 'poisson', 14, 'pavé de saumon',
    [f('pavé de saumon', 2), f('pesto', 1, 'c. à soupe'), f('tomates cerises', 1, 'poignée')], [], AF(12, 'le saumon nappé de pesto et les tomates')],
  ['steak-frites-airfryer', 'Steak & frites airfryer', 'viande', 15, 'steak haché',
    [f('steak haché', 2), f('frites surgelées', 200, 'g')], ['enfant_friendly'], AF(15, 'les frites (le steak 6 min)')],
  ['chipolatas-pdt-airfryer', 'Chipolatas & pommes de terre airfryer', 'viande', 15, 'chipolatas',
    [f('chipolatas', 4), f('pommes de terre', 3), b('oignon', 1)], ['porc', 'enfant_friendly'], AF(15, 'pommes de terre, chipolatas et oignon')],
  ['jambon-fromage-tortilla-airfryer', 'Quesadilla jambon-fromage airfryer', 'viande', 12, 'jambon',
    [f('tortillas', 2), f('jambon', 2, 'tranches'), f('fromage râpé', 60, 'g')], ['porc', 'enfant_friendly'], AF(8, 'les tortillas garnies de jambon et fromage, pliées')],
  ['gratin-pdt-airfryer', 'Gratin de pommes de terre airfryer', 'vegetarien', 15, 'pommes de terre',
    [f('pommes de terre', 4), f('crème fraîche', 3, 'c. à soupe'), f('fromage râpé', 50, 'g')], ['vegetarien', 'enfant_friendly'], AF(15, 'les pommes de terre en fines tranches, crème et fromage')],
  ['pdt-ail-persil-airfryer', 'Pommes de terre ail & persil airfryer', 'vegetarien', 15, 'pommes de terre',
    [f('pommes de terre', 4), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')], ['vegetarien'], AF(15, 'les pommes de terre en cubes avec ail et persil')],
  ['courgette-chevre-airfryer', 'Courgette rôtie au chèvre airfryer', 'vegetarien', 14, 'courgette',
    [f('courgette', 1), f('bûche de chèvre', 80, 'g'), f('miel', 1, 'c. à café')], ['vegetarien'], AF(12, 'la courgette en rondelles, chèvre et filet de miel')],
  ['champignons-ail-persil-airfryer', 'Champignons ail & persil airfryer', 'vegetarien', 12, 'champignons',
    [f('champignons', 250, 'g'), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')], ['vegetarien'], AF(10, 'les champignons avec ail et persil')],
  ['tomates-cerises-mozza-airfryer', 'Tomates cerises & mozza au pesto airfryer', 'vegetarien', 12, 'tomates cerises',
    [f('tomates cerises', 1, 'poignée'), f('mozzarella', 1, 'boule'), f('pesto', 1, 'c. à soupe')], ['vegetarien'], AF(10, 'les tomates cerises au pesto, mozzarella ajoutée en fin')],
  ['potiron-feta-airfryer', 'Potiron rôti & feta airfryer', 'vegetarien', 15, 'potiron',
    [f('potiron', 300, 'g'), f('feta', 80, 'g'), f('miel', 1, 'c. à café')], ['vegetarien'], AF(15, 'le potiron en cubes, feta et filet de miel')],
  ['patate-douce-feta-airfryer', 'Patate douce rôtie & feta airfryer', 'vegetarien', 15, 'patate douce',
    [f('patate douce', 1), f('feta', 80, 'g'), f('miel', 1, 'c. à café')], ['vegetarien'], AF(15, 'la patate douce en cubes, feta et miel')],
  ['carottes-miel-airfryer', 'Carottes glacées au miel airfryer', 'vegetarien', 15, 'carotte',
    [f('carotte', 4), f('miel', 1, 'c. à soupe'), f('persil', 1, 'poignée')], ['vegetarien', 'enfant_friendly'], AF(15, 'les carottes en bâtonnets avec le miel')],
];

const cookeo = [
  ['risotto-tomate-cookeo', 'Risotto tomate Cookeo', 'vegetarien', 15, null,
    [b('riz', 180, 'g'), b('tomates concassées', 400, 'g'), b('oignon', 1), f('parmesan', 40, 'g'), b('bouillon cube', 1)], ['vegetarien'], CK(7, 'l’oignon')],
  ['risotto-courgette-cookeo', 'Risotto courgette Cookeo', 'vegetarien', 15, 'courgette',
    [b('riz', 180, 'g'), f('courgette', 1), b('oignon', 1), f('parmesan', 40, 'g'), b('bouillon cube', 1)], ['vegetarien'], CK(7, 'oignon et courgette')],
  ['risotto-petits-pois-cookeo', 'Risotto petits pois Cookeo', 'vegetarien', 15, 'petits pois',
    [b('riz', 180, 'g'), f('petits pois', 120, 'g'), b('oignon', 1), f('parmesan', 40, 'g'), b('bouillon cube', 1)], ['vegetarien'], CK(7, 'l’oignon')],
  ['risotto-poulet-cookeo', 'Risotto poulet & champignons Cookeo', 'volaille', 15, 'escalope de poulet',
    [b('riz', 160, 'g'), f('escalope de poulet', 1), f('champignons', 150, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('bouillon cube', 1)], [], CK(8, 'poulet et champignons')],
  ['poulet-moutarde-cookeo', 'Poulet à la moutarde Cookeo', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), b('moutarde', 1, 'c. à soupe'), f('crème fraîche', 2, 'c. à soupe'), b('riz', 150, 'g')], [], CK(8, 'le poulet')],
  ['riz-crevettes-curry-cookeo', 'Riz crevettes-curry Cookeo', 'poisson', 14, 'crevettes',
    [b('riz', 160, 'g'), f('crevettes', 200, 'g'), f('curry', 1, 'c. à café'), f('lait de coco', 20, 'cl')], [], CK(7, 'les crevettes au curry')],
  ['riz-thon-tomate-cookeo', 'Riz au thon & tomate Cookeo', 'feculent', 14, null,
    [b('riz', 180, 'g'), b('thon en conserve', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1)], [], CK(7, 'l’oignon')],
  ['riz-saumon-creme-cookeo', 'Riz saumon-petits pois Cookeo', 'poisson', 15, 'pavé de saumon',
    [b('riz', 160, 'g'), f('pavé de saumon', 2), f('petits pois', 100, 'g'), f('crème fraîche', 2, 'c. à soupe')], [], CK(8, 'le saumon en morceaux')],
  ['riz-jambon-cookeo', 'Riz crémeux jambon-petits pois Cookeo', 'feculent', 14, 'jambon',
    [b('riz', 180, 'g'), f('jambon', 2, 'tranches'), f('petits pois', 100, 'g'), f('crème fraîche', 2, 'c. à soupe')], ['porc', 'enfant_friendly'], CK(7, 'l’oignon (riz, petits pois)')],
  ['riz-chorizo-cookeo', 'Riz au chorizo Cookeo', 'feculent', 14, 'chorizo',
    [b('riz', 180, 'g'), f('chorizo', 80, 'g'), f('poivron', 1), b('oignon', 1)], ['porc'], CK(7, 'chorizo, poivron et oignon')],
  ['pates-tomate-mozza-cookeo', 'Pâtes tomate-mozza Cookeo', 'feculent', 14, 'mozzarella',
    [b('pâtes', 200, 'g'), b('tomates concassées', 400, 'g'), f('mozzarella', 1, 'boule'), b('oignon', 1)], ['vegetarien', 'enfant_friendly'], CK(7, 'l’oignon (mozza en fin)')],
  ['pates-thon-creme-cookeo', 'Pâtes thon crème Cookeo', 'feculent', 14, null,
    [b('pâtes', 200, 'g'), b('thon en conserve', 1, 'boîte'), f('crème fraîche', 3, 'c. à soupe'), b('oignon', 1)], [], CK(7, 'l’oignon')],
  ['pates-poulet-creme-cookeo', 'Pâtes poulet-champignons Cookeo', 'volaille', 15, 'escalope de poulet',
    [b('pâtes', 200, 'g'), f('escalope de poulet', 1), f('crème fraîche', 3, 'c. à soupe'), f('champignons', 150, 'g')], [], CK(8, 'poulet et champignons')],
  ['pates-lardons-creme-cookeo', 'Pâtes lardons crème Cookeo', 'feculent', 14, 'lardons',
    [b('pâtes', 200, 'g'), f('lardons', 150, 'g'), f('crème fraîche', 3, 'c. à soupe'), b('oignon', 1)], ['porc', 'enfant_friendly'], CK(7, 'lardons et oignon')],
  ['pates-courgette-chevre-cookeo', 'Pâtes courgette-chèvre Cookeo', 'feculent', 14, 'courgette',
    [b('pâtes', 200, 'g'), f('courgette', 1), f('bûche de chèvre', 80, 'g'), b('ail', 1, 'gousse')], ['vegetarien'], CK(7, 'la courgette et l’ail')],
  ['pates-chorizo-tomate-cookeo', 'Pâtes chorizo-tomate Cookeo', 'feculent', 14, 'chorizo',
    [b('pâtes', 200, 'g'), f('chorizo', 80, 'g'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['porc'], CK(7, 'chorizo et oignon')],
  ['soupe-carotte-coco-cookeo', 'Soupe carotte-coco Cookeo', 'soupe', 15, 'carotte',
    [f('carotte', 4), f('lait de coco', 20, 'cl'), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'], CK(10, 'l’oignon (puis mixer)')],
  ['soupe-courgette-cookeo', 'Soupe de courgette Cookeo', 'soupe', 15, 'courgette',
    [f('courgette', 2), f('pommes de terre', 2), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'], CK(10, 'les légumes (puis mixer)')],
  ['soupe-tomate-cookeo', 'Soupe de tomate Cookeo', 'soupe', 14, null,
    [b('tomates concassées', 400, 'g'), b('oignon', 1), b('ail', 1, 'gousse'), b('bouillon cube', 1)], ['vegetarien'], CK(8, 'oignon et ail (puis mixer)')],
  ['soupe-champignons-cookeo', 'Velouté de champignons Cookeo', 'soupe', 15, 'champignons',
    [f('champignons', 250, 'g'), f('pommes de terre', 2), b('oignon', 1), f('crème fraîche', 2, 'c. à soupe')], ['vegetarien'], CK(10, 'champignons et oignon (puis mixer)')],
  ['soupe-pois-chiches-cookeo', 'Soupe pois chiches Cookeo', 'soupe', 14, 'pois chiches',
    [f('pois chiches', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'], CK(8, 'l’oignon')],
  ['soupe-lentilles-carotte-cookeo', 'Soupe lentilles-carotte Cookeo', 'soupe', 15, 'lentilles corail',
    [f('lentilles corail', 150, 'g'), f('carotte', 2), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'], CK(10, 'l’oignon et la carotte')],
  ['poulet-tomate-poivron-cookeo', 'Poulet tomate-poivron Cookeo', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), b('tomates concassées', 400, 'g'), f('poivron', 1), b('oignon', 1)], [], CK(8, 'poulet, poivron et oignon')],
  ['boeuf-carottes-cookeo', 'Bœuf-carottes Cookeo', 'viande', 15, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), f('carotte', 3), b('oignon', 1), b('bouillon cube', 1)], [], CK(10, 'bœuf, carottes et oignon')],
  ['boeuf-tomate-poivron-cookeo', 'Bœuf tomate-poivron Cookeo', 'viande', 15, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), b('tomates concassées', 400, 'g'), f('poivron', 1), b('oignon', 1)], [], CK(8, 'bœuf, poivron et oignon')],
  ['dinde-coco-curry-cookeo', 'Dinde coco-curry Cookeo', 'volaille', 15, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à soupe'), b('riz', 150, 'g')], ['enfant_friendly'], CK(8, 'la dinde')],
  ['saucisses-haricots-cookeo', 'Saucisses & haricots rouges Cookeo', 'viande', 15, 'saucisses',
    [f('saucisses', 3), f('haricots rouges', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['porc'], CK(8, 'saucisses et oignon')],
  ['chipolatas-lentilles-cookeo', 'Chipolatas & lentilles Cookeo', 'viande', 15, 'chipolatas',
    [f('chipolatas', 4), f('lentilles corail', 150, 'g'), f('carotte', 2), b('oignon', 1)], ['porc'], CK(9, 'chipolatas et oignon')],
  ['merguez-haricots-cookeo', 'Merguez & haricots Cookeo', 'viande', 15, 'merguez',
    [f('merguez', 4), f('haricots rouges', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1)], [], CK(8, 'merguez et oignon')],
  ['cote-porc-tomate-cookeo', 'Côte de porc tomate-poivron Cookeo', 'viande', 15, 'côte de porc',
    [f('côte de porc', 2), b('tomates concassées', 400, 'g'), f('poivron', 1), b('oignon', 1)], ['porc'], CK(10, 'les côtes, poivron et oignon')],
  ['dahl-coco-curry-cookeo', 'Dahl coco-curry Cookeo', 'vegetarien', 15, 'lentilles corail',
    [f('lentilles corail', 200, 'g'), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à soupe'), b('oignon', 1)], ['vegetarien'], CK(8, 'l’oignon')],
  ['curry-pois-chiches-cookeo', 'Curry de pois chiches Cookeo', 'vegetarien', 15, 'pois chiches',
    [f('pois chiches', 1, 'boîte'), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à soupe'), b('tomates concassées', 400, 'g')], ['vegetarien'], CK(7, 'les épices')],
  ['curry-legumes-coco-cookeo', 'Curry de légumes coco Cookeo', 'vegetarien', 15, 'courgette',
    [f('courgette', 1), f('poivron', 1), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à soupe')], ['vegetarien'], CK(7, 'les légumes')],
  ['gnocchi-tomate-cookeo', 'Gnocchi tomate-mozza Cookeo', 'vegetarien', 13, 'gnocchi',
    [f('gnocchi', 400, 'g'), b('tomates concassées', 400, 'g'), f('mozzarella', 1, 'boule'), b('oignon', 1)], ['vegetarien', 'enfant_friendly'], CK(5, 'l’oignon (mozza en fin)')],
  ['pommes-de-terre-lardons-cookeo', 'Pommes de terre-lardons Cookeo', 'viande', 15, 'lardons',
    [f('pommes de terre', 4), f('lardons', 150, 'g'), b('oignon', 1), f('crème fraîche', 2, 'c. à soupe')], ['porc', 'enfant_friendly'], CK(10, 'lardons et oignon')],
  ['potiron-curry-cookeo', 'Curry de potiron Cookeo', 'vegetarien', 15, 'potiron',
    [f('potiron', 400, 'g'), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à soupe'), b('oignon', 1)], ['vegetarien'], CK(8, 'l’oignon')],
  ['lentilles-tomate-cookeo', 'Lentilles à la tomate Cookeo', 'vegetarien', 15, 'lentilles corail',
    [f('lentilles corail', 200, 'g'), b('tomates concassées', 400, 'g'), f('carotte', 2), b('oignon', 1)], ['vegetarien'], CK(9, 'carotte et oignon')],
  ['soupe-potiron-cookeo', 'Soupe de potiron Cookeo', 'soupe', 15, 'potiron',
    [f('potiron', 400, 'g'), f('pommes de terre', 2), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'], CK(10, 'les légumes (puis mixer)')],
];

const idsExistants = new Set(cat.recettes.map((r) => r.id));
const erreurs = [];
const ajoutees = [];

function ajouter(liste, equip) {
  for (const [id, nom, categorie, temps_min, vedette, ings, tags, etapes] of liste) {
    if (idsExistants.has(id)) { erreurs.push(`${id}: id déjà existant`); continue; }
    if (!CATS.has(categorie)) erreurs.push(`${id}: catégorie inconnue « ${categorie} »`);
    if (temps_min > 15) erreurs.push(`${id}: ${temps_min} min > 15`);
    if (ings.length > 5) erreurs.push(`${id}: ${ings.length} ingrédients > 5`);
    for (const i of ings) {
      const vocab = i.type === 'base' ? baseExistants : fraisExistants;
      if (!vocab.has(i.nom)) erreurs.push(`${id}: ingrédient hors vocabulaire (${i.type}) « ${i.nom} »`);
    }
    if (vedette && !ings.some((i) => i.nom === vedette)) erreurs.push(`${id}: vedette « ${vedette} » absente`);
    ajoutees.push({
      id, nom, temps_min, portions: 2,
      ingredient_vedette: vedette,
      categorie,
      ingredients: ings.map((i) => ({ nom: i.nom, type: i.type, quantite: { valeur: i.valeur, unite: i.unite } })),
      nb_comptables: ings.length,
      equipement_requis: [equip],
      etapes, tags,
    });
    idsExistants.add(id);
  }
}

ajouter(airfryer, 'airfryer');
ajouter(cookeo, 'cookeo');

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');
const nAir = cat.recettes.filter((r) => (r.equipement_requis || []).includes('airfryer')).length;
const nCook = cat.recettes.filter((r) => (r.equipement_requis || []).includes('cookeo')).length;
console.log(`✅ +${ajoutees.length} recettes. Total ${cat.recettes.length} — airfryer ${nAir}, cookeo ${nCook}.`);
