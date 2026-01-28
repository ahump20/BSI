#!/usr/bin/env npx tsx
/**
 * Import School Profile Script
 *
 * Validates and imports fanbase profile JSON files into the D1 database via API.
 *
 * Usage:
 *   npx ts-node scripts/import-school-profile.ts profiles/big12/texas-tech.json
 *   npx ts-node scripts/import-school-profile.ts profiles/big12/*.json
 *   npx ts-node scripts/import-school-profile.ts --dry-run profiles/big12/texas-tech.json
 *
 * Environment:
 *   FANBASE_ADMIN_API_KEY - Required for writes
 *   FANBASE_API_BASE - API endpoint (default: http://localhost:8788/api/v1/fanbase)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types (matching lib/fanbase/types.ts)
// ============================================================================

interface FanbaseSentiment {
  overall: number;
  optimism: number;
  loyalty: number;
  volatility: number;
}

interface FanbasePersonality {
  traits: string[];
  rivalries: string[];
  traditions: string[];
  quirks: string[];
}

interface FanbaseEngagement {
  socialMediaActivity: number;
  gameAttendance: number;
  travelSupport: number;
  merchandisePurchasing: number;
}

interface FanbaseDemographics {
  primaryAge: string;
  geographicSpread: string[];
  alumniPercentage: number;
}

interface FanbaseResearchMeta {
  lastUpdated: string;
  dataSource: string;
  confidence: number;
  sampleSize: number;
  researcher?: string;
}

interface FanbaseProfile {
  id: string;
  school: string;
  shortName: string;
  mascot: string;
  conference: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  sentiment: FanbaseSentiment;
  personality: FanbasePersonality;
  engagement: FanbaseEngagement;
  demographics: FanbaseDemographics;
  meta: FanbaseResearchMeta;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ImportResult {
  file: string;
  profileId: string;
  success: boolean;
  error?: string;
  warnings: string[];
}

// ============================================================================
// Validation
// ============================================================================

const VALID_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12', 'Independent'];

function validateRange(value: number, min: number, max: number, field: string): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return { field, message: `${field} must be a number` };
  }
  if (value < min || value > max) {
    return { field, message: `${field} must be between ${min} and ${max}, got ${value}` };
  }
  return null;
}

function validateProfile(profile: unknown): { valid: boolean; errors: ValidationError[]; warnings: string[] } {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Profile must be an object' }], warnings };
  }

  const p = profile as Record<string, unknown>;

  // Required string fields
  const requiredStrings = ['id', 'school', 'shortName', 'mascot', 'conference', 'primaryColor', 'secondaryColor'];
  for (const field of requiredStrings) {
    if (!p[field] || typeof p[field] !== 'string') {
      errors.push({ field, message: `${field} is required and must be a string` });
    }
  }

  // Validate ID format (lowercase, hyphenated)
  if (p.id && typeof p.id === 'string') {
    if (!/^[a-z0-9-]+$/.test(p.id)) {
      errors.push({ field: 'id', message: 'id must be lowercase alphanumeric with hyphens only' });
    }
  }

  // Validate conference
  if (p.conference && typeof p.conference === 'string') {
    if (!VALID_CONFERENCES.includes(p.conference)) {
      errors.push({ field: 'conference', message: `Invalid conference. Must be one of: ${VALID_CONFERENCES.join(', ')}` });
    }
  }

  // Validate colors (hex format)
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (p.primaryColor && typeof p.primaryColor === 'string' && !colorRegex.test(p.primaryColor)) {
    errors.push({ field: 'primaryColor', message: 'primaryColor must be a valid hex color (e.g., #FF0000)' });
  }
  if (p.secondaryColor && typeof p.secondaryColor === 'string' && !colorRegex.test(p.secondaryColor)) {
    errors.push({ field: 'secondaryColor', message: 'secondaryColor must be a valid hex color' });
  }

  // Validate sentiment
  if (!p.sentiment || typeof p.sentiment !== 'object') {
    errors.push({ field: 'sentiment', message: 'sentiment object is required' });
  } else {
    const s = p.sentiment as Record<string, unknown>;
    const overallErr = validateRange(s.overall as number, -1, 1, 'sentiment.overall');
    if (overallErr) errors.push(overallErr);

    const optimismErr = validateRange(s.optimism as number, 0, 1, 'sentiment.optimism');
    if (optimismErr) errors.push(optimismErr);

    const loyaltyErr = validateRange(s.loyalty as number, 0, 1, 'sentiment.loyalty');
    if (loyaltyErr) errors.push(loyaltyErr);

    const volatilityErr = validateRange(s.volatility as number, 0, 1, 'sentiment.volatility');
    if (volatilityErr) errors.push(volatilityErr);
  }

  // Validate engagement
  if (!p.engagement || typeof p.engagement !== 'object') {
    errors.push({ field: 'engagement', message: 'engagement object is required' });
  } else {
    const e = p.engagement as Record<string, unknown>;
    const fields = ['socialMediaActivity', 'gameAttendance', 'travelSupport', 'merchandisePurchasing'];
    for (const field of fields) {
      const err = validateRange(e[field] as number, 0, 1, `engagement.${field}`);
      if (err) errors.push(err);
    }
  }

  // Validate personality
  if (!p.personality || typeof p.personality !== 'object') {
    errors.push({ field: 'personality', message: 'personality object is required' });
  } else {
    const pers = p.personality as Record<string, unknown>;
    const arrayFields = ['traits', 'rivalries', 'traditions', 'quirks'];
    for (const field of arrayFields) {
      if (!Array.isArray(pers[field])) {
        errors.push({ field: `personality.${field}`, message: `personality.${field} must be an array` });
      }
    }

    // Warnings for minimal data
    if (Array.isArray(pers.traits) && pers.traits.length < 3) {
      warnings.push('Profile has fewer than 3 traits - consider adding more');
    }
    if (Array.isArray(pers.rivalries) && pers.rivalries.length < 1) {
      warnings.push('Profile has no rivalries defined');
    }
  }

  // Validate demographics
  if (!p.demographics || typeof p.demographics !== 'object') {
    errors.push({ field: 'demographics', message: 'demographics object is required' });
  } else {
    const d = p.demographics as Record<string, unknown>;
    if (!d.primaryAge || typeof d.primaryAge !== 'string') {
      errors.push({ field: 'demographics.primaryAge', message: 'demographics.primaryAge is required' });
    }
    if (!Array.isArray(d.geographicSpread)) {
      errors.push({ field: 'demographics.geographicSpread', message: 'demographics.geographicSpread must be an array' });
    }
    const alumniErr = validateRange(d.alumniPercentage as number, 0, 1, 'demographics.alumniPercentage');
    if (alumniErr) errors.push(alumniErr);
  }

  // Validate meta
  if (!p.meta || typeof p.meta !== 'object') {
    errors.push({ field: 'meta', message: 'meta object is required' });
  } else {
    const m = p.meta as Record<string, unknown>;
    if (!m.lastUpdated || typeof m.lastUpdated !== 'string') {
      errors.push({ field: 'meta.lastUpdated', message: 'meta.lastUpdated is required (ISO 8601)' });
    }
    if (!m.dataSource || typeof m.dataSource !== 'string') {
      errors.push({ field: 'meta.dataSource', message: 'meta.dataSource is required' });
    }
    const confidenceErr = validateRange(m.confidence as number, 0, 1, 'meta.confidence');
    if (confidenceErr) errors.push(confidenceErr);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// API Client
// ============================================================================

async function importProfile(
  profile: FanbaseProfile,
  apiBase: string,
  apiKey: string,
  dryRun: boolean
): Promise<{ success: boolean; error?: string }> {
  if (dryRun) {
    console.log(`[DRY RUN] Would import: ${profile.id}`);
    return { success: true };
  }

  const url = `${apiBase}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(profile),
    });

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse flags
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const files = args.filter((a) => !a.startsWith('-'));

  if (files.length === 0) {
    console.error('Usage: npx ts-node scripts/import-school-profile.ts [--dry-run] [--verbose] <profile.json> [...]');
    console.error('\nExamples:');
    console.error('  npx ts-node scripts/import-school-profile.ts profiles/big12/texas-tech.json');
    console.error('  npx ts-node scripts/import-school-profile.ts --dry-run profiles/big12/*.json');
    process.exit(1);
  }

  const apiBase = process.env.FANBASE_API_BASE || 'http://localhost:8788/api/v1/fanbase';
  const apiKey = process.env.FANBASE_ADMIN_API_KEY;

  if (!dryRun && !apiKey) {
    console.error('Error: FANBASE_ADMIN_API_KEY environment variable is required for imports');
    console.error('Set it with: export FANBASE_ADMIN_API_KEY=your-api-key');
    process.exit(1);
  }

  console.log(`Import Configuration:`);
  console.log(`  API Base: ${apiBase}`);
  console.log(`  Dry Run: ${dryRun}`);
  console.log(`  Files: ${files.length}`);
  console.log('');

  const results: ImportResult[] = [];

  for (const file of files) {
    const absolutePath = path.resolve(file);

    // Check file exists
    if (!fs.existsSync(absolutePath)) {
      results.push({
        file,
        profileId: 'unknown',
        success: false,
        error: 'File not found',
        warnings: [],
      });
      continue;
    }

    // Read and parse JSON
    let profile: unknown;
    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      profile = JSON.parse(content);
    } catch (err) {
      results.push({
        file,
        profileId: 'unknown',
        success: false,
        error: `JSON parse error: ${err instanceof Error ? err.message : 'Unknown'}`,
        warnings: [],
      });
      continue;
    }

    // Validate
    const validation = validateProfile(profile);
    const profileId = (profile as FanbaseProfile).id || 'unknown';

    if (!validation.valid) {
      console.log(`\n[FAIL] ${file}`);
      console.log(`  Validation errors:`);
      for (const err of validation.errors) {
        console.log(`    - ${err.field}: ${err.message}`);
      }
      results.push({
        file,
        profileId,
        success: false,
        error: `Validation failed: ${validation.errors.length} error(s)`,
        warnings: validation.warnings,
      });
      continue;
    }

    // Show warnings
    if (validation.warnings.length > 0 && verbose) {
      console.log(`  Warnings for ${profileId}:`);
      for (const warn of validation.warnings) {
        console.log(`    - ${warn}`);
      }
    }

    // Import
    const importResult = await importProfile(profile as FanbaseProfile, apiBase, apiKey || '', dryRun);

    if (importResult.success) {
      console.log(`[OK] ${profileId} <- ${path.basename(file)}`);
    } else {
      console.log(`[FAIL] ${profileId} <- ${path.basename(file)}: ${importResult.error}`);
    }

    results.push({
      file,
      profileId,
      success: importResult.success,
      error: importResult.error,
      warnings: validation.warnings,
    });
  }

  // Summary
  console.log('\n--- Summary ---');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`Total: ${results.length} | Success: ${successful} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
