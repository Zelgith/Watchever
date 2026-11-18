import assert from 'node:assert/strict';
import test from 'node:test';
import type { TestContext } from 'node:test';

import { requestTmdb, TmdbError } from '../src/lib/tmdb.ts';

function configureToken(context: TestContext) {
  const previous = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
  process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = 'unit-test-token';
  context.after(() => {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
    else process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN = previous;
  });
}

function waitForAbort(context: TestContext) {
  context.mock.method(globalThis, 'fetch', (_input: Parameters<typeof fetch>[0], init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Przerwano', 'AbortError')), { once: true });
    }),
  );
}

test('autoryzacja, limit i błąd serwera mają osobne komunikaty bez automatycznego ponawiania', async (context) => {
  configureToken(context);
  let status = 401;
  const fetch = context.mock.method(globalThis, 'fetch', async () => new Response('', { status }));
  for (const [code, message] of [[401, /Brak dostępu/], [403, /Brak dostępu/], [429, /Zbyt wiele zapytań/], [503, /Nie udało się pobrać danych/]] as const) {
    status = code;
    await assert.rejects(requestTmdb('/genre/movie/list'), (error: unknown) => {
      assert.ok(error instanceof TmdbError);
      assert.equal(error.status, code);
      assert.match(error.message, message);
      return true;
    });
  }
  assert.equal(fetch.mock.callCount(), 4);
});

test('wyjście z ekranu może przerwać oczekujące zapytanie', async (context) => {
  configureToken(context);
  waitForAbort(context);
  const controller = new AbortController();
  const pending = requestTmdb('/genre/movie/list', {}, controller.signal);
  const result = assert.rejects(pending, { name: 'AbortError' });
  controller.abort();
  await result;
});

test('brak odpowiedzi kończy oczekiwanie po 20 sekundach', async (context) => {
  configureToken(context);
  context.mock.timers.enable({ apis: ['setTimeout'] });
  waitForAbort(context);
  const result = assert.rejects(requestTmdb('/genre/movie/list'), /Przekroczono czas oczekiwania/);
  context.mock.timers.tick(20_000);
  await result;
});

test('brak internetu daje komunikat o połączeniu', async (context) => {
  configureToken(context);
  context.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network request failed'); });
  await assert.rejects(requestTmdb('/genre/movie/list'), /Sprawdź połączenie z internetem/);
});

test('błąd fetch z Expo również daje komunikat o połączeniu', async (context) => {
  configureToken(context);
  class FetchError extends Error {}
  context.mock.method(globalThis, 'fetch', async () => { throw new FetchError('fetch failed: Connection reset'); });
  await assert.rejects(requestTmdb('/genre/movie/list'), (error: unknown) => {
    assert.ok(error instanceof TmdbError);
    assert.match(error.message, /Sprawdź połączenie z internetem/);
    return true;
  });
});

test('błąd odczytu odpowiedzi nie jest przedstawiany jako brak połączenia', async (context) => {
  configureToken(context);
  const failure = new TypeError('Nie można odczytać odpowiedzi');
  const response = Response.json({});
  context.mock.method(response, 'json', async () => { throw failure; });
  context.mock.method(globalThis, 'fetch', async () => response);
  await assert.rejects(requestTmdb('/genre/movie/list'), (error: unknown) => error === failure);
});

test('anulowane wyszukiwanie nie rozpoczyna kolejnych zapytań', async (context) => {
  configureToken(context);
  const fetch = context.mock.method(globalThis, 'fetch', async () => Response.json({ results: [] }));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(requestTmdb('/genre/movie/list', {}, controller.signal), { name: 'AbortError' });
  assert.equal(fetch.mock.callCount(), 0);
});

test('odpowiedź otrzymana po przekroczeniu czasu nie staje się poprawnym wynikiem', async (context) => {
  configureToken(context);
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let complete!: () => void;
  context.mock.method(globalThis, 'fetch', () => new Promise<Response>((resolve) => {
    complete = () => resolve(Response.json({ results: [] }));
  }));
  const result = assert.rejects(requestTmdb('/genre/movie/list'), /Przekroczono czas oczekiwania/);
  context.mock.timers.tick(20_000);
  complete();
  await result;
});
