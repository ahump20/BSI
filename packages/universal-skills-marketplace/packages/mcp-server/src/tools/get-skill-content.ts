/**
 * get-skill-content tool implementation.
 *
 * Progressive disclosure: caller chooses which sections to include.
 * Phase 2: reads from in-memory catalog.
 * Phase 3: fetches from R2 via the API worker.
 */
import type { CanonicalSkill } from "@blazesportsintel/universal-skills-schema";
import { getCatalog } from "./resolve-skill.js";

interface GetContentInput {
  id: string;
  include?: Array<"metadata" | "body" | "references" | "scripts" | "assets" | "canonical_json">;
  version?: string;
}

interface ContentResult {
  id: string;
  version: string;
  sections: Record<string, unknown>;
  meta: {
    source: string;
    fetched_at: string;
  };
}

export async function handleGetSkillContent(input: GetContentInput): Promise<ContentResult> {
  const { id, include = ["metadata", "body"], version } = input;
  const now = new Date().toISOString();

  const catalog = getCatalog();
  const skill = catalog.find((s) => s.id === id);

  if (!skill) {
    return {
      id,
      version: version || "unknown",
      sections: { error: `Skill '${id}' not found in catalog` },
      meta: { source: "universal-skills-mcp/stdio", fetched_at: now },
    };
  }

  const primary = skill.skills[0];
  const sections: Record<string, unknown> = {};

  for (const section of include) {
    switch (section) {
      case "metadata":
        sections.metadata = {
          id: skill.id,
          name: skill.name,
          version: skill.version,
          description: skill.description,
          author: skill.author,
          license: skill.license,
          tags: skill.tags,
          category: skill.category,
          quality_score: skill.quality_score,
          origin: skill.origin,
          compatibility: skill.compatibility,
          install_commands: skill.install_commands,
          indexed_at: skill.indexed_at,
        };
        break;

      case "body":
        sections.body = primary?.body || "";
        break;

      case "references":
        sections.references = (primary?.references || []).map((r) => ({
          path: r.path,
          kind: r.kind,
          size_bytes: r.size_bytes,
          // Content not included in stdio mode — would need R2 fetch
          content_available: false,
        }));
        break;

      case "scripts":
        sections.scripts = (primary?.scripts || []).map((s) => ({
          path: s.path,
          size_bytes: s.size_bytes,
          content_available: false,
        }));
        break;

      case "assets":
        sections.assets = (primary?.assets || []).map((a) => ({
          path: a.path,
          mime: a.mime,
          size_bytes: a.size_bytes,
          content_available: false,
        }));
        break;

      case "canonical_json":
        sections.canonical_json = skill;
        break;
    }
  }

  return {
    id: skill.id,
    version: version || skill.version,
    sections,
    meta: { source: "universal-skills-mcp/stdio", fetched_at: now },
  };
}
