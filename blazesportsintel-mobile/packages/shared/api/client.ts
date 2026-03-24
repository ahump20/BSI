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

function buildTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('bsi_auth_token');
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers,
      signal: buildTimeoutSignal(REQUEST_TIMEOUT_MS)
    });
  } catch (error: unknown) {
    throw new ApiError({
      status: 0,
      message: 'Network error. Please try again.',
      body: error
    });
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

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
