/**
 * Pages Function — /api/semantic-health
 *
 * Admin-only endpoint for dataset identity health checks.
 * Requires Bearer token matching ADMIN_TOKEN env var.
 * Paginates KV list() and R2 list() to audit stored datasets.
 */

interface Env {
  KV?: KVNamespace;
  R2?: R2Bucket;
  ADMIN_TOKEN?: string;
}

/** Max items per KV/R2 list call */
const LIST_PAGE_SIZE = 1000;
/** Hard cap on pagination rounds to prevent runaway */
const MAX_LIST_ROUNDS = 10;

function requireAdmin(request: Request, env: Env): Response | null {
  const token = env.ADMIN_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'ADMIN_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = request.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

interface KVListResult {
  keys: { name: string; expiration?: number; metadata?: unknown }[];
  list_complete: boolean;
  cursor?: string;
}

interface R2ListResult {
  objects: { key: string; size: number; uploaded: string }[];
  truncated: boolean;
  cursor?: string;
}

async function paginateKVList(
  kv: KVNamespace,
  prefix?: string
): Promise<{ keys: string[]; rounds: number; complete: boolean }> {
  const allKeys: string[] = [];
  let cursor: string | undefined;
  let rounds = 0;

  do {
    rounds++;
    const listOptions: Record<string, unknown> = { limit: LIST_PAGE_SIZE };
    if (prefix) listOptions.prefix = prefix;
    if (cursor) listOptions.cursor = cursor;

    const result = await (kv.list as (opts: Record<string, unknown>) => Promise<KVListResult>)(
      listOptions
    );

    for (const key of result.keys) {
      allKeys.push(key.name);
    }

    if (result.list_complete) break;
    cursor = result.cursor;
  } while (cursor && rounds < MAX_LIST_ROUNDS);

  return { keys: allKeys, rounds, complete: rounds < MAX_LIST_ROUNDS };
}

async function paginateR2List(
  r2: R2Bucket,
  prefix?: string
): Promise<{ objects: { key: string; size: number }[]; rounds: number; complete: boolean }> {
  const allObjects: { key: string; size: number }[] = [];
  let cursor: string | undefined;
  let rounds = 0;

  do {
    rounds++;
    const listOptions: Record<string, unknown> = { limit: LIST_PAGE_SIZE };
    if (prefix) listOptions.prefix = prefix;
    if (cursor) listOptions.cursor = cursor;

    const result = await (r2.list as (opts: Record<string, unknown>) => Promise<R2ListResult>)(
      listOptions
    );

    for (const obj of result.objects) {
      allObjects.push({ key: obj.key, size: obj.size });
    }

    if (!result.truncated) break;
    cursor = result.cursor;
  } while (cursor && rounds < MAX_LIST_ROUNDS);

  return { objects: allObjects, rounds, complete: rounds < MAX_LIST_ROUNDS };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = requireAdmin(context.request, context.env);
  if (authError) return authError;

  const kvResult = context.env.KV
    ? await paginateKVList(context.env.KV)
    : { keys: [], rounds: 0, complete: true };

  const r2Result = context.env.R2
    ? await paginateR2List(context.env.R2, 'snapshots/')
    : { objects: [], rounds: 0, complete: true };

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      note: 'KV listing is eventually consistent (~60s)',
      kv: {
        totalKeys: kvResult.keys.length,
        rounds: kvResult.rounds,
        complete: kvResult.complete,
        keys: kvResult.keys,
      },
      r2: {
        totalObjects: r2Result.objects.length,
        rounds: r2Result.rounds,
        complete: r2Result.complete,
        objects: r2Result.objects,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
