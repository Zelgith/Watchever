import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>Watchever</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: theme.space.sm, paddingBottom: theme.space.xs },
  brand: {
    minWidth: 0,
    flexShrink: 1,
    fontFamily: theme.fonts.display,
    fontSize: theme.text.wordmark,
    lineHeight: 52,
    color: theme.colors.ink,
    textTransform: 'uppercase',
  },
});
