#!/usr/bin/env node
/**
 * PostToolUse Hook: BlazeCraft Event Emitter
 *
 * Forwards tool use events to BlazeCraft aggregator for real-time visualization.
 * Maps different tool types to BlazeCraft event categories.
 *
 * Event Categories:
 * - production: Edit, Write, NotebookEdit (code changes)
 * - research: Read, Grep, Glob, WebFetch (information gathering)
 * - commands: Bash, Task (execution)
 * - storage: TodoWrite (planning)
 * - defense: Notification events
 */

const { spawn } = require('child_process');
const path = require('path');

// Path to BlazeCraft emit script
const EMIT_SCRIPT = '/Users/AustinHumphrey/.claude/hooks/blazecraft/emit.js';

// Tool to category mapping
const TOOL_CATEGORY_MAP = {
  // Production tools (code changes)
  'Edit': 'production',
  'Write': 'production',
  'NotebookEdit': 'production',

  // Research tools (information gathering)
  'Read': 'research',
  'Grep': 'research',
  'Glob': 'research',
  'WebFetch': 'research',
  'WebSearch': 'research',

  // Command tools (execution)
  'Bash': 'commands',
  'Task': 'commands',
  'KillShell': 'commands',

  // Storage/planning tools
  'TodoWrite': 'storage',

  // Defense tools
  'AskUserQuestion': 'defense',
};

// Tool to event type mapping
const TOOL_EVENT_MAP = {
  'Edit': 'task_complete',
  'Write': 'task_complete',
  'Bash': 'command',
  'Read': 'task_complete',
  'Task': 'spawn',
  'TodoWrite': 'task_complete',
};

/**
 * Main hook execution
 */
async function main() {
  // Get tool info from environment (set by Claude Code)
  const toolName = process.env.CLAUDE_TOOL_NAME || 'unknown';
  const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
  const toolResult = process.env.CLAUDE_TOOL_RESULT || '';
  const sessionId = process.env.CLAUDE_SESSION_ID || `session-${Date.now()}`;

  // Determine category and event type
  const category = TOOL_CATEGORY_MAP[toolName] || 'commands';
  const eventType = TOOL_EVENT_MAP[toolName] || 'task_complete';

  // Set environment for emit.js
  const env = {
    ...process.env,
    CLAUDE_SESSION_ID: sessionId,
    CLAUDE_TOOL_NAME: toolName,
    CLAUDE_TOOL_INPUT: toolInput.slice(0, 500), // Truncate for safety
  };

  // Call emit.js with event type and category
  try {
    const child = spawn('node', [EMIT_SCRIPT, eventType, category], {
      env,
      stdio: 'ignore',
      detached: true,
    });

    // Don't wait for emit to complete - fire and forget
    child.unref();
  } catch (error) {
    // Fail silently - don't block Claude Code
    console.error(`[BlazeCraft] Emit failed: ${error.message}`);
  }
}

main().catch(() => {
  // Silent failure
  process.exit(0);
});
