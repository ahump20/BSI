import { APP_ENVIRONMENT, APP_RELEASE, APP_SERVICE } from './runtime-metadata';

declare const EdgeRuntime: string | undefined;

const EDGE_RUNTIME = typeof EdgeRuntime !== 'undefined';

function readEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[key]) {
    return String((globalThis as Record<string, unknown>)[key]);
  }
  return undefined;
}

function resolveSite(): string {
  return readEnv('DATADOG_SITE') ?? readEnv('NEXT_PUBLIC_DATADOG_SITE') ?? 'datadoghq.com';
}

function resolveRuntimeEndpoint(): string {
  const site = resolveSite();
  return `https://http-intake.logs.${site}/api/v2/logs`;
}

function getApiKey(): string | undefined {
  return readEnv('DATADOG_API_KEY') ?? readEnv('DD_API_KEY');
}

export interface RuntimeLogPayload {
  message: string;
  status?: 'debug' | 'info' | 'warn' | 'error';
  ddsource?: string;
  tags?: Record<string, string | number | boolean>;
  metadata?: Record<string, unknown>;
}

export async function emitRuntimeLog(payload: RuntimeLogPayload): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const body = [
    {
      message: payload.message,
      status: payload.status ?? 'info',
      ddsource: payload.ddsource ?? (EDGE_RUNTIME ? 'edge' : 'node'),
      service: APP_SERVICE,
      ddtags: buildTags(payload.tags),
      env: APP_ENVIRONMENT,
      version: APP_RELEASE,
      ...payload.metadata
    }
  ];

  try {
    await fetch(resolveRuntimeEndpoint(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'dd-api-key': apiKey
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const isProd = typeof process !== 'undefined' ? process.env?.NODE_ENV === 'production' : false;
    if (typeof console !== 'undefined' && !isProd) {
      console.warn('[Observability] Failed to push Datadog runtime log', error);
    }
  }
}

function buildTags(tags?: Record<string, string | number | boolean>): string {
  const base: Record<string, string | number | boolean> = {
    service: APP_SERVICE,
    environment: APP_ENVIRONMENT,
    release: APP_RELEASE,
    runtime: EDGE_RUNTIME ? 'edge' : 'node'
  };

  const merged = { ...base, ...(tags ?? {}) };
  return Object.entries(merged)
    .map(([key, value]) => `${key}:${value}`)
    .join(',');
}

export async function recordRuntimeEvent(eventName: string, tags?: Record<string, string | number | boolean>, metadata?: Record<string, unknown>): Promise<void> {
  await emitRuntimeLog({
    message: eventName,
    status: 'info',
    ddsource: EDGE_RUNTIME ? 'edge' : 'node',
    tags: { event: eventName, ...(tags ?? {}) },
    metadata: { timestamp: new Date().toISOString(), ...(metadata ?? {}) }
  });
}
