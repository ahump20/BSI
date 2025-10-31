#!/bin/bash

# Sports Data QC - Local Testing Script
# Tests QC validation logic with example data files

set -e

echo "=========================================="
echo "Sports Data QC - Local Testing"
echo "=========================================="
echo ""

# Check dependencies
if ! command -v bun &> /dev/null && ! command -v node &> /dev/null; then
    echo "❌ Error: Neither bun nor node found"
    echo "Install bun: curl -fsSL https://bun.sh/install | bash"
    echo "Or install node: https://nodejs.org/"
    exit 1
fi

# Determine runtime
if command -v bun &> /dev/null; then
    RUNTIME="bun run"
    echo "✅ Using Bun runtime"
else
    RUNTIME="npx tsx"
    echo "✅ Using Node.js with tsx"
fi

echo ""

# =============================================================================
# Test 1: Valid Data (Should Pass)
# =============================================================================

echo "🧪 Test 1: Validating clean data (valid_boxscore.json)..."
echo "Expected: High pass rate, minimal warnings"
echo ""

if [ -f "examples/valid_boxscore.json" ]; then
    cat > test_valid.ts << 'EOF'
import { runQCPipeline } from './scripts/qc_analysis';
import { formatReportConsole } from './scripts/qc_reporting';
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('examples/valid_boxscore.json', 'utf-8'));

const result = await runQCPipeline({
  games: data.games || [],
  player_stats: data.player_stats || [],
  simulations: data.simulations || [],
  data_source: 'TEST_VALID_DATA'
}, {
  auto_reject_failures: false,
  auto_reject_outliers: false,
  mad_threshold: 5.0,
  min_confidence_score: 0.7
});

console.log(formatReportConsole(result.report));

// Assert expectations
const { report } = result;
if (report.records_rejected > 0) {
  console.error('\n❌ FAIL: Valid data should not have rejections');
  process.exit(1);
}

if (report.overall_pass_rate < 0.9) {
  console.error('\n❌ FAIL: Pass rate should be >90% for clean data');
  process.exit(1);
}

console.log('\n✅ Test 1 PASSED: Clean data validated successfully');
EOF

    $RUNTIME test_valid.ts
    rm test_valid.ts
else
    echo "⚠️  Skipping: examples/valid_boxscore.json not found"
fi

echo ""
echo "---"
echo ""

# =============================================================================
# Test 2: Invalid Data (Should Reject)
# =============================================================================

echo "🧪 Test 2: Validating invalid data (invalid_boxscore.json)..."
echo "Expected: High rejection rate, multiple failures"
echo ""

if [ -f "examples/invalid_boxscore.json" ]; then
    cat > test_invalid.ts << 'EOF'
import { runQCPipeline } from './scripts/qc_analysis';
import { formatReportConsole } from './scripts/qc_reporting';
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('examples/invalid_boxscore.json', 'utf-8'));

const result = await runQCPipeline({
  games: data.games || [],
  player_stats: data.player_stats || [],
  simulations: data.simulations || [],
  data_source: 'TEST_INVALID_DATA'
}, {
  auto_reject_failures: true,
  auto_reject_outliers: false,
  mad_threshold: 5.0,
  min_confidence_score: 0.7
});

console.log(formatReportConsole(result.report));

// Assert expectations
const { report } = result;
if (report.records_rejected === 0) {
  console.error('\n❌ FAIL: Invalid data should have rejections');
  process.exit(1);
}

if (report.critical_failures === 0) {
  console.error('\n❌ FAIL: Should detect critical failures');
  process.exit(1);
}

console.log('\n✅ Test 2 PASSED: Invalid data correctly rejected');
EOF

    $RUNTIME test_invalid.ts
    rm test_invalid.ts
else
    echo "⚠️  Skipping: examples/invalid_boxscore.json not found"
fi

echo ""
echo "---"
echo ""

# =============================================================================
# Test 3: Comprehensive Test Data
# =============================================================================

echo "🧪 Test 3: Running comprehensive QC on test_data.json..."
echo "Expected: Mixed results with clear categorization"
echo ""

if [ -f "examples/test_data.json" ]; then
    $RUNTIME examples/example_usage.ts
else
    echo "⚠️  Skipping: examples/test_data.json not found"
fi

echo ""
echo "---"
echo ""

# =============================================================================
# Test 4: MAD Outlier Detection
# =============================================================================

echo "🧪 Test 4: Testing MAD outlier detection..."
echo ""

cat > test_mad.ts << 'EOF'
import { calculateMAD, calculateMedian, detectOutliersMAD } from './scripts/qc_core';

// Test dataset: normal values + 2 outliers
const velocities = [85, 87, 86, 88, 85, 87, 86, 88, 150, 40];

const median = calculateMedian(velocities);
const mad = calculateMAD(velocities);
const outliers = detectOutliersMAD(velocities, 'pitch_velocity', 5.0);

console.log('Dataset:', velocities);
console.log('Median:', median);
console.log('MAD:', mad);
console.log('\nOutliers detected:');
outliers
  .filter(o => o.is_outlier)
  .forEach(o => {
    console.log(`  - ${o.value} mph (MAD score: ${o.mad_score.toFixed(2)}, ${o.recommendation})`);
  });

// Assertions
const outlierCount = outliers.filter(o => o.is_outlier).length;
if (outlierCount !== 2) {
  console.error(`\n❌ FAIL: Expected 2 outliers, found ${outlierCount}`);
  process.exit(1);
}

if (Math.abs(median - 86.5) > 1) {
  console.error(`\n❌ FAIL: Median should be ~86.5, got ${median}`);
  process.exit(1);
}

console.log('\n✅ Test 4 PASSED: MAD detection working correctly');
EOF

$RUNTIME test_mad.ts
rm test_mad.ts

echo ""
echo "---"
echo ""

# =============================================================================
# Summary
# =============================================================================

echo ""
echo "=========================================="
echo "✅ All Tests Passed!"
echo "=========================================="
echo ""
echo "QC validation logic is working correctly:"
echo "  ✓ Valid data passes with high confidence"
echo "  ✓ Invalid data is correctly rejected"
echo "  ✓ Outliers are properly detected using MAD"
echo "  ✓ Reports are generated successfully"
echo ""
echo "Next steps:"
echo "  1. Deploy to Cloudflare: ./setup.sh"
echo "  2. Integrate with scrapers (see SKILL.md)"
echo "  3. Monitor production data quality"
echo ""
