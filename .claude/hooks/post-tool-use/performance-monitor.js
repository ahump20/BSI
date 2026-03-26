#!/usr/bin/env node
// Performance Monitor Hook
// Tracks command execution for performance insights

const fs = require('fs');
const path = require('path');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const toolInput = input.tool_input || {};
const toolResult = input.tool_result || {};

const metricsFile = path.join(process.env.HOME, '.claude', 'hooks', 'performance-metrics.jsonl');

function recordMetrics() {
  const entry = {
    timestamp: new Date().toISOString(),
    command: (toolInput.command || '').substring(0, 100),
    exit_code: toolResult.exit_code || 0,
    output_length: (toolResult.stdout || '').length + (toolResult.stderr || '').length
  };

  try {
    fs.appendFileSync(metricsFile, JSON.stringify(entry) + '\n');

    const stats = fs.statSync(metricsFile);
    if (stats.size > 1024 * 1024) {
      const backup = metricsFile + '.old';
      fs.renameSync(metricsFile, backup);
    }
  } catch {}
}

recordMetrics();

console.log(JSON.stringify({ decision: 'approve' }));
