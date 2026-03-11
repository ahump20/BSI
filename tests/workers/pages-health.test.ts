import { describe, expect, it } from 'vitest';

import { onRequestGet, onRequestHead, onRequestOptions } from '../../functions/api/health';

describe('Pages Function /api/health', () => {
  it('returns an ok health payload for preview deployments', async () => {
    const response = await onRequestGet({
      request: new Request('https://preview.blazesportsintel.pages.dev/api/health'),
      env: {
        API_VERSION: 'preview-test',
        ENVIRONMENT: 'preview',
      },
    } as Parameters<typeof onRequestGet>[0]);

    const body = await response.json() as {
      status: string;
      version: string;
      environment: string;
      mode: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('preview-test');
    expect(body.environment).toBe('preview');
    expect(body.mode).toBe('pages-function');
    expect(typeof body.timestamp).toBe('string');
  });

  it('handles preflight requests', async () => {
    const response = onRequestOptions();

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('responds to HEAD requests for smoke tools', async () => {
    const response = await onRequestHead({
      request: new Request('https://preview.blazesportsintel.pages.dev/api/health', {
        method: 'HEAD',
      }),
      env: {
        API_VERSION: 'preview-test',
        ENVIRONMENT: 'preview',
      },
    } as Parameters<typeof onRequestHead>[0]);

    expect(response.status).toBe(200);
  });
});
