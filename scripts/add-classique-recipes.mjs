// Étoffe et rééquilibre le pool « sans équipement » (poêle/casserole classique, sans
// airfryer/Cookeo) à 150 recettes, en restant STRICTEMENT dans le vocabulaire d'ingrédients
// déjà présent. Valide vocabulaire + invariants + unicité, puis réécrit.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHIER = join(ROOT, 'src/data/recettes_50.json');
const cat = JSON.parse(readFileSync(FICHIER, 'utf8'));

// Corrige des bugs préexistants et sans rapport avec cette tâche : quelques recettes
// référencent une vedette qui ne correspond à aucun ingrédient (nom tronqué/raccourci).
// Corrigé ici (via le script, jamais à la main) pour que l'invariant « vedette présente
// dans les ingrédients » soit vrai sur tout le fichier.
{
  const corrections = {
    'sardines-salade': ['sardines', 'sardines en boîte'],
    'gnocchi-epinards-chevre': ['chèvre', 'bûche de chèvre'],
    'salade-cesar': ['poulet', 'escalope de poulet'],
  };
  for (const [id, [avant, apres]] of Object.entries(corrections)) {
    const r = cat.recettes.find((x) => x.id === id);
    if (r && r.ingredient_vedette === avant) r.ingredient_vedette = apres;
  }
}

const baseExistants = new Set();
const fraisExistants = new Set();
for (const r of cat.recettes)
  for (const i of r.ingredients) (i.type === 'base' ? baseExistants : fraisExistants).add(i.nom);

const CATS = new Set(['feculent', 'oeufs', 'volaille', 'poisson', 'viande', 'vegetarien', 'soupe']);
const b = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'base' });
const f = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'frais' });

// Étapes génériques « à la poêle/casserole », sans équipement spécial.
const POELE = (min, quoi) => [
  `Faire revenir ${quoi}.`,
  `Cuire ${min} min en mélangeant.`,
  'Servir.',
];
const SALADE = (quoi) => [
  'Disposer les ingrédients.',
  `Assaisonner ${quoi}.`,
  'Servir.',
];
const SOUPE_MIXEE = (min, quoi) => [
  `Cuire ${quoi} dans le bouillon ${min} min.`,
  'Mixer.',
  'Servir.',
];

// [id, nom, categorie, temps_min, vedette, ingredients, tags, etapes]

// --- feculent (+5 → 25) ---
const feculent = [
  ['riz-petits-pois-parmesan', 'Riz petits pois & parmesan', 'feculent', 12, 'petits pois',
    [b('riz cuit', 250, 'g'), f('petits pois', 150, 'g'), f('parmesan', 40, 'g'), b('oignon', 1)],
    ['vegetarien', 'enfant_friendly'], POELE(6, "l'oignon puis les petits pois, ajouter le riz cuit et le parmesan")],
  ['pates-champignons-creme', 'Pâtes champignons & crème', 'feculent', 14, 'champignons',
    [b('pâtes', 200, 'g'), f('champignons', 200, 'g'), f('crème fraîche', 3, 'c. à soupe'), b('ail', 1, 'gousse')],
    ['vegetarien'], POELE(8, "l'ail et les champignons, lier à la crème, mélanger aux pâtes cuites")],
  ['semoule-pois-chiches-tomate', 'Semoule pois chiches & tomate', 'feculent', 13, 'pois chiches',
    [f('semoule', 150, 'g'), f('pois chiches', 1, 'boîte'), b('tomates concassées', 300, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], POELE(8, 'les pois chiches dans la tomate, verser sur la semoule gonflée')],
  ['riz-champignons-persil', 'Riz sauté champignons & persil', 'feculent', 13, 'champignons',
    [b('riz cuit', 250, 'g'), f('champignons', 200, 'g'), f('persil', 1, 'poignée'), b('ail', 1, 'gousse')],
    ['vegetarien'], POELE(7, "l'ail et les champignons, ajouter le riz cuit et le persil")],
  ['gnocchi-petits-pois-parmesan', 'Gnocchi petits pois & parmesan', 'feculent', 14, 'gnocchi',
    [f('gnocchi', 400, 'g'), f('petits pois', 100, 'g'), f('parmesan', 30, 'g'), f('crème fraîche', 2, 'c. à soupe')],
    ['vegetarien'], POELE(8, 'les gnocchis et les petits pois, lier à la crème et au parmesan')],
];

// --- oeufs (+11 → 20) ---
const oeufs = [
  ['omelette-tomate-persil', 'Omelette tomate & persil', 'oeufs', 10, 'tomate',
    [b('œufs', 4), f('tomate', 2), f('persil', 1, 'poignée'), b('ail', 1, 'gousse')],
    ['vegetarien', 'enfant_friendly'], POELE(5, 'la tomate et l’ail, verser les œufs battus par-dessus')],
  ['oeufs-brouilles-tomates-cerises', 'Œufs brouillés tomates cerises', 'oeufs', 8, 'tomates cerises',
    [b('œufs', 4), f('tomates cerises', 1, 'poignée'), f('ciboulette', 1, 'poignée')],
    ['vegetarien'], POELE(4, 'les tomates cerises, ajouter les œufs battus et la ciboulette')],
  ['omelette-poivron-oignon', 'Omelette poivron & oignon', 'oeufs', 10, 'poivron',
    [b('œufs', 4), f('poivron', 1), b('oignon', 1)],
    ['vegetarien', 'enfant_friendly'], POELE(6, "le poivron et l'oignon, verser les œufs battus")],
  ['tortilla-pommes-de-terre-oignon', 'Tortilla pommes de terre & oignon', 'oeufs', 15, 'pommes de terre',
    [b('œufs', 4), f('pommes de terre', 2), b('oignon', 1)],
    ['vegetarien', 'enfant_friendly'], POELE(10, 'les pommes de terre en fines tranches et l’oignon, napper d’œufs battus')],
  ['oeufs-mayo-ciboulette', 'Œufs mayonnaise & ciboulette', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('mayonnaise', 2, 'c. à soupe'), f('ciboulette', 1, 'poignée')],
    ['vegetarien'], SALADE('les œufs durs coupés de mayonnaise et de ciboulette')],
  ['omelette-petits-pois-parmesan', 'Omelette petits pois & parmesan', 'oeufs', 10, 'petits pois',
    [b('œufs', 4), f('petits pois', 100, 'g'), f('parmesan', 30, 'g')],
    ['vegetarien', 'enfant_friendly'], POELE(6, 'les petits pois, verser les œufs battus et le parmesan')],
  ['omelette-chorizo-poivron', 'Omelette chorizo & poivron', 'oeufs', 12, 'chorizo',
    [b('œufs', 4), f('chorizo', 60, 'g'), f('poivron', 1)],
    ['porc'], POELE(7, 'le chorizo et le poivron, verser les œufs battus')],
  ['oeufs-brouilles-jambon-fromage', 'Œufs brouillés jambon & fromage', 'oeufs', 10, 'jambon',
    [b('œufs', 4), f('jambon', 2, 'tranches'), f('fromage râpé', 50, 'g')],
    ['porc', 'enfant_friendly'], POELE(5, 'le jambon en dés avec les œufs battus, ajouter le fromage')],
  ['omelette-courgette-feta', 'Omelette courgette & feta', 'oeufs', 12, 'courgette',
    [b('œufs', 4), f('courgette', 1), f('feta', 60, 'g')],
    ['vegetarien'], POELE(7, 'la courgette, verser les œufs battus et émietter la feta')],
  ['omelette-potiron-persil', 'Omelette potiron & persil', 'oeufs', 14, 'potiron',
    [b('œufs', 4), f('potiron', 200, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], POELE(9, 'le potiron en petits dés, verser les œufs battus et le persil')],
  ['oeufs-cocotte-tomate-fromage', 'Œufs pochés tomate & fromage', 'oeufs', 12, 'tomates concassées',
    [b('œufs', 4), b('tomates concassées', 300, 'g'), f('fromage râpé', 50, 'g')],
    ['vegetarien', 'enfant_friendly'], POELE(6, 'la tomate, creuser des puits et y casser les œufs, parsemer de fromage')],
];

// --- volaille (+15 → 25) ---
const volaille = [
  ['poulet-pesto-tomates-cerises', 'Poulet pesto & tomates cerises', 'volaille', 13, 'escalope de poulet',
    [f('escalope de poulet', 2), f('pesto', 1, 'c. à soupe'), f('tomates cerises', 1, 'poignée'), b('riz cuit', 250, 'g')],
    [], POELE(8, 'le poulet, ajouter le pesto et les tomates cerises')],
  ['dinde-champignons-creme', 'Dinde & champignons à la crème', 'volaille', 14, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('champignons', 200, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('riz cuit', 250, 'g')],
    [], POELE(9, 'la dinde et les champignons, lier à la crème')],
  ['poulet-poivron-oignon', 'Poulet poivron & oignon', 'volaille', 14, 'escalope de poulet',
    [f('escalope de poulet', 2), f('poivron', 1), b('oignon', 1), b('riz cuit', 250, 'g')],
    [], POELE(9, 'le poulet en lanières, poivron et oignon')],
  ['poulet-avocat-salade', 'Salade de poulet & avocat', 'volaille', 10, 'escalope de poulet',
    [f('escalope de poulet', 2), f('avocat', 1), f('salade', 1, 'sachet'), f('citron', 1)],
    [], POELE(8, 'le poulet, dresser sur la salade avec l’avocat et un trait de citron')],
  ['dinde-soja-miel', 'Dinde sautée soja & miel', 'volaille', 12, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('sauce soja', 1, 'c. à soupe'), f('miel', 1, 'c. à café'), b('riz cuit', 250, 'g')],
    ['enfant_friendly'], POELE(8, 'la dinde, déglacer au soja et au miel')],
  ['poulet-cacciatore-express', 'Poulet chasseur express', 'volaille', 14, 'escalope de poulet',
    [f('escalope de poulet', 2), b('tomates concassées', 300, 'g'), f('champignons', 150, 'g'), b('oignon', 1)],
    [], POELE(9, "le poulet et l'oignon, ajouter tomate et champignons")],
  ['poulet-feta-tomates-cerises', 'Salade de poulet feta & tomates cerises', 'volaille', 10, 'escalope de poulet',
    [f('escalope de poulet', 2), f('feta', 60, 'g'), f('tomates cerises', 1, 'poignée'), f('salade', 1, 'sachet')],
    [], POELE(8, 'le poulet, dresser sur la salade avec feta et tomates cerises')],
  ['dinde-curry-patate-douce', 'Dinde curry & patate douce', 'volaille', 15, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('curry', 1, 'c. à café'), f('patate douce', 1), f('lait de coco', 20, 'cl')],
    [], POELE(10, 'la patate douce en petits dés avec la dinde, curry et lait de coco')],
  ['poulet-champignons-persil', 'Poulet champignons & persil', 'volaille', 13, 'escalope de poulet',
    [f('escalope de poulet', 2), f('champignons', 200, 'g'), f('persil', 1, 'poignée'), b('ail', 1, 'gousse')],
    [], POELE(8, 'le poulet, ail et champignons, parsemer de persil')],
  ['wrap-poulet-avocat', 'Wrap poulet & avocat', 'volaille', 10, 'escalope de poulet',
    [f('tortillas', 2), f('escalope de poulet', 2), f('avocat', 1), f('mayonnaise', 1, 'c. à soupe')],
    ['enfant_friendly'], POELE(7, 'le poulet, garnir les tortillas avec avocat et mayonnaise')],
  ['poulet-petits-pois-creme', 'Poulet petits pois à la crème', 'volaille', 14, 'escalope de poulet',
    [f('escalope de poulet', 2), f('petits pois', 100, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('riz cuit', 250, 'g')],
    [], POELE(9, 'le poulet, ajouter petits pois et crème')],
  ['dinde-moutarde-champignons', 'Dinde moutarde & champignons', 'volaille', 14, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), b('moutarde', 1, 'c. à soupe'), f('champignons', 150, 'g'), f('crème fraîche', 2, 'c. à soupe')],
    [], POELE(9, 'la dinde et les champignons, lier à la moutarde et à la crème')],
  ['poulet-pois-chiches-curry', 'Poulet pois chiches au curry', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), f('pois chiches', 1, 'boîte'), f('curry', 1, 'c. à café'), f('lait de coco', 20, 'cl')],
    [], POELE(10, 'le poulet, ajouter pois chiches, curry et lait de coco')],
  ['salade-poulet-avocat-croutons', 'Salade de poulet, avocat & croûtons', 'volaille', 10, 'escalope de poulet',
    [f('salade romaine', 1, 'sachet'), f('escalope de poulet', 2), f('avocat', 1), f('croûtons', 1, 'poignée')],
    [], SALADE('la salade romaine avec le poulet, l’avocat et les croûtons')],
  ['poulet-potiron-curry', 'Poulet potiron au curry', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), f('potiron', 250, 'g'), f('curry', 1, 'c. à café'), b('riz cuit', 250, 'g')],
    [], POELE(10, 'le poulet et le potiron en dés, ajouter le curry')],
];

// --- poisson (+11 → 20) ---
const poisson = [
  ['colin-citron-persil', 'Colin au citron & persil', 'poisson', 14, 'filet de colin',
    [f('filet de colin', 2), f('citron', 1), f('persil', 1, 'poignée'), b('riz cuit', 250, 'g')],
    ['enfant_friendly'], POELE(9, 'le colin, arroser de citron et parsemer de persil')],
  ['colin-tomates-cerises-ail', 'Colin & tomates cerises à l’ail', 'poisson', 14, 'filet de colin',
    [f('filet de colin', 2), f('tomates cerises', 1, 'poignée'), b('ail', 1, 'gousse'), b('riz cuit', 250, 'g')],
    ['enfant_friendly'], POELE(9, 'le colin et l’ail, ajouter les tomates cerises')],
  ['saumon-creme-persil', 'Saumon à la crème & persil', 'poisson', 14, 'pavé de saumon',
    [f('pavé de saumon', 2), f('crème fraîche', 2, 'c. à soupe'), f('persil', 1, 'poignée'), b('riz cuit', 250, 'g')],
    [], POELE(10, 'le saumon, napper de crème et de persil')],
  ['crevettes-curry-coco', 'Crevettes au curry & lait de coco', 'poisson', 12, 'crevettes',
    [f('crevettes', 200, 'g'), f('curry', 1, 'c. à café'), f('lait de coco', 20, 'cl'), b('riz cuit', 250, 'g')],
    [], POELE(7, 'les crevettes, ajouter curry et lait de coco')],
  ['crevettes-tomates-cerises-ail', 'Crevettes tomates cerises & ail', 'poisson', 10, 'crevettes',
    [f('crevettes', 200, 'g'), f('tomates cerises', 1, 'poignée'), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')],
    [], POELE(6, 'l’ail et les crevettes, ajouter les tomates cerises et le persil')],
  ['cabillaud-champignons-creme', 'Cabillaud champignons à la crème', 'poisson', 15, 'dos de cabillaud',
    [f('dos de cabillaud', 2), f('champignons', 150, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('riz cuit', 250, 'g')],
    [], POELE(10, 'le cabillaud et les champignons, lier à la crème')],
  ['saumon-poivron-citron', 'Saumon poivron & citron', 'poisson', 14, 'pavé de saumon',
    [f('pavé de saumon', 2), f('poivron', 1), f('citron', 1), b('riz cuit', 250, 'g')],
    [], POELE(9, 'le saumon et le poivron, arroser de citron')],
  ['sardines-tomate-pain', 'Tartine sardines & tomate', 'poisson', 8, 'sardines en boîte',
    [f('sardines en boîte', 1, 'boîte'), f('tomate', 1), f('pain de campagne', 2, 'tranches'), f('citron', 1)],
    [], SALADE('les sardines égouttées et la tomate sur le pain, avec un trait de citron')],
  ['saumon-fume-salade-avocat', 'Salade saumon fumé & avocat', 'poisson', 8, 'saumon fumé',
    [f('saumon fumé', 4, 'tranches'), f('avocat', 1), f('salade', 1, 'sachet'), f('citron', 1)],
    [], SALADE('la salade avec le saumon fumé et l’avocat, au citron')],
  ['colin-petits-pois-creme', 'Colin petits pois à la crème', 'poisson', 15, 'filet de colin',
    [f('filet de colin', 2), f('petits pois', 100, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('riz cuit', 250, 'g')],
    [], POELE(10, 'le colin et les petits pois, lier à la crème')],
  ['crevettes-poivron-oignon', 'Crevettes poivron & oignon', 'poisson', 12, 'crevettes',
    [f('crevettes', 200, 'g'), f('poivron', 1), b('oignon', 1), b('riz cuit', 250, 'g')],
    [], POELE(8, 'l’oignon et le poivron, ajouter les crevettes')],
];

// --- viande (+11 → 20) ---
const viande = [
  ['lardons-pdt-persil', 'Pommes de terre lardons & persil', 'viande', 15, 'lardons',
    [f('lardons', 150, 'g'), f('pommes de terre', 4), b('oignon', 1), f('persil', 1, 'poignée')],
    ['porc', 'enfant_friendly'], POELE(10, 'les lardons, pommes de terre et oignon, parsemer de persil')],
  ['chorizo-poivron-riz', 'Riz au chorizo & poivron', 'viande', 13, 'chorizo',
    [f('chorizo', 80, 'g'), f('poivron', 1), b('oignon', 1), b('riz cuit', 250, 'g')],
    ['porc'], POELE(8, 'le chorizo, poivron et oignon, ajouter le riz cuit')],
  ['chipolatas-pdt-moutarde', 'Chipolatas & pommes de terre moutarde', 'viande', 15, 'chipolatas',
    [f('chipolatas', 4), f('pommes de terre', 4), b('moutarde', 1, 'c. à soupe')],
    ['porc', 'enfant_friendly'], POELE(10, 'les chipolatas et les pommes de terre, lier à la moutarde')],
  ['jambon-petits-pois-creme', 'Jambon petits pois à la crème', 'viande', 12, 'jambon',
    [f('jambon', 2, 'tranches'), f('petits pois', 100, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('riz cuit', 250, 'g')],
    ['porc', 'enfant_friendly'], POELE(7, 'le jambon en dés et les petits pois, lier à la crème')],
  ['steak-poivron-oignon', 'Steak haché poivron & oignon', 'viande', 12, 'steak haché',
    [f('steak haché', 2), f('poivron', 1), b('oignon', 1), b('moutarde', 1, 'c. à café')],
    ['enfant_friendly'], POELE(8, 'le poivron et l’oignon, cuire les steaks à côté avec la moutarde')],
  ['cote-porc-patate-douce', 'Côte de porc & patate douce', 'viande', 15, 'côte de porc',
    [f('côte de porc', 2), f('patate douce', 1), b('moutarde', 1, 'c. à soupe')],
    ['porc'], POELE(10, 'la côte de porc et la patate douce en dés, lier à la moutarde')],
  ['merguez-pois-chiches-tomate', 'Merguez pois chiches & tomate', 'viande', 14, 'merguez',
    [f('merguez', 4), f('pois chiches', 1, 'boîte'), b('tomates concassées', 300, 'g'), b('oignon', 1)],
    [], POELE(9, 'les merguez et l’oignon, ajouter pois chiches et tomate')],
  ['saucisses-haricots-tomate', 'Saucisses haricots rouges & tomate', 'viande', 14, 'saucisses',
    [f('saucisses', 3), f('haricots rouges', 1, 'boîte'), b('tomates concassées', 300, 'g'), b('oignon', 1)],
    ['porc', 'enfant_friendly'], POELE(9, 'les saucisses et l’oignon, ajouter haricots et tomate')],
  ['jambon-champignons-creme', 'Jambon champignons à la crème', 'viande', 13, 'jambon',
    [f('jambon', 2, 'tranches'), f('champignons', 150, 'g'), f('crème fraîche', 2, 'c. à soupe'), b('riz cuit', 250, 'g')],
    ['porc', 'enfant_friendly'], POELE(8, 'le jambon en dés et les champignons, lier à la crème')],
  ['boeuf-tomate-persil', 'Bœuf émincé tomate & persil', 'viande', 15, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), b('tomates concassées', 300, 'g'), b('oignon', 1), f('persil', 1, 'poignée')],
    [], POELE(10, 'le bœuf et l’oignon, ajouter la tomate et le persil')],
  ['chorizo-haricots-tomate', 'Chorizo haricots rouges & tomate', 'viande', 14, 'chorizo',
    [f('chorizo', 80, 'g'), f('haricots rouges', 1, 'boîte'), b('tomates concassées', 300, 'g'), b('oignon', 1)],
    ['porc'], POELE(9, 'le chorizo et l’oignon, ajouter haricots et tomate')],
];

// --- vegetarien (+15 → 25) ---
const vegetarien = [
  ['curry-pois-chiches-potiron', 'Curry pois chiches & potiron', 'vegetarien', 15, 'pois chiches',
    [f('pois chiches', 1, 'boîte'), f('potiron', 250, 'g'), f('curry', 1, 'c. à café'), f('lait de coco', 20, 'cl')],
    ['vegetarien'], POELE(10, 'le potiron, ajouter pois chiches, curry et lait de coco')],
  ['salade-feta-tomates-cerises', 'Salade feta & tomates cerises', 'vegetarien', 8, 'feta',
    [f('salade', 1, 'sachet'), f('feta', 80, 'g'), f('tomates cerises', 1, 'poignée'), f('citron', 1)],
    ['vegetarien'], SALADE('la salade avec la feta et les tomates cerises, au citron')],
  ['patate-douce-feta-persil', 'Patate douce feta & persil', 'vegetarien', 15, 'patate douce',
    [f('patate douce', 1), f('feta', 80, 'g'), f('persil', 1, 'poignée'), f('citron', 1)],
    ['vegetarien'], POELE(10, 'la patate douce en dés, émietter la feta et le persil, citron en fin')],
  ['lentilles-epinards-curry-coco', 'Dahl lentilles-épinards coco', 'vegetarien', 15, 'lentilles corail',
    [f('lentilles corail', 180, 'g'), f('curry', 1, 'c. à café'), f('épinards', 150, 'g'), f('lait de coco', 20, 'cl')],
    ['vegetarien'], POELE(10, 'les lentilles au curry et au lait de coco, ajouter les épinards en fin')],
  ['galette-sarrasin-fromage-epinards', 'Galette de sarrasin fromage & épinards', 'vegetarien', 10, 'épinards',
    [f('galette de sarrasin', 2), f('fromage râpé', 60, 'g'), f('épinards', 100, 'g')],
    ['vegetarien'], POELE(6, 'les épinards, garnir les galettes de fromage et d’épinards')],
  ['quinoa-pois-chiches-poivron', 'Bowl quinoa pois chiches & poivron', 'vegetarien', 10, 'quinoa cuit',
    [f('quinoa cuit', 200, 'g'), f('pois chiches', 1, 'boîte'), f('poivron', 1), f('citron', 1)],
    ['vegetarien'], SALADE('le quinoa avec pois chiches et poivron, au citron')],
  ['avocat-oeuf-tomate', 'Bowl avocat, œuf & tomate', 'vegetarien', 10, 'avocat',
    [f('avocat', 1), b('œufs', 2), f('tomate', 1), f('citron', 1)],
    ['vegetarien'], POELE(6, 'les œufs durs, dresser avec l’avocat et la tomate, au citron')],
  ['haricots-rouges-poivron-tomate', 'Chili végétarien haricots & poivron', 'vegetarien', 14, 'haricots rouges',
    [f('haricots rouges', 1, 'boîte'), f('poivron', 1), b('tomates concassées', 300, 'g'), b('oignon', 1)],
    ['vegetarien'], POELE(9, 'l’oignon et le poivron, ajouter haricots et tomate')],
  ['champignons-creme-parmesan', 'Champignons à la crème & parmesan', 'vegetarien', 12, 'champignons',
    [f('champignons', 250, 'g'), f('crème fraîche', 3, 'c. à soupe'), f('parmesan', 30, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], POELE(8, 'les champignons, lier à la crème et au parmesan, parsemer de persil')],
  ['potiron-feta-miel', 'Potiron poêlé feta & miel', 'vegetarien', 15, 'potiron',
    [f('potiron', 300, 'g'), f('feta', 80, 'g'), f('miel', 1, 'c. à café'), f('persil', 1, 'poignée')],
    ['vegetarien'], POELE(11, 'le potiron en dés, émietter la feta et filet de miel')],
  ['quesadilla-haricots-mais', 'Quesadilla haricots rouges & maïs', 'vegetarien', 10, 'haricots rouges',
    [f('tortillas', 2), f('haricots rouges', 1, 'boîte'), b('maïs', 100, 'g'), f('fromage râpé', 60, 'g')],
    ['vegetarien', 'enfant_friendly'], POELE(6, 'haricots et maïs, garnir les tortillas de fromage et plier')],
  ['salade-avocat-mais-tomate', 'Salade avocat, maïs & tomate', 'vegetarien', 8, 'avocat',
    [f('avocat', 1), b('maïs', 150, 'g'), f('tomate', 2), f('citron', 1)],
    ['vegetarien'], SALADE('l’avocat, le maïs et la tomate, au citron')],
  ['lentilles-tomate-persil', 'Lentilles corail tomate & persil', 'vegetarien', 15, 'lentilles corail',
    [f('lentilles corail', 180, 'g'), b('tomates concassées', 300, 'g'), f('persil', 1, 'poignée'), b('oignon', 1)],
    ['vegetarien'], POELE(10, 'l’oignon, ajouter lentilles et tomate, parsemer de persil')],
  ['patate-douce-pois-chiches-curry', 'Patate douce & pois chiches au curry', 'vegetarien', 15, 'patate douce',
    [f('patate douce', 1), f('pois chiches', 1, 'boîte'), f('curry', 1, 'c. à café'), f('lait de coco', 20, 'cl')],
    ['vegetarien'], POELE(10, 'la patate douce en dés et les pois chiches, ajouter curry et lait de coco')],
  ['salade-quinoa-feta-tomates-cerises', 'Salade quinoa feta & tomates cerises', 'vegetarien', 8, 'quinoa cuit',
    [f('quinoa cuit', 200, 'g'), f('feta', 60, 'g'), f('tomates cerises', 1, 'poignée'), f('citron', 1)],
    ['vegetarien'], SALADE('le quinoa avec la feta et les tomates cerises, au citron')],
];

// --- soupe (+8 → 15) ---
const soupe = [
  ['veloute-champignons-persil', 'Velouté champignons & persil', 'soupe', 15, 'champignons',
    [f('champignons', 250, 'g'), b('bouillon cube', 1), f('crème fraîche', 2, 'c. à soupe'), f('persil', 1, 'poignée')],
    ['vegetarien'], SOUPE_MIXEE(10, 'les champignons')],
  ['soupe-lentilles-corail-carotte', 'Soupe lentilles corail & carotte', 'soupe', 15, 'lentilles corail',
    [f('lentilles corail', 150, 'g'), f('carotte', 2), b('bouillon cube', 1), b('oignon', 1)],
    ['vegetarien'], SOUPE_MIXEE(10, 'lentilles, carotte et oignon')],
  ['veloute-patate-douce-coco', 'Velouté patate douce & coco', 'soupe', 15, 'patate douce',
    [f('patate douce', 1), f('lait de coco', 20, 'cl'), b('bouillon cube', 1), b('oignon', 1)],
    ['vegetarien'], SOUPE_MIXEE(10, 'la patate douce et l’oignon')],
  ['soupe-pois-chiches-poivron', 'Soupe pois chiches & poivron', 'soupe', 13, 'pois chiches',
    [f('pois chiches', 1, 'boîte'), b('tomates concassées', 300, 'g'), f('poivron', 1), b('ail', 1, 'gousse')],
    ['vegetarien'], SOUPE_MIXEE(8, 'poivron et ail, puis pois chiches et tomate')],
  ['veloute-potiron-parmesan', 'Velouté de potiron au parmesan', 'soupe', 15, 'potiron',
    [f('potiron', 350, 'g'), b('bouillon cube', 1), f('parmesan', 30, 'g'), f('crème fraîche', 2, 'c. à soupe')],
    ['vegetarien'], SOUPE_MIXEE(10, 'le potiron')],
  ['soupe-carotte-ail-persil', 'Soupe carotte, ail & persil', 'soupe', 15, 'carotte',
    [f('carotte', 4), b('bouillon cube', 1), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')],
    ['vegetarien'], SOUPE_MIXEE(11, 'les carottes et l’ail')],
  ['soupe-pdt-creme-persil', 'Soupe pommes de terre, crème & persil', 'soupe', 15, 'pommes de terre',
    [f('pommes de terre', 3), b('bouillon cube', 1), f('crème fraîche', 2, 'c. à soupe'), f('persil', 1, 'poignée')],
    ['vegetarien'], SOUPE_MIXEE(11, 'les pommes de terre')],
  ['soupe-poulet-vermicelles-carotte', 'Soupe poulet, vermicelles & carotte', 'soupe', 15, 'escalope de poulet',
    [f('escalope de poulet', 1), b('bouillon cube', 1), b('vermicelles', 60, 'g'), f('carotte', 1)],
    ['enfant_friendly'], SOUPE_MIXEE(10, 'le poulet émincé et la carotte')],
];

const idsExistants = new Set(cat.recettes.map((r) => r.id));
const erreurs = [];
const ajoutees = [];

function ajouter(liste) {
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
      equipement_requis: [],
      etapes, tags,
    });
    idsExistants.add(id);
  }
}

ajouter(feculent);
ajouter(oeufs);
ajouter(volaille);
ajouter(poisson);
ajouter(viande);
ajouter(vegetarien);
ajouter(soupe);

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');
const sansEquip = cat.recettes.filter((r) => (r.equipement_requis || []).length === 0);
console.log(`✅ +${ajoutees.length} recettes. Total ${cat.recettes.length} — sans équipement ${sansEquip.length}.`);
