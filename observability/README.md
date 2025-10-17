# BlazeSportsIntel Observability

The monitoring stack now threads Sentry, Datadog, and Applitools through the Next.js 15 application and supporting workflows. This document outlines how to configure credentials, how the runtime instrumentation works, and how releases are published.

## Sentry (Error & Performance Monitoring)

- **SDK**: `@sentry/nextjs` is initialised via `apps/web/sentry.client.config.ts` (browser) and `apps/web/app/instrumentation.ts` (server/edge). Release and environment metadata are pulled from:
  - `NEXT_PUBLIC_SENTRY_RELEASE` → `SENTRY_RELEASE` → `VERCEL_GIT_COMMIT_SHA`
  - `NEXT_PUBLIC_SENTRY_ENVIRONMENT` → `SENTRY_ENVIRONMENT` → `NODE_ENV`
- **Next config**: `apps/web/next.config.mjs` is wrapped with `withSentryConfig` so source maps and release uploads execute during CI/CD. Plugin options live in `apps/web/sentry.config.ts`.
- **Logger bridge**: `api/services/logger-service.js` now initialises `@sentry/node` inside `sendToMonitoring` and forwards structured log events (including trace IDs and metadata) for critical error notifications.
- **Required secrets**:
  - `SENTRY_DSN` (and optionally `NEXT_PUBLIC_SENTRY_DSN` for browser capture)
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for release automation in CI
  - Optional sampling controls: `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE`

## Datadog (RUM + Runtime Signals)

- **Client (RUM)**: `apps/web/lib/observability/datadog.ts` loads `@datadog/browser-rum` and `@datadog/browser-logs` inside the client-only `ObservabilityProvider` that wraps the App Router layout.
- **Runtime/Edge**: `apps/web/lib/observability/datadog-runtime.ts` exposes `emitRuntimeLog` and `recordRuntimeEvent` helpers that work in both Node and Edge runtimes. Key routes (`/`, `/baseball`, `/football`, `/basketball`, and dynamic game detail pages) call `recordRuntimeEvent` to capture renders.
- **Env vars**:
  - Browser: `NEXT_PUBLIC_DATADOG_APPLICATION_ID`, `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`, `NEXT_PUBLIC_DATADOG_SITE`, optional sampling overrides (`NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE`, `NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE`).
  - Runtime: `DATADOG_API_KEY` (or `DD_API_KEY`), `DATADOG_SITE`, `DATADOG_ENV`, `DATADOG_SERVICE`.

## Visual Regression (Applitools Eyes)

- **Tests**: Smoke specs live in `apps/web/tests/visual/applitools-smoke.spec.ts` and run through Playwright with `@applitools/eyes-playwright`.
- **Workflow**: `.github/workflows/applitools-smoke.yml` provisions browsers, builds the Next.js app, and executes `pnpm --filter @bsi/web test:visual` against `/`, `/baseball`, `/football`, `/basketball`, and `/baseball/ncaab/games/diamond-prototype`.
- **Secrets**: Set `APPLITOOLS_API_KEY` (and optionally `APPLITOOLS_SERVER_URL`). The workflow skips automatically if the API key is missing to keep local forks unblocked.

## Release Notifications

- `.github/workflows/deploy.yml` now calls `getsentry/action-release@v1` after build/deploy. The action finalises a release using `github.sha`, associates it with the configured environment (`production` for `main`), and pushes deploy notifications to Sentry.
- Ensure the deploy workflow is supplied with `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` secrets so notifications fire.

## Local Verification Checklist

1. Export required env vars (`SENTRY_DSN`, `NEXT_PUBLIC_DATADOG_APPLICATION_ID`, etc.) in `.env.local` or your shell.
2. Run `pnpm install` (workspace root) to hydrate dependencies.
3. Start the web app (`pnpm --filter @bsi/web dev`) and confirm the network tab shows Sentry and Datadog calls when the env vars are present.
4. Execute `pnpm --filter @bsi/web test:visual` with `APPLITOOLS_API_KEY` set to validate Applitools Eyes connectivity.
