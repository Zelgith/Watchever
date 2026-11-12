import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../theme';

export function FilterField({ label, value, onChangeText, testID, maxLength }: {
  label: string; value: string; onChangeText: (value: string) => void; testID: string; maxLength: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput testID={testID} accessibilityLabel={label} value={value} onChangeText={onChangeText}
        placeholder="Dowolny" placeholderTextColor={theme.colors.muted} keyboardType="number-pad" maxLength={maxLength}
        selectionColor={theme.colors.accent} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.focused]} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 0, gap: theme.space.sm },
  label: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.secondaryInk },
  input: { minHeight: 52, paddingHorizontal: theme.space.md, paddingVertical: theme.space.md,
    borderWidth: 1, borderColor: theme.colors.muted, color: theme.colors.ink,
    fontFamily: theme.fonts.body, fontSize: theme.text.body },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
