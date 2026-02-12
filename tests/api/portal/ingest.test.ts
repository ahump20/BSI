/**
 * Tests for /api/portal/ingest authentication
 */

import { describe, it, expect } from 'vitest';

describe('Portal Ingest Authentication', () => {
  it('should reject requests without X-Ingest-Secret header', async () => {
    const mockRequest = new Request('https://example.com/api/portal/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries: [] }),
    });

    const mockEnv = {
      GAME_DB: {} as D1Database,
      KV: {} as KVNamespace,
      SPORTS_DATA: {} as R2Bucket,
      INGEST_SECRET: 'test-secret-123',
    };

    const mockContext = {
      request: mockRequest,
      env: mockEnv,
    } as any;

    // Dynamically import the handler to test
    const { onRequest } = await import('../../../functions/api/portal/ingest');
    const response = await onRequest(mockContext);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should reject requests with invalid X-Ingest-Secret header', async () => {
    const mockRequest = new Request('https://example.com/api/portal/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ingest-Secret': 'wrong-secret',
      },
      body: JSON.stringify({ entries: [] }),
    });

    const mockEnv = {
      GAME_DB: {} as D1Database,
      KV: {} as KVNamespace,
      SPORTS_DATA: {} as R2Bucket,
      INGEST_SECRET: 'test-secret-123',
    };

    const mockContext = {
      request: mockRequest,
      env: mockEnv,
    } as any;

    const { onRequest } = await import('../../../functions/api/portal/ingest');
    const response = await onRequest(mockContext);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should accept requests with valid X-Ingest-Secret header but reject invalid body', async () => {
    const mockRequest = new Request('https://example.com/api/portal/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ingest-Secret': 'test-secret-123',
      },
      body: JSON.stringify({ entries: [] }),
    });

    const mockEnv = {
      GAME_DB: {} as D1Database,
      KV: {} as KVNamespace,
      SPORTS_DATA: {} as R2Bucket,
      INGEST_SECRET: 'test-secret-123',
    };

    const mockContext = {
      request: mockRequest,
      env: mockEnv,
    } as any;

    const { onRequest } = await import('../../../functions/api/portal/ingest');
    const response = await onRequest(mockContext);

    // Should pass auth but fail on empty entries array
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Body must contain entries array' });
  });
});
