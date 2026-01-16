#!/usr/bin/env node

/**
 * BSI Icon Verification Script
 * Runs at build time to ensure all required icons exist
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const REQUIRED_ICONS = [
  'blaze-logo.svg',
  'baseball.svg',
  'football.svg',
  'basketball.svg',
  'robot.svg',
  'chart-line.svg',
  'database.svg',
  'info-circle.svg',
  'arrow-right.svg',
  'longhorns.svg',
];

const ICONS_DIR = join(ROOT, 'public', 'icons');

function verify() {
  console.log('\n🔍 BSI Icon Verification\n');
  console.log(`   Checking: ${ICONS_DIR}\n`);

  let missing = [];
  let invalid = [];
  let verified = [];

  for (const icon of REQUIRED_ICONS) {
    const iconPath = join(ICONS_DIR, icon);

    if (!existsSync(iconPath)) {
      missing.push(icon);
      continue;
    }

    const stats = statSync(iconPath);
    if (stats.size === 0) {
      invalid.push(`${icon} (empty file)`);
      continue;
    }

    const content = readFileSync(iconPath, 'utf-8');
    if (!content.includes('<svg')) {
      invalid.push(`${icon} (not a valid SVG)`);
      continue;
    }

    verified.push(icon);
    console.log(`   ✓ ${icon}`);
  }

  console.log('');

  if (missing.length > 0) {
    console.error('❌ MISSING ICONS:');
    missing.forEach((icon) => console.error(`   - ${icon}`));
    console.error('');
  }

  if (invalid.length > 0) {
    console.error('❌ INVALID ICONS:');
    invalid.forEach((msg) => console.error(`   - ${msg}`));
    console.error('');
  }

  if (missing.length === 0 && invalid.length === 0) {
    console.log(`✅ All ${verified.length} icons verified successfully!\n`);
    process.exit(0);
  } else {
    console.error(
      `\n❌ Icon verification failed: ${missing.length} missing, ${invalid.length} invalid\n`
    );
    console.error('   Ensure all icons exist in public/icons/');
    console.error('   Required icons:', REQUIRED_ICONS.join(', '));
    process.exit(1);
  }
}

verify();
