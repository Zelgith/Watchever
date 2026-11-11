import type { SQLiteDatabase } from 'expo-sqlite';

import type { FilterFields } from './preferences.ts';
import type { Genre, MovieDetails } from './tmdb.ts';

export type PreferenceDraft = FilterFields & { providerIds: number[]; genreIds: number[] };
export type WatchedMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  genres: Genre[];
  watchedAt: string;
  rating: number | null;
};

export const emptyPreferences: PreferenceDraft = {
  providerIds: [], genreIds: [], yearFrom: '', yearTo: '', maxRuntime: '',
};

type Database = Pick<SQLiteDatabase, 'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync'>;

export async function initializeDatabase(db: Database): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS preferences (id INTEGER PRIMARY KEY CHECK (id = 1), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS watched_movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      poster_path TEXT,
      release_date TEXT NOT NULL,
      genres TEXT NOT NULL,
      watched_at TEXT NOT NULL,
      rating INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5 AND rating = CAST(rating AS INTEGER)))
    );
  `);
}

export async function loadPreferences(db: Database): Promise<PreferenceDraft> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE id = 1');
  if (!row) return { ...emptyPreferences, providerIds: [], genreIds: [] };
  const value: unknown = JSON.parse(row.value);
  if (!value || typeof value !== 'object') throw new Error('Nieprawidłowy zapis ustawień.');
  const draft = value as Partial<PreferenceDraft>;
  const validIds = (ids: unknown): ids is number[] => Array.isArray(ids) && ids.every((id) => Number.isSafeInteger(id) && id > 0);
  if (!validIds(draft.providerIds) || !validIds(draft.genreIds) ||
    typeof draft.yearFrom !== 'string' || typeof draft.yearTo !== 'string' || typeof draft.maxRuntime !== 'string') {
    throw new Error('Nieprawidłowy zapis ustawień.');
  }
  return draft as PreferenceDraft;
}

export async function savePreferences(db: Database, preferences: PreferenceDraft): Promise<void> {
  await db.runAsync('INSERT INTO preferences (id, value) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value', JSON.stringify(preferences));
}

export async function loadHistory(db: Database): Promise<WatchedMovie[]> {
  const rows = await db.getAllAsync<Omit<WatchedMovie, 'genres'> & { genres: string }>(
    'SELECT id, title, poster_path, release_date, genres, watched_at AS watchedAt, rating FROM watched_movies ORDER BY watched_at DESC, id DESC',
  );
  return rows.map((row) => ({ ...row, genres: JSON.parse(row.genres) as Genre[] }));
}

export async function saveWatchedMovie(db: Database, movie: MovieDetails): Promise<void> {
  await db.runAsync(`INSERT INTO watched_movies (id, title, poster_path, release_date, genres, watched_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
  movie.id, movie.title, movie.poster_path ?? null, movie.release_date ?? '', JSON.stringify(movie.genres ?? []), new Date().toISOString());
}

export async function saveRating(db: Database, movieId: number, rating: number | null): Promise<void> {
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error('Ocena musi być liczbą od 1 do 5.');
  await db.runAsync('UPDATE watched_movies SET rating = ? WHERE id = ?', rating, movieId);
}

export async function removeWatchedMovie(db: Database, movieId: number): Promise<void> {
  await db.runAsync('DELETE FROM watched_movies WHERE id = ?', movieId);
}
