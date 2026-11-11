import { getMovieDetails, requestTmdb, TmdbError, WATCH_REGION } from './tmdb.ts';
import type { MovieDetails } from './tmdb.ts';
import { releaseYear, validatePreferences } from './preferences.ts';
import type { MoviePreferences } from './preferences.ts';
import type { WatchedMovie } from './storage.ts';

export type { MoviePreferences } from './preferences.ts';

const NEUTRAL_RATING = 2.5;

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
    (movie.genres ?? []).some((genre) => preferences.genreIds.includes(genre.id));

  const year = releaseYear(movie.release_date);
  const hasYear = (preferences.yearFrom === undefined || (year !== undefined && year >= preferences.yearFrom)) &&
    (preferences.yearTo === undefined || (year !== undefined && year <= preferences.yearTo));
  const hasRuntime = preferences.maxRuntime === undefined ||
    (movie.runtime !== null && Number.isFinite(movie.runtime) && movie.runtime > 0 && movie.runtime <= preferences.maxRuntime);

  return movie.adult !== true && hasSubscription && hasGenre && hasYear && hasRuntime;
}

type Candidate = { id: number; genre_ids?: number[]; release_date?: string; adult?: boolean };
type MoviePage = { results: Candidate[]; total_pages?: number };

function genreAffinities(history: readonly WatchedMovie[]): Map<number, number> {
  const totals = new Map<number, { sum: number; count: number }>();
  for (const movie of history) {
    if (movie.rating === null) continue;
    for (const id of new Set(movie.genres.map((genre) => genre.id))) {
      const previous = totals.get(id) ?? { sum: 0, count: 0 };
      totals.set(id, { sum: previous.sum + movie.rating - NEUTRAL_RATING, count: previous.count + 1 });
    }
  }
  return new Map([...totals].map(([id, { sum, count }]) => [id, sum / (count + 1)]));
}

export async function getRecommendations(
  preferences: MoviePreferences,
  signal?: AbortSignal,
  history: readonly WatchedMovie[] = [],
  excludedIds: readonly number[] = [],
): Promise<MovieDetails[]> {
  const parameters = discoveryParameters(preferences);
  const skippedIds = new Set([...history.map((movie) => movie.id), ...excludedIds]);
  const affinities = genreAffinities(history);
  const seeds = history.filter((movie) => movie.rating === null || movie.rating > NEUTRAL_RATING)
    .sort((a, b) => (b.rating ?? NEUTRAL_RATING) - (a.rating ?? NEUTRAL_RATING) || b.watchedAt.localeCompare(a.watchedAt)).slice(0, 2);
  const [firstPage, relatedPages] = await Promise.all([
    requestTmdb<MoviePage>('/discover/movie', { ...parameters, page: '1' }, signal),
    Promise.all(seeds.map(async (movie) => {
      try { return await requestTmdb<MoviePage>(`/movie/${movie.id}/recommendations`, {}, signal); }
      catch (error) {
        if (signal?.aborted) throw error;
        return { results: [] };
      }
    })),
  ]);
  const relatedBonus = new Map<number, number>();
  relatedPages.forEach((page, index) => {
    for (const candidate of page.results) {
      const rating = seeds[index].rating;
      relatedBonus.set(candidate.id, (relatedBonus.get(candidate.id) ?? 0) + (rating === null ? 0.25 : (rating - NEUTRAL_RATING) / 2));
    }
  });

  function score(id: number, genreIds: readonly number[]) {
    const affinity = genreIds.reduce((sum, genre) => sum + (affinities.get(genre) ?? 0), 0) / Math.max(1, genreIds.length);
    return affinity + (relatedBonus.get(id) ?? 0);
  }

  function couldMatch(candidate: Candidate) {
    if (candidate.adult === true) return false;
    if (preferences.genreIds.length && candidate.genre_ids && !candidate.genre_ids.some((id) => preferences.genreIds.includes(id))) return false;
    const year = releaseYear(candidate.release_date);
    if (candidate.release_date !== undefined && (
      (preferences.yearFrom !== undefined && (year === undefined || year < preferences.yearFrom)) ||
      (preferences.yearTo !== undefined && (year === undefined || year > preferences.yearTo))
    )) return false;
    return true;
  }

  const checkedIds = new Set(skippedIds);
  const movies: MovieDetails[] = [];
  const maxPages = Math.min(5, firstPage.total_pages ?? 1);
  for (let page = 1; page <= Math.max(1, maxPages) && movies.length < 20; page++) {
    const response = page === 1 ? firstPage : await requestTmdb<MoviePage>('/discover/movie', { ...parameters, page: String(page) }, signal);
    const candidates = (page === 1 ? [...response.results, ...relatedPages.flatMap((related) => related.results)] : response.results)
      .filter((candidate) => {
        if (!Number.isSafeInteger(candidate.id) || candidate.id <= 0 || checkedIds.has(candidate.id)) return false;
        checkedIds.add(candidate.id);
        return couldMatch(candidate);
      })
      .sort((a, b) => score(b.id, b.genre_ids ?? []) - score(a.id, a.genre_ids ?? []));
    for (let index = 0; index < candidates.length && movies.length < 20; index += 4) {
      const details = await Promise.all(candidates.slice(index, index + 4).map(async ({ id }) => {
        try { return await getMovieDetails(id, signal); }
        catch (error) {
          if (error instanceof TmdbError && error.status === 404) return null;
          throw error;
        }
      }));
      movies.push(...details.filter((movie): movie is MovieDetails => movie !== null && !skippedIds.has(movie.id) && matchesPreferences(movie, preferences)));
    }
  }
  return movies.sort((a, b) => score(b.id, (b.genres ?? []).map((genre) => genre.id)) - score(a.id, (a.genres ?? []).map((genre) => genre.id))).slice(0, 20);
}
