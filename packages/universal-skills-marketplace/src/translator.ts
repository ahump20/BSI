/**
 * Re-exports from the canonical MCP server package.
 * Translator implementation lives in packages/mcp-server/src/lib/translator.ts.
 *
 * ClaudOpenAI is unofficial — not affiliated with Anthropic or OpenAI.
 */
export {
  claudeToCanonical,
  codexToCanonical,
  standaloneToCanonical,
  canonicalToClaude,
  canonicalToCodex,
} from "@blazesportsintel/universal-skills-mcp/lib/translator";
