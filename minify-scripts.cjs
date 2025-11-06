#!/usr/bin/env node
/**
 * Simple JavaScript minifier using built-in Node.js functionality
 * Removes comments, unnecessary whitespace, and optimizes code
 * PHASE 20-E: Bundle Size Optimization
 */

const fs = require('fs');
const path = require('path');

// Files to minify
const files = [
  { input: 'js/data-freshness-component.js', output: 'js/data-freshness-component.min.js' },
  { input: 'js/error-handler.js', output: 'js/error-handler.min.js' },
  { input: 'js/loading-skeletons.js', output: 'js/loading-skeletons.min.js' },
  { input: 'js/feedback-widget.js', output: 'js/feedback-widget.min.js' },
  { input: 'public/js/touch-gestures.js', output: 'public/js/touch-gestures.min.js' }
];

function simpleMinify(code) {
  // Remove single-line comments
  code = code.replace(/\/\/.*/g, '');

  // Remove multi-line comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove console.log statements
  code = code.replace(/console\.(log|debug|info|warn)\([^)]*\);?/g, '');

  // Remove unnecessary whitespace
  code = code.replace(/\s+/g, ' ');

  // Remove whitespace around operators and punctuation
  code = code.replace(/\s*([{}();,=+\-*/%<>!&|])\s*/g, '$1');

  // Remove whitespace at start and end
  code = code.trim();

  return code;
}

console.log('=== JavaScript Minification - PHASE 20-E ===\n');

let totalOriginal = 0;
let totalMinified = 0;

files.forEach(({ input, output }) => {
  try {
    const inputPath = path.join(__dirname, input);
    const outputPath = path.join(__dirname, output);

    // Read original file
    const original = fs.readFileSync(inputPath, 'utf8');
    const originalSize = Buffer.byteLength(original, 'utf8');

    // Minify
    const minified = simpleMinify(original);
    const minifiedSize = Buffer.byteLength(minified, 'utf8');

    // Write minified file
    fs.writeFileSync(outputPath, minified, 'utf8');

    const savings = originalSize - minifiedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    console.log(`✓ ${path.basename(input)}`);
    console.log(`  Original:  ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`  Minified:  ${(minifiedSize / 1024).toFixed(1)}KB`);
    console.log(`  Savings:   ${(savings / 1024).toFixed(1)}KB (${savingsPercent}%)\n`);

    totalOriginal += originalSize;
    totalMinified += minifiedSize;
  } catch (error) {
    console.error(`✗ Error minifying ${input}:`, error.message);
  }
});

const totalSavings = totalOriginal - totalMinified;
const totalSavingsPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);

console.log('='.repeat(50));
console.log(`Total Original:  ${(totalOriginal / 1024).toFixed(1)}KB`);
console.log(`Total Minified:  ${(totalMinified / 1024).toFixed(1)}KB`);
console.log(`Total Savings:   ${(totalSavings / 1024).toFixed(1)}KB (${totalSavingsPercent}%)`);
console.log('='.repeat(50));

// Calculate new bundle size
const alreadyMinified = 105662 + 48442; // analytics.min.js + analytics-statcast.min.js
const newTotal = alreadyMinified + totalMinified;
const target = 150 * 1024;

console.log(`\nNew bundle size: ${(newTotal / 1024).toFixed(1)}KB`);
console.log(`Target: 150KB`);
console.log(newTotal <= target ?
  `✓ SUCCESS: Under target by ${((target - newTotal) / 1024).toFixed(1)}KB` :
  `⚠ Over target by ${((newTotal - target) / 1024).toFixed(1)}KB`);
