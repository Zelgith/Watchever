import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { theme } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="about"
          options={{
            headerShown: true,
            title: 'O aplikacji',
            headerStyle: { backgroundColor: theme.colors.paper },
            headerTintColor: theme.colors.ink,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: theme.fonts.body },
          }}
        />
      </Stack>
    </>
  );
}
