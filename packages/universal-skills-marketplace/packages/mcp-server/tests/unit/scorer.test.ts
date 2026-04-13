/**
 * Quality scorer unit tests.
 *
 * Test vectors from references/09-quality-scoring-rubric.md:
 * - Well-structured skill with references/scripts/tests → high score
 * - Minimal stub → low score
 * - Score is deterministic
 * - Breakdown sums to total
 */
import { describe, it, expect } from "vitest";
import { scoreSkill, type QualityScore } from "../../src/lib/scorer.js";
import type { CanonicalSkill } from "@blazesportsintel/universal-skills-schema";

function makeSkill(overrides: Partial<CanonicalSkill> = {}): CanonicalSkill {
  const now = new Date().toISOString();
  return {
    id: "test/skill",
    name: "test-skill",
    version: "0.1.0",
    description: "A test skill",
    tags: [],
    origin: {
      ecosystem: "claude",
      repo_url: "https://github.com/test/repo",
      repo_name: "test/repo",
      branch: "main",
      path_in_repo: "skills/test",
      manifest_format: "claude-plugin",
      star_count: 0,
    },
    skills: [
      {
        name: "test-skill",
        description: "A test skill",
        frontmatter: { name: "test-skill", description: "A test skill" },
        body: "",
        references: [],
        scripts: [],
        assets: [],
      },
    ],
    agents: [],
    install_commands: [],
    compatibility: { claude: true, codex: false },
    hooks: {},
    quality_score: 0,
    translation_log: [],
    ecosystem_extensions: {},
    indexed_at: now,
    ...overrides,
  };
}

describe("scoreSkill", () => {
  it("well-structured skill scores >= 70 (production-ready bar)", () => {
    const skill = makeSkill({
      description: "A comprehensive PDF processing skill. Use when you need to extract text, merge documents, or convert formats. Triggers on PDF mentions.",
      skills: [
        {
          name: "pdf",
          description: "PDF processing skill with references and tests",
          frontmatter: { name: "pdf", description: "PDF processing skill with references and tests" },
          body: "# PDF Skill\n\n## Examples\n\nHere are some examples of usage.",
          references: [
            { path: "references/api.md" },
            { path: "references/config.md" },
            { path: "references/advanced.md" },
          ],
          scripts: [
            { path: "scripts/validate.sh" },
            { path: "scripts/test-roundtrip.ts" },
          ],
          assets: [],
        },
      ],
    });
    const score = scoreSkill(skill, 16679); // high star count
    expect(score.total).toBeGreaterThanOrEqual(70);
    expect(score.grade).toMatch(/^[AB]$/);
  });

  it("minimal stub scores < 30 (grade F or D)", () => {
    const stub = makeSkill({
      description: "Stub",
      skills: [
        {
          name: "stub",
          description: "Stub",
          frontmatter: {},
          body: "",
          references: [],
          scripts: [],
          assets: [],
        },
      ],
    });
    const score = scoreSkill(stub, 0);
    expect(score.total).toBeLessThan(30);
  });

  it("score is deterministic", () => {
    const skill = makeSkill({
      description: "A moderately complex skill for testing determinism. Use when verifying scorer consistency.",
      skills: [
        {
          name: "determ",
          description: "Determinism test",
          frontmatter: { name: "determ", description: "Determinism test" },
          body: "## Examples\n\nExample content here.",
          references: [{ path: "ref/a.md" }, { path: "ref/b.md" }],
          scripts: [{ path: "scripts/test-foo.ts" }],
          assets: [],
        },
      ],
    });
    const s1 = scoreSkill(skill, 1000);
    const s2 = scoreSkill(skill, 1000);
    expect(s1).toEqual(s2);
  });

  it("breakdown sums to total (capped at 100)", () => {
    const skill = makeSkill({
      description: "A well-documented skill with triggers on many patterns and use when needed for comprehensive testing.",
      skills: [
        {
          name: "sum-test",
          description: "Sum test",
          frontmatter: { name: "sum-test", description: "Sum test" },
          body: "## Examples\n\nSome examples.",
          references: [{ path: "ref/a.md" }, { path: "ref/b.md" }],
          scripts: [{ path: "scripts/validate.sh" }],
          assets: [],
        },
      ],
    });
    const score = scoreSkill(skill, 1000);
    const sum = Object.values(score.breakdown).reduce((a, v) => a + v, 0);
    expect(score.total).toBe(Math.min(100, sum));
  });

  it("star_weight caps at 25 for very high star counts", () => {
    const skill = makeSkill();
    const score = scoreSkill(skill, 1_000_000);
    expect(score.breakdown.star_weight).toBeLessThanOrEqual(25);
  });
});
