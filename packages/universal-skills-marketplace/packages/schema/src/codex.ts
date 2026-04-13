/**
 * OpenAI Codex plugin manifest schemas.
 *
 * Codex's plugin format is richer than Claude's:
 *   .codex-plugin/plugin.json — includes interface{}, apps{}, keywords[], license
 *   .codex/config.toml — TOML: [mcp_servers.<name>]
 *
 * The interface block describes how to invoke the MCP server.
 * The apps block describes per-client install commands.
 */
import { z } from "zod";

export const CodexInterfaceBlockSchema = z.object({
  type: z.string().default("mcp"),
  transport: z.enum(["stdio", "http", "sse"]).default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  env: z.record(z.string()).optional(),
});
export type CodexInterfaceBlock = z.infer<typeof CodexInterfaceBlockSchema>;

export const CodexAppEntrySchema = z.object({
  supported: z.boolean().default(true),
  install: z.string().optional(),
  notes: z.string().optional(),
});
export type CodexAppEntry = z.infer<typeof CodexAppEntrySchema>;

export const CodexAuthorSchema = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
});
export type CodexAuthor = z.infer<typeof CodexAuthorSchema>;

export const CodexHooksSchema = z.object({
  pre_install: z.string().optional(),
  post_install: z.string().optional(),
  pre_uninstall: z.string().optional(),
}).optional();
export type CodexHooks = z.infer<typeof CodexHooksSchema>;

export const CodexPluginManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().default("0.1.0"),
  description: z.string().min(1),
  author: z.union([z.string(), CodexAuthorSchema]),
  license: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  interface: CodexInterfaceBlockSchema.optional(),
  apps: z.record(z.string(), CodexAppEntrySchema).optional(),
  hooks: CodexHooksSchema,
  repository: z.object({
    type: z.string().default("git"),
    url: z.string().url(),
    directory: z.string().optional(),
  }).optional(),
});
export type CodexPluginManifest = z.infer<typeof CodexPluginManifestSchema>;

// Codex .mcp.json is WRAPPED: {"mcpServers": {"<name>": {...}}}
export const CodexMcpEntrySchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  transport: z.string().optional(),
  url: z.string().url().optional(),
  env: z.record(z.string()).optional(),
});
export type CodexMcpEntry = z.infer<typeof CodexMcpEntrySchema>;

export const CodexMcpJsonSchema = z.object({
  mcpServers: z.record(z.string(), CodexMcpEntrySchema),
});
export type CodexMcpJson = z.infer<typeof CodexMcpJsonSchema>;

// Codex marketplace.json (from .agents/plugins/marketplace.json)
export const CodexMarketplaceEntrySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  description: z.string(),
  author: z.union([z.string(), CodexAuthorSchema]).optional(),
  license: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  install: z.string().optional(),
  source: z.string().url().optional(),
  interface: CodexInterfaceBlockSchema.optional(),
});
export type CodexMarketplaceEntry = z.infer<typeof CodexMarketplaceEntrySchema>;

export const CodexMarketplaceJsonSchema = z.object({
  plugins: z.array(CodexMarketplaceEntrySchema),
  updated_at: z.string().datetime().optional(),
  source: z.string().optional(),
});
export type CodexMarketplaceJson = z.infer<typeof CodexMarketplaceJsonSchema>;
