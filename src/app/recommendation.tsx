import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Attribution } from '../components/Attribution';
import { getFirstRecommendation } from '../lib/recommendations';
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
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function findMovie() {
      try {
        const recommendation = await getFirstRecommendation(
          { providerIds: selectionIds(providers), genreIds: selectionIds(genres) },
          controller.signal,
        );
        if (!controller.signal.aborted) setMovie(recommendation);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void findMovie();
    return () => controller.abort();
  }, [providers, genres]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Watchever</Text>
        <View style={styles.result}>
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmu" />
          ) : failed ? (
            <Text style={styles.message} accessibilityRole="alert">
              Nie udało się pobrać propozycji filmu.
            </Text>
          ) : movie ? (
            <Text
              testID="recommendation-title"
              accessibilityRole="header"
              style={styles.title}
            >
              {movie.title}
            </Text>
          ) : (
            <Text style={styles.message}>Brak filmu dla tego wyboru.</Text>
          )}
        </View>
        <Attribution />
      </ScrollView>
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
    gap: theme.space.xxl,
  },
  brand: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.section,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  result: { flex: 1, justifyContent: 'center', paddingVertical: theme.space.xxl },
  title: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.title,
    fontWeight: '700',
    lineHeight: 41,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  message: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    lineHeight: 24,
    color: theme.colors.muted,
  },
});
