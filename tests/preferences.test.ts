import assert from 'node:assert/strict';
import test from 'node:test';

import { preferencesFromFields, validatePreferences } from '../src/lib/preferences.ts';

test('puste pola i pojedyncze granice lat nie dodają innych ograniczeń', () => {
  const preferences = preferencesFromFields([8], [], { yearFrom: '', yearTo: ' 2000 ', maxRuntime: '' });
  assert.equal(preferences.yearFrom, undefined);
  assert.equal(preferences.yearTo, 2000);
  assert.equal(preferences.maxRuntime, undefined);
});

test('niepoprawne zakresy i czasy są zatrzymywane przed wyszukiwaniem', () => {
  const fields = { yearFrom: '', yearTo: '', maxRuntime: '' };
  for (const invalid of [
    { yearFrom: '2020', yearTo: '2019' }, { yearFrom: '20' }, { yearTo: '10000' },
    { yearFrom: '2e3' }, { maxRuntime: '0' }, { maxRuntime: '-1' },
    { maxRuntime: '1.5' }, { maxRuntime: '90min' }, { maxRuntime: '9007199254740992' },
  ]) {
    assert.throws(() => preferencesFromFields([8], [], { ...fields, ...invalid }), JSON.stringify(invalid));
  }
  assert.throws(() => validatePreferences({ providerIds: [8], genreIds: [], maxRuntime: NaN }));
  assert.throws(() => validatePreferences({ providerIds: [8], genreIds: [], yearFrom: Infinity }));
});
