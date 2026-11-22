// Ajoute un lot « œufs / soupe » (catégories les plus maigres du catalogue) en restant
// STRICTEMENT dans le vocabulaire d'ingrédients déjà présent :
//   - oeufs sans équipement : +20 (20 → 40)
//   - oeufs airfryer        : +13 (7 → 20)
//   - soupe sans équipement : +10 (15 → 25)
//   - soupe cookeo          : +18 (17 → 35)
// Valide vocabulaire + invariants + unicité, puis réécrit.
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

// [id, nom, categorie, temps_min, vedette, ingredients, tags, etapes, equip]

// --- oeufs, sans équipement (+20) ---
const oeufsClassique = [
  ['oeufs-omelette-fromage-persil', 'Omelette au fromage & persil', 'oeufs', 8, 'œufs',
    [b('œufs', 4), f('fromage râpé', 60, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien', 'enfant_friendly'], ['Battre les œufs.', 'Cuire à la poêle en ajoutant le fromage.', 'Parsemer de persil et servir.']],
  ['oeufs-omelette-jambon-fromage', 'Omelette jambon & fromage', 'oeufs', 8, 'œufs',
    [b('œufs', 4), f('jambon', 2, 'tranches'), f('fromage râpé', 60, 'g')],
    ['porc', 'enfant_friendly'], ['Battre les œufs.', 'Ajouter le jambon coupé et le fromage, cuire à la poêle.', 'Servir.']],
  ['oeufs-brouilles-epinards-parmesan', 'Œufs brouillés, épinards & parmesan', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('épinards', 150, 'g'), f('parmesan', 30, 'g')],
    ['vegetarien'], ['Faire tomber les épinards à la poêle.', 'Ajouter les œufs battus, brouiller.', 'Parsemer de parmesan et servir.']],
  ['oeufs-omelette-champignons-ail', 'Omelette aux champignons & ail', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('champignons', 200, 'g'), b('ail', 1, 'gousse')],
    ['vegetarien'], ['Faire revenir les champignons avec l’ail.', 'Ajouter les œufs battus, cuire.', 'Servir.']],
  ['oeufs-plat-tomates-cerises-persil', 'Œufs au plat, tomates cerises & persil', 'oeufs', 8, 'œufs',
    [b('œufs', 4), f('tomates cerises', 150, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien', 'enfant_friendly'], ['Faire revenir les tomates cerises.', 'Cuire les œufs au plat à côté.', 'Parsemer de persil et servir.']],
  ['oeufs-omelette-poivron-oignon-2', 'Omelette poivron & oignon', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('poivron', 1), b('oignon', 1)],
    ['vegetarien'], ['Faire revenir le poivron et l’oignon.', 'Ajouter les œufs battus, cuire.', 'Servir.']],
  ['oeufs-brouilles-lardons-fromage', 'Œufs brouillés, lardons & fromage râpé', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('lardons', 100, 'g'), f('fromage râpé', 50, 'g')],
    ['porc'], ['Faire revenir les lardons.', 'Ajouter les œufs battus, brouiller avec le fromage.', 'Servir.']],
  ['oeufs-tortilla-pdt-oignon-2', 'Tortilla de pommes de terre & oignon', 'oeufs', 15, 'œufs',
    [b('œufs', 4), f('pommes de terre', 2), b('oignon', 1)],
    ['vegetarien'], ['Faire revenir les pommes de terre en tranches fines et l’oignon.', 'Ajouter les œufs battus, cuire à couvert.', 'Servir.']],
  ['oeufs-omelette-courgette-parmesan', 'Omelette courgette & parmesan', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('courgette', 1), f('parmesan', 30, 'g')],
    ['vegetarien'], ['Faire revenir la courgette en dés.', 'Ajouter les œufs battus et le parmesan, cuire.', 'Servir.']],
  ['oeufs-cocotte-creme-ciboulette', 'Œufs cocotte, crème fraîche & ciboulette', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('crème fraîche', 15, 'cl'), f('ciboulette', 1, 'poignée')],
    ['vegetarien'], ['Répartir la crème dans des ramequins.', 'Casser un œuf par ramequin, cuire au bain-marie ou au four.', 'Parsemer de ciboulette et servir.']],
  ['oeufs-omelette-crevettes-persil', 'Omelette aux crevettes & persil', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('crevettes', 150, 'g'), f('persil', 1, 'poignée')],
    [], ['Faire revenir les crevettes.', 'Ajouter les œufs battus, cuire.', 'Parsemer de persil et servir.']],
  ['oeufs-brouilles-saumon-ciboulette-2', 'Œufs brouillés, saumon fumé & ciboulette', 'oeufs', 8, 'œufs',
    [b('œufs', 4), f('saumon fumé', 100, 'g'), f('ciboulette', 1, 'poignée')],
    [], ['Brouiller les œufs à feu doux.', 'Ajouter le saumon fumé en lamelles et la ciboulette en fin de cuisson.', 'Servir.']],
  ['oeufs-omelette-chorizo-poivron-2', 'Omelette chorizo & poivron', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('chorizo', 80, 'g'), f('poivron', 1)],
    ['porc'], ['Faire revenir le chorizo et le poivron.', 'Ajouter les œufs battus, cuire.', 'Servir.']],
  ['oeufs-mimosa-mayo-persil', 'Œufs mimosa, mayonnaise & persil', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('mayonnaise', 2, 'c. à soupe'), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Faire cuire les œufs durs puis les écaler.', 'Mélanger les jaunes avec la mayonnaise, garnir les blancs.', 'Parsemer de persil et servir.']],
  ['oeufs-omelette-champignons-jambon', 'Omelette champignons & jambon', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('champignons', 150, 'g'), f('jambon', 2, 'tranches')],
    ['porc'], ['Faire revenir les champignons et le jambon coupé.', 'Ajouter les œufs battus, cuire.', 'Servir.']],
  ['oeufs-plat-lardons-2', 'Œufs au plat & lardons', 'oeufs', 8, 'œufs',
    [b('œufs', 4), f('lardons', 100, 'g')],
    ['porc'], ['Faire revenir les lardons.', 'Cuire les œufs au plat par-dessus.', 'Servir.']],
  ['oeufs-omelette-petits-pois-jambon-2', 'Omelette petits pois & jambon', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('petits pois', 150, 'g'), f('jambon', 2, 'tranches')],
    ['porc', 'enfant_friendly'], ['Réchauffer les petits pois et le jambon coupé.', 'Ajouter les œufs battus, cuire.', 'Servir.']],
  ['oeufs-brouilles-tomate-ciboulette-2', 'Œufs brouillés, tomate & ciboulette', 'oeufs', 8, 'œufs',
    [b('œufs', 4), f('tomate', 1), f('ciboulette', 1, 'poignée')],
    ['vegetarien'], ['Faire revenir la tomate en dés.', 'Ajouter les œufs battus, brouiller.', 'Parsemer de ciboulette et servir.']],
  ['oeufs-omelette-feta-epinards-2', 'Omelette feta & épinards', 'oeufs', 10, 'œufs',
    [b('œufs', 4), f('feta', 60, 'g'), f('épinards', 150, 'g')],
    ['vegetarien'], ['Faire tomber les épinards à la poêle.', 'Ajouter les œufs battus, émietter la feta, cuire.', 'Servir.']],
  ['oeufs-durs-mayo-salade', 'Œufs durs, mayonnaise & salade', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('mayonnaise', 2, 'c. à soupe'), f('salade', 1, 'poignée')],
    ['vegetarien'], ['Faire cuire les œufs durs puis les écaler.', 'Couper en deux, napper de mayonnaise.', 'Servir sur un lit de salade.']],
];

// --- oeufs, airfryer (+13) ---
const oeufsAirfryer = [
  ['oeufs-air-cocotte-jambon-fromage-2', 'Œufs cocotte à l’airfryer, jambon & fromage', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('jambon', 2, 'tranches'), f('fromage râpé', 50, 'g')],
    ['porc'], ['Répartir le jambon coupé dans des ramequins.', 'Casser un œuf par ramequin, parsemer de fromage.', 'Cuire à l’airfryer 10 min à 180°C.']],
  ['oeufs-air-omelette-champignons-persil-2', 'Omelette soufflée à l’airfryer, champignons & persil', 'oeufs', 14, 'œufs',
    [b('œufs', 4), f('champignons', 150, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Faire revenir les champignons.', 'Verser les œufs battus dans un moule, ajouter les champignons.', 'Cuire à l’airfryer 10 min à 170°C, parsemer de persil.']],
  ['oeufs-air-cocotte-epinards-creme-2', 'Œufs cocotte à l’airfryer, épinards & crème fraîche', 'oeufs', 13, 'œufs',
    [b('œufs', 4), f('épinards', 150, 'g'), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Répartir les épinards et la crème dans des ramequins.', 'Casser un œuf par ramequin.', 'Cuire à l’airfryer 10 min à 180°C.']],
  ['oeufs-air-muffins-lardons-fromage', 'Muffins aux œufs, lardons & fromage', 'oeufs', 15, 'œufs',
    [b('œufs', 4), f('lardons', 100, 'g'), f('fromage râpé', 50, 'g')],
    ['porc'], ['Faire revenir les lardons.', 'Répartir œufs battus, lardons et fromage dans des moules à muffins.', 'Cuire à l’airfryer 12 min à 180°C.']],
  ['oeufs-air-cocotte-tomate-persil-2', 'Œufs cocotte à l’airfryer, tomate & persil', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('tomate', 1), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Répartir la tomate en dés dans des ramequins.', 'Casser un œuf par ramequin.', 'Cuire à l’airfryer 10 min à 180°C, parsemer de persil.']],
  ['oeufs-air-omelette-poivron-oignon-2', 'Omelette à l’airfryer, poivron & oignon', 'oeufs', 14, 'œufs',
    [b('œufs', 4), f('poivron', 1), b('oignon', 1)],
    ['vegetarien'], ['Faire revenir le poivron et l’oignon.', 'Verser les œufs battus dans un moule avec les légumes.', 'Cuire à l’airfryer 10 min à 170°C.']],
  ['oeufs-air-cocotte-saumon-ciboulette-2', 'Œufs cocotte à l’airfryer, saumon fumé & ciboulette', 'oeufs', 12, 'œufs',
    [b('œufs', 4), f('saumon fumé', 100, 'g'), f('ciboulette', 1, 'poignée')],
    [], ['Répartir le saumon fumé dans des ramequins.', 'Casser un œuf par ramequin.', 'Cuire à l’airfryer 10 min à 180°C, parsemer de ciboulette.']],
  ['oeufs-air-muffins-courgette-parmesan', 'Muffins aux œufs, courgette & parmesan', 'oeufs', 15, 'œufs',
    [b('œufs', 4), f('courgette', 1), f('parmesan', 30, 'g')],
    ['vegetarien'], ['Râper la courgette.', 'Répartir œufs battus, courgette et parmesan dans des moules à muffins.', 'Cuire à l’airfryer 12 min à 180°C.']],
  ['oeufs-air-cocotte-chorizo-poivron-2', 'Œufs cocotte à l’airfryer, chorizo & poivron', 'oeufs', 13, 'œufs',
    [b('œufs', 4), f('chorizo', 80, 'g'), f('poivron', 1)],
    ['porc'], ['Répartir le chorizo et le poivron dans des ramequins.', 'Casser un œuf par ramequin.', 'Cuire à l’airfryer 10 min à 180°C.']],
  ['oeufs-air-omelette-feta-epinards-2', 'Omelette à l’airfryer, feta & épinards', 'oeufs', 14, 'œufs',
    [b('œufs', 4), f('feta', 60, 'g'), f('épinards', 150, 'g')],
    ['vegetarien'], ['Faire tomber les épinards.', 'Verser les œufs battus dans un moule, émietter la feta.', 'Cuire à l’airfryer 10 min à 170°C.']],
  ['oeufs-air-cocotte-petits-pois-jambon-2', 'Œufs cocotte à l’airfryer, petits pois & jambon', 'oeufs', 13, 'œufs',
    [b('œufs', 4), f('petits pois', 150, 'g'), f('jambon', 2, 'tranches')],
    ['porc'], ['Répartir les petits pois et le jambon coupé dans des ramequins.', 'Casser un œuf par ramequin.', 'Cuire à l’airfryer 10 min à 180°C.']],
  ['oeufs-air-muffins-champignons-fromage', 'Muffins aux œufs, champignons & fromage', 'oeufs', 15, 'œufs',
    [b('œufs', 4), f('champignons', 150, 'g'), f('fromage râpé', 50, 'g')],
    ['vegetarien'], ['Faire revenir les champignons.', 'Répartir œufs battus, champignons et fromage dans des moules à muffins.', 'Cuire à l’airfryer 12 min à 180°C.']],
  ['oeufs-air-cocotte-crevettes-persil-2', 'Œufs cocotte à l’airfryer, crevettes & persil', 'oeufs', 13, 'œufs',
    [b('œufs', 4), f('crevettes', 150, 'g'), f('persil', 1, 'poignée')],
    [], ['Répartir les crevettes dans des ramequins.', 'Casser un œuf par ramequin.', 'Cuire à l’airfryer 10 min à 180°C, parsemer de persil.']],
];

// --- soupe, sans équipement (+10) ---
const soupeClassique = [
  ['soupe-veloute-potiron-creme-2', 'Velouté de potiron express', 'soupe', 14, 'potiron',
    [f('potiron', 400, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Faire cuire le potiron coupé dans le bouillon.', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-lentilles-curry-2', 'Soupe de lentilles corail au curry', 'soupe', 14, 'lentilles corail',
    [f('lentilles corail', 150, 'g'), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    ['vegetarien'], ['Faire cuire les lentilles dans le bouillon avec le curry.', 'Mixer légèrement si besoin.', 'Servir chaud.']],
  ['soupe-petits-pois-persil-2', 'Soupe de petits pois au persil', 'soupe', 12, 'petits pois',
    [f('petits pois', 200, 'g'), b('bouillon cube', 1), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Faire cuire les petits pois dans le bouillon.', 'Mixer avec le persil.', 'Servir chaud.']],
  ['soupe-veloute-carotte-curry-2', 'Velouté de carotte au curry', 'soupe', 15, 'carotte',
    [f('carotte', 3), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    ['vegetarien'], ['Faire cuire la carotte en rondelles dans le bouillon.', 'Mixer avec le curry.', 'Servir chaud.']],
  ['soupe-tomate-vermicelles-persil', 'Soupe de tomates concassées & vermicelles', 'soupe', 12, 'tomates concassées',
    [b('tomates concassées', 1, 'boîte'), b('bouillon cube', 1), b('vermicelles', 60, 'g')],
    ['vegetarien'], ['Faire chauffer les tomates concassées dans le bouillon.', 'Ajouter les vermicelles, cuire quelques minutes.', 'Servir chaud.']],
  ['soupe-veloute-champignons-creme-2', 'Velouté de champignons & crème fraîche', 'soupe', 14, 'champignons',
    [f('champignons', 250, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Faire revenir puis cuire les champignons dans le bouillon.', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-pdt-oignon-2', 'Soupe de pommes de terre & oignon', 'soupe', 15, 'pommes de terre',
    [f('pommes de terre', 3), b('oignon', 1), b('bouillon cube', 1)],
    ['vegetarien'], ['Faire cuire les pommes de terre et l’oignon dans le bouillon.', 'Mixer.', 'Servir chaud.']],
  ['soupe-thai-coco-crevettes-2', 'Soupe thaï, lait de coco & crevettes', 'soupe', 13, 'crevettes',
    [f('crevettes', 150, 'g'), f('lait de coco', 20, 'cl'), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    [], ['Faire chauffer le bouillon avec le lait de coco et le curry.', 'Ajouter les crevettes, cuire 5 min.', 'Servir chaud.']],
  ['soupe-veloute-epinards-creme-2', 'Velouté d’épinards & crème fraîche', 'soupe', 12, 'épinards',
    [f('épinards', 200, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Faire tomber les épinards dans le bouillon.', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-riz-ciboulette-2', 'Soupe de riz & ciboulette', 'soupe', 15, 'riz',
    [b('riz', 100, 'g'), b('bouillon cube', 1), f('ciboulette', 1, 'poignée')],
    ['vegetarien'], ['Faire cuire le riz dans le bouillon.', 'Parsemer de ciboulette.', 'Servir chaud.']],
];

// --- soupe, cookeo (+18) ---
const soupeCookeo = [
  ['soupe-cookeo-potiron-creme-2', 'Soupe de potiron au cookeo, crème fraîche', 'soupe', 15, 'potiron',
    [f('potiron', 500, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Cuire le potiron au cookeo avec le bouillon (mode soupe/pression).', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-cookeo-carotte-curry-2', 'Velouté de carotte au cookeo, curry', 'soupe', 15, 'carotte',
    [f('carotte', 4), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    ['vegetarien'], ['Cuire la carotte au cookeo avec le bouillon.', 'Mixer avec le curry.', 'Servir chaud.']],
  ['soupe-cookeo-lentilles-curry-2', 'Soupe de lentilles corail au cookeo, curry', 'soupe', 14, 'lentilles corail',
    [f('lentilles corail', 200, 'g'), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    ['vegetarien'], ['Cuire les lentilles au cookeo avec le bouillon et le curry.', 'Mixer légèrement si besoin.', 'Servir chaud.']],
  ['soupe-cookeo-pdt-lardons-oignon', 'Soupe de pommes de terre au cookeo, lardons & oignon', 'soupe', 15, 'pommes de terre',
    [f('pommes de terre', 3), f('lardons', 100, 'g'), b('oignon', 1), b('bouillon cube', 1)],
    ['porc'], ['Cuire les pommes de terre et l’oignon au cookeo avec le bouillon.', 'Faire revenir les lardons à part, ajouter.', 'Servir chaud.']],
  ['soupe-cookeo-champignons-creme-2', 'Velouté de champignons au cookeo', 'soupe', 15, 'champignons',
    [f('champignons', 300, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Cuire les champignons au cookeo avec le bouillon.', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-cookeo-petits-pois-jambon-2', 'Soupe de petits pois au cookeo, jambon', 'soupe', 13, 'petits pois',
    [f('petits pois', 250, 'g'), f('jambon', 2, 'tranches'), b('bouillon cube', 1)],
    ['porc'], ['Cuire les petits pois au cookeo avec le bouillon.', 'Ajouter le jambon coupé.', 'Servir chaud.']],
  ['soupe-cookeo-carotte-pdt-oignon', 'Soupe de légumes au cookeo, carotte & pommes de terre', 'soupe', 15, 'carotte',
    [f('carotte', 3), f('pommes de terre', 2), b('oignon', 1), b('bouillon cube', 1)],
    ['vegetarien'], ['Cuire les légumes au cookeo avec le bouillon.', 'Mixer ou servir en morceaux.', 'Servir chaud.']],
  ['soupe-cookeo-epinards-creme-2', 'Velouté d’épinards au cookeo', 'soupe', 13, 'épinards',
    [f('épinards', 250, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Cuire les épinards au cookeo avec le bouillon.', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-cookeo-potiron-lardons', 'Soupe de potiron au cookeo, lardons', 'soupe', 15, 'potiron',
    [f('potiron', 400, 'g'), f('lardons', 100, 'g'), b('bouillon cube', 1)],
    ['porc'], ['Cuire le potiron au cookeo avec le bouillon.', 'Faire revenir les lardons, ajouter.', 'Servir chaud.']],
  ['soupe-cookeo-thai-coco-crevettes-2', 'Soupe thaï au cookeo, lait de coco & crevettes', 'soupe', 14, 'crevettes',
    [f('crevettes', 200, 'g'), f('lait de coco', 20, 'cl'), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    [], ['Cuire le bouillon, le lait de coco et le curry au cookeo quelques minutes.', 'Ajouter les crevettes en fin de cuisson.', 'Servir chaud.']],
  ['soupe-cookeo-carotte-chorizo', 'Soupe de carotte au cookeo, chorizo', 'soupe', 15, 'carotte',
    [f('carotte', 3), f('chorizo', 80, 'g'), b('bouillon cube', 1)],
    ['porc'], ['Cuire la carotte au cookeo avec le bouillon.', 'Ajouter le chorizo en tranches.', 'Servir chaud.']],
  ['soupe-cookeo-potiron-curry-2', 'Velouté de potiron au cookeo, curry', 'soupe', 15, 'potiron',
    [f('potiron', 500, 'g'), b('bouillon cube', 1), f('curry', 1, 'c. à café')],
    ['vegetarien'], ['Cuire le potiron au cookeo avec le bouillon et le curry.', 'Mixer.', 'Servir chaud.']],
  ['soupe-cookeo-pdt-saucisses-oignon', 'Soupe de pommes de terre au cookeo, saucisses', 'soupe', 15, 'pommes de terre',
    [f('pommes de terre', 3), f('saucisses', 2), b('oignon', 1), b('bouillon cube', 1)],
    ['porc'], ['Cuire les pommes de terre et l’oignon au cookeo avec le bouillon.', 'Ajouter les saucisses coupées.', 'Servir chaud.']],
  ['soupe-cookeo-lentilles-chorizo', 'Soupe de lentilles corail au cookeo, chorizo', 'soupe', 14, 'lentilles corail',
    [f('lentilles corail', 200, 'g'), f('chorizo', 80, 'g'), b('bouillon cube', 1)],
    ['porc'], ['Cuire les lentilles au cookeo avec le bouillon.', 'Ajouter le chorizo en tranches.', 'Servir chaud.']],
  ['soupe-cookeo-champignons-parmesan-2', 'Velouté de champignons au cookeo, parmesan', 'soupe', 15, 'champignons',
    [f('champignons', 300, 'g'), b('bouillon cube', 1), f('parmesan', 30, 'g')],
    ['vegetarien'], ['Cuire les champignons au cookeo avec le bouillon.', 'Mixer, parsemer de parmesan.', 'Servir chaud.']],
  ['soupe-cookeo-petits-pois-lardons-creme', 'Soupe de petits pois au cookeo, lardons & crème fraîche', 'soupe', 14, 'petits pois',
    [f('petits pois', 250, 'g'), f('lardons', 100, 'g'), f('crème fraîche', 15, 'cl'), b('bouillon cube', 1)],
    ['porc'], ['Cuire les petits pois au cookeo avec le bouillon.', 'Faire revenir les lardons, ajouter avec la crème.', 'Servir chaud.']],
  ['soupe-cookeo-carotte-potiron-creme', 'Soupe de carotte & potiron au cookeo', 'soupe', 15, 'potiron',
    [f('carotte', 2), f('potiron', 300, 'g'), b('bouillon cube', 1), f('crème fraîche', 15, 'cl')],
    ['vegetarien'], ['Cuire la carotte et le potiron au cookeo avec le bouillon.', 'Mixer avec la crème fraîche.', 'Servir chaud.']],
  ['soupe-cookeo-pdt-creme-ciboulette-2', 'Velouté de pommes de terre au cookeo, ciboulette', 'soupe', 15, 'pommes de terre',
    [f('pommes de terre', 3), b('bouillon cube', 1), f('crème fraîche', 15, 'cl'), f('ciboulette', 1, 'poignée')],
    ['vegetarien'], ['Cuire les pommes de terre au cookeo avec le bouillon.', 'Mixer avec la crème fraîche.', 'Parsemer de ciboulette et servir.']],
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
      equipement_requis: equip,
      etapes, tags,
    });
    idsExistants.add(id);
  }
}

ajouter(oeufsClassique, []);
ajouter(oeufsAirfryer, ['airfryer']);
ajouter(soupeClassique, []);
ajouter(soupeCookeo, ['cookeo']);

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');
const sansEquip = (c) => cat.recettes.filter((r) => (r.equipement_requis || []).length === 0 && r.categorie === c).length;
const parEquip = (eq, c) => cat.recettes.filter((r) => (r.equipement_requis || []).includes(eq) && r.categorie === c).length;
console.log(`✅ +${ajoutees.length} recettes œufs/soupe. Total ${cat.recettes.length}.`);
console.log(`   oeufs sans équip: ${sansEquip('oeufs')} — oeufs airfryer: ${parEquip('airfryer', 'oeufs')}`);
console.log(`   soupe sans équip: ${sansEquip('soupe')} — soupe cookeo: ${parEquip('cookeo', 'soupe')}`);
