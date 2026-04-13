/**
 * Quality scoring rubric — 0-100 additive score.
 *
 * 7 rules, deterministic, transparent breakdown.
 * See references/09-quality-scoring-rubric.md for design goals.
 *
 * Max: 10 + 10 + 5 + 10 + 20 + 25 + 20 = 100
 */
import type { CanonicalSkill } from "@blazesportsintel/universal-skills-schema";

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

export function scoreSkill(c: CanonicalSkill, starCount = 0): QualityScore {
  const b: QualityBreakdown = {
    has_references: 0,
    has_scripts: 0,
    description_quality: 0,
    has_examples: 0,
    passes_validation: 0,
    star_weight: 0,
    has_tests: 0,
  };

  const primary = c.skills[0] || {
    references: [],
    scripts: [],
    assets: [],
    body: "",
    frontmatter: {},
    name: "",
    description: "",
  };

  // Rule 1: has_references (+10)
  if (primary.references && primary.references.length >= 2) {
    b.has_references = 10;
  }

  // Rule 2: has_scripts (+10)
  if (primary.scripts && primary.scripts.length >= 1) {
    b.has_scripts = 10;
  }

  // Rule 3: description_quality (+5 max)
  if (c.description.length >= 100) {
    const desc = c.description.toLowerCase();
    if (desc.includes("use when") || desc.includes("triggers on") || desc.includes("trigger")) {
      b.description_quality = 5;
    } else {
      b.description_quality = 3; // partial credit
    }
  }

  // Rule 4: has_examples (+10)
  const body = primary.body || "";
  if (/##\s+Examples?\s*$/im.test(body)) {
    b.has_examples = 10;
  }

  // Rule 5: passes_validation (+20)
  if (c.name && c.description && primary.frontmatter?.name && primary.frontmatter?.description) {
    b.passes_validation = 20;
  }

  // Rule 6: star_weight (0-25, log scale)
  if (starCount > 0) {
    b.star_weight = Math.min(25, Math.floor(Math.log10(Math.max(starCount, 1)) * 10));
  }

  // Rule 7: has_tests (+20)
  const hasTests = (primary.scripts || []).some((s) => {
    const path = typeof s === "string" ? s : s.path || "";
    const filename = path.split("/").pop() || "";
    return /^(test|validate|verify)/i.test(filename);
  });
  if (hasTests) {
    b.has_tests = 20;
  }

  const total = Math.min(100, Object.values(b).reduce((a, v) => a + v, 0));
  const grade: QualityScore["grade"] =
    total >= 85 ? "A" : total >= 70 ? "B" : total >= 50 ? "C" : total >= 30 ? "D" : "F";

  return { total, breakdown: b, grade };
}
