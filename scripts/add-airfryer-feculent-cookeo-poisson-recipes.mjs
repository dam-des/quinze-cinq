// Comble les deux derniers creux par équipement :
//   - airfryer féculent : +16 (4 → 20)
//   - cookeo poisson    : +15 (3 → 18)
// Reste STRICTEMENT dans le vocabulaire d'ingrédients déjà présent.
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

// [id, nom, categorie, temps_min, vedette, ingredients, tags, etapes]

// --- airfryer, féculent (+16) : bases qui croustillent à l'airfryer (pdt, galette, tortilla, pain, gnocchi) ---
const airfryerFeculent = [
  ['airfryer-croquettes-riz-fromage', 'Croquettes de riz au fromage, airfryer', 'feculent', 14, 'riz cuit',
    [b('riz cuit', 300, 'g'), f('fromage râpé', 60, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien', 'enfant_friendly'], ['Façonner des croquettes avec le riz, le fromage et le persil.', 'Cuire à l’airfryer 10 min à 190°C.', 'Servir.']],
  ['airfryer-croquettes-riz-jambon', 'Croquettes de riz, jambon & fromage, airfryer', 'feculent', 14, 'riz cuit',
    [b('riz cuit', 300, 'g'), f('jambon', 2, 'tranches'), f('fromage râpé', 50, 'g')],
    ['porc'], ['Façonner des croquettes avec le riz, le jambon coupé et le fromage.', 'Cuire à l’airfryer 10 min à 190°C.', 'Servir.']],
  ['airfryer-gnocchi-croustillants-parmesan', 'Gnocchi croustillants à l’airfryer, parmesan', 'feculent', 12, 'gnocchi',
    [f('gnocchi', 400, 'g'), f('parmesan', 30, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Mélanger les gnocchi avec un filet d’huile.', 'Cuire à l’airfryer 10 min à 200°C en secouant à mi-cuisson.', 'Parsemer de parmesan et persil.']],
  ['airfryer-gnocchi-champignons', 'Gnocchi à l’airfryer, champignons & parmesan', 'feculent', 13, 'gnocchi',
    [f('gnocchi', 350, 'g'), f('champignons', 150, 'g'), f('parmesan', 30, 'g')],
    ['vegetarien'], ['Mélanger les gnocchi et les champignons.', 'Cuire à l’airfryer 10 min à 200°C en secouant à mi-cuisson.', 'Parsemer de parmesan.']],
  ['airfryer-wedges-patate-douce-ail-persil', 'Wedges de patate douce à l’airfryer, ail & persil', 'feculent', 15, 'patate douce',
    [f('patate douce', 2), b('ail', 1, 'gousse'), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Couper la patate douce en quartiers.', 'Cuire à l’airfryer 14 min à 190°C avec l’ail.', 'Parsemer de persil.']],
  ['airfryer-wedges-patate-douce-feta', 'Wedges de patate douce à l’airfryer, feta', 'feculent', 15, 'patate douce',
    [f('patate douce', 2), f('feta', 60, 'g'), f('persil', 1, 'poignée')],
    ['vegetarien'], ['Couper la patate douce en quartiers.', 'Cuire à l’airfryer 14 min à 190°C.', 'Émietter la feta et parsemer de persil.']],
  ['airfryer-quesadilla-poulet-fromage', 'Quesadilla poulet & fromage, airfryer', 'feculent', 12, 'escalope de poulet',
    [f('tortillas', 2), f('escalope de poulet', 1), f('fromage râpé', 60, 'g')],
    [], ['Garnir une tortilla de poulet cuit émincé et de fromage, refermer avec la seconde.', 'Cuire à l’airfryer 8 min à 180°C.', 'Couper en parts et servir.']],
  ['airfryer-quesadilla-champignons-fromage', 'Quesadilla champignons & fromage, airfryer', 'feculent', 12, 'champignons',
    [f('tortillas', 2), f('champignons', 150, 'g'), f('fromage râpé', 60, 'g')],
    ['vegetarien'], ['Faire revenir les champignons, garnir une tortilla avec le fromage, refermer avec la seconde.', 'Cuire à l’airfryer 8 min à 180°C.', 'Couper en parts et servir.']],
  ['airfryer-quesadilla-crevettes-fromage', 'Quesadilla crevettes & fromage, airfryer', 'feculent', 12, 'crevettes',
    [f('tortillas', 2), f('crevettes', 150, 'g'), f('fromage râpé', 60, 'g')],
    [], ['Garnir une tortilla de crevettes et de fromage, refermer avec la seconde.', 'Cuire à l’airfryer 8 min à 180°C.', 'Couper en parts et servir.']],
  ['airfryer-galette-sarrasin-jambon-fromage', 'Galette de sarrasin, jambon & fromage, airfryer', 'feculent', 12, 'jambon',
    [f('galette de sarrasin', 2), f('jambon', 2, 'tranches'), f('fromage râpé', 60, 'g')],
    ['porc'], ['Garnir les galettes de jambon et de fromage, plier.', 'Cuire à l’airfryer 8 min à 180°C.', 'Servir.']],
  ['airfryer-galette-sarrasin-champignons-fromage', 'Galette de sarrasin, champignons & fromage, airfryer', 'feculent', 13, 'champignons',
    [f('galette de sarrasin', 2), f('champignons', 150, 'g'), f('fromage râpé', 60, 'g')],
    ['vegetarien'], ['Faire revenir les champignons, garnir les galettes avec le fromage, plier.', 'Cuire à l’airfryer 8 min à 180°C.', 'Servir.']],
  ['airfryer-pdt-farcies-lardons-fromage', 'Pommes de terre farcies, lardons & fromage, airfryer', 'feculent', 15, 'pommes de terre',
    [f('pommes de terre', 2), f('lardons', 100, 'g'), f('fromage râpé', 50, 'g')],
    ['porc'], ['Cuire les pommes de terre à l’airfryer 12 min à 190°C, évider.', 'Garnir de lardons revenus et de fromage.', 'Repasser 3 min à l’airfryer.']],
  ['airfryer-pdt-farcies-thon-mayo', 'Pommes de terre farcies au thon, airfryer', 'feculent', 15, 'pommes de terre',
    [f('pommes de terre', 2), b('thon en conserve', 1, 'boîte'), f('mayonnaise', 1, 'c. à soupe')],
    [], ['Cuire les pommes de terre à l’airfryer 12 min à 190°C, évider.', 'Garnir avec le thon mélangé à la mayonnaise.', 'Servir.']],
  ['airfryer-pain-perdu-sale-jambon-fromage', 'Pain perdu salé, jambon & fromage, airfryer', 'feculent', 12, 'jambon',
    [f('pain de mie', 2, 'tranches'), b('œufs', 2), f('jambon', 2, 'tranches'), f('fromage râpé', 40, 'g')],
    ['porc'], ['Tremper le pain dans les œufs battus, garnir de jambon et de fromage.', 'Cuire à l’airfryer 8 min à 180°C.', 'Servir.']],
  ['airfryer-croquettes-pdt-chapelure-oeuf', 'Croquettes de pommes de terre panées, airfryer', 'feculent', 15, 'pommes de terre',
    [f('pommes de terre', 3), b('chapelure', 50, 'g'), b('œufs', 1)],
    ['vegetarien', 'enfant_friendly'], ['Écraser les pommes de terre cuites, façonner des croquettes.', 'Passer dans l’œuf battu puis la chapelure.', 'Cuire à l’airfryer 10 min à 190°C.']],
  ['airfryer-wedges-pdt-chorizo', 'Wedges de pommes de terre au chorizo, airfryer', 'feculent', 15, 'pommes de terre',
    [f('pommes de terre', 3), f('chorizo', 80, 'g'), f('persil', 1, 'poignée')],
    ['porc'], ['Couper les pommes de terre en quartiers, cuire à l’airfryer 14 min à 190°C avec le chorizo.', 'Parsemer de persil.', 'Servir.']],
];

// --- cookeo, poisson (+15) : riz/lentilles/semoule/pdt + poisson, à la cocotte sous pression ---
const cookeoPoisson = [
  ['cookeo-riz-colin-petits-pois', 'Riz au cookeo, filet de colin & petits pois', 'poisson', 15, 'filet de colin',
    [b('riz', 150, 'g'), f('filet de colin', 2), f('petits pois', 150, 'g')],
    [], ['Cuire le riz et les petits pois au cookeo.', 'Ajouter le colin en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-riz-cabillaud-tomate', 'Riz au cookeo, dos de cabillaud & tomates concassées', 'poisson', 15, 'dos de cabillaud',
    [b('riz', 150, 'g'), f('dos de cabillaud', 2), b('tomates concassées', 1, 'boîte')],
    [], ['Cuire le riz avec les tomates concassées au cookeo.', 'Ajouter le cabillaud en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-riz-thon-petits-pois', 'Riz au cookeo, thon & petits pois', 'poisson', 13, 'thon en conserve',
    [b('riz', 150, 'g'), b('thon en conserve', 1, 'boîte'), f('petits pois', 150, 'g')],
    ['enfant_friendly'], ['Cuire le riz et les petits pois au cookeo.', 'Ajouter le thon égoutté en fin de cuisson.', 'Servir.']],
  ['cookeo-lentilles-saumon-creme', 'Lentilles corail au cookeo, pavé de saumon & crème fraîche', 'poisson', 15, 'pavé de saumon',
    [f('lentilles corail', 150, 'g'), f('pavé de saumon', 2), f('crème fraîche', 15, 'cl')],
    [], ['Cuire les lentilles au cookeo.', 'Ajouter le saumon en fin de cuisson, cuire 5 min de plus avec la crème.', 'Servir.']],
  ['cookeo-risotto-crevettes-parmesan', 'Risotto au cookeo, crevettes & parmesan', 'poisson', 15, 'crevettes',
    [b('riz', 150, 'g'), f('crevettes', 200, 'g'), f('parmesan', 30, 'g')],
    [], ['Cuire le riz au cookeo façon risotto.', 'Ajouter les crevettes en fin de cuisson, parsemer de parmesan.', 'Servir.']],
  ['cookeo-riz-cabillaud-curry-coco', 'Riz au cookeo, dos de cabillaud au curry & coco', 'poisson', 15, 'dos de cabillaud',
    [b('riz', 150, 'g'), f('dos de cabillaud', 2), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à café')],
    [], ['Cuire le riz avec le lait de coco et le curry au cookeo.', 'Ajouter le cabillaud en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-riz-colin-curry-coco', 'Riz au cookeo, filet de colin au curry & coco', 'poisson', 15, 'filet de colin',
    [b('riz', 150, 'g'), f('filet de colin', 2), f('curry', 1, 'c. à café'), f('lait de coco', 20, 'cl')],
    [], ['Cuire le riz avec le lait de coco et le curry au cookeo.', 'Ajouter le colin en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-pdt-cabillaud-creme', 'Pommes de terre au cookeo, dos de cabillaud & crème fraîche', 'poisson', 15, 'dos de cabillaud',
    [f('pommes de terre', 3), f('dos de cabillaud', 2), f('crème fraîche', 15, 'cl')],
    [], ['Cuire les pommes de terre au cookeo.', 'Ajouter le cabillaud en fin de cuisson avec la crème, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-riz-saumon-citron', 'Riz au cookeo, pavé de saumon & citron', 'poisson', 15, 'pavé de saumon',
    [b('riz', 150, 'g'), f('pavé de saumon', 2), f('citron', 1)],
    [], ['Cuire le riz au cookeo.', 'Ajouter le saumon en fin de cuisson, cuire 5 min de plus, arroser de citron.', 'Servir.']],
  ['cookeo-lentilles-cabillaud-curry', 'Lentilles corail au cookeo, dos de cabillaud au curry', 'poisson', 15, 'dos de cabillaud',
    [f('lentilles corail', 150, 'g'), f('dos de cabillaud', 2), f('curry', 1, 'c. à café')],
    [], ['Cuire les lentilles avec le curry au cookeo.', 'Ajouter le cabillaud en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-riz-crevettes-tomate', 'Riz au cookeo, crevettes & tomates concassées', 'poisson', 14, 'crevettes',
    [b('riz', 150, 'g'), f('crevettes', 200, 'g'), b('tomates concassées', 1, 'boîte')],
    [], ['Cuire le riz avec les tomates concassées au cookeo.', 'Ajouter les crevettes en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-semoule-colin-poivron', 'Semoule au cookeo, filet de colin & poivron', 'poisson', 15, 'filet de colin',
    [f('semoule', 150, 'g'), f('filet de colin', 2), f('poivron', 1)],
    [], ['Cuire la semoule avec le poivron au cookeo.', 'Ajouter le colin en fin de cuisson, cuire 5 min de plus.', 'Servir.']],
  ['cookeo-riz-sardines-tomate-persil', 'Riz au cookeo, sardines & tomates concassées', 'poisson', 13, 'sardines en boîte',
    [b('riz', 150, 'g'), f('sardines en boîte', 1, 'boîte'), b('tomates concassées', 1, 'boîte'), f('persil', 1, 'poignée')],
    [], ['Cuire le riz avec les tomates concassées au cookeo.', 'Ajouter les sardines égouttées en fin de cuisson, parsemer de persil.', 'Servir.']],
  ['cookeo-pdt-saumon-fume-ciboulette', 'Pommes de terre au cookeo, saumon fumé & ciboulette', 'poisson', 15, 'saumon fumé',
    [f('pommes de terre', 3), f('saumon fumé', 100, 'g'), f('crème fraîche', 15, 'cl'), f('ciboulette', 1, 'poignée')],
    [], ['Cuire les pommes de terre au cookeo.', 'Écraser grossièrement, ajouter la crème, le saumon fumé et la ciboulette hors du feu.', 'Servir.']],
  ['cookeo-riz-cabillaud-petits-pois-citron', 'Riz au cookeo, dos de cabillaud, petits pois & citron', 'poisson', 15, 'dos de cabillaud',
    [b('riz', 150, 'g'), f('dos de cabillaud', 2), f('petits pois', 150, 'g'), f('citron', 1)],
    [], ['Cuire le riz et les petits pois au cookeo.', 'Ajouter le cabillaud en fin de cuisson, cuire 5 min de plus, arroser de citron.', 'Servir.']],
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

ajouter(airfryerFeculent, ['airfryer']);
ajouter(cookeoPoisson, ['cookeo']);

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');
const parEquip = (eq, c) => cat.recettes.filter((r) => (r.equipement_requis || []).includes(eq) && r.categorie === c).length;
console.log(`✅ +${ajoutees.length} recettes. Total ${cat.recettes.length}.`);
console.log(`   airfryer féculent: ${parEquip('airfryer', 'feculent')} — cookeo poisson: ${parEquip('cookeo', 'poisson')}`);
