export type Genre = {
  id: number;
  name: string;
};

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  display_priorities?: Record<string, number>;
};

export type RegionalAvailability = {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type MovieDetails = {
  id: number;
  adult?: boolean;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string | null;
  runtime: number | null;
  vote_average?: number | null;
  vote_count?: number;
  genres: Genre[];
  'watch/providers': {
    results: Record<string, RegionalAvailability>;
  };
};

export type MovieSummary = Pick<MovieDetails, 'id' | 'title' | 'poster_path' | 'release_date'>;
export type MovieSearchPage = { results: MovieSummary[]; total_pages: number };

export const WATCH_REGION = 'PL';

export class TmdbError extends Error {
  readonly status: number | null;
  constructor(status: number | null, message?: string) {
    super(message ?? (status === 401 || status === 403 ? 'Brak dostępu do bazy filmów.' :
      status === 429 ? 'Zbyt wiele zapytań. Odczekaj chwilę i spróbuj ponownie.' :
        'Nie udało się pobrać danych z bazy filmów. Spróbuj ponownie.'));
    this.name = 'TmdbError';
    this.status = status;
  }
}

export function tmdbErrorMessage(error: unknown, fallback: string): string {
  return error instanceof TmdbError ? error.message : fallback;
}

export async function requestTmdb<T>(
  path: string,
  parameters: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<T> {
  signal?.throwIfAborted();
  const token = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new TmdbError(null, 'Brak dostępu do bazy filmów.');
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('language', 'pl-PL');
  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, value);
  }

  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20_000);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    controller.signal.throwIfAborted();
    if (!response.ok) throw new TmdbError(response.status);
    const data = await response.json() as T;
    controller.signal.throwIfAborted();
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new TmdbError(null, 'Przekroczono czas oczekiwania. Spróbuj ponownie.');
    if (error instanceof TypeError) throw new TmdbError(null, 'Sprawdź połączenie z internetem i spróbuj ponownie.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function getWatchProviders(signal?: AbortSignal): Promise<WatchProvider[]> {
  const response = await requestTmdb<{ results: WatchProvider[] }>(
    '/watch/providers/movie',
    { watch_region: WATCH_REGION },
    signal,
  );

  return response.results.sort(
    (first, second) =>
      (first.display_priorities?.[WATCH_REGION] ?? first.display_priority) -
      (second.display_priorities?.[WATCH_REGION] ?? second.display_priority),
  );
}

export async function getGenres(signal?: AbortSignal): Promise<Genre[]> {
  const response = await requestTmdb<{ genres: Genre[] }>('/genre/movie/list', {}, signal);
  return response.genres.sort((first, second) => first.name.localeCompare(second.name, 'pl'));
}

export function getMovieDetails(movieId: number, signal?: AbortSignal): Promise<MovieDetails> {
  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    throw new Error('Nieprawidłowy identyfikator filmu.');
  }

  return requestTmdb<MovieDetails>(
    `/movie/${movieId}`,
    { append_to_response: 'watch/providers' },
    signal,
  );
}

export async function searchMovies(query: string, page = 1, signal?: AbortSignal): Promise<MovieSearchPage> {
  const title = query.trim();
  if (!title) return { results: [], total_pages: 0 };
  if (!Number.isInteger(page) || page < 1 || page > 500) throw new Error('Nieprawidłowa strona wyszukiwania.');
  return requestTmdb<MovieSearchPage>('/search/movie', { query: title, include_adult: 'false', page: String(page) }, signal);
}
