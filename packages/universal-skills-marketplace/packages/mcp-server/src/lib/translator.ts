/**
 * Manifest translator — the hardest component.
 *
 * Flow: ClaudePlugin ↔ CanonicalSkill ↔ CodexPlugin
 * NEVER translate directly between ecosystems.
 *
 * Every lossy field is logged in translation_log + persisted in ecosystem_extensions.
 * No silent drops — rule 4 from SKILL.md hard rules.
 *
 * See references/11-manifest-translator-algorithm.md for the full algorithm.
 */
import type {
  CanonicalSkill,
  TranslationLogEntry,
  ClaudePluginManifest,
  CodexPluginManifest,
  CommandEntry,
} from "@blazesportsintel/universal-skills-schema";

// --- Helpers ---

function logEntry(
  field: string,
  source: "claude" | "codex" | "standalone",
  action: TranslationLogEntry["action"],
  detail: string,
): TranslationLogEntry {
  return {
    field,
    source_ecosystem: source,
    action,
    detail,
    timestamp: new Date().toISOString(),
  };
}

function generateId(repoName: string, skillName: string): string {
  return `${repoName}/${skillName}`.toLowerCase().replace(/[^a-z0-9/.-]/g, "-");
}

// --- Claude → Canonical ---

export function claudeToCanonical(
  manifest: ClaudePluginManifest,
  opts: {
    repoUrl: string;
    repoName: string;
    branch?: string;
    commitSha?: string;
    pathInRepo: string;
    starCount?: number;
    skillBody?: string;
    skillFrontmatter?: Record<string, unknown>;
    references?: Array<{ path: string; kind?: string; sha256?: string; size_bytes?: number }>;
    scripts?: Array<{ path: string; sha256?: string; size_bytes?: number }>;
  },
): CanonicalSkill {
  const log: TranslationLogEntry[] = [];
  const now = new Date().toISOString();

  const id = generateId(opts.repoName, manifest.name);

  // Claude manifests are minimal — most fields get "defaulted" log entries
  log.push(logEntry("version", "claude", "defaulted", "Claude plugin.json has no version field; defaulting to 0.1.0"));
  log.push(logEntry("license", "claude", "defaulted", "Claude plugin.json has no license field; defaulting to undefined"));
  log.push(logEntry("keywords", "claude", "inferred", "No keywords in Claude format; inferred from description if possible"));

  // Tags: extract from frontmatter if available
  const tags: string[] = [];
  if (opts.skillFrontmatter?.tags && Array.isArray(opts.skillFrontmatter.tags)) {
    tags.push(...(opts.skillFrontmatter.tags as string[]));
  }

  const canonical: CanonicalSkill = {
    id,
    name: manifest.name,
    version: (opts.skillFrontmatter?.version as string) || "0.1.0",
    description: manifest.description,
    author: manifest.author ? { name: manifest.author } : undefined,
    license: undefined,
    tags,
    category: (opts.skillFrontmatter?.category as string) || undefined,
    origin: {
      ecosystem: "claude",
      repo_url: opts.repoUrl,
      repo_name: opts.repoName,
      branch: opts.branch || "main",
      commit_sha: opts.commitSha,
      path_in_repo: opts.pathInRepo,
      manifest_format: "claude-plugin",
      star_count: opts.starCount || 0,
    },
    skills: [
      {
        name: manifest.name,
        description: manifest.description,
        frontmatter: opts.skillFrontmatter || {},
        body: opts.skillBody || "",
        references: (opts.references || []).map((r) => ({
          path: r.path,
          kind: (r.kind as any) || "reference",
          sha256: r.sha256,
          size_bytes: r.size_bytes,
        })),
        scripts: (opts.scripts || []).map((s) => ({
          path: s.path,
          sha256: s.sha256,
          size_bytes: s.size_bytes,
        })),
        assets: [],
      },
    ],
    agents: [],
    install_commands: [
      {
        ecosystem: "claude",
        install_command: `claude mcp add ${manifest.name} -- npx -y @${opts.repoName}/${manifest.name}`,
      },
    ],
    compatibility: {
      claude: true,
      codex: true, // We bridge it
    },
    codex_interface: undefined,
    hooks: {},
    quality_score: 0, // Scored separately
    translation_log: log,
    ecosystem_extensions: {},
    indexed_at: now,
  };

  return canonical;
}

// --- Codex → Canonical ---

export function codexToCanonical(
  manifest: CodexPluginManifest,
  opts: {
    repoUrl: string;
    repoName: string;
    branch?: string;
    commitSha?: string;
    pathInRepo: string;
    starCount?: number;
    skillBody?: string;
    skillFrontmatter?: Record<string, unknown>;
    references?: Array<{ path: string; kind?: string; sha256?: string; size_bytes?: number }>;
    scripts?: Array<{ path: string; sha256?: string; size_bytes?: number }>;
  },
): CanonicalSkill {
  const log: TranslationLogEntry[] = [];
  const now = new Date().toISOString();

  const id = generateId(opts.repoName, manifest.name);

  // Author normalization
  const author = typeof manifest.author === "string"
    ? { name: manifest.author }
    : manifest.author
      ? { name: manifest.author.name, url: manifest.author.url, email: manifest.author.email }
      : undefined;

  // Interface preservation
  const codexInterface = manifest.interface
    ? {
        type: manifest.interface.type || "mcp",
        transport: manifest.interface.transport || "stdio",
        command: manifest.interface.command,
        args: manifest.interface.args,
        url: manifest.interface.url,
      }
    : undefined;

  // Hooks preservation
  const hooks = manifest.hooks || {};
  if (manifest.hooks) {
    log.push(logEntry("hooks", "codex", "mapped", "Codex hooks preserved in canonical hooks block"));
  }

  // Apps → ecosystem_extensions (lossy for Claude)
  const ecosystemExtensions: Record<string, unknown> = {};
  if (manifest.apps) {
    ecosystemExtensions.codex_apps = manifest.apps;
    log.push(logEntry("apps", "codex", "shimmed", "Codex apps block stored in ecosystem_extensions.codex_apps; no Claude equivalent"));
  }

  // Repository
  if (manifest.repository) {
    ecosystemExtensions.codex_repository = manifest.repository;
  }

  // Build install commands for both ecosystems
  const installCommands: CommandEntry[] = [];
  const iface = manifest.interface;

  if (iface?.command) {
    installCommands.push({
      ecosystem: "codex",
      install_command: `codex install ${manifest.name}`,
      mcp_json_snippet: {
        mcpServers: {
          [manifest.name]: {
            command: iface.command,
            args: iface.args || [],
          },
        },
      },
    });
    installCommands.push({
      ecosystem: "claude",
      install_command: `claude mcp add ${manifest.name} -- ${iface.command} ${(iface.args || []).join(" ")}`,
      mcp_json_snippet: {
        [manifest.name]: {
          command: iface.command,
          args: iface.args || [],
        },
      },
      notes: "Translated from Codex interface block",
    });
  }

  // Tags from keywords
  const tags = manifest.keywords || [];
  if (opts.skillFrontmatter?.tags && Array.isArray(opts.skillFrontmatter.tags)) {
    for (const t of opts.skillFrontmatter.tags as string[]) {
      if (!tags.includes(t)) tags.push(t);
    }
  }

  const canonical: CanonicalSkill = {
    id,
    name: manifest.name,
    version: manifest.version || "0.1.0",
    description: manifest.description,
    author,
    license: manifest.license,
    tags,
    category: (opts.skillFrontmatter?.category as string) || undefined,
    origin: {
      ecosystem: "codex",
      repo_url: opts.repoUrl,
      repo_name: opts.repoName,
      branch: opts.branch || "main",
      commit_sha: opts.commitSha,
      path_in_repo: opts.pathInRepo,
      manifest_format: "codex-plugin",
      star_count: opts.starCount || 0,
    },
    skills: [
      {
        name: manifest.name,
        description: manifest.description,
        frontmatter: opts.skillFrontmatter || {},
        body: opts.skillBody || "",
        references: (opts.references || []).map((r) => ({
          path: r.path,
          kind: (r.kind as any) || "reference",
          sha256: r.sha256,
          size_bytes: r.size_bytes,
        })),
        scripts: (opts.scripts || []).map((s) => ({
          path: s.path,
          sha256: s.sha256,
          size_bytes: s.size_bytes,
        })),
        assets: [],
      },
    ],
    agents: [],
    install_commands: installCommands,
    compatibility: {
      claude: true,
      codex: true,
    },
    codex_interface: codexInterface,
    hooks,
    quality_score: 0,
    translation_log: log,
    ecosystem_extensions: ecosystemExtensions,
    indexed_at: now,
  };

  return canonical;
}

// --- Standalone SKILL.md → Canonical ---

export function standaloneToCanonical(
  frontmatter: Record<string, unknown>,
  body: string,
  opts: {
    repoUrl: string;
    repoName: string;
    branch?: string;
    commitSha?: string;
    pathInRepo: string;
    starCount?: number;
    references?: Array<{ path: string; kind?: string; sha256?: string; size_bytes?: number }>;
    scripts?: Array<{ path: string; sha256?: string; size_bytes?: number }>;
  },
): CanonicalSkill {
  const log: TranslationLogEntry[] = [];
  const now = new Date().toISOString();

  const name = (frontmatter.name as string) || opts.pathInRepo.split("/").pop()?.replace(/\.md$/i, "") || "unknown";
  const description = (frontmatter.description as string) || "";
  const id = generateId(opts.repoName, name);

  log.push(logEntry("manifest", "standalone", "inferred", "No plugin manifest found; treating SKILL.md as standalone skill"));

  const tags: string[] = [];
  if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
    tags.push(...(frontmatter.tags as string[]));
  }

  const canonical: CanonicalSkill = {
    id,
    name,
    version: (frontmatter.version as string) || "0.1.0",
    description,
    author: frontmatter.author ? { name: frontmatter.author as string } : undefined,
    license: undefined,
    tags,
    category: (frontmatter.category as string) || undefined,
    origin: {
      ecosystem: "standalone",
      repo_url: opts.repoUrl,
      repo_name: opts.repoName,
      branch: opts.branch || "main",
      commit_sha: opts.commitSha,
      path_in_repo: opts.pathInRepo,
      manifest_format: "standalone-skill",
      star_count: opts.starCount || 0,
    },
    skills: [
      {
        name,
        description,
        frontmatter,
        body,
        references: (opts.references || []).map((r) => ({
          path: r.path,
          kind: (r.kind as any) || "reference",
          sha256: r.sha256,
          size_bytes: r.size_bytes,
        })),
        scripts: (opts.scripts || []).map((s) => ({
          path: s.path,
          sha256: s.sha256,
          size_bytes: s.size_bytes,
        })),
        assets: [],
      },
    ],
    agents: [],
    install_commands: [],
    compatibility: {
      claude: true,
      codex: true,
    },
    codex_interface: undefined,
    hooks: {},
    quality_score: 0,
    translation_log: log,
    ecosystem_extensions: {},
    indexed_at: now,
  };

  return canonical;
}

// --- Canonical → Claude plugin.json ---

export function canonicalToClaude(canonical: CanonicalSkill): {
  pluginJson: ClaudePluginManifest;
  mcpJson: Record<string, unknown>;
  sidecar: Record<string, unknown>;
} {
  const pluginJson: ClaudePluginManifest = {
    name: canonical.name,
    description: canonical.description,
    author: canonical.author?.name,
  };

  // .mcp.json (flat format)
  const claudeCmd = canonical.install_commands.find((c) => c.ecosystem === "claude");
  const mcpJson: Record<string, unknown> = claudeCmd?.mcp_json_snippet || {
    [canonical.name]: {
      command: canonical.codex_interface?.command || "npx",
      args: canonical.codex_interface?.args || ["-y", `@unknown/${canonical.name}`],
    },
  };

  // Sidecar: codex_ecosystem.json — preserves lossy fields for round-trip
  const sidecar: Record<string, unknown> = {
    _comment: "Codex-specific fields preserved for round-trip translation. Do not edit manually.",
    version: canonical.version,
    license: canonical.license,
    keywords: canonical.tags,
    codex_interface: canonical.codex_interface,
    hooks: canonical.hooks,
    ...canonical.ecosystem_extensions,
  };

  return { pluginJson, mcpJson, sidecar };
}

// --- Canonical → Codex plugin.json ---

export function canonicalToCodex(canonical: CanonicalSkill): {
  pluginJson: CodexPluginManifest;
  mcpJson: Record<string, unknown>;
  sidecar: Record<string, unknown>;
} {
  const pluginJson: CodexPluginManifest = {
    name: canonical.name,
    version: canonical.version,
    description: canonical.description,
    author: canonical.author || "Unknown",
    license: canonical.license,
    keywords: canonical.tags,
    interface: canonical.codex_interface
      ? {
          type: canonical.codex_interface.type || "mcp",
          transport: (canonical.codex_interface.transport as "stdio" | "http" | "sse") || "stdio",
          command: canonical.codex_interface.command,
          args: canonical.codex_interface.args,
          url: canonical.codex_interface.url,
        }
      : undefined,
    hooks: canonical.hooks || undefined,
  };

  // .mcp.json (wrapped format)
  const codexCmd = canonical.install_commands.find((c) => c.ecosystem === "codex");
  const mcpJson: Record<string, unknown> = codexCmd?.mcp_json_snippet || {
    mcpServers: {
      [canonical.name]: {
        command: canonical.codex_interface?.command || "npx",
        args: canonical.codex_interface?.args || ["-y", `@unknown/${canonical.name}`],
      },
    },
  };

  // Sidecar: claude_ecosystem.json — preserves Claude-specific conventions
  const sidecar: Record<string, unknown> = {
    _comment: "Claude-specific fields preserved for round-trip translation. Do not edit manually.",
    claude_author_string: canonical.author?.name,
    claude_skill_frontmatter: canonical.skills[0]?.frontmatter || {},
  };

  return { pluginJson, mcpJson, sidecar };
}
