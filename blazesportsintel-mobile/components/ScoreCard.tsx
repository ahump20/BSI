import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Score } from '@shared/types/scores';
import { borderRadius, colors, fonts } from '@/constants/theme';

interface ScoreCardProps {
  score: Score;
}

export function ScoreCard({ score }: ScoreCardProps) {
  const homeLeading = score.homeTeam.score > score.awayTeam.score;
  const awayLeading = score.awayTeam.score > score.homeTeam.score;

  return (
    <Pressable
      accessibilityLabel={`Open game detail ${score.awayTeam.name} at ${score.homeTeam.name}`}
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: score.gameId, sport: score.sport } })}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.team}>{score.awayTeam.abbreviation || score.awayTeam.name}</Text>
        <Text style={[styles.points, awayLeading && styles.leading]}>{score.awayTeam.score}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.team}>{score.homeTeam.abbreviation || score.homeTeam.name}</Text>
        <Text style={[styles.points, homeLeading && styles.leading]}>{score.homeTeam.score}</Text>
      </View>
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      <Text style={styles.status}>
        {score.status === 'live'
          ? `● LIVE ${score.periodLabel ?? ''}`
          : score.status === 'final'
            ? 'FINAL'
            : score.startTime}
      </Text>
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
      {score.status === 'live' ? (
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={[styles.status, styles.liveText]}>LIVE {score.periodLabel ?? ''}</Text>
        </View>
      ) : (
        <Text style={styles.status}>{score.status === 'final' ? 'FINAL' : score.startTime}</Text>
      )}
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.charcoal, borderRadius: borderRadius.sm, padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  team: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2, textTransform: 'uppercase' },
  points: { color: colors.bone, fontFamily: fonts.bebas, fontSize: 32 },
  leading: { color: colors.burntOrange },
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  status: { color: colors.dust, fontFamily: fonts.mono, fontSize: 12 }
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  status: { color: colors.dust, fontFamily: fonts.mono, fontSize: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 2, backgroundColor: colors.ember },
  liveText: { color: colors.ember }
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
});
