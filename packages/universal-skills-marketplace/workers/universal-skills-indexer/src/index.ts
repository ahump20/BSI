/**
 * Universal Skills Indexer Worker — cron-driven GitHub indexer.
 *
 * Every 6 hours:
 *   1. List sources from D1
 *   2. For each source: ls-remote → delta check → sparse-clone → walk
 *   3. Normalize found skills → canonical JSON
 *   4. Score quality
 *   5. UPSERT into D1, write content to R2
 *
 * See references/08-github-indexer-design.md for full algorithm.
 */
import type { IndexerEnv, SourceRow } from "../../shared/types.js";

// GitHub API helpers
async function getRepoHead(source: SourceRow, token: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${extractOwnerRepo(source.repo_url)}/git/ref/heads/${source.default_branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "universal-skills-indexer/0.1.0",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { object?: { sha?: string } };
  return data.object?.sha || null;
}

function extractOwnerRepo(repoUrl: string): string {
  // https://github.com/owner/repo → owner/repo
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1].replace(/\.git$/, "") : "";
}

// Find SKILL.md files via GitHub Trees API (sparse-clone equivalent)
async function findSkillFiles(source: SourceRow, sha: string, token: string): Promise<Array<{ path: string; sha: string }>> {
  const ownerRepo = extractOwnerRepo(source.repo_url);
  const url = `https://api.github.com/repos/${ownerRepo}/git/trees/${sha}?recursive=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "universal-skills-indexer/0.1.0",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { tree?: Array<{ path: string; sha: string; type: string }> };
  return (data.tree || [])
    .filter((entry) => entry.type === "blob" && /SKILL\.md$/i.test(entry.path))
    .map((entry) => ({ path: entry.path, sha: entry.sha }));
}

// Fetch file content via GitHub blob API
async function fetchBlob(ownerRepo: string, blobSha: string, token: string): Promise<string> {
  const url = `https://api.github.com/repos/${ownerRepo}/git/blobs/${blobSha}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "universal-skills-indexer/0.1.0",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (data.encoding === "base64" && data.content) {
    return atob(data.content.replace(/\n/g, ""));
  }
  return data.content || "";
}

// Parse YAML frontmatter from SKILL.md
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const yamlStr = match[1];
  const body = match[2];

  // Simple YAML parser for key: value pairs
  const frontmatter: Record<string, unknown> = {};
  for (const line of yamlStr.split("\n")) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (kv) {
      const val = kv[2].trim();
      // Handle arrays (simple inline)
      if (val.startsWith("[") && val.endsWith("]")) {
        frontmatter[kv[1]] = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
      } else {
        frontmatter[kv[1]] = val.replace(/^['"]|['"]$/g, "");
      }
    }
  }
  return { frontmatter, body };
}

// Generate a content hash
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// UPSERT a skill into D1
async function upsertSkill(db: D1Database, skill: {
  id: string;
  name: string;
  description: string;
  source_ecosystem: string;
  source_url: string;
  source_repo: string;
  source_commit: string;
  source_path: string;
  manifest_format: string;
  quality_score: number;
  star_count: number;
  content_hash: string;
  tags: string[];
  category?: string;
}) {
  await db.prepare(`
    INSERT INTO skills (id, name, description, source_ecosystem, source_url, source_repo,
      source_commit, source_path, manifest_format, quality_score, star_count, content_hash,
      compat_claude, compat_codex, tags, category, indexed_at, tombstoned)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1, 1, ?13, ?14, ?15, 0)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      quality_score = excluded.quality_score,
      star_count = excluded.star_count,
      content_hash = excluded.content_hash,
      source_commit = excluded.source_commit,
      tags = excluded.tags,
      category = excluded.category,
      indexed_at = excluded.indexed_at,
      tombstoned = 0
  `).bind(
    skill.id, skill.name, skill.description, skill.source_ecosystem,
    skill.source_url, skill.source_repo, skill.source_commit, skill.source_path,
    skill.manifest_format, skill.quality_score, skill.star_count, skill.content_hash,
    JSON.stringify(skill.tags), skill.category || null, new Date().toISOString(),
  ).run();
}

// --- Main index cycle ---
async function runIndexCycle(env: IndexerEnv): Promise<void> {
  const sources = await env.DB.prepare("SELECT * FROM sources ORDER BY priority_tier ASC").all();

  for (const src of (sources.results || []) as unknown as SourceRow[]) {
    try {
      console.log(`Indexing source: ${src.name}`);
      const headSha = await getRepoHead(src, env.GITHUB_TOKEN);
      if (!headSha) {
        console.log(`Could not get HEAD for ${src.name}, skipping`);
        await env.DB.prepare("UPDATE sources SET last_check_at = ?, last_result = 'error', error_message = 'Could not fetch HEAD' WHERE name = ?")
          .bind(new Date().toISOString(), src.name).run();
        continue;
      }

      // Delta check
      const lastSyncSha = await env.INDEXER_STATE.get(`sha:${src.name}`);
      if (headSha === lastSyncSha) {
        console.log(`${src.name} unchanged (${headSha.slice(0, 8)}), skipping`);
        await env.INDEXER_STATE.put(`last_checked:${src.name}`, new Date().toISOString());
        await env.DB.prepare("UPDATE sources SET last_check_at = ? WHERE name = ?")
          .bind(new Date().toISOString(), src.name).run();
        continue;
      }

      // Find SKILL.md files
      const skillFiles = await findSkillFiles(src, headSha, env.GITHUB_TOKEN);
      console.log(`Found ${skillFiles.length} SKILL.md files in ${src.name}`);

      const ownerRepo = extractOwnerRepo(src.repo_url);
      let indexedCount = 0;

      for (const file of skillFiles) {
        try {
          const content = await fetchBlob(ownerRepo, file.sha, env.GITHUB_TOKEN);
          if (!content) continue;

          const { frontmatter, body } = parseFrontmatter(content);
          const name = (frontmatter.name as string) || file.path.split("/").slice(-2, -1)[0] || "unknown";
          const description = (frontmatter.description as string) || "";
          const skillId = `${src.name}/${name}`.toLowerCase();
          const contentHash = await hashContent(content);

          // Simple quality score (basic heuristic — full scorer runs on canonical JSON)
          let qualityScore = 0;
          if (frontmatter.name && frontmatter.description) qualityScore += 20;
          if (description.length >= 100) qualityScore += 5;
          if (/##\s+Examples?\s*$/im.test(body)) qualityScore += 10;

          await upsertSkill(env.DB, {
            id: skillId,
            name,
            description,
            source_ecosystem: src.name.startsWith("openai") ? "codex" : src.name.startsWith("anthropic") ? "claude" : "standalone",
            source_url: `${src.repo_url}/blob/${src.default_branch}/${file.path}`,
            source_repo: src.name,
            source_commit: headSha,
            source_path: file.path,
            manifest_format: src.name.startsWith("openai") ? "codex-plugin" : "claude-plugin",
            quality_score: qualityScore,
            star_count: 0,
            content_hash: contentHash,
            tags: (frontmatter.tags as string[]) || [],
            category: frontmatter.category as string | undefined,
          });

          // Write content to R2
          await env.CONTENT.put(`skills/${skillId}/latest/skill.md`, content);
          indexedCount++;
        } catch (fileErr) {
          console.error(`Error indexing ${file.path} in ${src.name}:`, fileErr);
        }
      }

      // Update state
      await env.INDEXER_STATE.put(`sha:${src.name}`, headSha);
      await env.DB.prepare("UPDATE sources SET last_sync_sha = ?, last_sync_at = ?, last_check_at = ?, last_result = 'success', error_message = NULL WHERE name = ?")
        .bind(headSha, new Date().toISOString(), new Date().toISOString(), src.name).run();
      console.log(`Indexed ${indexedCount} skills from ${src.name}`);

    } catch (err) {
      console.error(`Indexer failed for ${src.name}:`, err);
      await env.DB.prepare("UPDATE sources SET last_check_at = ?, last_result = 'error', error_message = ? WHERE name = ?")
        .bind(new Date().toISOString(), err instanceof Error ? err.message : "unknown", src.name).run();
    }
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: IndexerEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runIndexCycle(env));
  },

  async fetch(req: Request, env: IndexerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", worker: "universal-skills-indexer" }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.pathname === "/run" && req.method === "POST") {
      ctx.waitUntil(runIndexCycle(env));
      return new Response(JSON.stringify({ started: true, timestamp: new Date().toISOString() }), {
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  },
};
