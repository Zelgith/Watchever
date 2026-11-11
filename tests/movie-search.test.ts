import assert from 'node:assert/strict';
import test from 'node:test';

import { searchMovies } from '../src/lib/tmdb.ts';

test('wyszukiwanie tytułów nie ogranicza się do wybranych platform i poprawnie koduje zapytanie', async (context) => {
  const previous = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
  process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = 'unit-test-token';
  context.after(() => {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
    else process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = previous;
  });
  context.mock.method(globalThis, 'fetch', async (input: Parameters<typeof fetch>[0]) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, '/3/search/movie');
    assert.equal(url.searchParams.get('query'), 'Piękna & Bestia');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('language'), 'pl-PL');
    assert.equal(url.searchParams.get('include_adult'), 'false');
    assert.equal(url.searchParams.has('with_watch_providers'), false);
    return Response.json({ results: [{ id: 100, title: 'Film' }], total_pages: 3 });
  });
  const result = await searchMovies('  Piękna & Bestia  ', 2);
  assert.equal(result.results[0].id, 100);
  assert.equal(result.total_pages, 3);
});

test('puste wyszukiwanie nie wysyła zapytania', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', async () => { throw new Error('Nie wysyłaj pustego zapytania'); });
  assert.deepEqual(await searchMovies('   '), { results: [], total_pages: 0 });
  assert.equal(fetch.mock.callCount(), 0);
});
