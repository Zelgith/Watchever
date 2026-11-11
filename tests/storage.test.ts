import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { initializeDatabase, loadHistory, loadPreferences, savePreferences, saveRating, saveWatchedMovie } from '../src/lib/storage.ts';
import type { MovieDetails } from '../src/lib/tmdb.ts';

function connection(path: string) {
  const native = new DatabaseSync(path);
  const db = {
    execAsync: async (sql: string) => native.exec(sql),
    runAsync: async (sql: string, ...args: (string | number | null)[]) => native.prepare(sql).run(...args),
    getFirstAsync: async <T>(sql: string) => native.prepare(sql).get() as T | undefined,
    getAllAsync: async <T>(sql: string) => native.prepare(sql).all() as T[],
  } as unknown as Parameters<typeof initializeDatabase>[0];
  return { native, db };
}

test('ponowne otwarcie i inicjalizacja zachowują preferencje, ocenę i datę obejrzenia bez duplikatów', async (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'watchever-storage-'));
  const path = join(directory, 'test.db');
  let { native, db } = connection(path);
  context.after(() => { native.close(); rmSync(directory, { recursive: true }); });
  await initializeDatabase(db);
  assert.deepEqual((await loadPreferences(db)).providerIds, []);
  const preferences = { providerIds: [8, 337], genreIds: [28], yearFrom: '2000', yearTo: '', maxRuntime: '120' };
  await savePreferences(db, preferences);
  const movie: MovieDetails = { id: 7, title: 'Film „A”', poster_path: null, release_date: '', overview: null, runtime: null, genres: [{ id: 28, name: 'Akcja' }], 'watch/providers': { results: {} } };
  await saveWatchedMovie(db, movie);
  await saveRating(db, movie.id, 4);
  const before = await loadHistory(db);
  await saveWatchedMovie(db, movie);
  native.close();
  ({ native, db } = connection(path));
  await initializeDatabase(db);
  assert.deepEqual(await loadPreferences(db), preferences);
  assert.deepEqual(await loadHistory(db), before);
  assert.equal(before.length, 1);
  assert.equal(before[0].rating, 4);
  await assert.rejects(saveRating(db, movie.id, 5.5));
  await assert.rejects(saveRating(db, movie.id, 0));
  assert.equal((await loadHistory(db))[0].rating, 4);
});

test('błąd odczytu nie zamienia uszkodzonego zapisu w puste preferencje', async (context) => {
  const { native, db } = connection(':memory:');
  context.after(() => native.close());
  await initializeDatabase(db);
  await db.runAsync('INSERT INTO preferences (id, value) VALUES (1, ?)', '{broken');
  await assert.rejects(loadPreferences(db));
  assert.equal((await db.getFirstAsync<{ value: string }>('SELECT value FROM preferences'))?.value, '{broken');
});
