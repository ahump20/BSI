import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProviderRegistry, generate, resolveProviderPlan } from '../../ai/router';

const PROVIDER_ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_API_BASE_URL',
  'OPENAI_JSON_MODEL',
  'OPENAI_TEXT_MODEL',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_API_BASE_URL',
  'ANTHROPIC_JSON_MODEL',
  'ANTHROPIC_TEXT_MODEL',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'XAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'HUGGINGFACE_API_KEY',
] as const;

type ProviderEnvKey = (typeof PROVIDER_ENV_KEYS)[number];

const ORIGINAL_ENV: Partial<Record<ProviderEnvKey, string>> = {};
for (const key of PROVIDER_ENV_KEYS) {
  if (process.env[key]) {
    ORIGINAL_ENV[key] = process.env[key] as string;
  }
}

const originalFetch = globalThis.fetch;

function clearProviderEnv() {
  for (const key of PROVIDER_ENV_KEYS) {
    delete process.env[key];
  }
}

function restoreOriginalEnv() {
  clearProviderEnv();
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value !== undefined) {
      process.env[key as ProviderEnvKey] = value;
    }
  }
}

function setEnv(values: Partial<Record<ProviderEnvKey, string>>) {
  clearProviderEnv();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      process.env[key as ProviderEnvKey] = value;
    }
  }
}

function createMockResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    clone: () => ({
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    }),
    json: async () => payload,
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearProviderEnv();
});

afterEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = originalFetch;
  restoreOriginalEnv();
});

afterAll(() => {
  restoreOriginalEnv();
  globalThis.fetch = originalFetch;
});

describe('resolveProviderPlan', () => {
  it('prioritises Anthropic when both providers are available', () => {
    setEnv({ OPENAI_API_KEY: 'open-key', ANTHROPIC_API_KEY: 'anth-key' });
    const plan = resolveProviderPlan(
      { prompt: 'Generate a recap.' },
      createProviderRegistry()
    );

    expect(plan[0]).toBe('anthropic');
    expect(plan).toContain('openai');
  });

  it('falls back to OpenAI when Anthropic credentials are missing', () => {
    setEnv({ OPENAI_API_KEY: 'open-key' });
    const plan = resolveProviderPlan(
      { prompt: 'Generate a recap.' },
      createProviderRegistry()
    );

    expect(plan[0]).toBe('openai');
    expect(plan).not.toContain('anthropic');
  });

  it('respects an explicitly requested provider while still planning fallbacks', () => {
    setEnv({ OPENAI_API_KEY: 'open-key' });
    const plan = resolveProviderPlan(
      { prompt: 'Generate a recap.', provider: 'anthropic', fallbackProviders: ['openai'] },
      createProviderRegistry()
    );

    expect(plan[0]).toBe('anthropic');
    expect(plan[1]).toBe('openai');
  });
});

describe('generate', () => {
  it('sets response_format for JSON mode requests', async () => {
    setEnv({ OPENAI_API_KEY: 'open-key' });
    const payload = {
      model: 'gpt-4o-mini',
      choices: [
        {
          message: { content: '{"answer":"yes"}' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
    };

    const fetchMock = vi
      .fn<Parameters<typeof fetch>, Promise<Response>>()
      .mockResolvedValue(createMockResponse(payload));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await generate({ prompt: 'Return JSON', mode: 'json' });

    expect(result.mode).toBe('json');
    expect(result.json).toEqual({ answer: 'yes' });

    const body = fetchMock.mock.calls[0]?.[1]?.body;
    const parsed = body ? JSON.parse(body as string) : undefined;
    expect(parsed?.response_format).toEqual({ type: 'json_object' });
  });

  it('omits response_format for text mode requests', async () => {
    setEnv({ OPENAI_API_KEY: 'open-key' });
    const payload = {
      model: 'gpt-4o-mini',
      choices: [
        {
          message: { content: 'Go Vols.' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
    };

    const fetchMock = vi
      .fn<Parameters<typeof fetch>, Promise<Response>>()
      .mockResolvedValue(createMockResponse(payload));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await generate({ prompt: 'Return text', mode: 'text' });

    expect(result.mode).toBe('text');
    expect(result.json).toBeUndefined();

    const body = fetchMock.mock.calls[0]?.[1]?.body;
    const parsed = body ? JSON.parse(body as string) : undefined;
    expect(parsed?.response_format).toBeUndefined();
  });
});
