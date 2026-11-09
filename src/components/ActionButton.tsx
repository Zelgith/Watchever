import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../theme';
import { Icon } from './Icon';
import type { IconName } from './Icon';

type Props = {
  label: string;
  onPress: () => void;
  testID?: string;
  secondary?: boolean;
  disabled?: boolean;
  compact?: boolean;
  icon?: IconName;
};

export function ActionButton({ label, onPress, testID, secondary = false, disabled = false, compact = false, icon }: Props) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.button, secondary && styles.secondary,
        compact && styles.compact, (pressed || hovered) && !disabled && (secondary ? styles.secondaryPressed : styles.pressed),
        disabled && styles.disabled, focused && styles.focused]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel, disabled && styles.disabledLabel]}>{label}</Text>
      {icon ? <Icon name={icon} color={disabled ? theme.colors.muted : secondary ? theme.colors.ink : theme.colors.buttonInk} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56, paddingHorizontal: theme.space.xl, paddingVertical: theme.space.md,
    flexDirection: 'row', gap: theme.space.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.button, borderRadius: theme.radius,
  },
  compact: { minHeight: 48, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm },
  secondary: { backgroundColor: theme.colors.surface },
  pressed: { backgroundColor: theme.colors.buttonPressed },
  secondaryPressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  disabled: { backgroundColor: theme.colors.surface },
  label: { flexShrink: 1, fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, textAlign: 'center', color: theme.colors.buttonInk },
  secondaryLabel: { color: theme.colors.ink },
  disabledLabel: { color: theme.colors.muted },
});
