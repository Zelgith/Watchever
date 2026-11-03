import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { theme } from '../theme';

type ChoiceProps = {
  testID?: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  imagePath?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function Choice({ testID, label, selected, onPress, imagePath, style }: ChoiceProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.selected,
        pressed && styles.pressed,
        focused && styles.focused,
        style,
      ]}
    >
      {imagePath ? (
        <Image
          source={`https://image.tmdb.org/t/p/w92${imagePath}`}
          style={styles.logo}
          contentFit="contain"
          accessible={false}
        />
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.check, selected && styles.checked]}>
        {selected ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    minHeight: 48,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    borderWidth: 1,
    borderColor: theme.colors.muted,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  selected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.subtle },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  logo: { width: 28, height: 28, borderRadius: theme.radius / 2 },
  label: {
    flexShrink: 1,
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  check: {
    width: 18,
    height: 18,
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: theme.colors.muted,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  checkmark: {
    fontFamily: theme.fonts.body,
    fontSize: theme.text.caption,
    lineHeight: 17,
    color: theme.colors.buttonInk,
    fontWeight: '700',
  },
});
