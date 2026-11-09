import assert from 'node:assert/strict';
import test from 'node:test';
import type { TestContext } from 'node:test';

import { requestTmdb } from '../src/lib/tmdb.ts';

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

test('błąd serwera nie jest traktowany jak poprawna odpowiedź TMDB', async (context) => {
  configureToken(context);
  context.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  await assert.rejects(requestTmdb('/genre/movie/list'), /Nie udało się pobrać danych/);
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
  const result = assert.rejects(requestTmdb('/genre/movie/list'), { name: 'AbortError' });
  context.mock.timers.tick(20_000);
  await result;
});
