---
name: new-worker
description: |
  Scaffold a new Cloudflare Worker for BSI following project conventions.
  Creates the directory, wrangler.toml, types, and entry point matching existing worker patterns.

  Example triggers: "/new-worker bsi-alerts", "/new-worker college-rankings",
  "scaffold a new worker for live scoring"
disable-model-invocation: true
---

# New Worker Scaffold Skill

## Arguments

The first argument is the worker name (kebab-case). If not provided, ask the user.

Optionally ask which bindings the worker needs:
- KV (rate limiting, caching)
- D1 (database queries)
- R2 (asset storage)
- Durable Objects (stateful coordination)
- None (stateless API)

## Directory Structure

Create under `workers/<worker-name>/`:

```
workers/<worker-name>/
  src/
    index.ts      # Entry point with fetch handler
    types.ts      # Env interface matching wrangler.toml bindings
  wrangler.toml   # Worker config
  package.json    # Minimal package.json
```

## File Templates

### wrangler.toml

Follow the pattern from existing workers (e.g., `workers/mini-games-api/wrangler.toml`):

```toml
name = "<worker-name>"
main = "src/index.ts"
compatibility_date = "<current-date>"

[vars]
ENVIRONMENT = "production"
```

Add binding blocks based on user selection:

```toml
# If KV selected:
[[kv_namespaces]]
binding = "KV"
id = "<PLACEHOLDER: create KV namespace with `wrangler kv namespace create KV` and paste ID>"

# If D1 selected:
[[d1_databases]]
binding = "DB"
database_name = "<worker-name>-db"
database_id = "<PLACEHOLDER: create D1 with `wrangler d1 create <worker-name>-db` and paste ID>"

# If R2 selected:
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "<worker-name>-assets"
```

Add route if the user specifies one:
```toml
[[routes]]
pattern = "blazesportsintel.com/api/<path>/*"
zone_name = "blazesportsintel.com"
```

### src/types.ts

Generate the Env interface from the selected bindings:

```typescript
export interface Env {
  ENVIRONMENT: string;
  // Add per binding selection:
  // KV: KVNamespace;
  // DB: D1Database;
  // BUCKET: R2Bucket;
}
```

### src/index.ts

Standard entry point matching the project pattern:

```typescript
import type { Env } from './types';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return json(null, 204);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // TODO: Add routes here

    return json({ error: 'Not found' }, 404);
  },
};
```

### package.json

```json
{
  "name": "<worker-name>",
  "version": "1.0.0",
  "private": true
}
```

## Post-Scaffold

After creating files, tell the user:

1. Fill in the placeholder IDs in `wrangler.toml` (provide the wrangler commands to create resources)
2. Add a deploy script to the root `package.json` if they want a shortcut:
   ```
   "deploy:<worker-name>": "wrangler deploy --config workers/<worker-name>/wrangler.toml"
   ```
3. Test locally with: `wrangler dev --config workers/<worker-name>/wrangler.toml`
