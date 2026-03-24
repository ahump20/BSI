import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useScoresStore } from '@/stores/scoresStore';
import { useScores } from '@/hooks/useScores';
import { FilterPills } from '@/components/FilterPills';
import { ScoreCard } from '@/components/ScoreCard';
import type { Score } from '@shared/types/scores';
import { colors, fonts } from '@/constants/theme';

const sports = [
  { key: 'all', label: 'All' },
  { key: 'college-baseball', label: 'College Baseball' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nfl', label: 'NFL' },
  { key: 'cfb', label: 'CFB' },
  { key: 'nba', label: 'NBA' }
];

export default function ScoresTab() {
  const activeSport = useScoresStore((s) => s.activeSport);
  const setActiveSport = useScoresStore((s) => s.setActiveSport);
  const query = useScores(activeSport);

  const sorted = useMemo(() => {
    const data = query.data ?? [];
    const rank: Record<string, number> = { live: 0, final: 1, upcoming: 2 };
    return [...data].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [query.data]);

  const renderEmpty = () => {
    if (query.isLoading) {
      return <ActivityIndicator color={colors.burntOrange} />;
    }
    if (query.isError) {
      return <Text style={styles.stateText}>Couldn’t load scores. Pull down to retry.</Text>;
    }
    return <Text style={styles.stateText}>No games right now. Check back soon.</Text>;
  };

  return (
    <View style={styles.container}>
      <FilterPills
        options={sports}
        activeKey={activeSport}
        onChange={(sport) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          setActiveSport(sport);
        }}
      />
      <FlatList
        data={sorted}
        keyExtractor={(item: Score) => item.gameId}
        renderItem={({ item }) => <ScoreCard score={item} />}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.burntOrange} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight, padding: 12 },
  stateText: { color: colors.dust, textAlign: 'center', marginTop: 24, fontFamily: fonts.cormorant, fontSize: 18 }
});
