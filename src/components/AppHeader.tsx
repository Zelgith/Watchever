import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { theme } from '../theme';
import { IconButton } from './IconButton';

export function AppHeader() {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>Watchever</Text>
      <IconButton testID="open-history" icon="history" label="Historia oglądania" onPress={() => router.push('/history')} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: theme.space.sm, paddingBottom: theme.space.xs, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  brand: {
    minWidth: 0,
    flex: 1,
    flexShrink: 1,
    fontFamily: theme.fonts.display,
    fontSize: theme.text.wordmark,
    lineHeight: 52,
    color: theme.colors.ink,
    textTransform: 'uppercase',
  },
});
