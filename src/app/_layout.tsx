import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { theme } from '../theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [theme.fonts.body]: require('../../assets/fonts/Barlow-Regular.ttf'),
    [theme.fonts.medium]: require('../../assets/fonts/Barlow-Medium.ttf'),
    [theme.fonts.display]: require('../../assets/fonts/SofiaSansExtraCondensed-Light.ttf'),
  });
  if (error) throw error;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {loaded ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.paper } }} />
      ) : <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Watchever" />}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.paper } });
