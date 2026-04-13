/**
 * Claude Code plugin manifest schemas.
 *
 * Claude's plugin format is intentionally minimal:
 *   .claude-plugin/plugin.json — 3-5 fields (name, description, author)
 *   .mcp.json — flat: {"<name>": {"command": "...", "args": [...]}}
 *
 * Convention-based: directory structure IS the schema.
 * skills/ directory contains SKILL.md files with YAML frontmatter.
 */
import { z } from "zod";

export const ClaudePluginManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  author: z.string().optional(),
  version: z.string().optional(),
  repository: z.string().url().optional(),
});
export type ClaudePluginManifest = z.infer<typeof ClaudePluginManifestSchema>;

export const ClaudeMcpEntrySchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  type: z.enum(["stdio", "http", "sse"]).optional(),
  url: z.string().url().optional(),
  env: z.record(z.string()).optional(),
});
export type ClaudeMcpEntry = z.infer<typeof ClaudeMcpEntrySchema>;

// Claude .mcp.json is FLAT: {"<name>": {command, args, ...}}
export const ClaudeMcpJsonSchema = z.record(z.string(), ClaudeMcpEntrySchema);
export type ClaudeMcpJson = z.infer<typeof ClaudeMcpJsonSchema>;

// Claude marketplace.json shape (from .claude-plugin/marketplace.json)
export const ClaudeMarketplaceEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  author: z.string().optional(),
  install: z.string().optional(),
  source: z.string().url().optional(),
});
export type ClaudeMarketplaceEntry = z.infer<typeof ClaudeMarketplaceEntrySchema>;

export const ClaudeMarketplaceJsonSchema = z.object({
  plugins: z.array(ClaudeMarketplaceEntrySchema),
  updated_at: z.string().datetime().optional(),
  source: z.string().optional(),
});
export type ClaudeMarketplaceJson = z.infer<typeof ClaudeMarketplaceJsonSchema>;

// SKILL.md frontmatter (the YAML header in a Claude skill)
export const ClaudeSkillFrontmatterSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
}).passthrough(); // allow additional fields
export type ClaudeSkillFrontmatter = z.infer<typeof ClaudeSkillFrontmatterSchema>;
