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

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
function buildTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function createAbortController(timeoutMs: number): { controller: AbortController; cancelTimeout: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    controller,
    cancelTimeout: () => clearTimeout(timeoutId)
  };
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('bsi_auth_token');
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAuthToken();
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function buildHeaders(token: string | null): Record<string, string> {
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  return headers;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const { controller, cancelTimeout } = createAbortController(REQUEST_TIMEOUT_MS);
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      method: 'GET',
      headers,
      signal: buildTimeoutSignal(REQUEST_TIMEOUT_MS)
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
      ...init,
      headers: {
        ...buildHeaders(token),
        ...(init.headers ?? {})
      },
      signal: controller.signal
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    });
  } catch (error: unknown) {
    throw new ApiError({
      status: 0,
      message: 'Network error. Please try again.',
      body: error
    });
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
  } finally {
    cancelTimeout();
>>>>>>> theirs
=======
  } finally {
    cancelTimeout();
>>>>>>> theirs
=======
  } finally {
    cancelTimeout();
>>>>>>> theirs
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

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return request<TResponse>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}
