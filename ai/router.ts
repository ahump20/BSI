type ProviderName =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'xai'
  | 'deepseek'
  | 'bedrock'
  | 'huggingface';

type GenerationMode = 'text' | 'json';

export interface GenerateParams {
  prompt: string;
  system?: string;
  mode?: GenerationMode;
  temperature?: number;
  maxTokens?: number;
  provider?: ProviderName;
  fallbackProviders?: ProviderName[];
  metadata?: Record<string, unknown>;
}

interface AdapterRequest extends Omit<GenerateParams, 'mode' | 'system'> {
  mode: GenerationMode;
  system: string;
}

export interface GenerationResult {
  provider: ProviderName;
  model: string;
  mode: GenerationMode;
  text: string;
  json?: unknown;
  raw: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

export type ProviderErrorCode =
  | 'missing_credentials'
  | 'network_error'
  | 'api_error'
  | 'invalid_response'
  | 'not_implemented'
  | 'unknown';

export interface ProviderError {
  provider: ProviderName;
  code: ProviderErrorCode;
  message: string;
  status?: number;
  missing?: string[];
  details?: Record<string, unknown>;
  cause?: unknown;
}

export type GenerationErrorCode = 'no_providers_available' | 'all_providers_failed';

export class GenerationError extends Error {
  public readonly code: GenerationErrorCode;
  public readonly plan: ProviderName[];
  public readonly errors: ProviderError[];

  constructor(
    code: GenerationErrorCode,
    message: string,
    plan: ProviderName[],
    errors: ProviderError[]
  ) {
    super(message);
    this.name = 'GenerationError';
    this.code = code;
    this.plan = plan;
    this.errors = errors;
  }
}

const PROVIDER_PRIORITY: ProviderName[] = [
  'anthropic',
  'openai',
  'gemini',
  'xai',
  'deepseek',
  'bedrock',
  'huggingface',
];

const DEFAULT_SYSTEM_PROMPT =
  "You are BlazeSportsIntel's narrative intelligence engine. Generate concise, fact-grounded insights.";

interface ProviderAdapter {
  readonly name: ProviderName;
  isAvailable(): boolean;
  missingEnvVars(): string[];
  invoke(request: AdapterRequest): Promise<GenerationResult>;
}

class ProviderAdapterError extends Error {
  public readonly provider: ProviderName;
  public readonly code: ProviderErrorCode;
  public readonly status?: number;
  public readonly meta?: Record<string, unknown>;

  constructor(
    provider: ProviderName,
    code: ProviderErrorCode,
    message: string,
    status?: number,
    meta?: Record<string, unknown>,
    cause?: unknown
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ProviderAdapterError';
    this.provider = provider;
    this.code = code;
    this.status = status;
    this.meta = meta;
  }
}

abstract class BaseProviderAdapter implements ProviderAdapter {
  public readonly name: ProviderName;
  private readonly requiredEnv: string[];

  protected constructor(name: ProviderName, requiredEnv: string[] = []) {
    this.name = name;
    this.requiredEnv = requiredEnv;
  }

  isAvailable(): boolean {
    return this.missingEnvVars().length === 0;
  }

  missingEnvVars(): string[] {
    return this.requiredEnv.filter(key => !process.env[key]);
  }

  abstract invoke(request: AdapterRequest): Promise<GenerationResult>;
}

class OpenAIAdapter extends BaseProviderAdapter {
  constructor() {
    super('openai', ['OPENAI_API_KEY']);
  }

  async invoke(request: AdapterRequest): Promise<GenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY!;
    const baseUrl = process.env.OPENAI_API_BASE_URL ?? 'https://api.openai.com/v1';
    const model =
      request.mode === 'json'
        ? process.env.OPENAI_JSON_MODEL ?? 'gpt-4o-mini'
        : process.env.OPENAI_TEXT_MODEL ?? 'gpt-4o-mini';

    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.prompt },
      ],
      temperature: request.temperature ?? 0.6,
      max_tokens: request.maxTokens ?? 1024,
    };

    if (request.mode === 'json') {
      payload.response_format = { type: 'json_object' };
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new ProviderAdapterError(
        this.name,
        'network_error',
        'Failed to reach OpenAI API.',
        undefined,
        undefined,
        error
      );
    }

    const raw = await safeReadJson(response);

    if (!response.ok) {
      throw new ProviderAdapterError(
        this.name,
        'api_error',
        `OpenAI API error (${response.status}).`,
        response.status,
        { raw }
      );
    }

    const choice = raw?.choices?.[0];
    const text: string = choice?.message?.content ?? '';

    const result: GenerationResult = {
      provider: this.name,
      model: raw?.model ?? model,
      mode: request.mode,
      text,
      raw,
      usage: normalizeUsage(raw?.usage),
      finishReason: choice?.finish_reason,
      metadata: request.metadata,
    };

    if (request.mode === 'json') {
      result.json = safeParseJson(text, this.name);
    }

    return result;
  }
}

class AnthropicAdapter extends BaseProviderAdapter {
  constructor() {
    super('anthropic', ['ANTHROPIC_API_KEY']);
  }

  async invoke(request: AdapterRequest): Promise<GenerationResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const baseUrl = process.env.ANTHROPIC_API_BASE_URL ?? 'https://api.anthropic.com';
    const model =
      request.mode === 'json'
        ? process.env.ANTHROPIC_JSON_MODEL ?? 'claude-3-5-sonnet-20241022'
        : process.env.ANTHROPIC_TEXT_MODEL ?? 'claude-3-5-sonnet-20241022';

    const payload: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.6,
      system: request.system,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    };

    if (request.mode === 'json') {
      payload.response_format = { type: 'json_object' };
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/messages`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': process.env.ANTHROPIC_API_VERSION ?? '2023-06-01',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new ProviderAdapterError(
        this.name,
        'network_error',
        'Failed to reach Anthropic API.',
        undefined,
        undefined,
        error
      );
    }

    const raw = await safeReadJson(response);

    if (!response.ok) {
      throw new ProviderAdapterError(
        this.name,
        'api_error',
        `Anthropic API error (${response.status}).`,
        response.status,
        { raw }
      );
    }

    const primaryContent = raw?.content?.[0]?.text ?? '';

    const result: GenerationResult = {
      provider: this.name,
      model: raw?.model ?? model,
      mode: request.mode,
      text: primaryContent,
      raw,
      usage: normalizeAnthropicUsage(raw?.usage),
      finishReason: raw?.stop_reason,
      metadata: request.metadata,
    };

    if (request.mode === 'json') {
      result.json = safeParseJson(primaryContent, this.name);
    }

    return result;
  }
}

class StubAdapter extends BaseProviderAdapter {
  private readonly displayName: string;

  constructor(name: ProviderName, displayName: string, requiredEnv: string[]) {
    super(name, requiredEnv);
    this.displayName = displayName;
  }

  async invoke(): Promise<GenerationResult> {
    throw new ProviderAdapterError(
      this.name,
      'not_implemented',
      `${this.displayName} adapter is not yet implemented.`
    );
  }
}

type ProviderRegistry = Map<ProviderName, ProviderAdapter>;

function createProviderRegistry(): ProviderRegistry {
  return new Map<ProviderName, ProviderAdapter>([
    ['anthropic', new AnthropicAdapter()],
    ['openai', new OpenAIAdapter()],
    ['gemini', new StubAdapter('gemini', 'Google Gemini', ['GEMINI_API_KEY', 'GOOGLE_API_KEY'])],
    ['xai', new StubAdapter('xai', 'xAI Grok', ['XAI_API_KEY'])],
    ['deepseek', new StubAdapter('deepseek', 'DeepSeek', ['DEEPSEEK_API_KEY'])],
    [
      'bedrock',
      new StubAdapter('bedrock', 'AWS Bedrock', [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ]),
    ],
    ['huggingface', new StubAdapter('huggingface', 'Hugging Face', ['HUGGINGFACE_API_KEY'])],
  ]);
}

function normalizeUsage(usage: any): GenerationResult['usage'] {
  if (!usage) return undefined;
  return {
    promptTokens: usage.prompt_tokens ?? usage.promptTokens,
    completionTokens: usage.completion_tokens ?? usage.completionTokens,
    totalTokens: usage.total_tokens ?? usage.totalTokens,
  };
}

function normalizeAnthropicUsage(usage: any): GenerationResult['usage'] {
  if (!usage) return undefined;
  return {
    promptTokens: usage.input_tokens ?? usage.prompt_tokens,
    completionTokens: usage.output_tokens ?? usage.completion_tokens,
    totalTokens:
      usage.total_tokens ??
      (usage.input_tokens && usage.output_tokens
        ? usage.input_tokens + usage.output_tokens
        : undefined),
  };
}

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.clone().json();
  } catch (_) {
    try {
      return await response.clone().text();
    } catch (error) {
      return { readError: error instanceof Error ? error.message : String(error) };
    }
  }
}

function safeParseJson(payload: string, provider: ProviderName): unknown {
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new ProviderAdapterError(
      provider,
      'invalid_response',
      'Provider returned invalid JSON.',
      undefined,
      { payload },
      error
    );
  }
}

function captureError(error: unknown, fallbackProvider: ProviderName): ProviderError {
  if (error instanceof ProviderAdapterError) {
    const meta = error.meta;
    const missing =
      meta && Array.isArray((meta as { missing?: unknown }).missing)
        ? ((meta as { missing: string[] }).missing)
        : undefined;
    return {
      provider: error.provider,
      code: error.code,
      message: error.message,
      status: error.status,
      missing,
      details: meta ?? undefined,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return {
      provider: fallbackProvider,
      code: 'unknown',
      message: error.message,
      cause: error,
    };
  }

  return {
    provider: fallbackProvider,
    code: 'unknown',
    message: 'Unknown error.',
    cause: error,
  };
}

export function resolveProviderPlan(
  params: GenerateParams,
  registry: ProviderRegistry = createProviderRegistry()
): ProviderName[] {
  const plan: ProviderName[] = [];
  const seen = new Set<ProviderName>();

  const add = (name: ProviderName | undefined) => {
    if (!name || seen.has(name)) return;
    plan.push(name);
    seen.add(name);
  };

  if (params.provider) {
    add(params.provider);
  }

  if (params.fallbackProviders?.length) {
    params.fallbackProviders.forEach(add);
  }

  for (const provider of PROVIDER_PRIORITY) {
    const adapter = registry.get(provider);
    if (adapter?.isAvailable()) {
      add(provider);
    }
  }

  if (!plan.length) {
    for (const provider of PROVIDER_PRIORITY) {
      const adapter = registry.get(provider);
      if (adapter && !adapter.isAvailable()) {
        add(provider);
      }
    }
  }

  return plan;
}

export async function generate(params: GenerateParams): Promise<GenerationResult> {
  const registry = createProviderRegistry();
  const plan = resolveProviderPlan(params, registry);

  if (plan.length === 0) {
    throw new GenerationError(
      'no_providers_available',
      'No AI providers are configured. Please add API keys to the environment.',
      plan,
      []
    );
  }

  const errors: ProviderError[] = [];
  const adapterRequest: AdapterRequest = {
    ...params,
    system: params.system ?? DEFAULT_SYSTEM_PROMPT,
    mode: params.mode ?? 'text',
  };

  for (const providerName of plan) {
    const adapter = registry.get(providerName);
    if (!adapter) {
      errors.push({
        provider: providerName,
        code: 'unknown',
        message: `No adapter registered for ${providerName}.`,
      });
      continue;
    }

    if (!adapter.isAvailable()) {
      errors.push({
        provider: providerName,
        code: 'missing_credentials',
        message: `${providerName} credentials are missing.`,
        missing: adapter.missingEnvVars(),
      });
      continue;
    }

    try {
      return await adapter.invoke(adapterRequest);
    } catch (error) {
      errors.push(captureError(error, providerName));
    }
  }

  throw new GenerationError(
    'all_providers_failed',
    'All AI providers failed to generate a response.',
    plan,
    errors
  );
}

export { createProviderRegistry };
export type { ProviderName, GenerationMode };
