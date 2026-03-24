import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export default function AnalyticsTab() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ANALYTICS</Text>
        <Text style={styles.subtitle}>Advanced analytics dropping soon.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight, padding: 12 },
  card: { backgroundColor: colors.charcoal, borderLeftWidth: 2, borderLeftColor: colors.burntOrange, padding: 12 },
  title: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2 },
  subtitle: { color: colors.dust, fontFamily: fonts.cormorant, marginTop: 8, fontSize: 18 }
});
