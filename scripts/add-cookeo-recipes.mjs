// Ajoute des recettes Cookeo (multicuiseur) : one-pot rapides 15 min / ≤5 ingrédients,
// equipement_requis: ['cookeo']. Valide les invariants puis réécrit le JSON.
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
  ['risotto-champignons-cookeo', 'Risotto champignons Cookeo', 'feculent', 15, 'champignons',
    [b('riz', 180, 'g'), f('champignons', 200, 'g'), b('oignon', 1), f('parmesan', 40, 'g'), b('bouillon cube', 1)], ['vegetarien'],
    ['Dorer oignon et champignons en mode dorer.', 'Ajouter le riz, le bouillon et de l’eau à hauteur.', 'Cuisson sous pression 6 min.', 'Mélanger le parmesan et servir.']],
  ['bolognaise-cookeo', 'Bolognaise express Cookeo', 'feculent', 15, 'steak haché',
    [b('pâtes', 200, 'g'), f('steak haché', 250, 'g'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['enfant_friendly'],
    ['Dorer l’oignon et la viande.', 'Ajouter pâtes, tomate et de l’eau à hauteur.', 'Cuisson sous pression 7 min.', 'Mélanger et servir.']],
  ['poulet-curry-coco-cookeo', 'Poulet curry-coco Cookeo', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), f('lait de coco', 20, 'cl'), f('curry', 1, 'c. à soupe'), b('riz', 150, 'g')], ['enfant_friendly'],
    ['Dorer le poulet en morceaux.', 'Ajouter curry, lait de coco, riz et un peu d’eau.', 'Cuisson sous pression 8 min.', 'Servir.']],
  ['dahl-corail-cookeo', 'Dahl de corail Cookeo', 'vegetarien', 15, 'lentilles corail',
    [f('lentilles corail', 200, 'g'), f('lait de coco', 20, 'cl'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['vegetarien'],
    ['Dorer l’oignon.', 'Ajouter lentilles, tomate, lait de coco et de l’eau.', 'Cuisson sous pression 8 min.', 'Mélanger et servir.']],
  ['soupe-legumes-cookeo', 'Soupe de légumes Cookeo', 'soupe', 15, 'carotte',
    [f('carotte', 3), f('pomme de terre', 2), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'],
    ['Couper les légumes en morceaux.', 'Mettre avec le bouillon et de l’eau à hauteur.', 'Cuisson sous pression 10 min.', 'Mixer et servir.']],
  ['riz-cantonais-cookeo', 'Riz cantonais Cookeo', 'feculent', 14, 'petits pois',
    [b('riz', 180, 'g'), f('petits pois', 100, 'g'), f('jambon', 2, 'tranches'), b('œufs', 2)], ['enfant_friendly', 'porc'],
    ['Mettre riz, petits pois et eau à hauteur.', 'Cuisson sous pression 6 min.', 'Ajouter jambon en dés et œufs brouillés.', 'Mélanger et servir.']],
  ['chili-cookeo', 'Chili con carne Cookeo', 'viande', 15, 'bœuf émincé',
    [f('bœuf émincé', 250, 'g'), f('haricots rouges', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1)], ['enfant_friendly'],
    ['Dorer oignon et bœuf.', 'Ajouter tomate et haricots égouttés.', 'Cuisson sous pression 6 min.', 'Servir.']],
  ['risotto-potiron-cookeo', 'Risotto potiron Cookeo', 'vegetarien', 15, 'potiron',
    [b('riz', 180, 'g'), f('potiron', 250, 'g'), b('oignon', 1), f('parmesan', 40, 'g'), b('bouillon cube', 1)], ['vegetarien'],
    ['Dorer oignon et potiron en dés.', 'Ajouter riz, bouillon et eau à hauteur.', 'Cuisson sous pression 7 min.', 'Mélanger le parmesan et servir.']],
  ['soupe-potiron-coco-cookeo', 'Soupe potiron-coco Cookeo', 'soupe', 15, 'potiron',
    [f('potiron', 400, 'g'), f('lait de coco', 20, 'cl'), b('oignon', 1), b('bouillon cube', 1)], ['vegetarien'],
    ['Couper le potiron en morceaux.', 'Mettre avec oignon, bouillon, lait de coco et eau.', 'Cuisson sous pression 10 min.', 'Mixer et servir.']],
  ['pates-thon-cookeo', 'Pâtes au thon Cookeo', 'feculent', 14, null,
    [b('pâtes', 200, 'g'), b('thon en conserve', 1, 'boîte'), b('tomates concassées', 400, 'g'), b('oignon', 1)], [],
    ['Dorer l’oignon.', 'Ajouter pâtes, tomate, thon et eau à hauteur.', 'Cuisson sous pression 7 min.', 'Mélanger et servir.']],
  ['poulet-riz-petits-pois-cookeo', 'Poulet, riz & petits pois Cookeo', 'volaille', 15, 'escalope de poulet',
    [f('escalope de poulet', 2), b('riz', 150, 'g'), f('petits pois', 100, 'g'), b('bouillon cube', 1)], ['enfant_friendly'],
    ['Dorer le poulet en morceaux.', 'Ajouter riz, petits pois, bouillon et eau.', 'Cuisson sous pression 8 min.', 'Servir.']],
  ['saucisses-lentilles-cookeo', 'Saucisses & lentilles Cookeo', 'viande', 15, 'saucisses',
    [f('saucisses', 3), f('lentilles corail', 180, 'g'), b('oignon', 1), b('tomates concassées', 400, 'g')], ['porc'],
    ['Dorer les saucisses et l’oignon.', 'Ajouter lentilles, tomate et de l’eau.', 'Cuisson sous pression 8 min.', 'Servir.']],
];

const idsExistants = new Set(cat.recettes.map((r) => r.id));
const erreurs = [];
const ajoutees = [];

for (const [id, nom, categorie, temps_min, vedette, ings, tags, etapes] of nouvelles) {
  if (idsExistants.has(id)) continue;
  if (!CATS.has(categorie)) erreurs.push(`${id}: catégorie inconnue`);
  if (temps_min > 15) erreurs.push(`${id}: ${temps_min} min > 15`);
  if (ings.length > 5) erreurs.push(`${id}: ${ings.length} ingrédients > 5`);
  if (vedette && !ings.some((i) => i.nom === vedette)) erreurs.push(`${id}: vedette absente`);
  ajoutees.push({
    id, nom, temps_min, portions: 2,
    ingredient_vedette: vedette,
    categorie,
    ingredients: ings.map((i) => ({ nom: i.nom, type: i.type, quantite: { valeur: i.valeur, unite: i.unite } })),
    nb_comptables: ings.length,
    equipement_requis: ['cookeo'],
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
const cookeo = cat.recettes.filter((r) => (r.equipement_requis || []).includes('cookeo')).length;
console.log(`✅ ${ajoutees.length} recettes Cookeo ajoutées. Total : ${cat.recettes.length} (dont ${cookeo} cookeo).`);
