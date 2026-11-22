import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DATA = JSON.parse(readFileSync(new URL('../src/data/recettes_50.json', import.meta.url), 'utf8'));
const R = DATA.recettes;

const BASE_CONNU = new Set(['ail','bouillon cube','chapelure','farine','lait','maïs','moutarde',
  'oignon','pâtes','riz','riz cuit','thon en conserve','tomates concassées','vermicelles','œufs']);
const FRAIS_CONNU = new Set(['aiguillettes de dinde','avocat','bûche de chèvre','bœuf émincé',
  'carotte','champignons','chipolatas','chorizo','ciboulette','citron','courgette','crevettes',
  'croûtons','crème fraîche','curry','câpres','côte de porc','dos de cabillaud',
  'escalope de poulet','feta','filet de colin','frites surgelées','fromage râpé',
  'galette de sarrasin','gnocchi','haricots rouges','jambon','lait de coco','lardons',
  'lentilles corail','mayonnaise','merguez','miel','mozzarella','nouilles chinoises',
  'pain de campagne','pain de mie','parmesan','patate douce','pavé de saumon','persil','pesto',
  'petits pois','pois chiches','poivron','pommes de terre','potiron','quinoa cuit','salade',
  'salade romaine','sardines en boîte','sauce soja','saucisses','saumon fumé','semoule',
  'steak haché','tomate','tomates cerises','tortillas','épinards']);

test('contenu — aucun ingrédient hors vocabulaire fermé', () => {
  for (const r of R) for (const i of r.ingredients) {
    const vocab = i.type === 'base' ? BASE_CONNU : FRAIS_CONNU;
    assert.ok(vocab.has(i.nom), `${r.id}: ingrédient hors vocabulaire « ${i.nom} »`);
  }
});

test('contenu — ids uniques sur tout le fichier', () => {
  const ids = R.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('contenu — invariants (temps, nb ingrédients, vedette)', () => {
  for (const r of R) {
    assert.ok(r.temps_min <= 15, `${r.id}: ${r.temps_min} min`);
    assert.ok(r.ingredients.length <= 5, `${r.id}: ${r.ingredients.length} ingrédients`);
    if (r.ingredient_vedette) {
      assert.ok(r.ingredients.some((i) => i.nom === r.ingredient_vedette), `${r.id}: vedette absente`);
    }
  }
});

function sansEquip(cat) {
  return R.filter((r) => (r.equipement_requis || []).length === 0 && (!cat || r.categorie === cat));
}

test('contenu — pool sans équipement : 180 au total, réparti par catégorie', () => {
  assert.equal(sansEquip().length, 180);
  assert.equal(sansEquip('feculent').length, 25);
  assert.equal(sansEquip('volaille').length, 25);
  assert.equal(sansEquip('vegetarien').length, 25);
  assert.equal(sansEquip('oeufs').length, 40);
  assert.equal(sansEquip('poisson').length, 20);
  assert.equal(sansEquip('viande').length, 20);
  assert.equal(sansEquip('soupe').length, 25);
});

test('contenu — pool sans équipement : au moins 65 taguées vegetarien', () => {
  const n = sansEquip().filter((r) => (r.tags || []).includes('vegetarien')).length;
  assert.ok(n >= 65, `seulement ${n} recettes sans équipement taguées vegetarien`);
});

test('contenu — plancha : 45 recettes, réparties', () => {
  const plancha = R.filter((r) => (r.equipement_requis || []).includes('plancha'));
  assert.equal(plancha.length, 45);
  const par = (cat) => plancha.filter((r) => r.categorie === cat).length;
  assert.equal(par('viande'), 12);
  assert.equal(par('poisson'), 10);
  assert.equal(par('volaille'), 12);
  assert.equal(par('vegetarien'), 11);
});

function parEquip(equip, categorie) {
  return R.filter((r) => (r.equipement_requis || []).includes(equip) && r.categorie === categorie).length;
}

test('contenu — lot œufs/soupe : +61 recettes', () => {
  assert.equal(parEquip('airfryer', 'oeufs'), 20);
  assert.equal(parEquip('cookeo', 'soupe'), 35);
});

test('contenu — lot airfryer féculent / cookeo poisson : +31 recettes, total 488', () => {
  assert.equal(parEquip('airfryer', 'feculent'), 20);
  assert.equal(parEquip('cookeo', 'poisson'), 18);
  assert.equal(R.length, 488);
});
