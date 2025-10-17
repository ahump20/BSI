import * as Sentry from '@sentry/nextjs';

import { APP_ENVIRONMENT, APP_RELEASE } from '../lib/observability/runtime-metadata';

export const register = async () => {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';
  if (!dsn) {
    return;
  }

  const tracesSampleRate = Number(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.2'
  );
  const profilesSampleRate = Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1');

  Sentry.init({
    dsn,
    environment: APP_ENVIRONMENT,
    release: APP_RELEASE,
    tracesSampleRate,
    profilesSampleRate,
    enabled: true,
    sendDefaultPii: false,
    maxBreadcrumbs: 50
  });
};
