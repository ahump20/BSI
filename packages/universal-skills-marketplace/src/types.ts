/**
 * Re-exports from the canonical schema package.
 * All types live in packages/schema/src/ — this file exists for
 * backward compatibility with imports from "src/types".
 *
 * ClaudOpenAI is unofficial — not affiliated with Anthropic or OpenAI.
 */
export type {
  CanonicalSkill,
  SkillEntry,
  SkillOrigin,
  Author,
  CommandEntry,
  AgentEntry,
  HooksBlock,
  CodexInterface,
  TranslationLogEntry,
  ResolveResult,
} from "@blazesportsintel/universal-skills-schema";

export {
  CanonicalSkillSchema,
  SkillEntrySchema,
  SkillOriginSchema,
  AuthorSchema,
  CommandEntrySchema,
  AgentEntrySchema,
  TranslationLogEntrySchema,
  ResolveResultSchema,
} from "@blazesportsintel/universal-skills-schema";

// Legacy aliases for the flat src/ consumers
export type Ecosystem = "claude" | "codex" | "universal" | "standalone" | "unknown";

export interface QualityBreakdown {
  has_references: number;
  has_scripts: number;
  description_quality: number;
  has_examples: number;
  passes_validation: number;
  star_weight: number;
  has_tests: number;
}

export interface QualityScore {
  total: number;
  breakdown: QualityBreakdown;
  grade: "A" | "B" | "C" | "D" | "F";
}
