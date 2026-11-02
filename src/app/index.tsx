import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.brand}>Watchever</Text>
        <Text style={styles.title}>Co dziś obejrzysz?</Text>
        <Text style={styles.description}>Znajdź film na swoich platformach.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  brand: { color: '#315DEB', fontSize: 22, fontWeight: '700', marginBottom: 28 },
  title: { color: '#17243B', fontSize: 34, fontWeight: '700', marginBottom: 12 },
  description: { color: '#53637A', fontSize: 17, lineHeight: 25 },
});
