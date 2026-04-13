/**
 * Registry — GitHub API search fallback for standalone use.
 *
 * This module exists for the flat src/ entry point. The canonical
 * implementation is in packages/mcp-server/src/tools/resolve-skill.ts
 * (in-memory BM25-lite) and workers/universal-skills-api/ (D1 FTS5).
 *
 * This file is DEPRECATED — kept for backward compatibility only.
 * New code should use the packages/ implementations directly.
 *
 * ClaudOpenAI is unofficial — not affiliated with Anthropic or OpenAI.
 */

// Re-export the stdio-mode resolve handler from the MCP server package
export { handleResolveSkill as searchSkills } from "@blazesportsintel/universal-skills-mcp/tools/resolve-skill";
export { loadCatalog, getCatalog } from "@blazesportsintel/universal-skills-mcp/tools/resolve-skill";
