import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  testID?: string;
  secondary?: boolean;
};

export function ActionButton({ label, onPress, testID, secondary = false }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.button, secondary && styles.secondary,
        pressed && (secondary ? styles.secondaryPressed : styles.pressed), focused && styles.focused]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52, paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.button, borderRadius: theme.radius,
  },
  secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.muted, borderWidth: 1 },
  pressed: { backgroundColor: theme.colors.secondaryInk },
  secondaryPressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  label: { fontFamily: theme.fonts.body, fontSize: theme.text.body, fontWeight: '700', lineHeight: 24, textAlign: 'center', color: theme.colors.buttonInk },
  secondaryLabel: { color: theme.colors.ink },
});
