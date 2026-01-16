#!/usr/bin/env node
/**
 * GLB Validation Script
 * Validates that a GLB file contains all required nodes for Sandlot Sluggers.
 *
 * Usage: node scripts/validate-glb.mjs [path-to-glb]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Required nodes from GLB contract
const REQUIRED_NODES = {
  root: ['SYB_Root'],
  anchors: [
    'SYB_Anchor_Home',
    'SYB_Anchor_1B',
    'SYB_Anchor_2B',
    'SYB_Anchor_3B',
    'SYB_Anchor_Mound',
    'SYB_Anchor_Batter',
  ],
  cameras: ['SYB_Cam_BehindBatter', 'SYB_Cam_StrikeZoneHigh', 'SYB_Cam_Isometric'],
  aimTargets: ['SYB_Aim_StrikeZone'],
};

// Optional but recommended nodes
const OPTIONAL_NODES = [
  'SYB_Anchor_Catcher',
  'SYB_Anchor_1B_F',
  'SYB_Anchor_2B_F',
  'SYB_Anchor_SS_F',
  'SYB_Anchor_3B_F',
  'SYB_Anchor_LF_F',
  'SYB_Anchor_CF_F',
  'SYB_Anchor_RF_F',
  'SYB_Aim_Mound',
];

// Parse GLB file and extract node names
function parseGLB(buffer) {
  // GLB header: magic (4) + version (4) + length (4)
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    // 'glTF' in little endian
    throw new Error('Invalid GLB magic number');
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`);
  }

  // First chunk should be JSON
  const chunk0Length = buffer.readUInt32LE(12);
  const chunk0Type = buffer.readUInt32LE(16);

  if (chunk0Type !== 0x4e4f534a) {
    // 'JSON' in little endian
    throw new Error('First chunk is not JSON');
  }

  const jsonData = buffer.slice(20, 20 + chunk0Length).toString('utf8');
  return JSON.parse(jsonData);
}

// Extract all node names from glTF JSON
function extractNodeNames(gltf) {
  const names = new Set();

  if (gltf.nodes) {
    for (const node of gltf.nodes) {
      if (node.name) {
        names.add(node.name);
      }
    }
  }

  return names;
}

// Validate GLB against requirements
function validateGLB(glbPath) {
  console.log(`\n📦 Validating GLB: ${glbPath}\n`);

  // Read and parse GLB
  let gltf;
  try {
    const buffer = readFileSync(glbPath);
    gltf = parseGLB(buffer);
  } catch (err) {
    console.error(`❌ Failed to parse GLB: ${err.message}`);
    process.exit(1);
  }

  const nodeNames = extractNodeNames(gltf);
  console.log(`Found ${nodeNames.size} nodes in GLB\n`);

  let hasErrors = false;
  let hasWarnings = false;

  // Check required nodes
  console.log('Required Nodes:');
  console.log('─'.repeat(50));

  for (const [category, nodes] of Object.entries(REQUIRED_NODES)) {
    console.log(`\n${category.toUpperCase()}:`);
    for (const node of nodes) {
      if (nodeNames.has(node)) {
        console.log(`  ✅ ${node}`);
      } else {
        console.log(`  ❌ ${node} (MISSING)`);
        hasErrors = true;
      }
    }
  }

  // Check optional nodes
  console.log('\n\nOptional Nodes (recommended):');
  console.log('─'.repeat(50));

  for (const node of OPTIONAL_NODES) {
    if (nodeNames.has(node)) {
      console.log(`  ✅ ${node}`);
    } else {
      console.log(`  ⚠️  ${node} (missing)`);
      hasWarnings = true;
    }
  }

  // Check for SYB_ prefix on all relevant nodes
  console.log('\n\nNaming Convention Check:');
  console.log('─'.repeat(50));

  const nonPrefixedNodes = [];
  for (const name of nodeNames) {
    // Skip default/system nodes
    if (
      name.startsWith('SYB_') ||
      name === 'Scene' ||
      name === 'RootNode' ||
      name.startsWith('Armature') ||
      name.startsWith('Camera') ||
      name.startsWith('Light')
    ) {
      continue;
    }
    nonPrefixedNodes.push(name);
  }

  if (nonPrefixedNodes.length > 0) {
    console.log(`  ⚠️  Found ${nonPrefixedNodes.length} nodes without SYB_ prefix:`);
    for (const name of nonPrefixedNodes.slice(0, 10)) {
      console.log(`      - ${name}`);
    }
    if (nonPrefixedNodes.length > 10) {
      console.log(`      ... and ${nonPrefixedNodes.length - 10} more`);
    }
    hasWarnings = true;
  } else {
    console.log('  ✅ All custom nodes use SYB_ prefix');
  }

  // Summary
  console.log('\n\n' + '═'.repeat(50));
  if (hasErrors) {
    console.log('❌ VALIDATION FAILED - Missing required nodes');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  VALIDATION PASSED WITH WARNINGS');
    console.log('   Game will work but some features may use fallbacks');
    process.exit(0);
  } else {
    console.log('✅ VALIDATION PASSED - All requirements met!');
    process.exit(0);
  }
}

// Main
const args = process.argv.slice(2);
const glbPath = args[0] || 'public/assets/sandlot-field.glb';

validateGLB(resolve(process.cwd(), glbPath));
