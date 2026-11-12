import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { ActionButton } from '../components/ActionButton';
import { Choice } from '../components/Choice';
import { Icon } from '../components/Icon';
import { FilterField } from '../components/FilterField';
import { preferencesFromFields } from '../lib/preferences';
import type { FilterFields } from '../lib/preferences';
import { getGenres, getWatchProviders } from '../lib/tmdb';
import type { Genre, WatchProvider } from '../lib/tmdb';
import { theme } from '../theme';
import { useAppData } from '../state/AppData';

export default function HomeScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, saveError, retrySave } = useAppData();
  const selectedProviders = preferences.providerIds;
  const selectedGenres = preferences.genreIds;
  const fields: FilterFields = preferences;
  const [providers, setProviders] = useState<WatchProvider[] | null>(null);
  const [genres, setGenres] = useState<Genre[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [providerQuery, setProviderQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [genreError, setGenreError] = useState(false);
  const [disclosureFocused, setDisclosureFocused] = useState(false);
  const [disclosureHovered, setDisclosureHovered] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [filterError, setFilterError] = useState<string | null>(null);

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
    setFilterError(null);
    updatePreferences({ providerIds: selectedProviders.includes(id)
      ? selectedProviders.filter((current) => current !== id) : [...selectedProviders, id] });
  }

  function toggleGenre(id: number) {
    updatePreferences({ genreIds: selectedGenres.includes(id)
      ? selectedGenres.filter((current) => current !== id) : [...selectedGenres, id] });
  }

  function changeField(name: keyof FilterFields, value: string) {
    updatePreferences({ [name]: value });
    setFilterError(null);
  }

  function findMovies() {
    try {
      preferencesFromFields(selectedProviders, selectedGenres, fields);
      setFilterError(null);
      Keyboard.dismiss();
      router.push({ pathname: '/recommendation', params: {
        providers: selectedProviders.join(','), genres: selectedGenres.join(','),
        yearFrom: fields.yearFrom, yearTo: fields.yearTo, maxRuntime: fields.maxRuntime,
      } });
    } catch (error) {
      setFilterError(error instanceof Error ? error.message : 'Sprawdź filtry.');
    }
  }

  const providerChoices = visibleProviders?.map((provider) => (
    <Choice
      key={provider.provider_id}
      kind={expanded ? 'provider-row' : 'provider'}
      testID={`provider-${provider.provider_id}`}
      label={provider.provider_name}
      imagePath={provider.logo_path}
      selected={selectedProviders.includes(provider.provider_id)}
      onPress={() => toggleProvider(provider.provider_id)}
      style={expanded ? styles.providerRow : styles.providerItem}
    />
  ));

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior="height">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <AppHeader />
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text nativeID="providers-heading" style={styles.sectionTitle} accessibilityRole="header">Platformy</Text>
            {providers && providers.length > 6 ? (
              <Pressable
                testID="toggle-providers"
                accessibilityRole="button"
                accessibilityLabel={expanded ? 'Zwiń platformy' : 'Wszystkie platformy'}
                accessibilityState={{ expanded }}
                onPress={() => {
                  setExpanded((current) => !current);
                  setProviderQuery('');
                }}
                onFocus={() => setDisclosureFocused(true)}
                onBlur={() => setDisclosureFocused(false)}
                onHoverIn={() => setDisclosureHovered(true)}
                onHoverOut={() => setDisclosureHovered(false)}
                style={({ pressed }) => [styles.disclosure,
                  (pressed || disclosureHovered) && styles.pressed, disclosureFocused && styles.focused]}
              >
                <Text style={styles.disclosureText}>{expanded ? 'Mniej' : 'Wszystkie'}</Text>
                <Icon name={expanded ? 'up' : 'down'} size={16} color={theme.colors.secondaryInk} />
              </Pressable>
            ) : null}
          </View>
          {providers ? (
            <>
              {expanded ? (
                <View style={[styles.searchField, searchFocused && styles.focused]}>
                  <Icon name="search" color={theme.colors.muted} />
                  <TextInput
                    testID="provider-search"
                    accessibilityLabel="Szukaj platformy"
                    accessibilityLabelledBy="providers-heading"
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
                    style={styles.search}
                  />
                </View>
              ) : null}
              {expanded ? <View style={styles.providerList}>{providerChoices}</View> : (
                <ScrollView testID="provider-rail" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerRail}>
                  {providerChoices}
                </ScrollView>
              )}
              {visibleProviders?.length === 0 ? <Text style={styles.message}>Brak platform o tej nazwie.</Text> : null}
            </>
          ) : loadError ? (
            <>
              <Text style={styles.message} accessibilityRole="alert">Nie udało się pobrać platform.</Text>
              <ActionButton testID="retry-providers" label="Spróbuj ponownie" onPress={() => setLoadAttempt((current) => current + 1)} secondary />
            </>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerRail} accessibilityRole="progressbar" accessibilityLabel="Pobieranie platform">
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.skeletonProvider}>
                  <View style={styles.skeletonLogo} />
                  <View style={styles.skeletonLabel} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Gatunki</Text>
          {genres ? (
            <View style={styles.genres}>
              <Choice testID="genre-any" label="Dowolne" selected={selectedGenres.length === 0} onPress={() => updatePreferences({ genreIds: [] })} />
              {genres.map((genre) => (
                <Choice key={genre.id} testID={`genre-${genre.id}`} label={genre.name}
                  selected={selectedGenres.includes(genre.id)} onPress={() => toggleGenre(genre.id)} />
              ))}
            </View>
          ) : genreError ? (
            <>
              <Text style={styles.message} accessibilityRole="alert">Nie udało się pobrać gatunków.</Text>
              <ActionButton testID="retry-genres" label="Spróbuj ponownie" onPress={() => setLoadAttempt((current) => current + 1)} secondary />
            </>
          ) : (
            <View style={styles.genres} accessibilityRole="progressbar" accessibilityLabel="Pobieranie gatunków">
              {[0, 1, 2, 3].map((index) => <View key={index} style={styles.skeletonGenre} />)}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Rok i czas</Text>
          <View style={styles.filterRow}>
            <FilterField testID="year-from" label="Rok od" maxLength={4} value={fields.yearFrom} onChangeText={(value) => changeField('yearFrom', value)} />
            <FilterField testID="year-to" label="Rok do" maxLength={4} value={fields.yearTo} onChangeText={(value) => changeField('yearTo', value)} />
          </View>
          <FilterField testID="max-runtime" label="Maks. czas (min)" maxLength={3} value={fields.maxRuntime} onChangeText={(value) => changeField('maxRuntime', value)} />
        </View>
      </ScrollView>
      <View style={styles.actions}>
        {saveError ? <>
          <Text accessibilityRole="alert" style={styles.message}>Nie udało się zapisać ustawień.</Text>
          <ActionButton testID="retry-save" label="Ponów zapis" secondary compact onPress={retrySave} />
        </> : null}
        {filterError ? <Text testID="filter-error" accessibilityRole="alert" style={styles.message}>{filterError}</Text> : null}
        <ActionButton
          testID="find-movie"
          label="Znajdź filmy"
          icon="arrow"
          onPress={findMovies}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', padding: theme.space.xl, gap: theme.space.xl },
  section: { gap: theme.space.lg },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.space.sm },
  sectionTitle: { flexShrink: 1, fontFamily: theme.fonts.medium, fontSize: theme.text.section, lineHeight: 28, color: theme.colors.ink },
  providerRail: { gap: theme.space.sm, paddingVertical: theme.space.xs },
  providerList: { width: '100%' },
  providerItem: { width: 88 },
  providerRow: { width: '100%' },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  filterRow: { flexDirection: 'row', gap: theme.space.md },
  message: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
  searchField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: theme.space.md, borderWidth: 1, borderColor: theme.colors.muted, paddingHorizontal: theme.space.md },
  search: { flex: 1, minWidth: 0, minHeight: 50, fontFamily: theme.fonts.body, fontSize: theme.text.body, color: theme.colors.ink, paddingVertical: theme.space.sm },
  disclosure: { minHeight: 48, flexDirection: 'row', gap: theme.space.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.space.sm },
  disclosureText: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.secondaryInk },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  actions: { paddingHorizontal: theme.space.xl, paddingTop: theme.space.md, paddingBottom: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.colors.rule, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center' },
  skeletonProvider: { width: 88, minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: theme.space.md },
  skeletonLogo: { width: 56, height: 56, backgroundColor: theme.colors.surface },
  skeletonLabel: { width: '80%', height: 12, backgroundColor: theme.colors.rule },
  skeletonGenre: { width: 96, height: 48, backgroundColor: theme.colors.surface },
});
