/**
 * Universal Skills API Worker — JSON-RPC 2.0 MCP endpoint.
 *
 * POST /mcp  → tools/list, tools/call (resolve-skill, get-skill-content, install-skill)
 * GET  /health → health check
 *
 * Rate limited at 60 rpm/IP via KV.
 */
import type { ApiEnv, RpcRequest } from "../../shared/types.js";
import { rpcResult, rpcError } from "../../shared/types.js";

// Tool definitions for tools/list
const TOOL_DEFS = [
  {
    name: "resolve-skill",
    description: "Search the universal skills catalog. Returns ranked results from both Claude Code and OpenAI Codex ecosystems.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        ecosystem: { type: "string", enum: ["claude", "codex", "universal", "any"], default: "any" },
        category: { type: "string" },
        min_quality: { type: "number", default: 30 },
        source_repo: { type: "string" },
        limit: { type: "number", default: 10 },
      },
      required: ["query"],
    },
  },
  {
    name: "get-skill-content",
    description: "Fetch full content of a skill by ID with progressive disclosure.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        include: { type: "array", items: { type: "string" }, default: ["metadata", "body"] },
        version: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "install-skill",
    description: "Generate install commands for a skill targeting Claude Code or OpenAI Codex.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        target: { type: "string", enum: ["claude", "codex", "auto-detect"], default: "auto-detect" },
        mode: { type: "string", enum: ["command-only", "write-to-disk"], default: "command-only" },
        scope: { type: "string", enum: ["user", "project"], default: "user" },
      },
      required: ["id"],
    },
  },
];

// --- Rate limiting ---
async function checkRateLimit(req: Request, kv: KVNamespace, rpm: number): Promise<{ ok: boolean; retryAfter: number }> {
  const ip = req.headers.get("cf-connecting-ip") || "unknown";
  const key = `rl:${ip}:${Math.floor(Date.now() / 60000)}`;
  const current = parseInt((await kv.get(key)) || "0", 10);
  if (current >= rpm) {
    return { ok: false, retryAfter: 60 - (Math.floor(Date.now() / 1000) % 60) };
  }
  await kv.put(key, String(current + 1), { expirationTtl: 120 });
  return { ok: true, retryAfter: 0 };
}

// --- Resolve skill via D1 FTS5 ---
async function handleResolve(args: Record<string, unknown>, env: ApiEnv) {
  const query = String(args.query || "");
  const ecosystem = String(args.ecosystem || "any");
  const minQuality = Number(args.min_quality ?? 30);
  const limit = Math.min(Number(args.limit ?? 10), 50);

  let sql = `
    SELECT s.id, s.name, s.description, s.quality_score, s.source_ecosystem,
           s.source_url, s.compat_claude, s.compat_codex, s.tags, s.category,
           s.content_hash, s.star_count
    FROM skills_fts f
    JOIN skills s ON f.id = s.id
    WHERE skills_fts MATCH ?1
      AND s.quality_score >= ?2
      AND s.tombstoned = 0
  `;
  const params: unknown[] = [query, minQuality];

  if (ecosystem !== "any" && ecosystem !== "universal") {
    sql += ` AND s.source_ecosystem = ?${params.length + 1}`;
    params.push(ecosystem);
  }

  sql += `
    ORDER BY
      (bm25(skills_fts) * 1.0) +
      (1.0 - s.quality_score / 100.0) * 2.0
    ASC
    LIMIT ?${params.length + 1}
  `;
  params.push(limit);

  const result = await env.DB.prepare(sql).bind(...params).all();
  const now = new Date().toISOString();

  return (result.results || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    quality_score: row.quality_score,
    quality_grade: row.quality_score >= 85 ? "A" : row.quality_score >= 70 ? "B" : row.quality_score >= 50 ? "C" : row.quality_score >= 30 ? "D" : "F",
    source_ecosystem: row.source_ecosystem,
    source_url: row.source_url,
    compatibility: { claude: !!row.compat_claude, codex: !!row.compat_codex },
    install_commands: [],
    tags: JSON.parse(row.tags || "[]"),
    category: row.category,
    content_hash: row.content_hash,
    meta: { source: "universal-skills-api/d1", fetched_at: now },
  }));
}

// --- Get skill content from D1 + R2 ---
async function handleGetContent(args: Record<string, unknown>, env: ApiEnv) {
  const id = String(args.id);
  const include = (args.include as string[]) || ["metadata", "body"];
  const now = new Date().toISOString();

  const row = await env.DB.prepare("SELECT * FROM skills WHERE id = ?").bind(id).first();
  if (!row) {
    return { id, version: "unknown", sections: { error: `Skill '${id}' not found` }, meta: { source: "universal-skills-api/d1", fetched_at: now } };
  }

  const sections: Record<string, unknown> = {};
  for (const section of include) {
    switch (section) {
      case "metadata":
        sections.metadata = row;
        break;
      case "body": {
        const obj = await env.CONTENT.get(`skills/${id}/latest/skill.md`);
        sections.body = obj ? await obj.text() : "";
        break;
      }
      case "references": {
        const refs = await env.DB.prepare("SELECT * FROM skill_references WHERE skill_id = ? AND version = 'latest'").bind(id).all();
        sections.references = refs.results || [];
        break;
      }
      case "canonical_json": {
        const obj = await env.CONTENT.get(`skills/${id}/latest/canonical.json`);
        sections.canonical_json = obj ? JSON.parse(await obj.text()) : null;
        break;
      }
    }
  }

  return { id, version: (row as any).version || "latest", sections, meta: { source: "universal-skills-api/d1", fetched_at: now } };
}

// --- Install skill ---
async function handleInstall(args: Record<string, unknown>, env: ApiEnv) {
  const id = String(args.id);
  const target = String(args.target || "claude");
  const now = new Date().toISOString();

  const row: any = await env.DB.prepare("SELECT * FROM skills WHERE id = ?").bind(id).first();
  if (!row) {
    return { id, target, command: "", instructions: `Skill '${id}' not found.`, meta: { source: "universal-skills-api/d1", fetched_at: now } };
  }

  // Increment install count
  await env.DB.prepare("UPDATE skills SET install_count = install_count + 1 WHERE id = ?").bind(id).run();

  const name = row.name;
  if (target === "claude") {
    return {
      id, target, mode: args.mode || "command-only", scope: args.scope || "user",
      command: `claude mcp add ${name} -- npx -y @universal-skills/${name}`,
      instructions: `Run the command to add '${name}' to your Claude Code MCP config.`,
      meta: { source: "universal-skills-api/d1", fetched_at: now },
    };
  } else {
    return {
      id, target, mode: args.mode || "command-only", scope: args.scope || "user",
      command: `codex install ${name}`,
      instructions: `Run the command to install '${name}' for Codex.`,
      meta: { source: "universal-skills-api/d1", fetched_at: now },
    };
  }
}

// --- Main handler ---
export default {
  async fetch(req: Request, env: ApiEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    try {
      // Health check
      if (url.pathname === "/health") {
        const dbCheck = await env.DB.prepare("SELECT COUNT(*) as count FROM skills WHERE tombstoned = 0").first();
        return new Response(JSON.stringify({
          status: "ok",
          version: env.REGISTRY_VERSION,
          skills_count: (dbCheck as any)?.count || 0,
          timestamp: new Date().toISOString(),
        }), { headers: { "content-type": "application/json" } });
      }

      // Rate limit (skip for health)
      const rl = await checkRateLimit(req, env.RATE_LIMIT, 60);
      if (!rl.ok) {
        return new Response(JSON.stringify({ error: "rate_limited", retry_after: rl.retryAfter }), {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfter), "content-type": "application/json" },
        });
      }

      // MCP endpoint
      if (url.pathname === "/mcp" && req.method === "POST") {
        const body = (await req.json()) as RpcRequest;

        if (body.jsonrpc !== "2.0" || !body.method) {
          return rpcError(-32600, "Invalid Request", body.id);
        }

        switch (body.method) {
          case "tools/list":
            return rpcResult({ tools: TOOL_DEFS }, body.id);

          case "tools/call": {
            const { name, arguments: args } = (body.params || {}) as { name?: string; arguments?: Record<string, unknown> };
            switch (name) {
              case "resolve-skill":
                return rpcResult({ content: [{ type: "text", text: JSON.stringify(await handleResolve(args || {}, env)) }] }, body.id);
              case "get-skill-content":
                return rpcResult({ content: [{ type: "text", text: JSON.stringify(await handleGetContent(args || {}, env)) }] }, body.id);
              case "install-skill":
                return rpcResult({ content: [{ type: "text", text: JSON.stringify(await handleInstall(args || {}, env)) }] }, body.id);
              default:
                return rpcError(-32601, `Unknown tool: ${name}`, body.id);
            }
          }

          default:
            return rpcError(-32601, `Unknown method: ${body.method}`, body.id);
        }
      }

      // CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "content-type": "application/json" } });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({
        error: "internal_server_error",
        message: err instanceof Error ? err.message : "unknown",
      }), { status: 500, headers: { "content-type": "application/json" } });
    }
  },
};
