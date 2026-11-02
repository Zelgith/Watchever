import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Attribution } from '../components/Attribution';
import { Choice } from '../components/Choice';
import { getGenres, getWatchProviders } from '../lib/tmdb';
import type { Genre, WatchProvider } from '../lib/tmdb';
import { theme } from '../theme';

export default function HomeScreen() {
  const [providers, setProviders] = useState<WatchProvider[] | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[] | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [genreError, setGenreError] = useState(false);
  const [disclosureFocused, setDisclosureFocused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getWatchProviders(controller.signal)
      .then(setProviders)
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    getGenres(controller.signal)
      .then(setGenres)
      .catch(() => {
        if (!controller.signal.aborted) setGenreError(true);
      });
    return () => controller.abort();
  }, []);

  function toggleProvider(id: number) {
    setSelectedProviders((selected) =>
      selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id],
    );
  }

  function toggleGenre(id: number) {
    setSelectedGenres((selected) =>
      selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id],
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Watchever</Text>
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Co dziś obejrzysz?</Text>
          <Text style={styles.description}>Znajdź film na swoich platformach.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Twoje platformy</Text>
            <Text style={styles.description}>Wybierz co najmniej jedną.</Text>
          </View>
          {providers ? (
            <>
              <View style={styles.options}>
                {(expanded ? providers : providers.slice(0, 6)).map((provider) => (
                  <Choice
                    key={provider.provider_id}
                    label={provider.provider_name}
                    imagePath={provider.logo_path}
                    selected={selectedProviders.includes(provider.provider_id)}
                    onPress={() => toggleProvider(provider.provider_id)}
                    style={styles.provider}
                  />
                ))}
              </View>
              {providers.length > 6 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setExpanded((current) => !current)}
                  onFocus={() => setDisclosureFocused(true)}
                  onBlur={() => setDisclosureFocused(false)}
                  style={({ pressed }) => [
                    styles.disclosure,
                    pressed && styles.pressed,
                    disclosureFocused && styles.focused,
                  ]}
                >
                  <Text style={styles.disclosureText}>
                    {expanded ? 'Zwiń listę platform' : `Wszystkie platformy (${providers.length})`}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : loadError ? (
            <Text style={styles.description} accessibilityRole="alert">
              Nie udało się pobrać platform.
            </Text>
          ) : (
            <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Pobieranie platform" />
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Gatunki</Text>
            <Text style={styles.description}>Film pasuje do co najmniej jednego z wybranych.</Text>
          </View>
          {genres ? (
            <View style={styles.options}>
              <Choice
                label="Dowolne"
                selected={selectedGenres.length === 0}
                onPress={() => setSelectedGenres([])}
              />
              {genres.map((genre) => (
                <Choice
                  key={genre.id}
                  label={genre.name}
                  selected={selectedGenres.includes(genre.id)}
                  onPress={() => toggleGenre(genre.id)}
                />
              ))}
            </View>
          ) : genreError ? (
            <Text style={styles.description} accessibilityRole="alert">
              Nie udało się pobrać gatunków.
            </Text>
          ) : (
            <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Pobieranie gatunków" />
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
    padding: theme.space.xl,
    gap: theme.space.xxl,
    width: '100%',
    maxWidth: theme.contentWidth,
    alignSelf: 'center',
  },
  brand: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: theme.text.section,
    fontWeight: '700',
  },
  heading: { gap: theme.space.sm },
  title: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: theme.text.heading,
    lineHeight: 34,
    fontWeight: '700',
    flexShrink: 1,
  },
  description: {
    fontFamily: theme.fonts.body,
    color: theme.colors.muted,
    fontSize: theme.text.body,
    lineHeight: 24,
  },
  section: { gap: theme.space.lg },
  sectionHeading: { gap: theme.space.xs },
  sectionTitle: {
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: theme.text.section,
    fontWeight: '700',
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  provider: { width: '48.5%', minHeight: 76 },
  disclosure: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  disclosureText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    color: theme.colors.secondaryInk,
    textDecorationLine: 'underline',
  },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
