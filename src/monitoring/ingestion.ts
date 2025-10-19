import { sentry } from './sentry'

const hasSentryClient = (): boolean => {
  try {
    return Boolean(sentry.getCurrentHub().getClient())
  } catch (err) {
    console.warn('[Sentry] Unable to verify client presence', err)
    return false
  }
}

type IngestionContext = {
  source: string
  endpoint: string
  status?: number
  metadata?: Record<string, unknown>
}

export const recordIngestionFailure = (
  error: unknown,
  context: IngestionContext
): void => {
  if (hasSentryClient()) {
    const normalizedError = error instanceof Error ? error : new Error(String(error))
    sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setTag('scope', 'data-ingestion')
      scope.setTag('source', context.source)
      scope.setExtra('endpoint', context.endpoint)
      scope.setExtra('status', context.status)
      scope.setExtra('metadata', context.metadata)
      sentry.captureException(normalizedError)
    })
  }

  console.error('[IngestionFailure]', context, error)
}

export const recordIngestionSuccess = (context: IngestionContext): void => {
  if (hasSentryClient()) {
    sentry.captureEvent({
      message: 'ingestion:success',
      level: 'info',
      tags: {
        scope: 'data-ingestion',
        source: context.source,
      },
      extra: {
        endpoint: context.endpoint,
        status: context.status,
        metadata: context.metadata,
      },
    })
  }
}
