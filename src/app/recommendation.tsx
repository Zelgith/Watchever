import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { getRecommendations } from '../lib/recommendations';
import type { MovieDetails } from '../lib/tmdb';
import { theme } from '../theme';
import { Choice } from '../components/Choice';

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
  const router = useRouter();
  const { providers, genres } = useLocalSearchParams<{
    providers?: string;
    genres?: string;
  }>();
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const selectedProviderIds = selectionIds(providers);
  const currentMovie = movies[currentMovieIndex];
  
  function showNextMovie() {
    setCurrentMovieIndex((index) => index + 1);
  }

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
        if (!controller.signal.aborted) {
          setMovies(recommendations);
          setCurrentMovieIndex(0);
        }
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
        style={styles.list}
        data={currentMovie ? [currentMovie] : []}
        keyExtractor={(movie) => String(movie.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.heading}>
            <AppHeader />
          </View>
        )}
        renderItem={({ item }) => {
          const availableSelectedProviders =
            item['watch/providers']?.results?.PL?.flatrate?.filter((provider) =>
              selectedProviderIds.includes(provider.provider_id),
            ) ?? [];

          return (
            <View style={styles.movie}>
              <Text
                testID={`movie-title-${item.id}`}
                style={styles.movieTitle}
              >
                {item.title}
              </Text>
              <View style={styles.movieInfo}>
                <Text
                  testID={`movie-release-${item.id}`}
                  style={styles.message}
                >
                  {new Date(item.release_date).toLocaleDateString('pl-PL')}
                </Text>

                <Text style={styles.message}>
                  - {item.runtime} min
                </Text>
              </View>
              {item.poster_path ? (
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                  }}
                  style={styles.poster}
                  resizeMode="cover"
                  accessibilityLabel={`Plakat filmu ${item.title}`}
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <Text style={styles.message}>Brak plakatu</Text>
                </View>
              )}
              {item.overview ? (
                <Text
                  testID={`movie-overview-${item.id}`}
                  style={styles.message}
                >
                  {item.overview}
                </Text>
              ) : (
                <Text style={styles.message}>Brak opisu</Text>
              )}
              {availableSelectedProviders.length > 0 && (
                <View style={styles.options}>
                  {availableSelectedProviders.map((provider) => (
                    <Choice
                      key={provider.provider_id}
                      testID={`movie-provider-${provider.provider_id}`}
                      label={provider.provider_name}
                      imagePath={provider.logo_path}
                      selected={true}
                      onPress={() => {}}
                      readOnly
                      style={styles.provider}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wyszukiwanie filmów" />
            ) : failed ? (
              <Text style={styles.message} accessibilityRole="alert">
                Nie udało się pobrać propozycji filmów.
              </Text>
            ) : movies.length > 0 && currentMovieIndex >= movies.length ? (
              <Text style={styles.message}>
                Nie mamy więcej rekomendacji
              </Text>
            ) : (
              <Text style={styles.message}>
                Brak potwierdzonych propozycji dla tego wyboru.
              </Text>
            )}
          </View>
        )}
      />
      {currentMovie && (
        <View style={styles.actions}>
          <Pressable
            testID="change-filters-button"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
            ]}
          >
            <Text style={styles.submitText}>
              Zmień filtry
            </Text>
          </Pressable>
          <Pressable
            testID="next-movie-button"
            accessibilityRole="button"
            onPress={showNextMovie}
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
            ]}
          >
            <Text style={styles.submitText}>
              Nie interesuje mnie
            </Text>
          </Pressable>
        </View>
      )}
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
  titleGroup: { gap: theme.space.sm },
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
    alignItems: 'center',
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
  poster: {
    width: 270,
    height: 405,
    borderRadius: 10,
    marginBottom: theme.space.md,
    backgroundColor: theme.colors.rule,
  },
  posterPlaceholder: {
    width: 270,
    height: 405,
    borderRadius: 10,
    marginBottom: theme.space.md,
    backgroundColor: theme.colors.rule,
    justifyContent: 'center',
    alignItems: 'center',
  },
    movieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
  },
    options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  provider: {
    width: '100%',
    minHeight: 56,
  },
  submit: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    backgroundColor: theme.colors.button,
    borderRadius: theme.radius,
  },
  submitText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    fontWeight: '700',
    lineHeight: 24,
    color: theme.colors.buttonInk,
  },
  submitPressed: {
    backgroundColor: theme.colors.secondaryInk,
  },list: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.lg,
    width: '100%',
    maxWidth: theme.contentWidth,
    alignSelf: 'center',
    backgroundColor: theme.colors.paper,
    gap: theme.space.sm,
  },
});
