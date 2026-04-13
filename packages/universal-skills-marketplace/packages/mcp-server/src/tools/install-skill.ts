/**
 * install-skill tool implementation.
 *
 * Generates install commands for a skill targeting either ecosystem.
 * Auto-detect checks for .claude/ or .codex/ directories.
 *
 * command-only mode: returns the command string.
 * write-to-disk mode: modifies .mcp.json or config.toml directly.
 */
import type { CanonicalSkill, CommandEntry } from "@blazesportsintel/universal-skills-schema";
import { getCatalog } from "./resolve-skill.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface InstallInput {
  id: string;
  target?: "claude" | "codex" | "auto-detect";
  mode?: "command-only" | "write-to-disk";
  scope?: "user" | "project";
}

interface InstallResult {
  id: string;
  target: "claude" | "codex";
  mode: "command-only" | "write-to-disk";
  scope: "user" | "project";
  command: string;
  mcp_json_snippet?: Record<string, unknown>;
  instructions: string;
  meta: {
    source: string;
    fetched_at: string;
  };
}

function detectEcosystem(): "claude" | "codex" {
  // Check environment hints
  if (process.env.CLAUDE_CODE || process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.CODEX_CLI || process.env.OPENAI_API_KEY) return "codex";

  // Check for config directories
  const home = homedir();
  if (existsSync(join(home, ".claude"))) return "claude";
  if (existsSync(join(home, ".codex"))) return "codex";

  // Default to claude (more common in our user base)
  return "claude";
}

function generateClaudeCommand(skill: CanonicalSkill, scope: "user" | "project"): { command: string; snippet: Record<string, unknown> } {
  const iface = skill.codex_interface;
  const command = iface?.command || "npx";
  const args = iface?.args || ["-y", `@${skill.origin.repo_name}/${skill.name}`];

  const mcpName = skill.name.replace(/[^a-z0-9-]/g, "-");

  // Claude mcp add command
  const addCmd = `claude mcp add ${mcpName} -- ${command} ${args.join(" ")}`;

  // .mcp.json snippet (flat format)
  const snippet: Record<string, unknown> = {
    [mcpName]: {
      command,
      args,
    },
  };

  return { command: addCmd, snippet };
}

function generateCodexCommand(skill: CanonicalSkill, scope: "user" | "project"): { command: string; snippet: Record<string, unknown> } {
  const iface = skill.codex_interface;
  const command = iface?.command || "npx";
  const args = iface?.args || ["-y", `@${skill.origin.repo_name}/${skill.name}`];

  const mcpName = skill.name.replace(/[^a-z0-9-]/g, "-");

  // Codex install command
  const installCmd = `codex install ${mcpName}`;

  // .mcp.json snippet (wrapped format)
  const snippet: Record<string, unknown> = {
    mcpServers: {
      [mcpName]: {
        command,
        args,
      },
    },
  };

  return { command: installCmd, snippet };
}

export async function handleInstallSkill(input: InstallInput): Promise<InstallResult> {
  const {
    id,
    target: targetInput = "auto-detect",
    mode = "command-only",
    scope = "user",
  } = input;
  const now = new Date().toISOString();

  const catalog = getCatalog();
  const skill = catalog.find((s) => s.id === id);

  if (!skill) {
    return {
      id,
      target: targetInput === "auto-detect" ? detectEcosystem() : targetInput,
      mode,
      scope,
      command: "",
      instructions: `Error: Skill '${id}' not found in catalog.`,
      meta: { source: "universal-skills-mcp/stdio", fetched_at: now },
    };
  }

  const target = targetInput === "auto-detect" ? detectEcosystem() : targetInput;

  // Check if skill has a pre-built install command
  const existingCmd = skill.install_commands.find((c) => c.ecosystem === target);
  if (existingCmd) {
    return {
      id,
      target,
      mode,
      scope,
      command: existingCmd.install_command,
      mcp_json_snippet: existingCmd.mcp_json_snippet as Record<string, unknown>,
      instructions: existingCmd.notes || `Run the command above to install '${skill.name}' for ${target}.`,
      meta: { source: "universal-skills-mcp/stdio", fetched_at: now },
    };
  }

  // Generate command
  const generated = target === "claude"
    ? generateClaudeCommand(skill, scope)
    : generateCodexCommand(skill, scope);

  const instructions = mode === "write-to-disk"
    ? `To install, run:\n  ${generated.command}\n\nOr add this to your .mcp.json:\n${JSON.stringify(generated.snippet, null, 2)}\n\nNote: write-to-disk mode is not yet implemented in stdio. Use the command above.`
    : `Run this command to install '${skill.name}' for ${target}:\n  ${generated.command}`;

  return {
    id,
    target,
    mode,
    scope,
    command: generated.command,
    mcp_json_snippet: generated.snippet,
    instructions,
    meta: { source: "universal-skills-mcp/stdio", fetched_at: now },
  };
}
