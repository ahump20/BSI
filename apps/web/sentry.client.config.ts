import * as Sentry from '@sentry/nextjs';
import { APP_ENVIRONMENT, APP_RELEASE } from './lib/observability/runtime-metadata';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? '';
const tracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.2');
const replaysSessionSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? '0.1');
const replaysOnErrorSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE ?? '1.0');

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  release: APP_RELEASE,
  environment: APP_ENVIRONMENT,
  tracesSampleRate,
  integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: true })],
  replaysSessionSampleRate,
  replaysOnErrorSampleRate,
  sendClientReports: true,
  autoSessionTracking: true
});
