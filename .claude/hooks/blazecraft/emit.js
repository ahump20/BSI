#!/usr/bin/env node
/**
 * BlazeCraft event emitter for Claude Code hooks.
 *
 * Claude Code hooks pass context via stdin as JSON:
 *   PostToolUse: { tool_name, tool_input, tool_output }
 *   PreToolUse:  { tool_name, tool_input }
 *
 * Usage: node emit.js <event_type> [category]
 *
 * Building kind mapping:
 *   townhall  = Task spawns (hero summon)
 *   barracks  = Bash commands (troop training)
 *   workshop  = Edit/Write (production)
 *   library   = Read/Grep/Glob (research)
 *   stables   = TodoWrite (planning)
 *   market    = WebFetch/WebSearch (defense)
 */

const { spawn } = require("child_process");
const crypto = require("crypto");

const PRODUCTION_API = "https://blazecraft.app/api/blazecraft/events";

const [, , eventType = "task_complete", category = "production"] = process.argv;

const TOOL_BUILDING_MAP = {
  Task: "townhall",
  Bash: "barracks",
  Edit: "workshop",
  Write: "workshop",
  Read: "library",
  Grep: "library",
  Glob: "library",
  TodoWrite: "stables",
  WebFetch: "market",
  WebSearch: "market",
};

const CATEGORY_BUILDING_MAP = {
  production: "workshop",
  research: "library",
  spawns: "townhall",
  commands: "barracks",
  storage: "stables",
  defense: "market",
};

/** Read stdin with a 50ms timeout. */
function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve(null);

    let data = "";
    const timer = setTimeout(() => {
      process.stdin.removeAllListeners();
      try {
        process.stdin.destroy();
      } catch {}
      resolve(data ? safeParse(data) : null);
    }, 50);

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(safeParse(data));
    });
    process.stdin.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function main() {
  const hookContext = await readStdin();

  const toolName = hookContext?.tool_name || null;
  const toolInput = hookContext?.tool_input || null;
  const buildingKind =
    TOOL_BUILDING_MAP[toolName] ||
    CATEGORY_BUILDING_MAP[category] ||
    "townhall";

  let filePath = null;
  if (toolInput) {
    filePath =
      toolInput.file_path || toolInput.path || toolInput.pattern || null;
  }

  // Derive a stable session ID from the access token (unique per Claude Code session).
  // Falls back to PPID if the token isn't available.
  const token = process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN;
  const sessionId = token
    ? `cc-${crypto.createHash("sha256").update(token).digest("hex").slice(0, 12)}`
    : `session-${process.ppid || Date.now()}`;

  const agentName =
    process.env.CLAUDE_AGENT_NAME || process.env.USER || "Claude";

  const payload = JSON.stringify({
    type: eventType === "spawn" ? "agent_spawn" : eventType,
    agentId: sessionId,
    agentName: agentName,
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    data: {
      tool: toolName,
      buildingKind: buildingKind,
      filePath: filePath ? String(filePath).slice(0, 500) : undefined,
      taskDescription:
        toolInput?.description || `${eventType}: ${category}`,
      message: toolName ? `Tool: ${toolName}` : undefined,
    },
  });

  // Fire-and-forget: spawn a detached curl process.
  // This survives after Node exits, ensuring the HTTPS request completes.
  const child = spawn(
    "curl",
    [
      "-s",
      "-X",
      "POST",
      "-H",
      "Content-Type: application/json",
      "-d",
      payload,
      "--max-time",
      "3",
      PRODUCTION_API,
    ],
    {
      detached: true,
      stdio: "ignore",
    },
  );
  child.unref();
}

main();
