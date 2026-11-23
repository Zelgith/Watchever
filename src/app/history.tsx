import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { DataSources } from '../components/DataSources';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { MovieCard } from '../components/MovieCard';
import { releaseYear } from '../lib/preferences';
import type { WatchedMovie } from '../lib/storage';
import { getMovieDetails, searchMovies, tmdbErrorMessage } from '../lib/tmdb';
import type { MovieDetails, MovieSummary } from '../lib/tmdb';
import { useAppData } from '../state/AppData';
import { theme } from '../theme';

function savedDetails(entry: WatchedMovie): MovieDetails {
  return {
    id: entry.id, title: entry.title, poster_path: entry.poster_path, release_date: entry.release_date,
    genres: entry.genres, overview: null, runtime: null, 'watch/providers': { results: {} },
  };
}

export default function HistoryScreen() {
  const router = useRouter();
  const { history, markWatched } = useAppData();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MovieDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const addRequest = useRef<AbortController | null>(null);
  const searchRequest = useRef<AbortController | null>(null);
  const searchPending = useRef(false);
  const detailsRequest = useRef<AbortController | null>(null);
  const searching = query.trim().length > 0;
  const watchedById = new Map(history.map((movie) => [movie.id, movie]));

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    searchRequest.current = controller;
    searchPending.current = true;
    setSearchLoading(true);
    setSearchError(null);
    const timeout = setTimeout(() => {
      searchMovies(query, page, controller.signal).then((response) => {
        if (controller.signal.aborted) return;
        setResults((current) => [...new Map([...(page === 1 ? [] : current), ...response.results].map((movie) => [movie.id, movie])).values()]);
        setTotalPages(Math.min(500, response.total_pages));
      }).catch((error) => {
        if (!controller.signal.aborted) setSearchError(tmdbErrorMessage(error, 'Nie udało się wyszukać filmów.'));
      }).finally(() => {
        if (!controller.signal.aborted) {
          searchPending.current = false;
          setSearchLoading(false);
        }
      });
    }, 350);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, page, attempt]);

  useEffect(() => () => { addRequest.current?.abort(); searchRequest.current?.abort(); detailsRequest.current?.abort(); }, []);

  function changeQuery(value: string) {
    searchRequest.current?.abort();
    searchPending.current = value.trim().length > 0;
    setQuery(value);
    setResults([]);
    setPage(1);
    setTotalPages(0);
    setSearchLoading(value.trim().length > 0);
    setSearchError(null);
    setAddError(null);
  }

  function searchAgain(nextPage: boolean) {
    if (searchPending.current) return;
    searchPending.current = true;
    setSearchLoading(true);
    if (nextPage) setPage((current) => current + 1);
    else setAttempt((current) => current + 1);
  }

  async function add(id: number) {
    if (addRequest.current) return;
    const controller = new AbortController();
    addRequest.current = controller;
    setAddingId(id);
    setAddError(null);
    Keyboard.dismiss();
    try {
      const movie = await getMovieDetails(id, controller.signal);
      if (controller.signal.aborted) return;
      await markWatched(movie);
      if (controller.signal.aborted) return;
      changeQuery('');
      setDetailsError(null);
      setSelected(movie);
    } catch (error) {
      if (!controller.signal.aborted) setAddError(tmdbErrorMessage(error, 'Nie udało się dodać filmu. Spróbuj ponownie.'));
    } finally {
      addRequest.current = null;
      setAddingId(null);
    }
  }

  async function openMovieDetails(entry: WatchedMovie) {
    detailsRequest.current?.abort();
    const controller = new AbortController();
    detailsRequest.current = controller;
    Keyboard.dismiss();
    setSelected(savedDetails(entry));
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const details = await getMovieDetails(entry.id, controller.signal);
      if (!controller.signal.aborted) setSelected(details);
    } catch (error) {
      if (!controller.signal.aborted) setDetailsError(tmdbErrorMessage(error, 'Nie udało się pobrać opisu filmu.'));
    } finally {
      if (detailsRequest.current === controller) {
        detailsRequest.current = null;
        setDetailsLoading(false);
      }
    }
  }

  function closeMovieDetails() {
    detailsRequest.current?.abort();
    detailsRequest.current = null;
    setDetailsLoading(false);
    setDetailsError(null);
    setSelected(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleGroup}>
          <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.heading}>Obejrzane</Text>
          <Text testID="history-count" style={styles.count} accessibilityLabel={`Obejrzane filmy: ${history.length}`}>{history.length}</Text>
        </View>
        <IconButton testID="open-data-sources" icon="info" label="Źródła danych" onPress={() => setSourcesOpen(true)} />
        <IconButton testID="history-back" icon="back" label="Wróć" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
      </View>
      <View style={styles.searchArea}>
        <View style={[styles.searchField, searchFocused && styles.focused]}>
          <Icon name="search" color={theme.colors.muted} />
          <TextInput testID="watched-search" accessibilityLabel="Znajdź film do dodania" placeholder="Znajdź film do dodania"
            placeholderTextColor={theme.colors.muted} value={query} onChangeText={changeQuery} editable={addingId === null}
            autoCorrect={false} autoCapitalize="none" returnKeyType="search" onSubmitEditing={Keyboard.dismiss}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} selectionColor={theme.colors.accent} style={styles.searchInput} />
          {query ? <IconButton testID="clear-watched-search" icon="close" label="Wyczyść wyszukiwanie" disabled={addingId !== null} onPress={() => changeQuery('')} /> : null}
        </View>
        {addError ? <Text testID="watched-add-error" style={styles.text} accessibilityRole="alert">{addError}</Text> : null}
      </View>
      <FlatList testID="history-list" data={searching ? results : history} keyExtractor={(movie) => String(movie.id)} contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        ListEmptyComponent={searching ? (
          searchLoading ? <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" /> :
            <Text testID="watched-search-empty" style={styles.text} accessibilityRole={searchError ? 'alert' : undefined}>{searchError ?? 'Brak filmów o tym tytule.'}</Text>
        ) : <Text testID="history-empty" style={styles.text}>Brak obejrzanych filmów.</Text>}
        ListFooterComponent={searching ? (
          searchLoading && results.length > 0 ? <View style={styles.footer}><ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" /></View> :
            searchError ? <View style={styles.footer}><ActionButton testID="retry-watched-search" label="Spróbuj ponownie" secondary onPress={() => searchAgain(false)} /></View> :
              !searchLoading && page < totalPages ? <View style={styles.footer}><ActionButton testID="more-watched-search" label="Więcej wyników" secondary onPress={() => searchAgain(true)} /></View> : undefined
        ) : undefined}
        renderItem={({ item }) => {
          const entry = watchedById.get(item.id);
          return (
          <Pressable testID={`${searching ? 'search' : 'history'}-movie-${item.id}`} accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${releaseYear(item.release_date) ?? 'rok nieznany'}${entry ? ', obejrzane' : ''}`}
            accessibilityHint={entry ? 'Zmień ocenę lub usuń film z historii' : 'Dodaj do obejrzanych'}
            accessibilityState={{ disabled: addingId !== null }} disabled={addingId !== null}
            onPress={() => { if (entry) void openMovieDetails(entry); else void add(item.id); }}
            onFocus={() => setFocusedId(item.id)} onBlur={() => setFocusedId(null)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed, focusedId === item.id && styles.focused]}>
            <View style={styles.poster}>
              {item.poster_path ? <Image source={`https://image.tmdb.org/t/p/w185${item.poster_path}`} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} /> : <Icon name="play" color={theme.colors.muted} />}
            </View>
            <View style={styles.summary}>
              <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.caption}>{releaseYear(item.release_date) ?? 'Rok nieznany'}</Text>
              {entry ? <Text style={styles.caption}>{searching ? 'Obejrzane' : new Date(entry.watchedAt).toLocaleDateString('pl-PL')}</Text> : null}
            </View>
            {addingId === item.id ? <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Dodawanie filmu" /> :
              entry ? <View style={styles.score}><Icon name="star" filled={entry.rating !== null} color={entry.rating !== null ? theme.colors.accent : theme.colors.muted} />
                <Text testID={`history-rating-${item.id}`} style={styles.caption}>{entry.rating === null ? '—' : `${entry.rating.toLocaleString('pl-PL')}/5`}</Text>
              </View> : <Icon name="plus" color={theme.colors.accent} />}
          </Pressable>
        ); }}
      />
      {selected ? (
        <MovieCard
          key={selected.id}
          movie={selected}
          providerIds={[]}
          onDismiss={() => {}}
          showProviders={false}
          showDismiss={false}
          detailsOnly
          initiallyOpen
          notice={detailsLoading ? 'Wczytywanie opisu…' : detailsError ?? undefined}
          onClose={closeMovieDetails}
        />
      ) : null}
      <DataSources visible={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  toolbar: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', padding: theme.space.xl, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  titleGroup: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  count: { fontFamily: theme.fonts.body, fontSize: theme.text.body, color: theme.colors.muted, fontVariant: ['tabular-nums'] },
  heading: { minWidth: 0, flexShrink: 1, fontFamily: theme.fonts.display, fontSize: theme.text.wordmark, lineHeight: 52, color: theme.colors.ink, textTransform: 'uppercase' },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl },
  searchArea: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', paddingHorizontal: theme.space.xl, paddingBottom: theme.space.lg, gap: theme.space.md },
  searchField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, borderWidth: 1, borderColor: theme.colors.muted, paddingLeft: theme.space.md, paddingRight: theme.space.xs },
  searchInput: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: theme.space.sm, fontFamily: theme.fonts.body, fontSize: theme.text.body, color: theme.colors.ink },
  row: { minHeight: 112, paddingVertical: theme.space.lg, flexDirection: 'row', alignItems: 'center', gap: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.rule },
  footer: { paddingTop: theme.space.lg },
  pressed: { backgroundColor: theme.colors.surface },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  poster: { width: 56, aspectRatio: 2 / 3, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  summary: { flex: 1, gap: theme.space.xs },
  movieTitle: { fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.ink },
  caption: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.muted },
  score: { alignItems: 'center', gap: theme.space.xs },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
});
