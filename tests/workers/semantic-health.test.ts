import { describe, expect, it, vi } from 'vitest';

import { handleSemanticHealth } from '../../workers/handlers/health';

describe('/api/semantic-health', () => {
  it('requires an admin key', async () => {
    const response = await handleSemanticHealth(
      new Request('https://blazesportsintel.com/api/semantic-health'),
      { ADMIN_KEY: 'secret', KV: { list: vi.fn() } } as any,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns KV and R2 inventory for an authenticated request', async () => {
    const response = await handleSemanticHealth(
      new Request('https://blazesportsintel.com/api/semantic-health', {
        headers: { 'X-Admin-Key': 'secret' },
      }),
      {
        ADMIN_KEY: 'secret',
        KV: {
          list: vi.fn().mockResolvedValue({
            keys: [{ name: 'dataset:one' }, { name: 'dataset:two' }],
            list_complete: true,
          }),
        },
        DATA_LAKE: {
          list: vi.fn().mockResolvedValue({
            objects: [{ key: 'snapshots/2026-03-13.json', size: 128, uploaded: '2026-03-13T12:00:00Z' }],
            truncated: false,
          }),
        },
      } as any,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      kv: {
        totalKeys: 2,
        keys: ['dataset:one', 'dataset:two'],
      },
      r2: {
        totalObjects: 1,
        objects: [{ key: 'snapshots/2026-03-13.json', size: 128 }],
      },
    });
  });
});
