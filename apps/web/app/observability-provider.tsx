'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { initDatadogRum } from '../lib/observability/datadog';

interface ObservabilityProviderProps {
  children: ReactNode;
}

export default function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  useEffect(() => {
    initDatadogRum();
  }, []);

  return <>{children}</>;
}
