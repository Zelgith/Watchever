import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { AppHeader } from '../components/AppHeader';
import { MovieCard } from '../components/MovieCard';
import { getRecommendations } from '../lib/recommendations';
import type { MovieDetails } from '../lib/tmdb';
import { theme } from '../theme';

function selectionIds(value: string | string[] | undefined): number[] {
  if (value === undefined || value === '') return [];
  const parts = Array.isArray(value) ? value : [value];
  const ids = parts.flatMap((part) => part.split(',')).map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Nieprawidłowy wybór.');
  return ids;
}

export default function RecommendationScreen() {
  const router = useRouter();
  const list = useRef<FlatList<MovieDetails>>(null);
  const { providers, genres } = useLocalSearchParams<{ providers?: string; genres?: string }>();
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
          { providerIds: selected, genreIds: selectionIds(genres) }, controller.signal,
        );
        if (!controller.signal.aborted) {
          setMovies(recommendations);
          setLoadedCount(recommendations.length);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void findMovies();
    return () => controller.abort();
  }, [providers, genres, attempt]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        ref={list}
        testID="recommendations-list"
        data={movies}
        keyExtractor={(movie) => String(movie.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.heading}>
            <AppHeader />
            <View style={styles.titleGroup}>
              <Text accessibilityRole="header" style={styles.title}>
                Pasujące filmy{!loading && !failed ? ` (${movies.length})` : ''}
              </Text>
              <Text style={styles.message}>W Twoich abonamentach w Polsce.</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            providerIds={providerIds}
            onDismiss={() => {
              setMovies((current) => current.filter((movie) => movie.id !== item.id));
              list.current?.scrollToOffset({ offset: 0, animated: false });
            }}
          />
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" />
            ) : failed ? (
              <>
                <Text testID="recommendations-error" style={styles.message} accessibilityRole="alert">
                  Nie udało się pobrać propozycji filmów. Sprawdź połączenie i spróbuj ponownie.
                </Text>
                <ActionButton testID="retry-movies" label="Spróbuj ponownie" onPress={() => setAttempt((current) => current + 1)} secondary />
              </>
            ) : (
              <Text testID="recommendations-empty" style={styles.message}>
                {loadedCount > 0 ? 'Odrzucono wszystkie propozycje. Zmień filtry, aby rozpocząć nowe wyszukiwanie.' : 'Brak pasujących filmów. Spróbuj zmienić platformy lub gatunki.'}
              </Text>
            )}
          </View>
        )}
      />
      <View style={styles.actions}>
        <ActionButton
          testID="change-filters-button"
          label="Zmień filtry"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', padding: theme.space.xl },
  heading: { gap: theme.space.xxl, paddingBottom: theme.space.sm },
  titleGroup: { gap: theme.space.sm },
  empty: { gap: theme.space.lg, paddingVertical: theme.space.xxl },
  title: { fontFamily: theme.fonts.body, fontSize: theme.text.heading, fontWeight: '700', lineHeight: 34, color: theme.colors.ink, flexShrink: 1 },
  message: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.muted },
  actions: { paddingHorizontal: theme.space.xl, paddingVertical: theme.space.md, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center' },
});
