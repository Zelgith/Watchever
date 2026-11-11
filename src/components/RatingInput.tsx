import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import { ActionButton } from './ActionButton';
import { Icon } from './Icon';

export function RatingInput({ value, onChange, disabled = false }: {
  value: number | null; onChange: (value: number | null) => Promise<void>; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [focused, setFocused] = useState<number | null>(null);
  async function change(rating: number | null) {
    if (busy || disabled) return;
    setBusy(true);
    setError(false);
    try { await onChange(rating); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return (
    <View style={styles.rating}>
      <Text style={styles.label}>Twoja ocena{value === null ? '' : ` ${value}/5`}</Text>
      <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Twoja ocena">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Pressable key={rating} testID={`rate-${rating}`} accessibilityRole="radio"
            accessibilityLabel={`Ocena ${rating} z 5`} accessibilityState={{ checked: value === rating, disabled: busy || disabled }}
            disabled={busy || disabled} onPress={() => void change(rating)}
            onFocus={() => setFocused(rating)} onBlur={() => setFocused(null)}
            style={({ pressed }) => [styles.star, pressed && styles.pressed, focused === rating && styles.focused]}>
            <Icon name="star" size={24} color={value !== null && rating <= value ? theme.colors.accent : theme.colors.muted}
              filled={value !== null && rating <= value} />
          </Pressable>
        ))}
      </View>
      {value !== null ? <ActionButton testID="clear-rating" label="Usuń ocenę" secondary compact disabled={busy || disabled} onPress={() => void change(null)} /> : null}
      {error ? <Text style={styles.label} accessibilityRole="alert">Nie udało się zapisać oceny.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rating: { gap: theme.space.sm },
  label: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
  stars: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  star: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
