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
      <Text style={styles.label}>Twoja ocena{value === null ? '' : ` ${value.toLocaleString('pl-PL')}/5`}</Text>
      <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Twoja ocena">
        {[1, 2, 3, 4, 5].map((rating) => (
          <View key={rating} style={styles.star}>
            <View pointerEvents="none" style={styles.starGraphic}>
              <Icon name="star" size={24} color={theme.colors.muted} />
              {value !== null && value > rating - 1 ? (
                <View style={[styles.fill, { width: value >= rating ? 24 : 12 }]}>
                  <Icon name="star" size={24} color={theme.colors.accent} filled />
                </View>
              ) : null}
            </View>
            {[rating - 0.5, rating].map((choice) => (
              <Pressable key={choice} testID={`rate-${choice}`} accessibilityRole="radio"
                accessibilityLabel={`Ocena ${choice.toLocaleString('pl-PL')} z 5`}
                accessibilityState={{ checked: value === choice, disabled: busy || disabled }}
                disabled={busy || disabled} onPress={() => void change(choice)}
                onFocus={() => setFocused(choice)} onBlur={() => setFocused(null)}
                style={({ pressed }) => [styles.half, pressed && styles.pressed, focused === choice && styles.focused]} />
            ))}
          </View>
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
  star: { width: 48, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  starGraphic: { position: 'absolute', left: 12, top: 12, width: 24, height: 24 },
  fill: { position: 'absolute', top: 0, left: 0, height: 24, overflow: 'hidden' },
  half: { width: 24, height: 48 },
  pressed: { backgroundColor: theme.colors.selection },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
});
