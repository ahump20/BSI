import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { colors, fonts } from '@/constants/theme';
import { useScoresStore } from '@/stores/scoresStore';

export default function ProfileTab() {
  const favoriteTeams = useScoresStore((state) => state.favoriteTeams);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>FAVORITE TEAMS</Text>
      <Text style={styles.body}>{favoriteTeams.length ? favoriteTeams.join(', ') : 'No favorites selected yet.'}</Text>
      <Text style={styles.body}>App version: {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      <Text style={styles.footer}>Born to Blaze the Path Beaten Less</Text>
      <Text style={styles.credit}>Powered by <Text style={styles.creditAccent}>Blaze Sports Intel</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight, padding: 12 },
  heading: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2 },
  body: { color: colors.dust, fontFamily: fonts.cormorant, fontSize: 18, marginTop: 10 },
  footer: { color: colors.dust, fontFamily: fonts.cormorant, fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  credit: { color: colors.bone, fontFamily: fonts.cormorant, textAlign: 'center', marginTop: 10 },
  creditAccent: { color: colors.burntOrange }
});
