/**
 * @blazesportsintel/universal-skills-schema
 *
 * Canonical, Claude, and Codex schema definitions for the Universal Skills Marketplace.
 * All translation flows through the canonical intermediate format.
 */

// Canonical (the bridge)
export {
  CanonicalSkillSchema,
  ResolveResultSchema,
  AuthorSchema,
  SkillOriginSchema,
  SkillEntrySchema,
  AgentEntrySchema,
  CommandEntrySchema,
  HooksBlockSchema,
  CodexInterfaceSchema,
  TranslationLogEntrySchema,
  type CanonicalSkill,
  type ResolveResult,
  type Author,
  type SkillOrigin,
  type SkillEntry,
  type AgentEntry,
  type CommandEntry,
  type HooksBlock,
  type CodexInterface,
  type TranslationLogEntry,
} from "./canonical.js";

// Claude ecosystem
export {
  ClaudePluginManifestSchema,
  ClaudeMcpEntrySchema,
  ClaudeMcpJsonSchema,
  ClaudeMarketplaceJsonSchema,
  ClaudeMarketplaceEntrySchema,
  ClaudeSkillFrontmatterSchema,
  type ClaudePluginManifest,
  type ClaudeMcpEntry,
  type ClaudeMcpJson,
  type ClaudeMarketplaceJson,
  type ClaudeMarketplaceEntry,
  type ClaudeSkillFrontmatter,
} from "./claude.js";

// Codex ecosystem
export {
  CodexPluginManifestSchema,
  CodexInterfaceBlockSchema,
  CodexAppEntrySchema,
  CodexAuthorSchema,
  CodexHooksSchema,
  CodexMcpEntrySchema,
  CodexMcpJsonSchema,
  CodexMarketplaceJsonSchema,
  CodexMarketplaceEntrySchema,
  type CodexPluginManifest,
  type CodexInterfaceBlock,
  type CodexAppEntry,
  type CodexAuthor,
  type CodexHooks,
  type CodexMcpEntry,
  type CodexMcpJson,
  type CodexMarketplaceJson,
  type CodexMarketplaceEntry,
} from "./codex.js";
