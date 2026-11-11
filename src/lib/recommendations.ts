import { getMovieDetails, requestTmdb, WATCH_REGION } from './tmdb.ts';
import type { MovieDetails } from './tmdb.ts';
import { releaseYear, validatePreferences } from './preferences.ts';
import type { MoviePreferences } from './preferences.ts';

export type { MoviePreferences } from './preferences.ts';

export function discoveryParameters(preferences: MoviePreferences): Record<string, string> {
  validatePreferences(preferences);

  return {
    watch_region: WATCH_REGION,
    with_watch_monetization_types: 'flatrate',
    with_watch_providers: preferences.providerIds.join('|'),
    sort_by: 'popularity.desc',
    include_adult: 'false',
    include_video: 'false',
    ...(preferences.genreIds.length ? { with_genres: preferences.genreIds.join('|') } : {}),
    ...(preferences.yearFrom !== undefined ? { 'primary_release_date.gte': `${preferences.yearFrom}-01-01` } : {}),
    ...(preferences.yearTo !== undefined ? { 'primary_release_date.lte': `${preferences.yearTo}-12-31` } : {}),
    ...(preferences.maxRuntime !== undefined ? { 'with_runtime.gte': '1', 'with_runtime.lte': String(preferences.maxRuntime) } : {}),
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

  const year = releaseYear(movie.release_date);
  const hasYear = (preferences.yearFrom === undefined || (year !== undefined && year >= preferences.yearFrom)) &&
    (preferences.yearTo === undefined || (year !== undefined && year <= preferences.yearTo));
  const hasRuntime = preferences.maxRuntime === undefined ||
    (movie.runtime !== null && Number.isFinite(movie.runtime) && movie.runtime > 0 && movie.runtime <= preferences.maxRuntime);

  return hasSubscription && hasGenre && hasYear && hasRuntime;
}

export async function getRecommendations(
  preferences: MoviePreferences,
  signal?: AbortSignal,
): Promise<MovieDetails[]> {
  const response = await requestTmdb<{ results: { id: number }[] }>(
    '/discover/movie',
    discoveryParameters(preferences),
    signal,
  );

  const candidateIds = [...new Set(response.results.map((candidate) => candidate.id))].slice(0, 20);
  const movies: MovieDetails[] = [];

  for (let index = 0; index < candidateIds.length; index += 4) {
    const candidates = await Promise.all(
      candidateIds.slice(index, index + 4).map((id) => getMovieDetails(id, signal)),
    );
    movies.push(...candidates.filter((movie) => matchesPreferences(movie, preferences)));
  }

  return movies;
}
