'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Create query client with stale time matching our API cache strategy
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 10 seconds before considered stale (matches KV cache)
            staleTime: 10_000,
            // 5 minutes garbage collection
            gcTime: 5 * 60 * 1000,
            // Refetch on window focus for live data freshness
            refetchOnWindowFocus: true,
            // Retry failed requests with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
