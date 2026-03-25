import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initOfflineArticles } from '@/lib/offlineArticles';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    initOfflineArticles();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen name="article/[slug]" />
      </Stack>
    </QueryClientProvider>
  );
}
