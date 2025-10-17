'use client';

import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { APP_ENVIRONMENT, APP_RELEASE, APP_SERVICE } from './runtime-metadata';

declare global {
  interface Window {
    __bsiDatadogInitialized?: boolean;
  }
}

const RUM_SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE ?? '100');
const RUM_REPLAY_SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE ?? '20');

function getSite(): string {
  return process.env.NEXT_PUBLIC_DATADOG_SITE ?? 'datadoghq.com';
}

export function initDatadogRum(): void {
  if (typeof window === 'undefined') return;
  if (window.__bsiDatadogInitialized) return;

  const applicationId = process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID;
  const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;

  if (!applicationId || !clientToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Observability] Datadog RUM not initialised. Missing NEXT_PUBLIC_DATADOG_APPLICATION_ID or NEXT_PUBLIC_DATADOG_CLIENT_TOKEN.');
    }
    return;
  }

  datadogRum.init({
    applicationId,
    clientToken,
    site: getSite(),
    env: APP_ENVIRONMENT,
    service: APP_SERVICE,
    version: APP_RELEASE,
    sessionSampleRate: RUM_SAMPLE_RATE,
    sessionReplaySampleRate: RUM_REPLAY_SAMPLE_RATE,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    silentMultipleInit: true,
    allowFallbackToLocalStorage: true,
    useCrossSiteSessionCookie: true
  });

  datadogRum.startSessionReplayRecording();

  datadogLogs.init({
    clientToken,
    site: getSite(),
    env: APP_ENVIRONMENT,
    service: APP_SERVICE,
    forwardErrorsToLogs: true,
    silentMultipleInit: true
  });

  window.__bsiDatadogInitialized = true;
}

export function trackRumAction(name: string, attributes?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.__bsiDatadogInitialized) return;
  datadogRum.addAction(name, {
    ...attributes,
    release: APP_RELEASE,
    service: APP_SERVICE
  });
}

export function trackRumError(error: Error, context?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.__bsiDatadogInitialized) return;
  datadogRum.addError(error, {
    ...context,
    release: APP_RELEASE,
    service: APP_SERVICE
  });
}

export function logClientEvent(message: string, attributes?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.__bsiDatadogInitialized) return;
  datadogLogs.logger.info(message, {
    ...attributes,
    release: APP_RELEASE,
    service: APP_SERVICE
  });
}
