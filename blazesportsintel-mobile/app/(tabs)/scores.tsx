import { useMemo } from 'react';
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
=======
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
>>>>>>> theirs
=======
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
>>>>>>> theirs
=======
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
>>>>>>> theirs
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
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    const data = Array.isArray(query.data) ? query.data : [];
    const rank: Record<string, number> = { live: 0, final: 1, upcoming: 2 };
    return [...data].sort((a, b) => (rank[a.status] ?? 2) - (rank[b.status] ?? 2));
  }, [query.data]);

  const renderEmpty = () => {
    if (query.isLoading) {
      return <ActivityIndicator color={colors.burntOrange} />;
    }
    if (query.isError) {
      return <Text style={styles.stateText}>Couldn’t load scores. Pull down to retry.</Text>;
    }
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    const data = query.data ?? [];
    const rank: Record<Score['status'], number> = { live: 0, final: 1, upcoming: 2 };
    return [...data].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [query.data]);

  const renderHeader = (index: number) => {
    const item = sorted[index];
    if (!item) {
      return null;
    }

    if (index === 0 || item.status !== sorted[index - 1]?.status) {
      const labels: Record<Score['status'], string> = {
        live: 'LIVE',
        final: 'FINAL',
        upcoming: 'UPCOMING'
      };
      return <Text style={styles.sectionHeader}>{labels[item.status]}</Text>;
    }

    return null;
  };

  const renderEmpty = () => {
    if (query.isLoading) {
      return (
        <View>
          {[0, 1, 2].map((value) => (
            <View key={value} style={styles.skeletonCard} />
          ))}
        </View>
      );
    }

    if (query.isError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.stateText}>Couldn’t load scores. Pull down to retry.</Text>
          <Pressable style={styles.retryButton} onPress={() => query.refetch()} accessibilityLabel="Retry loading scores">
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
        renderItem={({ item }) => <ScoreCard score={item} />}
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        renderItem={({ item, index }) => (
          <View>
            {renderHeader(index)}
            <ScoreCard score={item} />
          </View>
        )}
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.burntOrange} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight, padding: 12 },
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  stateText: { color: colors.dust, textAlign: 'center', marginTop: 24, fontFamily: fonts.cormorant, fontSize: 18 }
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  sectionHeader: {
    color: colors.dust,
    fontFamily: fonts.mono,
    marginBottom: 6,
    marginTop: 8,
    fontSize: 12,
    letterSpacing: 0.5
  },
  emptyContainer: { alignItems: 'center', marginTop: 24 },
  stateText: { color: colors.dust, textAlign: 'center', marginTop: 24, fontFamily: fonts.cormorant, fontSize: 18 },
  retryButton: {
    marginTop: 10,
    backgroundColor: colors.burntOrange,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  retryText: { color: colors.bone, fontFamily: fonts.mono },
  skeletonCard: {
    height: 92,
    backgroundColor: colors.charcoal,
    borderRadius: 2,
    marginBottom: 8,
    opacity: 0.6
  }
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
});
