#!/usr/bin/env node
// Rate Limit Checker Hook
// Prevents excessive API calls in short time windows

const fs = require('fs');
const path = require('path');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const toolInput = input.tool_input || {};
const command = toolInput.command || '';

const stateFile = path.join(process.env.HOME, '.claude', 'hooks', '.rate-limit-state.json');

// Rate limit configuration
const RATE_LIMITS = {
  'curl': { max: 30, windowMs: 60000 },
  'gh api': { max: 20, windowMs: 60000 },
  'wrangler': { max: 10, windowMs: 60000 }
};

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return { calls: {} };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch {}
}

function checkRateLimit(cmd) {
  const state = loadState();
  const now = Date.now();

  let limitKey = null;
  for (const key of Object.keys(RATE_LIMITS)) {
    if (cmd.includes(key)) {
      limitKey = key;
      break;
    }
  }

  if (!limitKey) return { pass: true };

  const limit = RATE_LIMITS[limitKey];
  const calls = state.calls[limitKey] || [];
  const recentCalls = calls.filter(t => now - t < limit.windowMs);

  if (recentCalls.length >= limit.max) {
    return {
      pass: false,
      reason: `Rate limit exceeded for ${limitKey}: ${recentCalls.length}/${limit.max} calls in last minute`
    };
  }

  recentCalls.push(now);
  state.calls[limitKey] = recentCalls;
  saveState(state);

  return { pass: true };
}

const result = checkRateLimit(command);

console.log(JSON.stringify({
  decision: result.pass ? 'approve' : 'block',
  reason: result.reason || null
}));
