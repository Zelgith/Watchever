import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MovieDetails } from '../lib/tmdb';
import { WATCH_REGION } from '../lib/tmdb';
import { theme } from '../theme';
import { ActionButton } from './ActionButton';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

type Props = { movie: MovieDetails; providerIds: readonly number[]; onDismiss: () => void; style?: StyleProp<ViewStyle> };

export function MovieCard({ movie, providerIds, onDismiss, style }: Props) {
  const [posterFailed, setPosterFailed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const providers = movie['watch/providers'].results[WATCH_REGION]?.flatrate?.filter(
    (provider) => providerIds.includes(provider.provider_id),
  ) ?? [];
  const year = movie.release_date?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0].slice(0, 4);
  const poster = movie.poster_path && !posterFailed ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;

  return (
    <View style={[styles.movie, style]}>
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
        </View>
      </Pressable>
      <Modal visible={detailsOpen} transparent animationType="none" onRequestClose={() => setDetailsOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessible={false} focusable={false} onPress={() => setDetailsOpen(false)} />
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text testID={`movie-detail-title-${movie.id}`} accessibilityRole="header" style={styles.detailTitle}>{movie.title}</Text>
              <IconButton testID={`close-movie-${movie.id}`} icon="close" label="Zamknij szczegóły" onPress={() => setDetailsOpen(false)} />
            </View>
            <ScrollView contentContainerStyle={styles.details}>
              <View style={styles.detailSummary}>
                {poster ? <Image source={poster} style={styles.detailPoster} contentFit="cover" accessible={false} /> : null}
                <View style={styles.facts}>
                  <View style={styles.metadata}>
                    <Text style={styles.text}>{year ?? 'Rok nieznany'}</Text>
                    {movie.runtime !== null && movie.runtime > 0 ? <Text style={styles.text}>{movie.runtime} min</Text> : null}
                  </View>
                  {movie.genres.length > 0 ? <Text style={styles.caption}>{movie.genres.map((genre) => genre.name).join(', ')}</Text> : null}
                  {providers.map((provider) => (
                    <View key={provider.provider_id} style={styles.provider}>
                      {provider.logo_path ? <Image source={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} style={styles.providerLogo} accessible={false} /> : null}
                      <Text style={styles.providerName}>{provider.provider_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text testID={`movie-overview-${movie.id}`} style={styles.text}>{movie.overview?.trim() || 'Brak opisu.'}</Text>
              <ActionButton testID={`dismiss-movie-${movie.id}`} label="Nie interesuje mnie" icon="close" secondary onPress={() => {
                setDetailsOpen(false);
                onDismiss();
              }} />
            </ScrollView>
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
  title: { minHeight: 48, minWidth: 0, fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.ink },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md },
  caption: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.muted },
  logos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  providerLogo: { width: 24, height: 24 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  sheet: { width: '100%', maxWidth: theme.contentWidth, maxHeight: '90%', alignSelf: 'center', backgroundColor: theme.colors.surface },
  sheetHeader: { paddingLeft: theme.space.xl, paddingRight: theme.space.sm, paddingTop: theme.space.md, paddingBottom: theme.space.md, flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md },
  detailTitle: { flex: 1, minWidth: 0, paddingTop: theme.space.sm, fontFamily: theme.fonts.medium, fontSize: theme.text.section, lineHeight: 28, color: theme.colors.ink },
  details: { paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl, gap: theme.space.xl },
  detailSummary: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.lg },
  detailPoster: { width: 88, aspectRatio: 2 / 3, backgroundColor: theme.colors.subtle },
  facts: { flex: 1, gap: theme.space.md },
  provider: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  providerName: { flexShrink: 1, fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.secondaryInk },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 26, color: theme.colors.secondaryInk },
});
