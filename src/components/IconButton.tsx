import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export function IconButton({ icon, label, onPress, testID, overlay = false, disabled = false, loading = false }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  testID?: string;
  overlay?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.button, overlay && styles.overlay,
        (pressed || hovered) && styles.pressed, focused && styles.focused]}
    >
      {loading ? <ActivityIndicator color={theme.colors.accent} /> : <Icon name={icon} color={disabled ? theme.colors.muted : theme.colors.ink} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  overlay: { backgroundColor: theme.colors.overlay },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
