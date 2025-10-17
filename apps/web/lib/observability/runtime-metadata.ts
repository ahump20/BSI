export const APP_ENVIRONMENT =
  process.env.NEXT_PUBLIC_APP_ENV ??
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  'development';

export const APP_RELEASE =
  process.env.NEXT_PUBLIC_APP_RELEASE ??
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ??
  process.env.SENTRY_RELEASE ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.NEXT_RUNTIME ??
  'local';

export const APP_SERVICE = process.env.NEXT_PUBLIC_APP_SERVICE ?? 'blaze-sports-intel-web';

export const OBSERVABILITY_TAGS = {
  service: APP_SERVICE,
  environment: APP_ENVIRONMENT,
  release: APP_RELEASE
};
