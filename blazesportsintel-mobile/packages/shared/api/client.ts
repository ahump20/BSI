import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://blazesportsintel.com';
const REQUEST_TIMEOUT_MS = 10_000;

export interface ApiErrorResponse {
  status: number;
  message: string;
  body?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(input: ApiErrorResponse) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.body = input.body;
  }
}

function createAbortController(timeoutMs: number): { controller: AbortController; cancelTimeout: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    controller,
    cancelTimeout: () => clearTimeout(timeoutId)
  };
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('bsi_auth_token');
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function buildHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const { controller, cancelTimeout } = createAbortController(REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...buildHeaders(token),
        ...(init.headers ?? {})
      },
      signal: controller.signal
    });
  } catch (error: unknown) {
    throw new ApiError({
      status: 0,
      message: 'Network error. Please try again.',
      body: error
    });
  } finally {
    cancelTimeout();
  }

  const text = await response.text();
  const parsed: unknown = text ? safeJsonParse(text) : undefined;

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: `Request failed (${response.status}).`,
      body: parsed
    });
  }

  return parsed as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return request<TResponse>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
