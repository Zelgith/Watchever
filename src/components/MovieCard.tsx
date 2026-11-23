import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MovieDetails } from '../lib/tmdb';
import { WATCH_REGION } from '../lib/tmdb';
import { releaseYear } from '../lib/preferences';
import { theme } from '../theme';
import { ActionButton } from './ActionButton';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { RatingInput } from './RatingInput';
import { useAppData } from '../state/AppData';

type Props = { movie: MovieDetails; providerIds: readonly number[]; onDismiss: () => void; style?: StyleProp<ViewStyle>; showProviders?: boolean; showDismiss?: boolean; detailsOnly?: boolean; initiallyOpen?: boolean; notice?: string; onClose?: () => void };

export function MovieCard({ movie, providerIds, onDismiss, style, showProviders = true, showDismiss = true, detailsOnly = false, initiallyOpen = false, notice, onClose }: Props) {
  const { history, markWatched, rateMovie, removeFromHistory } = useAppData();
  const watched = history.find((entry) => entry.id === movie.id);
  const [posterFailed, setPosterFailed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(initiallyOpen);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);
  const pending = useRef(false);
  const providers = movie['watch/providers']?.results?.[WATCH_REGION]?.flatrate?.filter(
    (provider) => providerIds.includes(provider.provider_id),
  ) ?? [];
  const genres = movie.genres ?? [];
  const year = releaseYear(movie.release_date);
  const rating = movie.vote_count && movie.vote_count > 0 && movie.vote_average !== null &&
    movie.vote_average !== undefined && Number.isFinite(movie.vote_average) && movie.vote_average >= 0 && movie.vote_average <= 10
    ? movie.vote_average.toLocaleString('pl-PL', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : null;
  const poster = movie.poster_path && !posterFailed ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;

  useEffect(() => {
    if (watched && !detailsOpen) onDismiss();
  }, [watched, detailsOpen, onDismiss]);

  function closeDetails() {
    setDetailsOpen(false);
    onClose?.();
  }

  async function watch() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setSaveError(false);
    try { await markWatched(movie); }
    catch { setSaveError(true); }
    finally { pending.current = false; setSaving(false); }
  }

  async function unwatch() {
    if (pending.current) return;
    pending.current = true;
    setRemoving(true);
    setRemoveError(false);

    try {
      await removeFromHistory(movie.id);
      if (detailsOnly) closeDetails();
    } catch {
      setRemoveError(true);
    } finally {
      pending.current = false;
      setRemoving(false);
    }
  }

  return (
    <View style={[styles.movie, style]}>
      {!detailsOnly ? (
        <Pressable
          testID={`open-movie-${movie.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${movie.title}, ${year ?? 'rok nieznany'}`}
          accessibilityHint="Otwiera szczegóły filmu"
          onPress={() => setDetailsOpen(true)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={({ pressed }) => [styles.open, (pressed || hovered) && styles.pressed, focused && styles.focused]}
        >
          {poster ? (
            <Image testID={`movie-poster-${movie.id}`} source={poster} style={styles.poster}
              contentFit="cover" accessible={false} onError={() => setPosterFailed(true)} />
          ) : (
            <View style={[styles.poster, styles.placeholder]}>
              <Icon name="play" size={24} color={theme.colors.muted} />
              <Text style={styles.caption}>Brak plakatu</Text>
            </View>
          )}
          <View style={styles.summary}>
            <Text testID={`movie-title-${movie.id}`} numberOfLines={2} style={styles.title}>{movie.title}</Text>
            <View style={styles.metadata}>
              <Text testID={`movie-release-${movie.id}`} style={styles.caption}>{year ?? 'Rok nieznany'}</Text>
              {movie.runtime !== null && movie.runtime > 0 ? <Text style={styles.caption}>{movie.runtime} min</Text> : null}
            </View>
            {showProviders ? (
              <View style={styles.logos}>
                {providers.map((provider) => (
                  <View key={provider.provider_id} testID={`movie-provider-${movie.id}-${provider.provider_id}`}>
                    {provider.logo_path ? (
                      <Image source={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} style={styles.providerLogo}
                      accessibilityLabel={provider.provider_name} contentFit="contain" />
                    ) : <Text style={styles.caption}>{provider.provider_name}</Text>}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Pressable>
      ) : null}
      <Modal visible={detailsOpen} transparent animationType="none" onRequestClose={closeDetails}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessible={false} focusable={false} onPress={closeDetails} />
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text testID={`movie-detail-title-${movie.id}`} accessibilityRole="header" style={styles.detailTitle}>{movie.title}</Text>
              <IconButton testID={`close-movie-${movie.id}`} icon="close" label="Zamknij szczegóły" onPress={closeDetails} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.details}>
              <View style={styles.detailSummary}>
                {poster ? <Image source={poster} style={styles.detailPoster} contentFit="cover" accessible={false} /> : null}
                <View style={styles.facts}>
                  <View style={styles.metadata}>
                    <Text style={styles.text}>{year ?? 'Rok nieznany'}</Text>
                    {notice === undefined ? <Text testID={`movie-runtime-${movie.id}`} style={styles.text}>{movie.runtime !== null && movie.runtime > 0 ? `${movie.runtime} min` : 'Czas nieznany'}</Text> : null}
                  </View>
                  <Text style={styles.caption}>{genres.length > 0 ? genres.map((genre) => genre.name).join(', ') : 'Gatunek nieznany'}</Text>
                  {notice === undefined ? <Text testID={`movie-rating-${movie.id}`} style={styles.caption}>{rating ? `TMDB ${rating}/10` : 'Brak ocen TMDB'}</Text> : null}
                  {showProviders ? providers.map((provider) => (
                    <View key={provider.provider_id} style={styles.provider}>
                      {provider.logo_path ? <Image source={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} style={styles.providerLogo} accessible={false} /> : null}
                      <Text style={styles.providerName}>{provider.provider_name}</Text>
                    </View>
                  )) : null}
                </View>
              </View>
              {notice === undefined ? <Text testID={`movie-overview-${movie.id}`} style={styles.text}>{movie.overview?.trim() || 'Brak opisu.'}</Text> :
                <Text testID={`movie-notice-${movie.id}`} style={styles.caption}>{notice}</Text>}
            </ScrollView>
            <View style={styles.footer}>
              {watched ? (
                <View style={styles.watched}>
                  <View style={styles.provider}>
                    <Icon name="check" color={theme.colors.accent} />
                    <Text style={styles.text}>Obejrzane</Text>
                  </View>
                  <RatingInput
                    value={watched.rating}
                    onChange={(rating) => rateMovie(movie.id, rating)}
                    disabled={removing}
                  />
                  <ActionButton
                    testID={`unwatch-movie-${movie.id}`}
                    label="Cofnij oznaczenie jako obejrzane"
                    icon="close"
                    secondary
                    disabled={removing}
                    onPress={() => void unwatch()}
                  />
                </View>
              ) : (
                <View collapsable={false} style={styles.actions}>
                  <ActionButton testID={`watch-movie-${movie.id}`} label="Obejrzane" icon="check" disabled={saving} onPress={() => void watch()} />
                  {showDismiss ? (
                    <ActionButton testID={`dismiss-movie-${movie.id}`} label="Nie interesuje mnie" icon="close" secondary disabled={saving} onPress={onDismiss} />
                  ) : null}
                </View>
              )}
              {saveError ? <Text style={styles.text} accessibilityRole="alert">Nie udało się zapisać filmu w historii.</Text> : null}
              {removeError ? <Text style={styles.text} accessibilityRole="alert">Nie udało się cofnąć oznaczenia filmu jako obejrzanego.</Text> : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  movie: { minWidth: 0 },
  open: { gap: theme.space.md, paddingBottom: theme.space.xl },
  pressed: { backgroundColor: theme.colors.surface },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  poster: { width: '100%', aspectRatio: 2 / 3, backgroundColor: theme.colors.surface },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: theme.space.md },
  summary: { gap: theme.space.sm },
  title: { minWidth: 0, fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.ink },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md },
  caption: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.muted },
  logos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  providerLogo: { width: 24, height: 24 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  sheet: { width: '100%', maxWidth: theme.contentWidth, maxHeight: '90%', alignSelf: 'center', backgroundColor: theme.colors.surface },
  sheetHeader: { paddingLeft: theme.space.xl, paddingRight: theme.space.sm, paddingTop: theme.space.md, paddingBottom: theme.space.md, flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md },
  detailTitle: { flex: 1, minWidth: 0, paddingTop: theme.space.sm, fontFamily: theme.fonts.medium, fontSize: theme.text.section, lineHeight: 28, color: theme.colors.ink },
  scroll: { flexShrink: 1 },
  details: { paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl, gap: theme.space.xl },
  detailSummary: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.lg },
  detailPoster: { width: 88, aspectRatio: 2 / 3, backgroundColor: theme.colors.subtle },
  facts: { flex: 1, gap: theme.space.md },
  footer: { paddingHorizontal: theme.space.xl, paddingTop: theme.space.lg, paddingBottom: theme.space.lg, gap: theme.space.md, borderTopWidth: 1, borderTopColor: theme.colors.rule },
  watched: { gap: theme.space.md },
  actions: { gap: theme.space.sm },
  provider: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  providerName: { flexShrink: 1, fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.secondaryInk },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 26, color: theme.colors.secondaryInk },
});
