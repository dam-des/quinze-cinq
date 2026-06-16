// Étoffe la base avec des recettes variées (15 min / ≤5 ingrédients), inspirées
// d'idées de dîners express, pour casser la routine. Contrairement au lot airfryer,
// on s'autorise quelques NOUVEAUX ingrédients frais (chorizo, merguez, haricots
// rouges, feta, galette de sarrasin). Valide les invariants puis réécrit le JSON.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHIER = join(ROOT, 'src/data/recettes_50.json');
const cat = JSON.parse(readFileSync(FICHIER, 'utf8'));

const CATS = new Set(['feculent', 'oeufs', 'volaille', 'poisson', 'viande', 'vegetarien', 'soupe']);
const b = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'base' });
const f = (nom, valeur, unite = null) => ({ nom, valeur, unite, type: 'frais' });

const nouvelles = [
  // Féculents
  ['pates-chorizo-tomate', 'Pâtes au chorizo & tomate', 'feculent', 15, 'chorizo',
    [b('pâtes', 200, 'g'), f('chorizo', 80, 'g'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['porc'],
    ['Cuire les pâtes.', 'Faire revenir oignon et chorizo en rondelles, ajouter la tomate, mijoter 8 min.', 'Mélanger avec les pâtes.']],
  ['pates-epinards-chevre', 'Pâtes épinards & chèvre', 'feculent', 15, 'épinards',
    [b('pâtes', 200, 'g'), f('épinards', 2, 'poignées'), f('bûche de chèvre', 80, 'g'), b('ail', 1, 'gousse')], ['vegetarien'],
    ['Cuire les pâtes.', "Faire tomber les épinards à l'ail, ajouter le chèvre pour le fondre.", 'Mélanger avec les pâtes.']],
  ['pates-citron-parmesan', 'Pâtes citron & parmesan', 'feculent', 14, 'citron',
    [b('pâtes', 200, 'g'), f('citron', 1), f('parmesan', 40, 'g'), f('crème fraîche', 2, 'c. à soupe')], ['vegetarien'],
    ['Cuire les pâtes.', 'Mélanger crème, jus et zeste de citron, parmesan.', 'Enrober les pâtes chaudes de la sauce.']],
  ['nouilles-boeuf-soja', 'Nouilles sautées au bœuf & soja', 'feculent', 15, 'bœuf émincé',
    [f('nouilles chinoises', 150, 'g'), f('bœuf émincé', 200, 'g'), f('sauce soja', 2, 'c. à soupe'), f('poivron', 1)], [],
    ['Cuire les nouilles.', 'Saisir le bœuf et le poivron à feu vif, ajouter la sauce soja.', 'Mélanger avec les nouilles.']],
  ['pates-thon-capres', 'Pâtes thon & câpres', 'feculent', 14, 'câpres',
    [b('pâtes', 200, 'g'), b('thon en conserve', 1, 'boîte'), f('câpres', 1, 'c. à soupe'), f('citron', 1)], [],
    ['Cuire les pâtes.', 'Mélanger thon égoutté, câpres, jus de citron et un filet d’huile.', 'Mélanger avec les pâtes.']],

  // Œufs
  ['shakshuka-express', 'Shakshuka express', 'oeufs', 15, 'poivron',
    [b('œufs', 3), b('tomates concassées', 400, 'g'), f('poivron', 1), b('oignon', 1)], ['vegetarien'],
    ['Faire revenir oignon et poivron.', 'Ajouter la tomate, laisser mijoter 5 min.', 'Casser les œufs dessus, couvrir 4 min.', 'Servir avec du pain.']],
  ['omelette-chevre-miel', 'Omelette chèvre & miel', 'oeufs', 10, 'bûche de chèvre',
    [b('œufs', 3), f('bûche de chèvre', 60, 'g'), f('miel', 1, 'c. à café')], ['vegetarien'],
    ['Battre les œufs, cuire à la poêle.', 'Déposer le chèvre, plier l’omelette.', 'Filet de miel et servir.']],

  // Volaille
  ['poulet-miel-moutarde', 'Poulet miel-moutarde', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), f('miel', 1, 'c. à soupe'), b('moutarde', 1, 'c. à soupe'), b('riz cuit', 1, 'bol')], ['enfant_friendly'],
    ['Couper le poulet en lanières, le saisir.', 'Ajouter miel et moutarde, laquer 4 min.', 'Servir avec le riz réchauffé.']],
  ['quesadilla-poulet', 'Quesadilla poulet-fromage', 'volaille', 15, 'escalope de poulet',
    [f('tortillas', 2), f('escalope de poulet', 1), f('fromage râpé', 60, 'g'), f('poivron', 1)], ['enfant_friendly'],
    ['Saisir poulet et poivron émincés.', 'Garnir une tortilla de poulet et fromage, replier.', 'Dorer 2 min de chaque côté à la poêle.']],

  // Poisson
  ['crevettes-ail-miel', 'Crevettes sautées ail & miel', 'poisson', 12, 'crevettes',
    [f('crevettes', 200, 'g'), f('miel', 1, 'c. à soupe'), b('ail', 2, 'gousses'), b('riz cuit', 1, 'bol')], ['enfant_friendly'],
    ['Saisir les crevettes avec l’ail.', 'Ajouter le miel, laquer 2 min.', 'Servir sur le riz réchauffé.']],
  ['cabillaud-tomates-cerises', 'Cabillaud & tomates cerises', 'poisson', 15, 'dos de cabillaud',
    [f('dos de cabillaud', 2), f('tomates cerises', 1, 'poignée'), f('citron', 1), b('riz cuit', 1, 'bol')], ['enfant_friendly'],
    ['Poêler le cabillaud 6 min.', 'Ajouter tomates cerises et jus de citron, 3 min.', 'Servir avec le riz.']],
  ['crevettes-courgette', 'Poêlée crevettes & courgette', 'poisson', 13, 'crevettes',
    [f('crevettes', 200, 'g'), f('courgette', 1), b('ail', 1, 'gousse'), f('citron', 1)], [],
    ['Faire revenir la courgette en dés avec l’ail.', 'Ajouter les crevettes, saisir 4 min.', 'Filet de citron et servir.']],

  // Viande
  ['fajitas-boeuf', 'Fajitas de bœuf', 'viande', 15, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), f('poivron', 1), b('oignon', 1), f('tortillas', 2)], ['enfant_friendly'],
    ['Saisir le bœuf à feu vif.', 'Ajouter poivron et oignon émincés, 5 min.', 'Garnir les tortillas chaudes.']],
  ['merguez-semoule', 'Merguez & semoule', 'viande', 15, 'merguez',
    [f('merguez', 4), f('semoule', 150, 'g'), f('poivron', 1), b('oignon', 1)], [],
    ['Cuire les merguez à la poêle.', 'Faire revenir poivron et oignon.', 'Préparer la semoule (eau bouillante, 5 min couvert).', 'Servir ensemble.']],
  ['chili-express', 'Chili express bœuf & haricots', 'viande', 15, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), f('haricots rouges', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['enfant_friendly'],
    ['Saisir le bœuf avec l’oignon.', 'Ajouter tomates et haricots égouttés.', 'Mijoter 8 min et servir.']],

  // Végétarien
  ['quesadilla-vege', 'Quesadilla poivron-fromage', 'vegetarien', 13, 'poivron',
    [f('tortillas', 2), f('fromage râpé', 60, 'g'), f('poivron', 1), b('maïs', 4, 'c. à soupe')], ['vegetarien', 'enfant_friendly'],
    ['Faire revenir le poivron émincé.', 'Garnir une tortilla de fromage, poivron et maïs, replier.', 'Dorer 2 min de chaque côté.']],
  ['fajitas-haricots', 'Fajitas de haricots rouges', 'vegetarien', 15, 'haricots rouges',
    [f('haricots rouges', 1, 'boîte'), f('poivron', 1), b('oignon', 1), f('tortillas', 2), b('maïs', 3, 'c. à soupe')], ['vegetarien'],
    ['Faire revenir poivron et oignon.', 'Ajouter haricots égouttés et maïs, réchauffer.', 'Garnir les tortillas.']],
  ['galette-sarrasin-oeuf', 'Galette de sarrasin œuf-fromage', 'vegetarien', 12, 'galette de sarrasin',
    [f('galette de sarrasin', 2), b('œufs', 2), f('fromage râpé', 50, 'g')], ['vegetarien', 'enfant_friendly'],
    ['Réchauffer une galette à la poêle.', 'Casser un œuf au centre, parsemer de fromage.', 'Replier les bords, servir.']],
  ['salade-pois-chiches-feta', 'Salade pois chiches & feta', 'vegetarien', 10, 'feta',
    [f('pois chiches', 1, 'boîte'), f('feta', 80, 'g'), f('tomate', 2), f('citron', 1)], ['vegetarien'],
    ['Égoutter les pois chiches.', 'Mélanger avec feta émiettée, tomates en dés.', 'Assaisonner de jus de citron et d’huile.']],

  // Soupe
  ['soupe-tomate-pois-chiches', 'Soupe tomate & pois chiches', 'soupe', 15, 'pois chiches',
    [b('tomates concassées', 400, 'g'), f('pois chiches', 1, 'boîte'), b('bouillon cube', 1), b('oignon', 1)], ['vegetarien'],
    ['Faire revenir l’oignon.', 'Ajouter tomate, pois chiches, bouillon et un peu d’eau.', 'Mijoter 10 min, mixer si désiré.']],
];

const idsExistants = new Set(cat.recettes.map((r) => r.id));
const erreurs = [];
const ajoutees = [];

for (const [id, nom, categorie, temps_min, vedette, ings, tags, etapes] of nouvelles) {
  if (idsExistants.has(id)) continue;
  if (!CATS.has(categorie)) erreurs.push(`${id}: catégorie inconnue « ${categorie} »`);
  if (temps_min > 15) erreurs.push(`${id}: ${temps_min} min > 15`);
  if (ings.length > 5) erreurs.push(`${id}: ${ings.length} ingrédients > 5`);
  if (vedette && !ings.some((i) => i.nom === vedette))
    erreurs.push(`${id}: ingredient_vedette « ${vedette} » absent`);
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

if (erreurs.length) {
  console.error('❌ Validation échouée :\n  ' + erreurs.join('\n  '));
  process.exit(1);
}

cat.recettes.push(...ajoutees);
writeFileSync(FICHIER, JSON.stringify(cat, null, 2) + '\n', 'utf8');

// Récap : nouveaux ingrédients frais introduits.
const fraisAvant = new Set();
for (const r of cat.recettes.slice(0, cat.recettes.length - ajoutees.length))
  for (const i of r.ingredients) if (i.type === 'frais') fraisAvant.add(i.nom);
const nouveaux = new Set();
for (const r of ajoutees) for (const i of r.ingredients) if (i.type === 'frais' && !fraisAvant.has(i.nom)) nouveaux.add(i.nom);
console.log(`✅ ${ajoutees.length} recettes ajoutées. Total : ${cat.recettes.length}.`);
console.log('Nouveaux ingrédients frais :', [...nouveaux].join(', ') || '(aucun)');
