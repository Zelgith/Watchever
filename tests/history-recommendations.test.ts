import assert from 'node:assert/strict';
import test from 'node:test';
import type { TestContext } from 'node:test';

import { getRecommendations, matchesPreferences } from '../src/lib/recommendations.ts';
import type { WatchedMovie } from '../src/lib/storage.ts';
import type { MovieDetails } from '../src/lib/tmdb.ts';

function movie(id: number, genre = 28): MovieDetails {
  return { id, title: `Film ${id}`, poster_path: null, release_date: '2010-01-01', overview: null,
    runtime: 100, genres: [{ id: genre, name: String(genre) }],
    'watch/providers': { results: { PL: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 0 }] } } } };
}

function watched(id: number, rating: number | null = null, genre = 28): WatchedMovie {
  return { ...movie(id, genre), watchedAt: '2026-11-11T12:00:00Z', rating };
}

function mockApi(context: TestContext, respond: (url: URL) => Response) {
  const previous = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
  process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = 'unit-test-token';
  context.after(() => {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
    else process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = previous;
  });
  context.mock.method(globalThis, 'fetch', async (input: Parameters<typeof fetch>[0]) => respond(new URL(String(input))));
}

test('obejrzana pierwsza strona prowadzi do następnej bez pobierania obejrzanych i bez duplikatów', async (context) => {
  const detailIds: number[] = [];
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/recommendations')) return Response.json({ results: [] });
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ total_pages: 2,
      results: (url.searchParams.get('page') === '1' ? [1, 2] : [2, 3, 3, 4]).map((id) => ({ id })) });
    const id = Number(url.pathname.split('/').at(-1));
    detailIds.push(id);
    return Response.json(id === 4 ? { ...movie(id), runtime: null } : movie(id));
  });
  const preferences = { providerIds: [8], genreIds: [28], yearFrom: 2010, yearTo: 2010, maxRuntime: 100 };
  const result = await getRecommendations(preferences, undefined, [watched(1), watched(2)]);
  assert.deepEqual(result.map(({ id }) => id), [3]);
  assert.deepEqual(detailIds, [3, 4]);
});

test('oceny i podobne filmy zmieniają kolejność, zachowując wszystkie twarde filtry', async (context) => {
  const details = new Map([
    [100, movie(100, 99)], [200, movie(200, 35)], [300, movie(300, 28)], [400, movie(400, 35)],
    [500, { ...movie(500), runtime: 130 }], [600, { ...movie(600), 'watch/providers': { results: { PL: { rent: movie(600)['watch/providers'].results.PL.flatrate } } } }],
    [700, { ...movie(700), release_date: '1999-01-01' }], [800, { ...movie(800), adult: true }],
  ]);
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: [100, 200, 300, 1].map((id) => ({ id, genre_ids: details.get(id)?.genres.map((g) => g.id) })) });
    if (url.pathname.endsWith('/recommendations')) return Response.json({ results: [400, 500, 600, 700, 800, 1].map((id) => ({ id, genre_ids: details.get(id)?.genres.map((g) => g.id) })) });
    const detail = details.get(Number(url.pathname.split('/').at(-1)));
    assert.ok(detail);
    return Response.json(detail);
  });
  const history = [watched(1, 4.5, 28), watched(2, 1, 99)];
  const preferences = { providerIds: [8], genreIds: [], yearFrom: 2000, yearTo: 2020, maxRuntime: 120 };
  const result = await getRecommendations(preferences, undefined, history);
  assert.deepEqual(result.map(({ id }) => id), [300, 400, 200, 100]);
  assert.ok(result.every((film) => matchesPreferences(film, preferences)));
  const actionOnly = await getRecommendations({ ...preferences, genreIds: [28] }, undefined, history);
  assert.deepEqual(actionOnly.map(({ id }) => id), [300]);
});

test('awaria dodatkowych podobnych filmów nie blokuje podstawowych rekomendacji', async (context) => {
  let relatedRequests = 0;
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: [{ id: 2 }] });
    if (url.pathname.endsWith('/recommendations')) { relatedRequests++; return new Response('', { status: 503 }); }
    return Response.json(movie(2));
  });
  const result = await getRecommendations({ providerIds: [8], genreIds: [] }, undefined, [watched(1, 5)]);
  assert.deepEqual(result.map(({ id }) => id), [2]);
  assert.equal(relatedRequests, 1);
});

test('poszukiwanie niewidzianych filmów ma limit pięciu stron', async (context) => {
  const pages: number[] = [];
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/recommendations')) return Response.json({ results: [] });
    assert.ok(url.pathname.endsWith('/discover/movie'), 'Nie pobieraj szczegółów obejrzanych filmów');
    const page = Number(url.searchParams.get('page'));
    pages.push(page);
    return Response.json({ total_pages: 500, results: [{ id: page }] });
  });
  const result = await getRecommendations({ providerIds: [8], genreIds: [] }, undefined, [1, 2, 3, 4, 5].map((id) => watched(id)));
  assert.deepEqual(result, []);
  assert.deepEqual(pages, [1, 2, 3, 4, 5]);
});

test('podobne filmy z historii bez ocen również wpływają na dobór', async (context) => {
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: [{ id: 2 }] });
    if (url.pathname.endsWith('/recommendations')) return Response.json({ results: [{ id: 3 }] });
    return Response.json(movie(Number(url.pathname.split('/').at(-1))));
  });
  const result = await getRecommendations({ providerIds: [8], genreIds: [] }, undefined, [watched(1)]);
  assert.deepEqual(result.map(({ id }) => id), [3, 2]);
});

test('odświeżenie zwraca inną dwudziestkę i nie pobiera ponownie szczegółów obecnych filmów', async (context) => {
  const detailIds: number[] = [];
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) {
      const page = Number(url.searchParams.get('page'));
      return Response.json({ total_pages: 3, results: Array.from({ length: 20 }, (_, index) => ({ id: (page - 1) * 20 + index + 1 })) });
    }
    const id = Number(url.pathname.split('/').at(-1));
    detailIds.push(id);
    return Response.json(movie(id));
  });
  const preferences = { providerIds: [8], genreIds: [28], yearFrom: 2010, yearTo: 2010, maxRuntime: 100 };
  const first = await getRecommendations(preferences);
  detailIds.length = 0;
  const second = await getRecommendations(preferences, undefined, [], first.map(({ id }) => id));
  assert.equal(first.length, 20);
  assert.equal(second.length, 20);
  assert.ok(second.every((film) => !first.some(({ id }) => id === film.id) && matchesPreferences(film, preferences)));
  assert.deepEqual(detailIds, Array.from({ length: 20 }, (_, index) => index + 21));
});

test('brak innych dopasowań nie przywraca wykluczonych filmów', async (context) => {
  mockApi(context, (url) => {
    assert.ok(url.pathname.endsWith('/discover/movie'));
    return Response.json({ total_pages: 1, results: [{ id: 1 }, { id: 2 }] });
  });
  assert.deepEqual(await getRecommendations({ providerIds: [8], genreIds: [] }, undefined, [], [1, 2]), []);
});

test('usunięty z TMDB film jest pomijany, a błąd komunikacji nadal jest błędem', async (context) => {
  let status = 404;
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: [{ id: 1 }, { id: 2 }] });
    return url.pathname.endsWith('/1') ? new Response('', { status }) : Response.json(movie(2));
  });
  assert.deepEqual((await getRecommendations({ providerIds: [8], genreIds: [] })).map(({ id }) => id), [2]);
  status = 503;
  await assert.rejects(getRecommendations({ providerIds: [8], genreIds: [] }));
});

test('sama zamiana ocen odwraca ranking tego samego katalogu przy tej samej historii i filtrach', async (context) => {
  const catalogue = [movie(3, 35), movie(4, 28), movie(5, 99)];
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: catalogue.map((film) => ({ id: film.id, genre_ids: film.genres.map((genre) => genre.id) })) });
    if (url.pathname.endsWith('/recommendations')) return Response.json({ results: [] });
    const film = catalogue.find(({ id }) => id === Number(url.pathname.split('/').at(-1)));
    assert.ok(film);
    return Response.json(film);
  });
  const preferences = { providerIds: [8], genreIds: [], yearFrom: 2010, yearTo: 2010, maxRuntime: 100 };
  const actionLiked = [watched(1, 5, 28), watched(2, 0.5, 35)];
  const comedyLiked = [watched(1, 0.5, 28), watched(2, 5, 35)];
  const neutral = [watched(1, 2.5, 28), watched(2, 2.5, 35)];
  const first = await getRecommendations(preferences, undefined, actionLiked);
  const reversed = await getRecommendations(preferences, undefined, comedyLiked);
  const unchanged = await getRecommendations(preferences, undefined, neutral);
  assert.deepEqual(first.map(({ id }) => id), [4, 5, 3]);
  assert.deepEqual(reversed.map(({ id }) => id), [3, 5, 4]);
  assert.deepEqual(unchanged.map(({ id }) => id), [3, 4, 5]);
  assert.deepEqual([...first.map(({ id }) => id)].sort(), [...reversed.map(({ id }) => id)].sort());
  assert.ok([...first, ...reversed, ...unchanged].every((film) => matchesPreferences(film, preferences)));
});

test('ocena 2,5 jest neutralna, a 3 promuje gatunek słabiej niż wyższa ocena', async (context) => {
  const catalogue = [movie(3, 35), movie(4, 28), movie(5, 99)];
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: catalogue.map((film) => ({ id: film.id, genre_ids: film.genres.map((genre) => genre.id) })) });
    if (url.pathname.endsWith('/recommendations')) return Response.json({ results: [] });
    return Response.json(catalogue.find(({ id }) => id === Number(url.pathname.split('/').at(-1))));
  });
  const preferences = { providerIds: [8], genreIds: [] };
  for (const [rating, expected] of [[2, [3, 5, 4]], [2.5, [3, 4, 5]], [3, [4, 3, 5]]] as const) {
    const result = await getRecommendations(preferences, undefined, [watched(1, rating, 28), watched(2, 2.5, 35)]);
    assert.deepEqual(result.map(({ id }) => id), expected, `Ocena ${rating}`);
  }
  const strongerComedy = await getRecommendations(preferences, undefined, [watched(1, 3, 28), watched(2, 3.5, 35)]);
  assert.deepEqual(strongerComedy.map(({ id }) => id), [3, 4, 5]);
});

test('ocena 3 włącza podobieństwo filmu, a neutralna i niska nie promują podobnych', async (context) => {
  let relatedRequests = 0;
  mockApi(context, (url) => {
    if (url.pathname.endsWith('/discover/movie')) return Response.json({ results: [{ id: 2 }, { id: 3 }] });
    if (url.pathname.endsWith('/recommendations')) { relatedRequests++; return Response.json({ results: [{ id: 3 }] }); }
    return Response.json(movie(Number(url.pathname.split('/').at(-1)), 35));
  });
  const preferences = { providerIds: [8], genreIds: [] };
  for (const rating of [0.5, 2, 2.5, 3, 3.5, 5]) {
    relatedRequests = 0;
    const result = await getRecommendations(preferences, undefined, [watched(1, rating, 28)]);
    assert.deepEqual(result.map(({ id }) => id), rating > 2.5 ? [3, 2] : [2, 3], `Ocena ${rating}`);
    assert.equal(relatedRequests, rating > 2.5 ? 1 : 0, `Ocena ${rating}`);
  }
});
