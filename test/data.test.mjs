import test from 'node:test';
import assert from 'node:assert/strict';
import { categorieAppareil } from '../src/js/data.js';
import { ICONES_APPAREIL } from '../src/js/ui.js';

test('categorieAppareil — reconnaît les 4 types', () => {
  assert.equal(categorieAppareil({ equipement_requis: ['airfryer'] }), 'airfryer');
  assert.equal(categorieAppareil({ equipement_requis: ['cookeo'] }), 'cookeo');
  assert.equal(categorieAppareil({ equipement_requis: ['plancha'] }), 'plancha');
  assert.equal(categorieAppareil({ equipement_requis: [] }), 'classique');
});

test('ICONES_APPAREIL — une icône définie pour chacun des 4 types', () => {
  for (const cle of ['classique', 'airfryer', 'cookeo', 'plancha']) {
    assert.ok(ICONES_APPAREIL[cle], `icône manquante pour « ${cle} »`);
  }
});
