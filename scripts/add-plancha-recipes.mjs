// Ajoute 45 recettes « plancha » (grill à sec, type plaque chauffante) en restant
// STRICTEMENT dans le vocabulaire d'ingrédients déjà présent. Pas de féculent/œufs/soupe :
// uniquement viande/poisson/volaille/vegetarien, cuisson plancha. Valide vocabulaire +
// invariants + unicité, puis réécrit.
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

// Étapes génériques « à la plancha » (plaque chauffante, cuisson à sec).
const PLANCHA = (min, quoi) => [
  `Faire chauffer la plancha.`,
  `Griller ${quoi} ${min} min en retournant à mi-cuisson.`,
  'Servir.',
];

// [id, nom, categorie, temps_min, vedette, ingredients, tags, etapes]

// --- viande (12) ---
const viande = [
  ['plancha-steak-haricots-persil', 'Steak haché grillé, haricots rouges & persil', 'viande', 12, 'steak haché',
    [f('steak haché', 2), f('haricots rouges', 1, 'boîte'), f('persil', 1, 'poignée'), b('ail', 1, 'gousse')],
    ['enfant_friendly'], PLANCHA(8, 'le steak haché avec l’ail, servir avec les haricots et le persil')],
  ['plancha-merguez-poivron', 'Merguez grillées & poivron', 'viande', 12, 'merguez',
    [f('merguez', 4), f('poivron', 1), b('oignon', 1), f('citron', 1)],
    [], PLANCHA(9, 'les merguez avec le poivron et l’oignon, arroser de citron')],
  ['plancha-chipolatas-courgette', 'Chipolatas grillées & courgette', 'viande', 12, 'chipolatas',
    [f('chipolatas', 4), f('courgette', 1), b('moutarde', 1, 'c. à soupe')],
    ['porc', 'enfant_friendly'], PLANCHA(9, 'les chipolatas et la courgette en tranches, servir avec la moutarde')],
  ['plancha-cote-porc-patate-douce', 'Côte de porc grillée & patate douce', 'viande', 14, 'côte de porc',
    [f('côte de porc', 2), f('patate douce', 1), b('moutarde', 1, 'c. à soupe')],
    ['porc'], PLANCHA(10, 'la côte de porc et les tranches de patate douce, servir avec la moutarde')],
  ['plancha-boeuf-oignon-persil', 'Émincé de bœuf grillé, oignon & persil', 'viande', 12, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), b('oignon', 1), f('persil', 1, 'poignée'), f('citron', 1)],
    [], PLANCHA(7, 'le bœuf émincé et l’oignon, parsemer de persil et de citron')],
  ['plancha-chorizo-pois-chiches', 'Chorizo grillé & pois chiches', 'viande', 11, 'chorizo',
    [f('chorizo', 100, 'g'), f('pois chiches', 1, 'boîte'), f('persil', 1, 'poignée')],
    ['porc'], PLANCHA(7, 'les tranches de chorizo, servir avec les pois chiches et le persil')],
  ['plancha-lardons-pdt-oignon', 'Lardons grillés, pommes de terre & oignon', 'viande', 14, 'lardons',
    [f('lardons', 150, 'g'), f('pommes de terre', 3), b('oignon', 1)],
    ['porc', 'enfant_friendly'], PLANCHA(10, 'les lardons, les pommes de terre en tranches et l’oignon')],
  ['plancha-saucisses-poivron-tomate', 'Saucisses grillées, poivron & tomate', 'viande', 13, 'saucisses',
    [f('saucisses', 3), f('poivron', 1), f('tomate', 1)],
    ['porc', 'enfant_friendly'], PLANCHA(9, 'les saucisses, le poivron et la tomate en tranches')],
  ['plancha-steak-champignons-ail', 'Steak haché grillé, champignons & ail', 'viande', 12, 'steak haché',
    [f('steak haché', 2), f('champignons', 200, 'g'), b('ail', 1, 'gousse')],
    [], PLANCHA(8, 'le steak haché, griller les champignons et l’ail à côté')],
  ['plancha-merguez-tomates-cerises', 'Merguez grillées & tomates cerises', 'viande', 11, 'merguez',
    [f('merguez', 4), f('tomates cerises', 1, 'poignée'), f('citron', 1)],
    [], PLANCHA(9, 'les merguez et les tomates cerises, arroser de citron')],
  ['plancha-jambon-courgette-fromage', 'Jambon & courgette grillés au fromage', 'viande', 11, 'jambon',
    [f('jambon', 2, 'tranches'), f('courgette', 1), f('fromage râpé', 50, 'g')],
    ['porc', 'enfant_friendly'], PLANCHA(7, 'la courgette et le jambon, parsemer de fromage en fin de cuisson')],
  ['plancha-chipolatas-mais-oignon', 'Chipolatas grillées, maïs & oignon', 'viande', 12, 'chipolatas',
    [f('chipolatas', 4), b('maïs', 150, 'g'), b('oignon', 1)],
    ['porc', 'enfant_friendly'], PLANCHA(9, 'les chipolatas et l’oignon, réchauffer le maïs à côté')],
];

// --- poisson (10) ---
const poisson = [
  ['plancha-saumon-citron-persil', 'Pavé de saumon grillé, citron & persil', 'poisson', 12, 'pavé de saumon',
    [f('pavé de saumon', 2), f('citron', 1), f('persil', 1, 'poignée')],
    [], PLANCHA(8, 'le saumon côté peau, arroser de citron et parsemer de persil')],
  ['plancha-colin-poivron', 'Filet de colin grillé & poivron', 'poisson', 13, 'filet de colin',
    [f('filet de colin', 2), f('poivron', 1), f('citron', 1)],
    ['enfant_friendly'], PLANCHA(9, 'le colin et le poivron en lanières, arroser de citron')],
  ['plancha-crevettes-ail-persil', 'Crevettes grillées, ail & persil', 'poisson', 9, 'crevettes',
    [f('crevettes', 200, 'g'), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')],
    [], PLANCHA(5, 'les crevettes avec l’ail, parsemer de persil')],
  ['plancha-cabillaud-tomates-cerises', 'Dos de cabillaud grillé & tomates cerises', 'poisson', 13, 'dos de cabillaud',
    [f('dos de cabillaud', 2), f('tomates cerises', 1, 'poignée'), f('citron', 1)],
    [], PLANCHA(9, 'le cabillaud et les tomates cerises, arroser de citron')],
  ['plancha-saumon-courgette', 'Pavé de saumon grillé & courgette', 'poisson', 13, 'pavé de saumon',
    [f('pavé de saumon', 2), f('courgette', 1), f('citron', 1)],
    [], PLANCHA(9, 'le saumon et la courgette en tranches, arroser de citron')],
  ['plancha-crevettes-citron-poivron', 'Crevettes grillées, citron & poivron', 'poisson', 10, 'crevettes',
    [f('crevettes', 200, 'g'), f('poivron', 1), f('citron', 1)],
    [], PLANCHA(6, 'les crevettes et le poivron, arroser de citron')],
  ['plancha-colin-persil-ail', 'Filet de colin grillé, persil & ail', 'poisson', 12, 'filet de colin',
    [f('filet de colin', 2), f('persil', 1, 'poignée'), b('ail', 1, 'gousse')],
    ['enfant_friendly'], PLANCHA(8, 'le colin avec l’ail, parsemer de persil')],
  ['plancha-cabillaud-poivron-citron', 'Dos de cabillaud grillé, poivron & citron', 'poisson', 13, 'dos de cabillaud',
    [f('dos de cabillaud', 2), f('poivron', 1), f('citron', 1)],
    [], PLANCHA(9, 'le cabillaud et le poivron en lanières, arroser de citron')],
  ['plancha-saumon-tomates-cerises-persil', 'Pavé de saumon grillé, tomates cerises & persil', 'poisson', 12, 'pavé de saumon',
    [f('pavé de saumon', 2), f('tomates cerises', 1, 'poignée'), f('persil', 1, 'poignée')],
    [], PLANCHA(8, 'le saumon et les tomates cerises, parsemer de persil')],
  ['plancha-crevettes-courgette-ail', 'Crevettes grillées, courgette & ail', 'poisson', 10, 'crevettes',
    [f('crevettes', 200, 'g'), f('courgette', 1), b('ail', 1, 'gousse')],
    [], PLANCHA(6, 'la courgette et l’ail, ajouter les crevettes en fin de cuisson')],
];

// --- volaille (12) ---
const volaille = [
  ['plancha-poulet-citron-persil', 'Escalope de poulet grillée, citron & persil', 'volaille', 12, 'escalope de poulet',
    [f('escalope de poulet', 2), f('citron', 1), f('persil', 1, 'poignée')],
    ['enfant_friendly'], PLANCHA(9, 'le poulet, arroser de citron et parsemer de persil')],
  ['plancha-dinde-poivron-oignon', 'Aiguillettes de dinde grillées, poivron & oignon', 'volaille', 13, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('poivron', 1), b('oignon', 1)],
    [], PLANCHA(9, 'la dinde, le poivron et l’oignon')],
  ['plancha-poulet-courgette-ail', 'Escalope de poulet grillée, courgette & ail', 'volaille', 13, 'escalope de poulet',
    [f('escalope de poulet', 2), f('courgette', 1), b('ail', 1, 'gousse')],
    [], PLANCHA(9, 'le poulet et la courgette avec l’ail')],
  ['plancha-dinde-soja-citron', 'Aiguillettes de dinde grillées, soja & citron', 'volaille', 11, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('sauce soja', 1, 'c. à soupe'), f('citron', 1)],
    ['enfant_friendly'], PLANCHA(8, 'la dinde, déglacer au soja et arroser de citron')],
  ['plancha-poulet-poivron-tomates-cerises', 'Escalope de poulet grillée, poivron & tomates cerises', 'volaille', 13, 'escalope de poulet',
    [f('escalope de poulet', 2), f('poivron', 1), f('tomates cerises', 1, 'poignée')],
    [], PLANCHA(9, 'le poulet et le poivron, ajouter les tomates cerises en fin de cuisson')],
  ['plancha-dinde-champignons-persil', 'Aiguillettes de dinde grillées, champignons & persil', 'volaille', 13, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('champignons', 200, 'g'), f('persil', 1, 'poignée')],
    [], PLANCHA(9, 'la dinde et les champignons, parsemer de persil')],
  ['plancha-poulet-avocat-citron', 'Escalope de poulet grillée, avocat & citron', 'volaille', 10, 'escalope de poulet',
    [f('escalope de poulet', 2), f('avocat', 1), f('citron', 1)],
    [], PLANCHA(8, 'le poulet, dresser avec l’avocat et un trait de citron')],
  ['plancha-dinde-poivron-persil', 'Aiguillettes de dinde grillées, poivron & persil', 'volaille', 12, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('poivron', 1), f('persil', 1, 'poignée')],
    [], PLANCHA(9, 'la dinde et le poivron, parsemer de persil')],
  ['plancha-poulet-feta-tomate', 'Escalope de poulet grillée, feta & tomate', 'volaille', 12, 'escalope de poulet',
    [f('escalope de poulet', 2), f('feta', 60, 'g'), f('tomate', 1)],
    [], PLANCHA(9, 'le poulet et la tomate, émietter la feta en fin de cuisson')],
  ['plancha-dinde-citron-ail', 'Aiguillettes de dinde grillées, citron & ail', 'volaille', 11, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), b('ail', 1, 'gousse'), f('citron', 1)],
    ['enfant_friendly'], PLANCHA(8, 'la dinde avec l’ail, arroser de citron')],
  ['plancha-poulet-champignons-oignon', 'Escalope de poulet grillée, champignons & oignon', 'volaille', 13, 'escalope de poulet',
    [f('escalope de poulet', 2), f('champignons', 150, 'g'), b('oignon', 1)],
    [], PLANCHA(9, 'le poulet, l’oignon et les champignons')],
  ['plancha-dinde-tomates-cerises-citron', 'Aiguillettes de dinde grillées, tomates cerises & citron', 'volaille', 11, 'aiguillettes de dinde',
    [f('aiguillettes de dinde', 250, 'g'), f('tomates cerises', 1, 'poignée'), f('citron', 1)],
    [], PLANCHA(8, 'la dinde et les tomates cerises, arroser de citron')],
];

// --- vegetarien (11) ---
const vegetarien = [
  ['plancha-courgette-champignons-parmesan', 'Courgette & champignons grillés au parmesan', 'vegetarien', 11, 'courgette',
    [f('courgette', 1), f('champignons', 200, 'g'), f('parmesan', 30, 'g')],
    ['vegetarien'], PLANCHA(7, 'la courgette et les champignons, parsemer de parmesan')],
  ['plancha-feta-poivron-tomate', 'Poivron & tomate grillés à la feta', 'vegetarien', 12, 'poivron',
    [f('poivron', 2), f('tomate', 1), f('feta', 80, 'g')],
    ['vegetarien'], PLANCHA(9, 'le poivron et la tomate, émietter la feta en fin de cuisson')],
  ['plancha-champignons-ail-persil', 'Champignons grillés, ail & persil', 'vegetarien', 10, 'champignons',
    [f('champignons', 250, 'g'), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')],
    ['vegetarien'], PLANCHA(7, 'les champignons avec l’ail, parsemer de persil')],
  ['plancha-potiron-feta-miel', 'Potiron grillé, feta & miel', 'vegetarien', 14, 'potiron',
    [f('potiron', 300, 'g'), f('feta', 80, 'g'), f('miel', 1, 'c. à café')],
    ['vegetarien'], PLANCHA(10, 'les tranches de potiron, émietter la feta et filet de miel')],
  ['plancha-courgette-mozzarella-tomate', 'Courgette & tomate grillées à la mozzarella', 'vegetarien', 11, 'courgette',
    [f('courgette', 1), f('tomate', 1), f('mozzarella', 100, 'g')],
    ['vegetarien'], PLANCHA(7, 'la courgette et la tomate, ajouter la mozzarella en fin de cuisson')],
  ['plancha-patate-douce-oignon-persil', 'Patate douce & oignon grillés, persil', 'vegetarien', 14, 'patate douce',
    [f('patate douce', 1), b('oignon', 1), f('persil', 1, 'poignée')],
    ['vegetarien'], PLANCHA(10, 'les tranches de patate douce et l’oignon, parsemer de persil')],
  ['plancha-poivron-avocat-mais', 'Poivron grillé, avocat & maïs', 'vegetarien', 9, 'avocat',
    [f('poivron', 1), f('avocat', 1), b('maïs', 150, 'g')],
    ['vegetarien'], PLANCHA(6, 'le poivron, dresser avec l’avocat et le maïs')],
  ['plancha-champignons-tomates-cerises-parmesan', 'Champignons & tomates cerises grillés au parmesan', 'vegetarien', 11, 'champignons',
    [f('champignons', 250, 'g'), f('tomates cerises', 1, 'poignée'), f('parmesan', 30, 'g')],
    ['vegetarien'], PLANCHA(7, 'les champignons et les tomates cerises, parsemer de parmesan')],
  ['plancha-poivron-oignon-feta', 'Poivron & oignon grillés à la feta', 'vegetarien', 12, 'poivron',
    [f('poivron', 2), b('oignon', 1), f('feta', 60, 'g')],
    ['vegetarien'], PLANCHA(9, 'le poivron et l’oignon, émietter la feta en fin de cuisson')],
  ['plancha-courgette-potiron-persil', 'Courgette & potiron grillés, persil', 'vegetarien', 14, 'courgette',
    [f('courgette', 1), f('potiron', 200, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], PLANCHA(10, 'la courgette et le potiron en tranches, parsemer de persil')],
  ['plancha-tomate-mozzarella-persil', 'Tomate & mozzarella grillées, persil', 'vegetarien', 9, 'tomate',
    [f('tomate', 2), f('mozzarella', 100, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], PLANCHA(6, 'les tranches de tomate, ajouter la mozzarella en fin de cuisson et parsemer de persil')],
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
      equipement_requis: ['plancha'],
      etapes, tags,
    });
    idsExistants.add(id);
  }
}

ajouter(viande);
ajouter(poisson);
ajouter(volaille);
ajouter(vegetarien);

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');
const plancha = cat.recettes.filter((r) => (r.equipement_requis || []).includes('plancha'));
console.log(`✅ +${ajoutees.length} recettes plancha. Total ${cat.recettes.length} — plancha ${plancha.length}.`);
