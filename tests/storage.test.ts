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

test('migracja starych ocen zachowuje dane i umożliwia połówki, także po ponownym otwarciu', async (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'watchever-migration-'));
  const path = join(directory, 'test.db');
  let { native, db } = connection(path);
  context.after(() => { native.close(); rmSync(directory, { recursive: true }); });
  native.exec(`CREATE TABLE preferences (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE watched_movies (id INTEGER PRIMARY KEY, title TEXT NOT NULL, poster_path TEXT,
      release_date TEXT NOT NULL, genres TEXT NOT NULL, watched_at TEXT NOT NULL,
      rating INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5 AND rating = CAST(rating AS INTEGER))));`);
  const preferences = { providerIds: [8], genreIds: [], yearFrom: '2000', yearTo: '', maxRuntime: '120' };
  await savePreferences(db, preferences);
  native.prepare('INSERT INTO watched_movies VALUES (?, ?, ?, ?, ?, ?, ?)').run(42, 'Stary film', null, '2000-01-01', '[]', '2026-11-11T12:00:00Z', 4);
  const previous = await loadHistory(db);
  await initializeDatabase(db);
  assert.deepEqual(await loadHistory(db), previous);
  assert.deepEqual(await loadPreferences(db), preferences);
  await saveRating(db, 42, 4.5);
  native.close();
  ({ native, db } = connection(path));
  await initializeDatabase(db);
  assert.equal((await loadHistory(db))[0].rating, 4.5);
  await saveRating(db, 42, 0.5);
  assert.equal((await loadHistory(db))[0].rating, 0.5);
  await assert.rejects(saveRating(db, 42, 4.25));
  await assert.rejects(db.runAsync('UPDATE watched_movies SET rating = 4.25 WHERE id = 42'));
});
