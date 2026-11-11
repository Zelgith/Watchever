import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { emptyPreferences, initializeDatabase, loadHistory, loadPreferences, removeWatchedMovie, savePreferences, saveRating, saveWatchedMovie } from '../lib/storage';
import type { PreferenceDraft, WatchedMovie } from '../lib/storage';
import type { MovieDetails } from '../lib/tmdb';
import { theme } from '../theme';

type AppData = {
  preferences: PreferenceDraft;
  updatePreferences: (patch: Partial<PreferenceDraft>) => void;
  saveError: boolean;
  retrySave: () => void;
  history: WatchedMovie[];
  markWatched: (movie: MovieDetails) => Promise<void>;
  rateMovie: (id: number, rating: number | null) => Promise<void>;
  removeFromHistory: (id: number) => Promise<void>;
};

const DataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [preferences, setPreferences] = useState(emptyPreferences);
  const preferencesRef = useRef(preferences);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [history, setHistory] = useState<WatchedMovie[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    async function load() {
      try {
        const database = await openDatabaseAsync('watchever.db');
        await initializeDatabase(database);
        const [savedPreferences, savedHistory] = await Promise.all([loadPreferences(database), loadHistory(database)]);
        if (!active) return;
        preferencesRef.current = savedPreferences;
        setPreferences(savedPreferences);
        setHistory(savedHistory);
        setDb(database);
      } catch {
        if (active) setLoadError(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [attempt]);

  const updatePreferences = useCallback((patch: Partial<PreferenceDraft>) => {
    if (!db) return;
    const next = { ...preferencesRef.current, ...patch };
    preferencesRef.current = next;
    setPreferences(next);
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        await savePreferences(db, next);
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    });
  }, [db]);

  if (!db) return (
    <View style={styles.status}>
      {loadError ? <>
        <Text style={styles.message} accessibilityRole="alert">Nie udało się odczytać zapisanych danych.</Text>
        <ActionButton testID="retry-storage" label="Spróbuj ponownie" onPress={() => setAttempt((current) => current + 1)} />
      </> : <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Wczytywanie ustawień" />}
    </View>
  );

  return (
    <DataContext value={{ preferences, updatePreferences, saveError, retrySave: () => updatePreferences({}), history,
      markWatched: async (movie) => {
        await saveWatchedMovie(db, movie);
        setHistory(await loadHistory(db));
      },
      rateMovie: async (id, rating) => {
        await saveRating(db, id, rating);
        setHistory((current) => current.map((movie) => movie.id === id ? { ...movie, rating } : movie));
      },
      removeFromHistory: async (id) => {
        await removeWatchedMovie(db, id);
        setHistory((current) => current.filter((movie) => movie.id !== id));
      },
    }}>{children}</DataContext>
  );
}

export function useAppData(): AppData {
  const data = useContext(DataContext);
  if (!data) throw new Error('Brak zapisanych danych.');
  return data;
}

const styles = StyleSheet.create({
  status: { flex: 1, justifyContent: 'center', padding: theme.space.xl, gap: theme.space.lg },
  message: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
});
