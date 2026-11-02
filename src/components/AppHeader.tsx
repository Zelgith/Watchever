import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export function AppHeader() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.header}>
      <Text style={styles.brand}>Watchever</Text>
      <Pressable
        testID="about-app"
        accessibilityRole="button"
        onPress={() => router.push('/about')}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [styles.link, pressed && styles.pressed, focused && styles.focused]}
      >
        <Text style={styles.linkText}>O aplikacji</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.lg },
  brand: {
    flexShrink: 1,
    fontFamily: theme.fonts.body,
    fontSize: theme.text.section,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  link: {
    minHeight: 48,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.md,
    justifyContent: 'center',
    borderRadius: theme.radius,
  },
  linkText: { fontFamily: theme.fonts.body, fontSize: theme.text.body, color: theme.colors.secondaryInk },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
