/**
 * resolve-skill tool implementation.
 *
 * Phase 2 (npm package): in-memory BM25-lite search over a loaded catalog.
 * Phase 3 (Workers): replaced by D1 FTS5 queries via the API worker.
 *
 * This file implements the stdio/local version that loads skills from
 * a catalog file or fetches from the remote API.
 */
import type { CanonicalSkill, ResolveResult } from "@blazesportsintel/universal-skills-schema";
import { scoreSkill, type QualityScore } from "../lib/scorer.js";

interface ResolveInput {
  query: string;
  ecosystem?: "claude" | "codex" | "universal" | "any";
  category?: string;
  min_quality?: number;
  source_repo?: string;
  limit?: number;
}

// In-memory catalog for stdio mode. Populated by loadCatalog().
let catalog: CanonicalSkill[] = [];

export function loadCatalog(skills: CanonicalSkill[]): void {
  catalog = skills;
}

export function getCatalog(): CanonicalSkill[] {
  return catalog;
}

/**
 * BM25-lite: simple term-frequency scoring for local search.
 * Real BM25 lives in D1 FTS5 (Phase 3).
 */
function bm25Lite(query: string, skill: CanonicalSkill): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;

  const searchable = [
    skill.name,
    skill.description,
    ...(skill.tags || []),
    skill.category || "",
    ...(skill.skills?.[0]?.body || "").slice(0, 500).split(/\s+/),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const term of terms) {
    // Exact match in name gets heavy boost
    if (skill.name.toLowerCase().includes(term)) score += 10;
    // Description match
    if (skill.description.toLowerCase().includes(term)) score += 5;
    // Tag match
    if (skill.tags?.some((t) => t.toLowerCase().includes(term))) score += 8;
    // Category match
    if (skill.category?.toLowerCase().includes(term)) score += 6;
    // Body match (lighter weight)
    const bodyOccurrences = (searchable.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;
    score += Math.min(bodyOccurrences * 0.5, 5);
  }

  return score;
}

export async function handleResolveSkill(input: ResolveInput): Promise<ResolveResult[]> {
  const {
    query,
    ecosystem = "any",
    category,
    min_quality = 30,
    source_repo,
    limit = 10,
  } = input;

  // Filter
  let filtered = catalog.filter((skill) => {
    if (skill.quality_score < min_quality) return false;
    if (ecosystem !== "any" && ecosystem !== "universal") {
      if (skill.origin.ecosystem !== ecosystem) return false;
    }
    if (category && skill.category !== category) return false;
    if (source_repo && skill.origin.repo_name !== source_repo) return false;
    return true;
  });

  // Score and rank: blend BM25-lite with quality score
  const scored = filtered.map((skill) => {
    const textScore = bm25Lite(query, skill);
    const qualityNorm = skill.quality_score / 100;
    // Combined: text relevance + quality weight (2x per ref 09)
    const combined = textScore + qualityNorm * 20;
    return { skill, combined };
  });

  // Sort descending by combined score
  scored.sort((a, b) => b.combined - a.combined);

  // Take top N
  const top = scored.slice(0, limit);

  // Build results
  const now = new Date().toISOString();
  return top.map(({ skill }): ResolveResult => {
    const qs: QualityScore = scoreSkill(skill, skill.origin.star_count);
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      quality_score: qs.total,
      quality_grade: qs.grade,
      source_ecosystem: skill.origin.ecosystem,
      source_url: skill.origin.repo_url,
      compatibility: {
        claude: skill.compatibility.claude,
        codex: skill.compatibility.codex,
      },
      install_commands: skill.install_commands,
      tags: skill.tags,
      category: skill.category,
      content_hash: skill.content_hash,
      meta: {
        source: "universal-skills-mcp/stdio",
        fetched_at: now,
      },
    };
  });
}
