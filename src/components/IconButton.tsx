import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export function IconButton({ icon, label, onPress, testID, overlay = false }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  testID?: string;
  overlay?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.button, overlay && styles.overlay,
        (pressed || hovered) && styles.pressed, focused && styles.focused]}
    >
      <Icon name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  overlay: { backgroundColor: theme.colors.overlay },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
