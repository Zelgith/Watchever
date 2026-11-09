import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { ActionButton } from '../components/ActionButton';
import { Choice } from '../components/Choice';
import { getGenres, getWatchProviders } from '../lib/tmdb';
import type { Genre, WatchProvider } from '../lib/tmdb';
import { theme } from '../theme';

export default function HomeScreen() {
  const router = useRouter();
  const [providers, setProviders] = useState<WatchProvider[] | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[] | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [providerQuery, setProviderQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [genreError, setGenreError] = useState(false);
  const [disclosureFocused, setDisclosureFocused] = useState(false);
  const [submitFocused, setSubmitFocused] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const canRecommend = selectedProviders.length > 0 && providers !== null && genres !== null;
  const normalizedQuery = providerQuery.trim().toLocaleLowerCase('pl');
  const visibleProviders = providers?.filter((provider, index) =>
    expanded
      ? provider.provider_name.toLocaleLowerCase('pl').includes(normalizedQuery)
      : index < 6 || selectedProviders.includes(provider.provider_id),
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    setGenreError(false);
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
  }, [loadAttempt]);

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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <AppHeader />
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Co dziś obejrzysz?</Text>
          <Text style={styles.description}>Filmy w Twoich abonamentach w Polsce.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Twoje platformy</Text>
            <Text style={styles.description}>Wybierz co najmniej jedną.</Text>
          </View>
          {providers ? (
            <>
              {providers.length > 6 ? (
                <Pressable
                  testID="toggle-providers"
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => {
                    setExpanded((current) => !current);
                    setProviderQuery('');
                  }}
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
              {expanded ? (
                <TextInput
                  testID="provider-search"
                  accessibilityLabel="Szukaj platformy"
                  placeholder="Szukaj platformy"
                  placeholderTextColor={theme.colors.muted}
                  selectionColor={theme.colors.accent}
                  value={providerQuery}
                  onChangeText={setProviderQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={[styles.search, searchFocused && styles.focused]}
                />
              ) : null}
              <View style={styles.options}>
                {visibleProviders?.map((provider) => (
                  <Choice
                    key={provider.provider_id}
                    testID={`provider-${provider.provider_id}`}
                    label={provider.provider_name}
                    imagePath={provider.logo_path}
                    selected={selectedProviders.includes(provider.provider_id)}
                    onPress={() => toggleProvider(provider.provider_id)}
                    style={styles.provider}
                  />
                ))}
              </View>
              {visibleProviders?.length === 0 ? (
                <Text style={styles.description}>Brak platform o tej nazwie.</Text>
              ) : null}
            </>
          ) : loadError ? (
            <>
              <Text style={styles.description} accessibilityRole="alert">Nie udało się pobrać platform.</Text>
              <ActionButton testID="retry-providers" label="Spróbuj ponownie" onPress={() => setLoadAttempt((current) => current + 1)} secondary />
            </>
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
                testID="genre-any"
                label="Dowolne"
                selected={selectedGenres.length === 0}
                onPress={() => setSelectedGenres([])}
              />
              {genres.map((genre) => (
                <Choice
                  key={genre.id}
                  testID={`genre-${genre.id}`}
                  label={genre.name}
                  selected={selectedGenres.includes(genre.id)}
                  onPress={() => toggleGenre(genre.id)}
                />
              ))}
            </View>
          ) : genreError ? (
            <>
              <Text style={styles.description} accessibilityRole="alert">Nie udało się pobrać gatunków.</Text>
              <ActionButton testID="retry-genres" label="Spróbuj ponownie" onPress={() => setLoadAttempt((current) => current + 1)} secondary />
            </>
          ) : (
            <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Pobieranie gatunków" />
          )}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Pressable
          testID="find-movie"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRecommend }}
          disabled={!canRecommend}
          onPress={() => router.push({
            pathname: '/recommendation',
            params: { providers: selectedProviders.join(','), genres: selectedGenres.join(',') },
          })}
          onFocus={() => setSubmitFocused(true)}
          onBlur={() => setSubmitFocused(false)}
          style={({ pressed }) => [
            styles.submit,
            !canRecommend && styles.disabled,
            pressed && styles.submitPressed,
            submitFocused && styles.focused,
          ]}
        >
          <Text style={styles.submitText}>Znajdź filmy</Text>
        </Pressable>
      </View>
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
  provider: { width: '100%', minHeight: 56 },
  search: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.muted,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    color: theme.colors.ink,
  },
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
    lineHeight: 24,
    textAlign: 'center',
    color: theme.colors.secondaryInk,
    textDecorationLine: 'underline',
  },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  actions: {
    paddingHorizontal: theme.space.xl,
    paddingVertical: theme.space.md,
    width: '100%',
    maxWidth: theme.contentWidth,
    alignSelf: 'center',
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
  submitPressed: { backgroundColor: theme.colors.secondaryInk },
  disabled: { opacity: 0.45 },
});
