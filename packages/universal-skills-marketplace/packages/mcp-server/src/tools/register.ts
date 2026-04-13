/**
 * Tool registration — Pattern B (search + execute).
 *
 * 3 tools, same as Context7:
 *   1. resolve-skill   — search the catalog
 *   2. get-skill-content — fetch progressive-disclosure content
 *   3. install-skill    — generate install commands or write config
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleResolveSkill } from "./resolve-skill.js";
import { handleGetSkillContent } from "./get-skill-content.js";
import { handleInstallSkill } from "./install-skill.js";

export function registerTools(server: McpServer): void {
  // Tool 1: resolve-skill
  server.tool(
    "resolve-skill",
    "Search the universal skills catalog. Returns ranked results from both Claude Code and OpenAI Codex ecosystems with quality scores and install commands.",
    {
      query: z.string().min(1).max(500).describe("Natural-language search query (e.g., 'PDF processing', 'database migration')"),
      ecosystem: z.enum(["claude", "codex", "universal", "any"]).default("any").describe("Filter by source ecosystem"),
      category: z.string().optional().describe("Filter by category slug"),
      min_quality: z.number().int().min(0).max(100).default(30).describe("Minimum quality score (0-100, default 30)"),
      source_repo: z.string().optional().describe("Filter by source repo name"),
      limit: z.number().int().min(1).max(50).default(10).describe("Max results to return"),
    },
    async (args) => {
      const results = await handleResolveSkill(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // Tool 2: get-skill-content
  server.tool(
    "get-skill-content",
    "Fetch the full content of a skill by ID. Supports progressive disclosure — request metadata, body, references, scripts, assets, or canonical JSON.",
    {
      id: z.string().min(1).describe("Skill ID from resolve-skill results"),
      include: z.array(z.enum(["metadata", "body", "references", "scripts", "assets", "canonical_json"]))
        .default(["metadata", "body"])
        .describe("Which content sections to include"),
      version: z.string().optional().describe("Specific version (defaults to latest)"),
    },
    async (args) => {
      const content = await handleGetSkillContent(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(content, null, 2) }],
      };
    }
  );

  // Tool 3: install-skill
  server.tool(
    "install-skill",
    "Generate install commands for a skill, targeting Claude Code or OpenAI Codex. Can auto-detect the current environment.",
    {
      id: z.string().min(1).describe("Skill ID to install"),
      target: z.enum(["claude", "codex", "auto-detect"]).default("auto-detect").describe("Target ecosystem"),
      mode: z.enum(["command-only", "write-to-disk"]).default("command-only").describe("'command-only' returns the command; 'write-to-disk' modifies config files"),
      scope: z.enum(["user", "project"]).default("user").describe("Install scope"),
    },
    async (args) => {
      const result = await handleInstallSkill(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
