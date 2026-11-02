import assert from 'node:assert/strict';
import test from 'node:test';

import { discoveryParameters, matchesPreferences } from '../src/lib/recommendations.ts';
import type { MovieDetails, WatchProvider } from '../src/lib/tmdb.ts';

const netflix: WatchProvider = {
  provider_id: 8,
  provider_name: 'Netflix',
  logo_path: null,
  display_priority: 0,
};
const disney: WatchProvider = { ...netflix, provider_id: 337, provider_name: 'Disney Plus' };
const movie: MovieDetails = {
  id: 1,
  title: 'Film testowy',
  genres: [{ id: 28, name: 'Akcja' }],
  'watch/providers': { results: { PL: { flatrate: [netflix], rent: [disney] } } },
};

test('wyszukiwanie ogranicza abonament do Polski i łączy wybory przez OR', () => {
  const parameters = discoveryParameters({ providerIds: [8, 337], genreIds: [28, 35] });
  assert.equal(parameters.watch_region, 'PL');
  assert.equal(parameters.with_watch_monetization_types, 'flatrate');
  assert.equal(parameters.with_watch_providers, '8|337');
  assert.equal(parameters.with_genres, '28|35');
});

test('brak wybranego gatunku nie ogranicza wyszukiwania', () => {
  const parameters = discoveryParameters({ providerIds: [8], genreIds: [] });
  assert.equal('with_genres' in parameters, false);
  assert.equal(matchesPreferences(movie, { providerIds: [8], genreIds: [] }), true);
});

test('nie rozpoczyna wyszukiwania bez platformy', () => {
  assert.throws(() => discoveryParameters({ providerIds: [], genreIds: [] }));
});

test('wystarcza jedna pasująca platforma i jeden z wybranych gatunków', () => {
  assert.equal(matchesPreferences(movie, { providerIds: [337, 8], genreIds: [35, 28] }), true);
});

test('odrzuca film spoza wybranych gatunków', () => {
  assert.equal(matchesPreferences(movie, { providerIds: [8], genreIds: [35] }), false);
});

test('wypożyczenie na wybranej platformie nie zastępuje abonamentu na niej', () => {
  assert.equal(matchesPreferences(movie, { providerIds: [337], genreIds: [] }), false);
});

test('sam zakup nie spełnia warunku dostępności', () => {
  const purchaseOnly: MovieDetails = {
    ...movie,
    'watch/providers': { results: { PL: { buy: [netflix] } } },
  };
  assert.equal(matchesPreferences(purchaseOnly, { providerIds: [8], genreIds: [] }), false);
});

test('abonament za granicą nie spełnia warunku dostępności w Polsce', () => {
  const foreignSubscription: MovieDetails = {
    ...movie,
    'watch/providers': { results: { US: { flatrate: [netflix] }, PL: { rent: [netflix] } } },
  };
  assert.equal(matchesPreferences(foreignSubscription, { providerIds: [8], genreIds: [] }), false);
});

test('brak informacji o dostępności nie jest potwierdzeniem abonamentu', () => {
  const unknownAvailability: MovieDetails = { ...movie, 'watch/providers': { results: {} } };
  assert.equal(matchesPreferences(unknownAvailability, { providerIds: [8], genreIds: [] }), false);
});
