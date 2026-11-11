export type MoviePreferences = {
  providerIds: readonly number[];
  genreIds: readonly number[];
  yearFrom?: number;
  yearTo?: number;
  maxRuntime?: number;
};

export type FilterFields = { yearFrom: string; yearTo: string; maxRuntime: string };

export function validatePreferences(preferences: MoviePreferences): void {
  const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
  if (!preferences.providerIds.length || !preferences.providerIds.every(validId)) {
    throw new Error('Wybierz platformę.');
  }
  if (!preferences.genreIds.every(validId)) throw new Error('Nieprawidłowy wybór gatunków.');
  for (const year of [preferences.yearFrom, preferences.yearTo]) {
    if (year !== undefined && (!Number.isInteger(year) || year < 1000 || year > 9999)) {
      throw new Error('Podaj czterocyfrowy rok.');
    }
  }
  if (preferences.yearFrom !== undefined && preferences.yearTo !== undefined && preferences.yearFrom > preferences.yearTo) {
    throw new Error('Rok „od” nie może być późniejszy niż rok „do”.');
  }
  if (preferences.maxRuntime !== undefined && (!Number.isSafeInteger(preferences.maxRuntime) || preferences.maxRuntime <= 0)) {
    throw new Error('Czas musi być dodatnią liczbą minut.');
  }
}

export function preferencesFromFields(
  providerIds: readonly number[], genreIds: readonly number[], fields: FilterFields,
): MoviePreferences {
  function number(value: string, message: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (!/^\d+$/.test(trimmed)) throw new Error(message);
    return Number(trimmed);
  }
  const preferences: MoviePreferences = {
    providerIds, genreIds,
    yearFrom: number(fields.yearFrom, 'Podaj czterocyfrowy rok.'),
    yearTo: number(fields.yearTo, 'Podaj czterocyfrowy rok.'),
    maxRuntime: number(fields.maxRuntime, 'Czas musi być dodatnią liczbą minut.'),
  };
  validatePreferences(preferences);
  return preferences;
}

export function releaseYear(date: string | null | undefined): number | undefined {
  return date?.match(/^\d{4}-\d{2}-\d{2}$/) ? Number(date.slice(0, 4)) : undefined;
}
