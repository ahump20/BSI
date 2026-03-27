<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
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
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { useArticle } from '@/hooks/useArticles';
import { getOfflineArticle, isOfflineArticleSaved, saveOfflineArticle } from '@/lib/offlineArticles';
import { colors, fonts } from '@/constants/theme';
import type { Article } from '@shared/types/articles';

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const articleQuery = useArticle(slug ?? '');
  const [offlineArticle, setOfflineArticle] = useState<Article | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const cached = getOfflineArticle(slug);
    setOfflineArticle(cached);
    setSaved(isOfflineArticleSaved(slug));
  }, [slug]);

  const article = useMemo(() => articleQuery.data ?? offlineArticle, [articleQuery.data, offlineArticle]);

  const onSaveOffline = () => {
    if (!article) {
      return;
    }

    saveOfflineArticle(article);
    setSaved(true);
  };

  if (articleQuery.isLoading && !article) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Loading article...</Text>
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

  if (!article) {
    return (
      <View style={styles.container}>
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
        <Text style={styles.body}>You’re offline. This article hasn’t been saved.</Text>
=======
        <Text style={styles.offlineMessage}>You’re offline. This article hasn’t been saved.</Text>
>>>>>>> theirs
=======
        <Text style={styles.offlineMessage}>You’re offline. This article hasn’t been saved.</Text>
>>>>>>> theirs
=======
        <Text style={styles.offlineMessage}>You’re offline. This article hasn’t been saved.</Text>
>>>>>>> theirs
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
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
            Sharing.shareAsync(`https://blazesportsintel.com/blog/${article.slug}`).catch(() => undefined)
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
            Share.share({
              message: `${article.title}\nhttps://blazesportsintel.com/blog/${article.slug}`,
              url: `https://blazesportsintel.com/blog/${article.slug}`
            }).catch(() => undefined)
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
          }
        >
          <Text style={styles.buttonText}>Share</Text>
        </Pressable>
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
        <Pressable
          accessibilityLabel="Save article for offline"
          style={[styles.button, saved && styles.savedButton]}
          onPress={() => {
            saveOfflineArticle(article);
            setSaved(true);
          }}
        >
          <Text style={styles.buttonText}>Save for offline</Text>
=======
        <Pressable accessibilityLabel="Save article for offline" style={[styles.button, saved && styles.savedButton]} onPress={onSaveOffline}>
          <Text style={styles.buttonText}>{saved ? 'Saved' : 'Save for offline'}</Text>
>>>>>>> theirs
=======
        <Pressable accessibilityLabel="Save article for offline" style={[styles.button, saved && styles.savedButton]} onPress={onSaveOffline}>
          <Text style={styles.buttonText}>{saved ? 'Saved' : 'Save for offline'}</Text>
>>>>>>> theirs
=======
        <Pressable accessibilityLabel="Save article for offline" style={[styles.button, saved && styles.savedButton]} onPress={onSaveOffline}>
          <Text style={styles.buttonText}>{saved ? 'Saved' : 'Save for offline'}</Text>
>>>>>>> theirs
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
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
  offlineMessage: { color: colors.dust, fontFamily: fonts.cormorant, fontSize: 20, lineHeight: 34 },
>>>>>>> theirs
=======
  offlineMessage: { color: colors.dust, fontFamily: fonts.cormorant, fontSize: 20, lineHeight: 34 },
>>>>>>> theirs
=======
  offlineMessage: { color: colors.dust, fontFamily: fonts.cormorant, fontSize: 20, lineHeight: 34 },
>>>>>>> theirs
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  button: { backgroundColor: colors.charcoal, padding: 10, borderRadius: 2 },
  savedButton: { backgroundColor: colors.burntOrange },
  buttonText: { color: colors.bone, fontFamily: fonts.mono }
});
