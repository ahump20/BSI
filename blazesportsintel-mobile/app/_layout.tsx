import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
import { StatusBar } from 'expo-status-bar';
=======
import { StatusBar } from 'react-native';
>>>>>>> theirs
=======
import { StatusBar } from 'react-native';
>>>>>>> theirs
=======
import { StatusBar } from 'react-native';
>>>>>>> theirs
import { useEffect } from 'react';
import { initOfflineArticles } from '@/lib/offlineArticles';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    initOfflineArticles();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      <StatusBar style="light" />
=======
      <StatusBar barStyle="light-content" />
>>>>>>> theirs
=======
      <StatusBar barStyle="light-content" />
>>>>>>> theirs
=======
      <StatusBar barStyle="light-content" />
>>>>>>> theirs
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen name="article/[slug]" />
      </Stack>
    </QueryClientProvider>
  );
}
