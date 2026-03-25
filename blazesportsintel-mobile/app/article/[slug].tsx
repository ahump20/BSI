import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useArticle } from '@/hooks/useArticles';
import { getOfflineArticle, saveOfflineArticle } from '@/lib/offlineArticles';
import { colors, fonts } from '@/constants/theme';

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [saved, setSaved] = useState(false);
  const query = useArticle(slug ?? '');
  const article = query.data ?? (slug ? getOfflineArticle(slug) : null);

  if (!article) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>You’re offline. This article hasn’t been saved.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {article.heroImage ? <Image source={article.heroImage} style={styles.hero} contentFit="cover" cachePolicy="disk" /> : null}
      <Text style={styles.title}>{article.title.toUpperCase()}</Text>
      <Text style={styles.body}>{article.body ?? article.excerpt ?? ''}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Share article"
          style={styles.button}
          onPress={() =>
            Sharing.shareAsync(`https://blazesportsintel.com/blog/${article.slug}`).catch(() => undefined)
          }
        >
          <Text style={styles.buttonText}>Share</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Save article for offline"
          style={[styles.button, saved && styles.savedButton]}
          onPress={() => {
            saveOfflineArticle(article);
            setSaved(true);
          }}
        >
          <Text style={styles.buttonText}>Save for offline</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  content: { padding: 12 },
  hero: { width: '100%', height: 220, borderRadius: 2, marginBottom: 12 },
  title: { color: colors.bone, fontFamily: fonts.oswald, letterSpacing: 1.2, marginBottom: 12 },
  body: { color: colors.bone, fontFamily: fonts.cormorant, fontSize: 20, lineHeight: 34 },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  button: { backgroundColor: colors.charcoal, padding: 10, borderRadius: 2 },
  savedButton: { backgroundColor: colors.burntOrange },
  buttonText: { color: colors.bone, fontFamily: fonts.mono }
});
