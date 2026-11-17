import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { IconButton } from './IconButton';

export function DataSources({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} focusable={false} onPress={onClose} />
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Źródła danych</Text>
            <IconButton testID="close-data-sources" icon="close" label="Zamknij źródła danych" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Image testID="tmdb-credit" source={require('../../assets/credits/tmdb-wordmark.png')}
              style={styles.logo} contentFit="contain" accessibilityLabel="TMDB" />
            <Text style={styles.text}>Dane filmów i plakaty: TMDB.</Text>
            <Text style={styles.text}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Text>
            <Text style={styles.text}>Informacje o dostępności: JustWatch.</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  sheet: { width: '100%', maxWidth: theme.contentWidth, maxHeight: '85%', alignSelf: 'center', backgroundColor: theme.colors.surface },
  header: { paddingLeft: theme.space.xl, paddingRight: theme.space.sm, paddingVertical: theme.space.md, flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  title: { flex: 1, minWidth: 0, fontFamily: theme.fonts.medium, fontSize: theme.text.section, lineHeight: 28, color: theme.colors.ink },
  content: { paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl, gap: theme.space.lg },
  logo: { width: 140, height: 20 },
  text: { fontFamily: theme.fonts.body, fontSize: theme.text.body, lineHeight: 24, color: theme.colors.secondaryInk },
});
