/**
 * Canonical intermediate format for the Universal Skills Marketplace.
 *
 * All translations flow through this:
 *   ClaudePlugin → CanonicalSkill ← CodexPlugin
 *   CanonicalSkill → ClaudePlugin | CodexPlugin
 *
 * Never translate directly between ecosystems.
 */
import { z } from "zod";

// --- Sub-schemas ---

export const AuthorSchema = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
});
export type Author = z.infer<typeof AuthorSchema>;

export const SkillOriginSchema = z.object({
  ecosystem: z.enum(["claude", "codex", "standalone", "unknown"]),
  repo_url: z.string().url(),
  repo_name: z.string(),
  branch: z.string().default("main"),
  commit_sha: z.string().optional(),
  path_in_repo: z.string(),
  manifest_format: z.enum(["claude-plugin", "codex-plugin", "standalone-skill", "unknown"]),
  star_count: z.number().int().min(0).default(0),
  last_push_at: z.string().datetime().optional(),
});
export type SkillOrigin = z.infer<typeof SkillOriginSchema>;

export const CommandEntrySchema = z.object({
  ecosystem: z.enum(["claude", "codex"]),
  install_command: z.string(),
  mcp_json_snippet: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});
export type CommandEntry = z.infer<typeof CommandEntrySchema>;

export const SkillEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  frontmatter: z.record(z.unknown()).default({}),
  body: z.string().default(""),
  references: z.array(z.object({
    path: z.string(),
    kind: z.enum(["reference", "script", "asset", "template", "fixture", "unknown"]).default("reference"),
    sha256: z.string().optional(),
    size_bytes: z.number().int().optional(),
    mime: z.string().optional(),
  })).default([]),
  scripts: z.array(z.object({
    path: z.string(),
    sha256: z.string().optional(),
    size_bytes: z.number().int().optional(),
  })).default([]),
  assets: z.array(z.object({
    path: z.string(),
    sha256: z.string().optional(),
    size_bytes: z.number().int().optional(),
    mime: z.string().optional(),
  })).default([]),
});
export type SkillEntry = z.infer<typeof SkillEntrySchema>;

export const AgentEntrySchema = z.object({
  name: z.string(),
  model: z.string().optional(),
  instructions: z.string().optional(),
  tools: z.array(z.string()).default([]),
});
export type AgentEntry = z.infer<typeof AgentEntrySchema>;

export const HooksBlockSchema = z.object({
  pre_install: z.string().optional(),
  post_install: z.string().optional(),
  pre_uninstall: z.string().optional(),
}).default({});
export type HooksBlock = z.infer<typeof HooksBlockSchema>;

export const CodexInterfaceSchema = z.object({
  type: z.string().default("mcp"),
  transport: z.string().default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().url().optional(),
}).optional();
export type CodexInterface = z.infer<typeof CodexInterfaceSchema>;

export const TranslationLogEntrySchema = z.object({
  field: z.string(),
  source_ecosystem: z.enum(["claude", "codex", "standalone"]),
  action: z.enum(["mapped", "shimmed", "dropped", "defaulted", "inferred"]),
  detail: z.string(),
  timestamp: z.string().datetime(),
});
export type TranslationLogEntry = z.infer<typeof TranslationLogEntrySchema>;

// --- Main canonical schema ---

export const CanonicalSkillSchema = z.object({
  // Identity
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().default("0.1.0"),
  description: z.string().min(1),
  author: AuthorSchema.optional(),
  license: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),

  // Origin
  origin: SkillOriginSchema,

  // Content
  skills: z.array(SkillEntrySchema).min(1),
  agents: z.array(AgentEntrySchema).default([]),

  // Cross-ecosystem
  install_commands: z.array(CommandEntrySchema).default([]),
  compatibility: z.object({
    claude: z.boolean().default(false),
    codex: z.boolean().default(false),
  }).default({ claude: false, codex: false }),

  // Codex-specific fields preserved in canonical
  codex_interface: CodexInterfaceSchema,
  hooks: HooksBlockSchema,

  // Quality
  quality_score: z.number().int().min(0).max(100).default(0),
  content_hash: z.string().optional(),

  // Translation provenance
  translation_log: z.array(TranslationLogEntrySchema).default([]),
  ecosystem_extensions: z.record(z.unknown()).default({}),

  // Timestamps
  indexed_at: z.string().datetime(),
  last_verified: z.string().datetime().optional(),
});
export type CanonicalSkill = z.infer<typeof CanonicalSkillSchema>;

// --- Resolve result (what the MCP tool returns) ---

export const ResolveResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  quality_score: z.number(),
  quality_grade: z.enum(["A", "B", "C", "D", "F"]),
  source_ecosystem: z.string(),
  source_url: z.string(),
  compatibility: z.object({
    claude: z.boolean(),
    codex: z.boolean(),
  }),
  install_commands: z.array(CommandEntrySchema),
  tags: z.array(z.string()),
  category: z.string().optional(),
  content_hash: z.string().optional(),
  meta: z.object({
    source: z.string(),
    fetched_at: z.string(),
  }),
});
export type ResolveResult = z.infer<typeof ResolveResultSchema>;
