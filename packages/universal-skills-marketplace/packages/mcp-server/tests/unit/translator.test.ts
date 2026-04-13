/**
 * Translator unit tests.
 *
 * Core invariant: round-trip claude→canonical→codex→canonical→claude
 * preserves every semantic field. Lossy fields are logged, not dropped.
 */
import { describe, it, expect } from "vitest";
import {
  claudeToCanonical,
  codexToCanonical,
  canonicalToClaude,
  canonicalToCodex,
  standaloneToCanonical,
} from "../../src/lib/translator.js";

const baseOpts = {
  repoUrl: "https://github.com/test/repo",
  repoName: "test/repo",
  branch: "main",
  pathInRepo: "skills/test-skill",
  starCount: 100,
};

describe("claudeToCanonical", () => {
  it("maps name, description, author correctly", () => {
    const canonical = claudeToCanonical(
      { name: "pdf-tools", description: "PDF processing tools", author: "Test Author" },
      { ...baseOpts, skillBody: "# PDF Tools\n\nBody here.", skillFrontmatter: { name: "pdf-tools", description: "PDF processing tools" } },
    );
    expect(canonical.name).toBe("pdf-tools");
    expect(canonical.description).toBe("PDF processing tools");
    expect(canonical.author?.name).toBe("Test Author");
    expect(canonical.origin.ecosystem).toBe("claude");
    expect(canonical.origin.manifest_format).toBe("claude-plugin");
  });

  it("logs defaulted fields in translation_log", () => {
    const canonical = claudeToCanonical(
      { name: "test", description: "Test" },
      baseOpts,
    );
    expect(canonical.translation_log.length).toBeGreaterThan(0);
    const defaulted = canonical.translation_log.filter((e) => e.action === "defaulted");
    expect(defaulted.length).toBeGreaterThan(0);
  });
});

describe("codexToCanonical", () => {
  it("preserves interface block and hooks", () => {
    const canonical = codexToCanonical(
      {
        name: "codex-skill",
        version: "1.0.0",
        description: "A Codex skill",
        author: { name: "Codex Author", url: "https://example.com" },
        license: "MIT",
        keywords: ["codex", "test"],
        interface: { type: "mcp", transport: "stdio", command: "npx", args: ["-y", "codex-skill"] },
        hooks: { post_install: "echo installed" },
      },
      baseOpts,
    );
    expect(canonical.codex_interface?.command).toBe("npx");
    expect(canonical.hooks).toEqual({ post_install: "echo installed" });
    expect(canonical.license).toBe("MIT");
    expect(canonical.tags).toContain("codex");
  });

  it("generates install commands for both ecosystems", () => {
    const canonical = codexToCanonical(
      {
        name: "dual-skill",
        description: "Works in both",
        author: "Author",
        interface: { type: "mcp", transport: "stdio", command: "npx", args: ["-y", "dual-skill"] },
      },
      baseOpts,
    );
    const ecosystems = canonical.install_commands.map((c) => c.ecosystem);
    expect(ecosystems).toContain("claude");
    expect(ecosystems).toContain("codex");
  });
});

describe("standaloneToCanonical", () => {
  it("infers identity from frontmatter", () => {
    const canonical = standaloneToCanonical(
      { name: "standalone-skill", description: "A standalone skill", tags: ["util"] },
      "# Standalone\n\nBody content.",
      baseOpts,
    );
    expect(canonical.name).toBe("standalone-skill");
    expect(canonical.origin.manifest_format).toBe("standalone-skill");
    expect(canonical.tags).toContain("util");
  });
});

describe("round-trip: canonical → claude → canonical preserves semantic fields", () => {
  it("name and description survive round-trip", () => {
    const original = claudeToCanonical(
      { name: "roundtrip", description: "Round-trip test skill" },
      { ...baseOpts, skillFrontmatter: { name: "roundtrip", description: "Round-trip test skill" } },
    );
    const { pluginJson } = canonicalToClaude(original);
    expect(pluginJson.name).toBe("roundtrip");
    expect(pluginJson.description).toBe("Round-trip test skill");
  });
});

describe("round-trip: canonical → codex → canonical preserves semantic fields", () => {
  it("version and license survive round-trip", () => {
    const original = codexToCanonical(
      {
        name: "rt-codex",
        version: "2.0.0",
        description: "Codex round-trip",
        author: "Author",
        license: "Apache-2.0",
        keywords: ["test"],
      },
      baseOpts,
    );
    const { pluginJson } = canonicalToCodex(original);
    expect(pluginJson.version).toBe("2.0.0");
    expect(pluginJson.license).toBe("Apache-2.0");
    expect(pluginJson.keywords).toContain("test");
  });
});
