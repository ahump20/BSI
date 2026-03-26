#!/usr/bin/env node
// Operation Logger Hook
// Logs file operations for audit trail

const fs = require('fs');
const path = require('path');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const toolName = input.tool_name || 'unknown';
const toolInput = input.tool_input || {};

const logFile = path.join(process.env.HOME, '.claude', 'hooks', 'operation-log.jsonl');

function logOperation() {
  const entry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    file_path: toolInput.file_path || null,
    operation: toolName === 'Write' ? 'write' : 'edit',
    session: process.env.CLAUDE_SESSION_ID || 'unknown'
  };

  try {
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch {}
}

logOperation();

console.log(JSON.stringify({ decision: 'approve' }));
