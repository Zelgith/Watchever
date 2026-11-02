import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export function Attribution() {
  return (
    <View style={styles.credits} accessibilityLabel="Źródła danych">
      <Image
        source={require('../../assets/tmdb.svg')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="TMDB"
      />
      <Text style={styles.text}>Dostępność filmów: JustWatch.</Text>
      <Text style={styles.text}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  credits: { gap: theme.space.sm, paddingVertical: theme.space.lg },
  logo: { width: 80, height: 12 },
  text: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.caption,
    lineHeight: 19,
    color: theme.colors.muted,
  },
});
