import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { IconButton } from '../components/IconButton';
import { MovieCard } from '../components/MovieCard';
import { getRecommendations } from '../lib/recommendations';
import { preferencesFromFields } from '../lib/preferences';
import type { MovieDetails } from '../lib/tmdb';
import { theme } from '../theme';
import { useAppData } from '../state/AppData';

function selectionIds(value: string | string[] | undefined): number[] {
  if (value === undefined || value === '') return [];
  const parts = Array.isArray(value) ? value : [value];
  const ids = parts.flatMap((part) => part.split(',')).map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Nieprawidłowy wybór.');
  return ids;
}

export default function RecommendationScreen() {
  const router = useRouter();
  const { history } = useAppData();
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const movieWidth = Math.floor((Math.min(width - insets.left - insets.right, theme.contentWidth) - theme.space.xl * 2 - theme.space.lg) / 2);
  const list = useRef<FlatList<MovieDetails>>(null);
  const { providers, genres, yearFrom, yearTo, maxRuntime } = useLocalSearchParams<{
    providers?: string; genres?: string; yearFrom?: string; yearTo?: string; maxRuntime?: string;
  }>();
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [providerIds, setProviderIds] = useState<number[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    setMovies([]);
    setLoadedCount(0);

    async function findMovies() {
      try {
        const selected = selectionIds(providers);
        setProviderIds(selected);
        const recommendations = await getRecommendations(
          preferencesFromFields(selected, selectionIds(genres), { yearFrom: yearFrom ?? '', yearTo: yearTo ?? '', maxRuntime: maxRuntime ?? '' }), controller.signal, historyRef.current,
        );
        if (!controller.signal.aborted) {
          const unwatched = recommendations.filter((movie) => !historyRef.current.some((entry) => entry.id === movie.id));
          setMovies(unwatched);
          setLoadedCount(unwatched.length);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void findMovies();
    return () => controller.abort();
  }, [providers, genres, yearFrom, yearTo, maxRuntime, attempt]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.titleGroup}>
          <Text accessibilityRole="header" style={styles.title}>Filmy</Text>
          {!loading && !failed ? <Text testID="movie-count" accessibilityLabel={`Liczba filmów: ${movies.length}`} style={styles.count}>{movies.length}</Text> : null}
        </View>
        <IconButton testID="change-filters-button" label="Wróć" icon="back"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
      </View>
      <FlatList
        ref={list}
        testID="recommendations-list"
        data={movies}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(movie) => String(movie.id)}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <MovieCard
            style={{ width: movieWidth }}
            movie={item}
            providerIds={providerIds}
            onDismiss={() => {
              setMovies((current) => current.filter((movie) => movie.id !== item.id));
              list.current?.scrollToOffset({ offset: 0, animated: false });
            }}
          />
        )}
        ListEmptyComponent={(
          loading ? (
            <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Wyszukiwanie filmów">
              {[0, 1].map((index) => (
                <View key={index} style={styles.skeleton}>
                  <View style={styles.skeletonPoster} />
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonMeta} />
                </View>
              ))}
            </View>
          ) : failed ? (
            <View style={styles.empty}>
              <Text testID="recommendations-error" style={styles.message} accessibilityRole="alert">Nie udało się pobrać filmów.</Text>
              <ActionButton testID="retry-movies" label="Spróbuj ponownie" onPress={() => setAttempt((current) => current + 1)} secondary />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text testID="recommendations-empty" style={styles.message}>
                {loadedCount > 0 ? 'To wszystkie propozycje. Zmień filtry, by szukać dalej.' : 'Brak filmów dla tych filtrów.'}
              </Text>
            </View>
          )
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  toolbar: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', padding: theme.space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.md },
  titleGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  title: { minWidth: 0, flexShrink: 1, fontFamily: theme.fonts.display, fontSize: theme.text.wordmark, lineHeight: 52, color: theme.colors.ink, textTransform: 'uppercase' },
  count: { fontFamily: theme.fonts.body, fontSize: theme.text.body, color: theme.colors.muted, fontVariant: ['tabular-nums'] },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl },
  row: { flexDirection: 'row', gap: theme.space.lg },
  empty: { gap: theme.space.lg, paddingTop: theme.space.xxxl },
  message: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 26, color: theme.colors.secondaryInk },
  skeleton: { flex: 1, gap: theme.space.md },
  skeletonPoster: { width: '100%', aspectRatio: 2 / 3, backgroundColor: theme.colors.surface },
  skeletonTitle: { height: 20, width: '90%', backgroundColor: theme.colors.surface },
  skeletonMeta: { height: 12, width: '55%', backgroundColor: theme.colors.surface },
});
