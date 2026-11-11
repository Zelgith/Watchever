import assert from 'node:assert/strict';
import test from 'node:test';
import type { TestContext } from 'node:test';

import { discoveryParameters, getRecommendations, matchesPreferences } from '../src/lib/recommendations.ts';
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
  poster_path: null,
  release_date: '',
  overview: null,
  runtime: null,
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

test('rok i czas trafiają do zapytania jako granice włączne', () => {
  const parameters = discoveryParameters({ providerIds: [8], genreIds: [28], yearFrom: 1990, yearTo: 2020, maxRuntime: 120 });
  assert.equal(parameters['primary_release_date.gte'], '1990-01-01');
  assert.equal(parameters['primary_release_date.lte'], '2020-12-31');
  assert.equal(parameters['with_runtime.gte'], '1');
  assert.equal(parameters['with_runtime.lte'], '120');
  const noLimits = discoveryParameters({ providerIds: [8], genreIds: [] });
  assert.equal('primary_release_date.gte' in noLimits, false);
  assert.equal('with_runtime.lte' in noLimits, false);
});

test('każdy aktywny filtr musi pasować, także na granicy lat i minut', () => {
  const preferences = { providerIds: [8], genreIds: [28], yearFrom: 2000, yearTo: 2020, maxRuntime: 120 };
  const matching = { ...movie, release_date: '2000-01-01', runtime: 120 };
  assert.equal(matchesPreferences(matching, preferences), true);
  assert.equal(matchesPreferences({ ...matching, release_date: '2020-12-31' }, preferences), true);
  for (const changed of [
    { release_date: '1999-12-31' }, { release_date: '2021-01-01' }, { release_date: '' },
    { runtime: 121 }, { runtime: null }, { runtime: 0 }, { runtime: -1 }, { runtime: NaN },
    { genres: [{ id: 35, name: 'Komedia' }] },
    { 'watch/providers': { results: { PL: { rent: [netflix] } } } },
  ]) assert.equal(matchesPreferences({ ...matching, ...changed }, preferences), false, JSON.stringify(changed));
});

test('nieznany rok lub czas wyklucza film tylko przy aktywnym filtrze', () => {
  assert.equal(matchesPreferences(movie, { providerIds: [8], genreIds: [] }), true);
  assert.equal(matchesPreferences(movie, { providerIds: [8], genreIds: [], yearTo: 2020 }), false);
  assert.equal(matchesPreferences(movie, { providerIds: [8], genreIds: [], maxRuntime: 120 }), false);
  assert.equal(matchesPreferences({ ...movie, release_date: '2020-01-01' }, { providerIds: [8], genreIds: [], yearFrom: 2020 }), true);
});

test('brak gatunków nie powoduje błędu i nie spełnia aktywnego filtra gatunków', () => {
  const incomplete = { ...movie, genres: undefined } as unknown as MovieDetails;
  assert.equal(matchesPreferences(incomplete, { providerIds: [8], genreIds: [] }), true);
  assert.equal(matchesPreferences(incomplete, { providerIds: [8], genreIds: [28] }), false);
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

function mockMovies(context: TestContext, candidates: MovieDetails[]) {
  const previousToken = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
  process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = 'unit-test-token';
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  context.after(() => {
    if (previousToken === undefined) delete process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
    else process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = previousToken;
  });
  context.mock.method(globalThis, 'fetch', async (input: Parameters<typeof fetch>[0]) => {
    const url = new URL(String(input));
    if (url.pathname === '/3/discover/movie') {
      return Response.json({ results: candidates.map(({ id }) => ({ id })) });
    }
    const id = Number(url.pathname.split('/')[3]);
    const details = byId.get(id);
    assert.ok(details, 'Nieoczekiwany identyfikator zapytania');
    return Response.json(details);
  });
}

test('zwraca wiele potwierdzonych filmów w kolejności wyników, bez duplikatów', async (context) => {
  mockMovies(context, [
    movie,
    { ...movie, id: 2, title: 'Drugi film', genres: [{ id: 35, name: 'Komedia' }] },
    { ...movie, id: 3, 'watch/providers': { results: { PL: { buy: [netflix] } } } },
    { ...movie, id: 4, genres: [{ id: 99, name: 'Dokumentalny' }] },
    { ...movie, id: 5, title: 'Kolejny film' },
    movie,
  ]);

  const recommendations = await getRecommendations({ providerIds: [8], genreIds: [28, 35] });
  assert.deepEqual(recommendations.map(({ id }) => id), [1, 2, 5]);
});

test('brak wyników TMDB zwraca pustą listę filmów', async (context) => {
  mockMovies(context, []);
  assert.deepEqual(await getRecommendations({ providerIds: [8], genreIds: [] }), []);
});
