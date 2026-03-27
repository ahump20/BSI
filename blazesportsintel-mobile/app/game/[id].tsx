import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Game } from '@shared/types/scores';
import { colors, fonts } from '@/constants/theme';

function resolvePath(sport: string, gameId: string): string {
  if (sport === 'college-baseball') return `/api/college-baseball/game/${gameId}`;
  if (sport === 'cfb') return `/api/cfb/game/${gameId}`;
  if (sport === 'nfl') return `/api/nfl/game/${gameId}`;
  return '/api/scores/cached';
}

export default function GameDetailScreen() {
  const { id, sport } = useLocalSearchParams<{ id: string; sport: string }>();
  const query = useQuery({
    queryKey: ['game', id, sport],
    queryFn: async () => {
      const data = await apiGet<Game | Game[]>(resolvePath(sport ?? '', id ?? ''));
      if (Array.isArray(data)) {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
        return data.find((game) => game.id === id) ?? null;
=======
        return data.find((game) => game.id === id || ('gameId' in game && (game as unknown as { gameId?: string }).gameId === id)) ?? null;
>>>>>>> theirs
=======
        return data.find((game) => game.id === id || ('gameId' in game && (game as unknown as { gameId?: string }).gameId === id)) ?? null;
>>>>>>> theirs
=======
        return data.find((game) => game.id === id || ('gameId' in game && (game as unknown as { gameId?: string }).gameId === id)) ?? null;
>>>>>>> theirs
      }
      return data;
    },
    enabled: Boolean(id)
  });

  const game = useMemo(() => query.data ?? null, [query.data]);

  if (query.isLoading) {
    return <ActivityIndicator color={colors.burntOrange} />;
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Game detail unavailable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{game.awayTeam.name.toUpperCase()} AT {game.homeTeam.name.toUpperCase()}</Text>
      <View style={styles.table}>
        <Text style={styles.row}>{game.awayTeam.abbreviation}: {game.awayTeam.score}</Text>
        <Text style={styles.row}>{game.homeTeam.abbreviation}: {game.homeTeam.score}</Text>
      </View>
      <Text style={styles.body}>Status: {game.status}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  content: { padding: 12 },
  header: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2 },
  table: { marginTop: 12, padding: 12, backgroundColor: colors.charcoal, borderRadius: 2 },
  row: { color: colors.bone, fontFamily: fonts.mono, marginBottom: 6 },
  body: { color: colors.dust, fontFamily: fonts.cormorant, fontSize: 18, marginTop: 12 }
});
