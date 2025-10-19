'use client';

import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import ObservabilityProvider from './observability-provider';
import { WatchlistProvider } from './watchlist-provider';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey && process.env.NODE_ENV === 'development') {
    console.warn('[Clerk] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Using placeholder key for local builds.');
  }

  if (!publishableKey) {
    return (
      <ObservabilityProvider>
        <WatchlistProvider authDisabled>{children}</WatchlistProvider>
      </ObservabilityProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ObservabilityProvider>
        <WatchlistProvider>{children}</WatchlistProvider>
      </ObservabilityProvider>
    </ClerkProvider>
  );
}
