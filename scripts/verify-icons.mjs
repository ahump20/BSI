#!/usr/bin/env node
/**
 * Icon Verification Script
 *
 * Ensures all required icon assets exist before build/deploy.
 * Fails the build if any icons are missing to prevent 404s in production.
 *
 * Usage: node scripts/verify-icons.mjs
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const ICONS_DIR = join(ROOT_DIR, 'public', 'icons');

// Required SVG icons for the site
const REQUIRED_SVG_ICONS = [
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

// Optional PWA icons (warn but don't fail)
const OPTIONAL_PWA_ICONS = [
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-192x192.png',
  'icon-384x384.png',
  'icon-512x512.png',
];

function verifyIcons() {
  console.log('🔍 Verifying icon assets...\n');

  const missingRequired = [];
  const missingOptional = [];

  // Check required SVG icons
  console.log('Required SVG icons:');
  for (const icon of REQUIRED_SVG_ICONS) {
    const iconPath = join(ICONS_DIR, icon);
    const exists = existsSync(iconPath);

    if (exists) {
      console.log(`  ✅ ${icon}`);
    } else {
      console.log(`  ❌ ${icon} - MISSING`);
      missingRequired.push(icon);
    }
  }

  console.log('\nOptional PWA icons:');
  for (const icon of OPTIONAL_PWA_ICONS) {
    const iconPath = join(ICONS_DIR, icon);
    const exists = existsSync(iconPath);

    if (exists) {
      console.log(`  ✅ ${icon}`);
    } else {
      console.log(`  ⚠️  ${icon} - missing (optional)`);
      missingOptional.push(icon);
    }
  }

  console.log('\n---');

  // Report results
  if (missingRequired.length > 0) {
    console.error(`\n❌ BUILD FAILED: ${missingRequired.length} required icon(s) missing:`);
    missingRequired.forEach(icon => console.error(`   - public/icons/${icon}`));
    console.error('\nAdd the missing icons to public/icons/ and try again.');
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn(`\n⚠️  Warning: ${missingOptional.length} optional PWA icon(s) missing.`);
    console.warn('   PWA install prompts may not work correctly.');
  }

  console.log('\n✅ All required icons verified successfully!\n');
  process.exit(0);
}

verifyIcons();
