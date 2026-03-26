#!/usr/bin/env node
// Fabrication Blocker Hook
// Blocks writes containing fabricated statistics or unverified claims

const fs = require('fs');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const toolInput = input.tool_input || {};

// Patterns that suggest fabricated data
const fabricationPatterns = [
  /\d{1,3}\.\d{3,}%/,  // Overly precise percentages like "87.234%"
  /according to (our|internal) (data|research|analysis)/i,
  /studies show that \d+%/i,
  /\$\d+(\.\d+)? (million|billion) (in revenue|valuation)/i,
];

// Check content for fabrication patterns
function checkForFabrication(content) {
  if (!content || typeof content !== 'string') return { pass: true };

  for (const pattern of fabricationPatterns) {
    if (pattern.test(content)) {
      return {
        pass: false,
        reason: `Potential fabrication detected: ${pattern.toString()}`
      };
    }
  }
  return { pass: true };
}

// Check the tool input
const content = toolInput.content || toolInput.new_string || '';
const result = checkForFabrication(content);

// Output result - pass through if OK
console.log(JSON.stringify({
  decision: result.pass ? 'approve' : 'block',
  reason: result.reason || null
}));
