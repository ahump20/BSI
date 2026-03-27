import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { useScoresStore } from '@/stores/scoresStore';

export default function ProfileTab() {
  const favoriteTeams = useScoresStore((state) => state.favoriteTeams);
  const removeFavoriteTeam = useScoresStore((state) => state.removeFavoriteTeam);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>FAVORITE TEAMS</Text>
      {favoriteTeams.length ? (
        <View style={styles.tagsWrap}>
          {favoriteTeams.map((team) => (
            <View key={team} style={styles.tag}>
              <Text style={styles.tagText}>{team}</Text>
              <Pressable accessibilityLabel={`Remove favorite team ${team}`} onPress={() => removeFavoriteTeam(team)}>
                <Text style={styles.remove}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.body}>No favorites selected yet.</Text>
      )}
      <Text style={styles.body}>App version: 0.1.0</Text>
      <Text style={styles.footer}>Born to Blaze the Path Beaten Less</Text>
      <Text style={styles.credit}>
        Powered by <Text style={styles.creditAccent}>Blaze Sports Intel</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight, padding: 12 },
  heading: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2 },
  body: { color: colors.dust, fontFamily: fonts.cormorant, fontSize: 18, marginTop: 10 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.charcoal
  },
  tagText: { color: colors.bone, fontFamily: fonts.mono },
  remove: { color: colors.burntOrange, fontFamily: fonts.oswald, fontSize: 18, lineHeight: 18 },
  footer: { color: colors.dust, fontFamily: fonts.cormorant, fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  credit: { color: colors.bone, fontFamily: fonts.cormorant, textAlign: 'center', marginTop: 10 },
  creditAccent: { color: colors.burntOrange }
});
