#!/usr/bin/env node
// API Key Validator Hook
// Prevents accidental exposure of API keys in bash commands

const fs = require('fs');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const toolInput = input.tool_input || {};
const command = toolInput.command || '';

// Patterns that look like exposed API keys (not in env vars)
const dangerPatterns = [
  /sk-[a-zA-Z0-9]{20,}/,  // OpenAI keys
  /ghp_[a-zA-Z0-9]{36}/,  // GitHub PAT (classic)
  /github_pat_[a-zA-Z0-9_]{80,}/, // GitHub PAT (fine-grained)
  /AKIA[0-9A-Z]{16}/,     // AWS access keys
  /sk_live_[a-zA-Z0-9]{24,}/, // Stripe live keys
  /[0-9a-f]{64}/,          // BSI ADMIN_KEY (64-char hex)
];

// Allow patterns (keys passed via env vars are OK)
const allowPatterns = [
  /\$\{?[A-Z_]+\}?/,  // Environment variable references
  /--token\s+\$[A-Z_]+/, // Token flags with env vars
];

function validateCommand(cmd) {
  // Skip if command uses env var references
  for (const pattern of allowPatterns) {
    if (pattern.test(cmd)) return { pass: true };
  }

  // Check for exposed keys
  for (const pattern of dangerPatterns) {
    if (pattern.test(cmd)) {
      return {
        pass: false,
        reason: 'Potential API key exposure in command. Use environment variables instead.'
      };
    }
  }

  return { pass: true };
}

const result = validateCommand(command);

console.log(JSON.stringify({
  decision: result.pass ? 'approve' : 'block',
  reason: result.reason || null
}));
