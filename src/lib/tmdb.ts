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

export const WATCH_REGION = 'PL';

export async function requestTmdb<T>(
  path: string,
  parameters: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error('Brak dostępu do bazy filmów.');
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('language', 'pl-PL');
  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, value);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 20_000);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Nie udało się pobrać danych z bazy filmów.');
    return await response.json() as T;
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
