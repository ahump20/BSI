/**
 * Universal Skills Bridge Worker — dual marketplace.json endpoints.
 *
 * Serves the same catalog in both ecosystem formats:
 *   GET /.claude-plugin/marketplace.json   → Claude format
 *   GET /.agents/plugins/marketplace.json  → Codex format
 *   GET /.well-known/universal-skills.json → Canonical format
 *   GET /health                            → Health check
 *
 * Read-only, backed by D1.
 */
import type { BridgeEnv, SkillRow } from "../../shared/types.js";

// Render Claude marketplace.json format
function renderClaudeMarketplace(skills: SkillRow[]): object {
  return {
    plugins: skills.map((s) => ({
      name: s.name,
      description: s.description,
      author: "Universal Skills Marketplace (unofficial)",
      install: `claude mcp add ${s.name} -- npx -y @universal-skills/${s.name}`,
      source: s.source_url,
    })),
    updated_at: new Date().toISOString(),
    source: "https://marketplace.blazesportsintel.com — unofficial, not affiliated with Anthropic or OpenAI",
  };
}

// Render Codex marketplace.json format
function renderCodexMarketplace(skills: SkillRow[]): object {
  return {
    plugins: skills.map((s) => ({
      name: s.name,
      version: "0.1.0",
      description: s.description,
      author: { name: "Universal Skills Marketplace", url: "https://marketplace.blazesportsintel.com" },
      license: "MIT",
      keywords: JSON.parse(s.tags || "[]"),
      install: `codex install ${s.name}`,
      source: s.source_url,
      interface: {
        type: "mcp",
        transport: "stdio",
        command: "npx",
        args: ["-y", `@universal-skills/${s.name}`],
      },
    })),
    updated_at: new Date().toISOString(),
    source: "https://marketplace.blazesportsintel.com — unofficial, not affiliated with Anthropic or OpenAI",
  };
}

// Render canonical universal format
function renderUniversalCatalog(skills: SkillRow[]): object {
  return {
    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      quality_score: s.quality_score,
      source_ecosystem: s.source_ecosystem,
      source_url: s.source_url,
      compatibility: { claude: !!s.compat_claude, codex: !!s.compat_codex },
      tags: JSON.parse(s.tags || "[]"),
      category: s.category,
    })),
    total: skills.length,
    updated_at: new Date().toISOString(),
    notice: "Unofficial. Not affiliated with Anthropic or OpenAI. See https://marketplace.blazesportsintel.com/NOTICE",
  };
}

async function getActiveSkills(db: D1Database): Promise<SkillRow[]> {
  const result = await db.prepare(
    "SELECT * FROM skills WHERE tombstoned = 0 AND quality_score >= 30 ORDER BY quality_score DESC LIMIT 500"
  ).all();
  return (result.results || []) as unknown as SkillRow[];
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=600, s-maxage=600",
};

export default {
  async fetch(req: Request, env: BridgeEnv): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // Health check
      if (url.pathname === "/health") {
        const count = await env.DB.prepare("SELECT COUNT(*) as count FROM skills WHERE tombstoned = 0").first();
        return new Response(JSON.stringify({
          status: "ok",
          worker: "universal-skills-bridge",
          skills_count: (count as any)?.count || 0,
          timestamp: new Date().toISOString(),
        }), { headers: { ...CORS_HEADERS, "content-type": "application/json" } });
      }

      // Claude marketplace.json
      if (url.pathname === "/.claude-plugin/marketplace.json") {
        const skills = await getActiveSkills(env.DB);
        return new Response(JSON.stringify(renderClaudeMarketplace(skills), null, 2), {
          headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
      }

      // Codex marketplace.json
      if (url.pathname === "/.agents/plugins/marketplace.json") {
        const skills = await getActiveSkills(env.DB);
        return new Response(JSON.stringify(renderCodexMarketplace(skills), null, 2), {
          headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
      }

      // Universal catalog
      if (url.pathname === "/.well-known/universal-skills.json") {
        const skills = await getActiveSkills(env.DB);
        return new Response(JSON.stringify(renderUniversalCatalog(skills), null, 2), {
          headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
      }

      // Root: info page
      if (url.pathname === "/") {
        return new Response(JSON.stringify({
          name: "Universal Skills Marketplace",
          description: "Context7-pattern bridge for Claude Code and OpenAI Codex skill ecosystems. Unofficial.",
          endpoints: {
            claude_marketplace: "/.claude-plugin/marketplace.json",
            codex_marketplace: "/.agents/plugins/marketplace.json",
            universal_catalog: "/.well-known/universal-skills.json",
            health: "/health",
          },
          notice: "Not affiliated with Anthropic or OpenAI.",
          source: "https://github.com/ahump20/BSI/tree/main/packages/universal-skills-marketplace",
        }, null, 2), { headers: { ...CORS_HEADERS, "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({
        error: "internal_server_error",
        message: err instanceof Error ? err.message : "unknown",
      }), { status: 500, headers: { "content-type": "application/json" } });
    }
  },
};
