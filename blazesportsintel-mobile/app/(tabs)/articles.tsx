import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FilterPills } from '@/components/FilterPills';
import { useArticles } from '@/hooks/useArticles';
import type { Article } from '@shared/types/articles';
import { colors, fonts } from '@/constants/theme';

const options = [
  { key: 'all', label: 'All' },
  { key: 'college-baseball', label: 'College Baseball' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nfl', label: 'NFL' },
  { key: 'cfb', label: 'CFB' },
  { key: 'nba', label: 'NBA' }
];

export default function ArticlesTab() {
  const [sport, setSport] = useState('all');
  const query = useArticles(sport);

  return (
    <View style={styles.container}>
      <FilterPills options={options} activeKey={sport} onChange={setSport} />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.slug}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.burntOrange} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.isLoading ? 'Loading articles...' : query.isError ? 'Couldn’t load articles.' : 'No articles found.'}
          </Text>
        }
        renderItem={({ item }: { item: Article }) => (
          <Pressable
            accessibilityLabel={`Open article ${item.title}`}
            onPress={() => router.push(`/article/${item.slug}`)}
            style={styles.card}
          >
            {item.heroImage ? <Image source={item.heroImage} style={styles.image} contentFit="cover" cachePolicy="disk" /> : null}
            <Text style={styles.title}>{item.title.toUpperCase()}</Text>
            <Text style={styles.meta}>{item.sport ?? 'general'} · {new Date(item.publishedAt).toLocaleDateString()}</Text>
            <Text numberOfLines={2} style={styles.excerpt}>{item.excerpt ?? ''}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight, padding: 12 },
  card: { backgroundColor: colors.charcoal, padding: 12, marginBottom: 8, borderRadius: 2 },
  image: { width: '100%', height: 140, borderRadius: 2, marginBottom: 8 },
  title: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2 },
  meta: { color: colors.dust, fontFamily: fonts.mono, marginTop: 6 },
  excerpt: { color: colors.bone, fontFamily: fonts.cormorant, marginTop: 6, fontSize: 17 },
  empty: { color: colors.dust, textAlign: 'center', marginTop: 24, fontFamily: fonts.cormorant, fontSize: 18 }
});
