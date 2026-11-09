import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MovieDetails } from '../lib/tmdb';
import { WATCH_REGION } from '../lib/tmdb';
import { theme } from '../theme';
import { ActionButton } from './ActionButton';

type Props = { movie: MovieDetails; providerIds: readonly number[]; onDismiss: () => void };

export function MovieCard({ movie, providerIds, onDismiss }: Props) {
  const [posterFailed, setPosterFailed] = useState(false);
  const providers = movie['watch/providers'].results[WATCH_REGION]?.flatrate?.filter(
    (provider) => providerIds.includes(provider.provider_id),
  ) ?? [];
  const year = movie.release_date?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0].slice(0, 4);

  return (
    <View style={styles.movie}>
      <Text testID={`movie-title-${movie.id}`} accessibilityRole="header" style={styles.title}>{movie.title}</Text>
      <View style={styles.metadata}>
        <Text testID={`movie-release-${movie.id}`} style={styles.text}>{year ?? 'Rok nieznany'}</Text>
        {movie.runtime !== null && movie.runtime > 0 ? <Text style={styles.text}>{movie.runtime} min</Text> : null}
      </View>
      {movie.poster_path && !posterFailed ? (
        <Image
          testID={`movie-poster-${movie.id}`}
          source={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          style={styles.poster}
          contentFit="contain"
          accessibilityLabel={`Plakat filmu ${movie.title}`}
          onError={() => setPosterFailed(true)}
        />
      ) : (
        <View style={[styles.poster, styles.placeholder]}><Text style={styles.text}>Brak plakatu</Text></View>
      )}
      <Text testID={`movie-overview-${movie.id}`} style={styles.text}>{movie.overview?.trim() || 'Brak opisu.'}</Text>
      <View style={styles.providers}>
        <Text style={styles.text}>W abonamencie:</Text>
        {providers.map((provider) => (
          <View key={provider.provider_id} testID={`movie-provider-${movie.id}-${provider.provider_id}`} style={styles.provider}>
            {provider.logo_path ? <Image source={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} style={styles.providerLogo} accessible={false} /> : null}
            <Text style={[styles.text, styles.providerName]}>{provider.provider_name}</Text>
          </View>
        ))}
      </View>
      <ActionButton testID={`dismiss-movie-${movie.id}`} label="Nie interesuje mnie" onPress={onDismiss} secondary />
    </View>
  );
}

const styles = StyleSheet.create({
  movie: { gap: theme.space.md, paddingVertical: theme.space.xl, borderBottomWidth: 1, borderBottomColor: theme.colors.rule },
  title: { fontFamily: theme.fonts.body, fontSize: theme.text.section, lineHeight: 27, fontWeight: '700', color: theme.colors.ink },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
  poster: { width: '100%', maxWidth: 270, aspectRatio: 2 / 3, alignSelf: 'center', borderRadius: theme.radius, backgroundColor: theme.colors.subtle },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  providers: { gap: theme.space.sm },
  provider: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  providerLogo: { width: 28, height: 28, borderRadius: theme.radius / 2 },
  providerName: { flexShrink: 1 },
});
