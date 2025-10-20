import * as Sentry from '@sentry/react'
import { browserTracingIntegration } from '@sentry/react'

let isInitialized = false

export const initSentry = (): void => {
  if (isInitialized) {
    return
  }

  const hasEnv = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
  const sentryDsn = hasEnv && typeof import.meta.env.VITE_SENTRY_DSN === 'string'
    ? import.meta.env.VITE_SENTRY_DSN
    : undefined
  const environment = hasEnv && typeof import.meta.env.MODE === 'string'
    ? import.meta.env.MODE
    : 'development'
  const isDev = hasEnv && import.meta.env.DEV === true

  if (!sentryDsn) {
    if (isDev) {
      console.warn('[Sentry] VITE_SENTRY_DSN is not configured; telemetry disabled.')
    }
    return
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      browserTracingIntegration(),
    ],
    tracesSampleRate: 0.25,
    beforeSend(event) {
      if (event.user && 'email' in event.user) {
        // Never ship PII per compliance requirements.
        delete event.user.email
      }
      return event
    },
  })

  isInitialized = true
}

export const sentry = Sentry
