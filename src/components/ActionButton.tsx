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
  plain?: boolean;
  icon?: IconName;
};

export function ActionButton({ label, onPress, testID, secondary = false, disabled = false, compact = false, plain = false, icon }: Props) {
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
        compact && styles.compact, plain && styles.plain, (pressed || hovered) && !disabled && (secondary || plain ? styles.secondaryPressed : styles.pressed),
        disabled && !plain && styles.disabled, focused && styles.focused]}
    >
      {icon && plain ? <Icon name={icon} size={18} color={disabled ? theme.colors.muted : theme.colors.secondaryInk} /> : null}
      <Text style={[styles.label, secondary && styles.secondaryLabel, plain && styles.plainLabel, disabled && styles.disabledLabel]}>{label}</Text>
      {icon && !plain ? <Icon name={icon} color={disabled ? theme.colors.muted : secondary ? theme.colors.ink : theme.colors.buttonInk} /> : null}
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
  secondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outline },
  pressed: { backgroundColor: theme.colors.buttonPressed },
  plain: { minHeight: 48, alignSelf: 'flex-start', paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, gap: theme.space.sm, backgroundColor: theme.colors.transparent, borderWidth: 0, marginHorizontal: -theme.space.sm },
  secondaryPressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  disabled: { backgroundColor: theme.colors.surface },
  label: { flexShrink: 1, fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, textAlign: 'center', color: theme.colors.buttonInk },
  secondaryLabel: { color: theme.colors.ink },
  plainLabel: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.secondaryInk },
  disabledLabel: { color: theme.colors.muted },
});
