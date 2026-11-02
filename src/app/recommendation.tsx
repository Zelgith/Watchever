import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Attribution } from '../components/Attribution';
import { getRecommendations } from '../lib/recommendations';
import type { MovieDetails } from '../lib/tmdb';
import { theme } from '../theme';

function selectionIds(value: string | string[] | undefined): number[] {
  if (value === undefined || value === '') return [];
  const parts = Array.isArray(value) ? value : [value];
  const ids = parts.flatMap((part) => part.split(',')).map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('Nieprawidłowy wybór.');
  }
  return ids;
}

export default function RecommendationScreen() {
  const { providers, genres } = useLocalSearchParams<{
    providers?: string;
    genres?: string;
  }>();
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    setMovies([]);

    async function findMovies() {
      try {
        const recommendations = await getRecommendations(
          { providerIds: selectionIds(providers), genreIds: selectionIds(genres) },
          controller.signal,
        );
        if (!controller.signal.aborted) setMovies(recommendations);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void findMovies();
    return () => controller.abort();
  }, [providers, genres]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        testID="recommendations-list"
        data={movies}
        keyExtractor={(movie) => String(movie.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.heading}>
            <Text style={styles.brand}>Watchever</Text>
            <Text accessibilityRole="header" style={styles.title}>Pasujące filmy</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.movie}>
            <Text
              testID={`movie-title-${item.id}`}
              style={styles.movieTitle}
            >
              {item.title}
            </Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" />
            ) : failed ? (
              <Text style={styles.message} accessibilityRole="alert">
                Nie udało się pobrać propozycji filmów.
              </Text>
            ) : (
              <Text style={styles.message}>Brak potwierdzonych propozycji dla tego wyboru.</Text>
            )}
          </View>
        )}
        ListFooterComponent={<Attribution />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: theme.contentWidth,
    alignSelf: 'center',
    padding: theme.space.xl,
  },
  heading: { gap: theme.space.xxl, paddingBottom: theme.space.lg },
  brand: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.section,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  empty: { paddingVertical: theme.space.xxl },
  title: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.heading,
    fontWeight: '700',
    lineHeight: 34,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  movie: {
    minHeight: 64,
    paddingVertical: theme.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.rule,
    justifyContent: 'center',
  },
  movieTitle: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.section,
    lineHeight: 27,
    color: theme.colors.ink,
  },
  message: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    lineHeight: 24,
    color: theme.colors.muted,
  },
});
