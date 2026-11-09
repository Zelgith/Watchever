import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { theme } from '../theme';
import { Icon } from './Icon';

type ChoiceProps = {
  testID?: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  imagePath?: string | null;
  style?: StyleProp<ViewStyle>;
  kind?: 'provider' | 'provider-row' | 'genre';
};

export function Choice({ testID, label, selected, onPress, imagePath, style, kind = 'genre' }: ChoiceProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const isProvider = kind !== 'genre';
  const isRow = kind === 'provider-row';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.choice,
        isProvider && styles.provider,
        isRow && styles.providerRow,
        selected && (!isProvider || isRow) && styles.selected,
        (pressed || hovered) && styles.pressed,
        focused && styles.focused,
        style,
      ]}
    >
      {isProvider ? (
        <View style={[styles.logoFrame, isRow && styles.rowLogoFrame, selected && !isRow && styles.logoSelected]}>
          {imagePath && !imageFailed ? (
            <Image source={`https://image.tmdb.org/t/p/w92${imagePath}`} style={[styles.logo, isRow && styles.rowLogo]}
              contentFit="contain" accessible={false} onError={() => setImageFailed(true)} />
          ) : <Icon name="play" size={24} color={theme.colors.muted} />}
          {selected && !isRow ? <View style={styles.logoCheck}><Icon name="check" size={16} color={theme.colors.buttonInk} /></View> : null}
        </View>
      ) : selected ? <Icon name="check" size={16} color={theme.colors.accent} /> : null}
      <Text numberOfLines={isProvider && !isRow ? 2 : undefined} style={[styles.label, isProvider && !isRow && styles.providerLabel]}>{label}</Text>
      {isRow && selected ? (
        <View style={styles.check}><Icon name="check" size={16} color={theme.colors.buttonInk} /></View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    minHeight: 44,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderWidth: 1,
    borderColor: theme.colors.transparent,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  provider: { minHeight: 112, flexDirection: 'column', backgroundColor: theme.colors.paper, borderColor: theme.colors.transparent, paddingHorizontal: 0, paddingVertical: theme.space.xs },
  providerRow: { minHeight: 64, flexDirection: 'row', paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm, borderBottomColor: theme.colors.rule, gap: theme.space.md },
  selected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.selection },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  logoFrame: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.transparent },
  logoSelected: { borderColor: theme.colors.accent },
  logo: { width: 48, height: 48 },
  rowLogoFrame: { width: 36, height: 36, borderWidth: 0 },
  rowLogo: { width: 32, height: 32 },
  logoCheck: { position: 'absolute', bottom: -theme.space.xxs, right: -theme.space.xxs, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent },
  label: {
    flexShrink: 1,
    fontFamily: theme.fonts.body,
    fontSize: theme.text.body,
    lineHeight: 24,
    color: theme.colors.ink,
  },
  providerLabel: { fontSize: theme.text.caption, lineHeight: 20, textAlign: 'center', minHeight: 40 },
  check: {
    marginLeft: 'auto',
    width: 20, height: 20, backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
