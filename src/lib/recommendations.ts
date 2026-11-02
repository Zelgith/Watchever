import { getMovieDetails, requestTmdb, WATCH_REGION } from './tmdb.ts';
import type { MovieDetails } from './tmdb.ts';

export type MoviePreferences = {
  providerIds: readonly number[];
  genreIds: readonly number[];
};

export function discoveryParameters(preferences: MoviePreferences): Record<string, string> {
  const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
  if (!preferences.providerIds.length || !preferences.providerIds.every(validId)) {
    throw new Error('Wybierz co najmniej jedną platformę.');
  }
  if (!preferences.genreIds.every(validId)) {
    throw new Error('Nieprawidłowy wybór gatunków.');
  }

  return {
    watch_region: WATCH_REGION,
    with_watch_monetization_types: 'flatrate',
    with_watch_providers: preferences.providerIds.join('|'),
    sort_by: 'popularity.desc',
    include_adult: 'false',
    include_video: 'false',
    ...(preferences.genreIds.length ? { with_genres: preferences.genreIds.join('|') } : {}),
  };
}

export function matchesPreferences(movie: MovieDetails, preferences: MoviePreferences): boolean {
  const subscriptions = movie['watch/providers']?.results?.[WATCH_REGION]?.flatrate ?? [];
  const hasSubscription = subscriptions.some((provider) =>
    preferences.providerIds.includes(provider.provider_id),
  );
  const hasGenre =
    preferences.genreIds.length === 0 ||
    movie.genres.some((genre) => preferences.genreIds.includes(genre.id));

  return hasSubscription && hasGenre;
}

export async function getFirstRecommendation(
  preferences: MoviePreferences,
  signal?: AbortSignal,
): Promise<MovieDetails | null> {
  const response = await requestTmdb<{ results: { id: number }[] }>(
    '/discover/movie',
    discoveryParameters(preferences),
    signal,
  );

  if (response.results.length === 0) return null;

  for (const candidate of response.results) {
    const movie = await getMovieDetails(candidate.id, signal);
    if (matchesPreferences(movie, preferences)) return movie;
  }

  throw new Error('Nie udało się potwierdzić dostępności filmu.');
}
