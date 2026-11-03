import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Watchever</Text>
        <Text style={styles.text}>Filmy dostępne w Twoich abonamentach w Polsce.</Text>
        <View style={styles.credits}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Źródła danych</Text>
          <Text style={styles.text}>Dostępność filmów: JustWatch.</Text>
          <Text style={styles.text}>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: {
    width: '100%',
    maxWidth: theme.contentWidth,
    alignSelf: 'center',
    padding: theme.space.xl,
    gap: theme.space.lg,
  },
  title: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.heading,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  sectionTitle: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.section,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  credits: { gap: theme.space.lg, paddingVertical: theme.space.lg },
  text: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    lineHeight: 24,
    color: theme.colors.muted,
  },
});
