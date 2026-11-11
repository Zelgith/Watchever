import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { RatingInput } from '../components/RatingInput';
import { releaseYear } from '../lib/preferences';
import { useAppData } from '../state/AppData';
import { theme } from '../theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, rateMovie, removeFromHistory } = useAppData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const selected = history.find((movie) => movie.id === selectedId);

  async function remove(id: number) {
    if (busy) return;
    setBusy(true);
    setError(false);
    try { await removeFromHistory(id); setSelectedId(null); }
    catch { setError(true); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.toolbar}>
        <Text accessibilityRole="header" style={styles.heading}>Historia</Text>
        <Text testID="history-count" style={styles.caption} accessibilityLabel={`Obejrzane filmy: ${history.length}`}>{history.length}</Text>
        <IconButton testID="history-back" icon="back" label="Wróć" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
      </View>
      <FlatList testID="history-list" data={history} keyExtractor={(movie) => String(movie.id)} contentContainerStyle={styles.content}
        ListEmptyComponent={<Text testID="history-empty" style={styles.text}>Brak obejrzanych filmów.</Text>}
        renderItem={({ item }) => (
          <Pressable testID={`history-movie-${item.id}`} accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.rating === null ? 'bez oceny' : `ocena ${item.rating} z 5`}`}
            accessibilityHint="Zmień ocenę lub usuń film z historii"
            onPress={() => { setSelectedId(item.id); setError(false); }}
            onFocus={() => setFocusedId(item.id)} onBlur={() => setFocusedId(null)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed, focusedId === item.id && styles.focused]}>
            <View style={styles.poster}>
              {item.poster_path ? <Image source={`https://image.tmdb.org/t/p/w185${item.poster_path}`} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} /> : <Icon name="play" color={theme.colors.muted} />}
            </View>
            <View style={styles.summary}>
              <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.caption}>{releaseYear(item.release_date) ?? 'Rok nieznany'}</Text>
              <Text style={styles.caption}>{new Date(item.watchedAt).toLocaleDateString('pl-PL')}</Text>
            </View>
            <View style={styles.score}><Icon name="star" filled={item.rating !== null} color={item.rating !== null ? theme.colors.accent : theme.colors.muted} />
              <Text testID={`history-rating-${item.id}`} style={styles.caption}>{item.rating === null ? '—' : `${item.rating}/5`}</Text>
            </View>
          </Pressable>
        )}
      />
      <Modal visible={selected !== undefined} transparent animationType="none" onRequestClose={() => setSelectedId(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessible={false} focusable={false} onPress={() => setSelectedId(null)} />
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text style={styles.detailTitle}>{selected?.title}</Text>
              <IconButton testID="close-history-entry" icon="close" label="Zamknij" onPress={() => setSelectedId(null)} />
            </View>
            {selected ? <ScrollView contentContainerStyle={styles.details}>
              <RatingInput value={selected.rating} onChange={(rating) => rateMovie(selected.id, rating)} disabled={busy} />
              <ActionButton testID="remove-history-entry" label="Usuń z historii" icon="close" secondary disabled={busy} onPress={() => void remove(selected.id)} />
              {error ? <Text style={styles.text} accessibilityRole="alert">Nie udało się usunąć filmu. Spróbuj ponownie.</Text> : null}
            </ScrollView> : null}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  toolbar: { width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', padding: theme.space.xl, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  heading: { flex: 1, minWidth: 0, fontFamily: theme.fonts.display, fontSize: theme.text.wordmark, lineHeight: 52, color: theme.colors.ink, textTransform: 'uppercase' },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidth, alignSelf: 'center', paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl },
  row: { minHeight: 112, paddingVertical: theme.space.lg, flexDirection: 'row', alignItems: 'center', gap: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.rule },
  pressed: { backgroundColor: theme.colors.surface },
  focused: { outlineColor: theme.colors.focus, outlineWidth: 2, outlineOffset: 2 },
  poster: { width: 56, aspectRatio: 2 / 3, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  summary: { flex: 1, gap: theme.space.xs },
  movieTitle: { fontFamily: theme.fonts.medium, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.ink },
  caption: { fontFamily: theme.fonts.body, fontSize: theme.text.caption, lineHeight: 20, color: theme.colors.muted },
  score: { alignItems: 'center', gap: theme.space.xs },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  sheet: { width: '100%', maxWidth: theme.contentWidth, maxHeight: '90%', alignSelf: 'center', backgroundColor: theme.colors.surface },
  sheetHeader: { paddingLeft: theme.space.xl, paddingRight: theme.space.sm, paddingVertical: theme.space.md, flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md },
  detailTitle: { flex: 1, minWidth: 0, paddingTop: theme.space.sm, fontFamily: theme.fonts.medium, fontSize: theme.text.section, lineHeight: 28, color: theme.colors.ink },
  details: { paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl, gap: theme.space.xl },
});
