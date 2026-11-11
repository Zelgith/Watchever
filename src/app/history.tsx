import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { RatingInput } from '../components/RatingInput';
import { releaseYear } from '../lib/preferences';
import { getMovieDetails, searchMovies } from '../lib/tmdb';
import type { MovieSummary } from '../lib/tmdb';
import { useAppData } from '../state/AppData';
import { theme } from '../theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, markWatched, rateMovie, removeFromHistory } = useAppData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addError, setAddError] = useState(false);
  const addRequest = useRef<AbortController | null>(null);
  const searching = query.trim().length > 0;
  const watchedById = new Map(history.map((movie) => [movie.id, movie]));
  const selected = history.find((movie) => movie.id === selectedId);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError(false);
    const timeout = setTimeout(() => {
      searchMovies(query, page, controller.signal).then((response) => {
        if (controller.signal.aborted) return;
        setResults((current) => [...new Map([...(page === 1 ? [] : current), ...response.results].map((movie) => [movie.id, movie])).values()]);
        setTotalPages(Math.min(500, response.total_pages));
      }).catch(() => {
        if (!controller.signal.aborted) setSearchError(true);
      }).finally(() => {
        if (!controller.signal.aborted) setSearchLoading(false);
      });
    }, 350);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, page, attempt]);

  useEffect(() => () => addRequest.current?.abort(), []);

  function changeQuery(value: string) {
    setQuery(value);
    setResults([]);
    setPage(1);
    setTotalPages(0);
    setSearchLoading(value.trim().length > 0);
    setSearchError(false);
    setAddError(false);
  }

  async function add(id: number) {
    if (addRequest.current) return;
    const controller = new AbortController();
    addRequest.current = controller;
    setAddingId(id);
    setAddError(false);
    Keyboard.dismiss();
    try {
      const movie = await getMovieDetails(id, controller.signal);
      if (controller.signal.aborted) return;
      await markWatched(movie);
      if (controller.signal.aborted) return;
      changeQuery('');
      setSelectedId(id);
      setError(false);
    } catch {
      if (!controller.signal.aborted) setAddError(true);
    } finally {
      addRequest.current = null;
      setAddingId(null);
    }
  }

  async function remove(id: number) {
    if (busy) return;
    setBusy(true);
    setError(false);
    try { await removeFromHistory(id); setSelectedId(null); }
    catch { setError(true); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.toolbar}>
        <Text accessibilityRole="header" style={styles.heading}>Obejrzane</Text>
        <Text testID="history-count" style={styles.caption} accessibilityLabel={`Obejrzane filmy: ${history.length}`}>{history.length}</Text>
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
        {addError ? <Text style={styles.text} accessibilityRole="alert">Nie udało się dodać filmu. Spróbuj ponownie.</Text> : null}
      </View>
      <FlatList testID="history-list" data={searching ? results : history} keyExtractor={(movie) => String(movie.id)} contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        ListEmptyComponent={searching ? (
          searchLoading ? <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" /> :
            <Text testID="watched-search-empty" style={styles.text}>{searchError ? 'Nie udało się wyszukać filmów.' : 'Brak filmów o tym tytule.'}</Text>
        ) : <Text testID="history-empty" style={styles.text}>Brak obejrzanych filmów.</Text>}
        ListFooterComponent={searching ? (
          searchLoading && results.length > 0 ? <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" /> :
            searchError ? <ActionButton testID="retry-watched-search" label="Spróbuj ponownie" secondary onPress={() => setAttempt((current) => current + 1)} /> :
              !searchLoading && page < totalPages ? <ActionButton testID="more-watched-search" label="Więcej wyników" secondary onPress={() => setPage((current) => current + 1)} /> : undefined
        ) : undefined}
        renderItem={({ item }) => {
          const entry = watchedById.get(item.id);
          return (
          <Pressable testID={`${searching ? 'search' : 'history'}-movie-${item.id}`} accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${releaseYear(item.release_date) ?? 'rok nieznany'}${entry ? ', obejrzane' : ''}`}
            accessibilityHint={entry ? 'Zmień ocenę lub usuń film z historii' : 'Dodaj do obejrzanych'}
            accessibilityState={{ disabled: addingId !== null }} disabled={addingId !== null}
            onPress={() => { if (entry) { Keyboard.dismiss(); setSelectedId(item.id); setError(false); } else void add(item.id); }}
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
      <Modal visible={selected !== undefined} transparent animationType="none" onRequestClose={() => setSelectedId(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessible={false} focusable={false} onPress={() => setSelectedId(null)} />
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text style={styles.detailTitle}>{selected?.title}</Text>
              <IconButton testID="close-history-entry" icon="close" label="Zamknij" onPress={() => setSelectedId(null)} />
            </View>
            {selected ? <ScrollView contentContainerStyle={styles.details}>
              <RatingInput value={selected.rating} onChange={(rating) => rateMovie(selected.id, rating)} disabled={busy} />
              <ActionButton testID="remove-history-entry" label="Usuń z historii" icon="close" secondary disabled={busy} onPress={() => void remove(selected.id)} />
              {error ? <Text style={styles.text} accessibilityRole="alert">Nie udało się usunąć filmu. Spróbuj ponownie.</Text> : null}
            </ScrollView> : null}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  toolbar: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', padding: theme.space.xl, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  heading: { flex: 1, minWidth: 0, fontFamily: theme.fonts.display, fontSize: theme.text.wordmark, lineHeight: 52, color: theme.colors.ink, textTransform: 'uppercase' },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl },
  searchArea: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', paddingHorizontal: theme.space.xl, paddingBottom: theme.space.lg, gap: theme.space.md },
  searchField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, borderWidth: 1, borderColor: theme.colors.muted, paddingLeft: theme.space.md, paddingRight: theme.space.xs },
  searchInput: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: theme.space.sm, fontFamily: theme.fonts.body, fontSize: theme.text.body, color: theme.colors.ink },
  row: { minHeight: 112, paddingVertical: theme.space.lg, flexDirection: 'row', alignItems: 'center', gap: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.rule },
  pressed: { backgroundColor: theme.colors.surface },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  poster: { width: 56, aspectRatio: 2 / 3, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  summary: { flex: 1, gap: theme.space.xs },
  movieTitle: { fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.ink },
  caption: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.muted },
  score: { alignItems: 'center', gap: theme.space.xs },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  sheet: { width: '100%', maxWidth: theme.contentWidth, maxHeight: '90%', alignSelf: 'center', backgroundColor: theme.colors.surface },
  sheetHeader: { paddingLeft: theme.space.xl, paddingRight: theme.space.sm, paddingVertical: theme.space.md, flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md },
  detailTitle: { flex: 1, minWidth: 0, paddingTop: theme.space.sm, fontFamily: theme.fonts.medium, fontSize: theme.text.section, lineHeight: 28, color: theme.colors.ink },
  details: { paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl, gap: theme.space.xl },
});
