/**
 * Example Usage - Sports Data QC Skill
 *
 * This script demonstrates how to use the QC skill with test data.
 * Run with: bun run examples/example_usage.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { runQCPipeline } from '../scripts/qc_analysis';
import {
  formatReportConsole,
  formatReportMarkdown,
  formatReportHTML,
  formatReportJSON,
} from '../scripts/qc_reporting';

async function main() {
  console.log('==========================================');
  console.log('Sports Data QC - Example Usage');
  console.log('==========================================\n');

  // =========================================================================
  // STEP 1: Load test data
  // =========================================================================

  console.log('📁 Loading test data...');
  const testData = JSON.parse(readFileSync('./examples/test_data.json', 'utf-8'));

  console.log(`   - Games: ${testData.games.length}`);
  console.log(`   - Player Stats: ${testData.player_stats.length}`);
  console.log(`   - Simulations: ${testData.simulations.length}\n`);

  // =========================================================================
  // STEP 2: Run QC Pipeline (Permissive Mode)
  // =========================================================================

  console.log('🔍 Running QC Pipeline (Permissive Mode)...\n');

  const { report, filtered_data } = await runQCPipeline(
    {
      games: testData.games,
      player_stats: testData.player_stats,
      simulations: testData.simulations,
      data_source: 'TEST_DATA',
    },
    {
      mad_threshold: 5.0,
      auto_reject_failures: true,
      auto_reject_outliers: false,
      include_flagged: true,
      min_confidence_score: 0.5,
    }
  );

  // =========================================================================
  // STEP 3: Print Console Report
  // =========================================================================

  console.log(formatReportConsole(report));

  // =========================================================================
  // STEP 4: Save Reports in Multiple Formats
  // =========================================================================

  console.log('💾 Saving reports...');

  // Save JSON report
  writeFileSync('./examples/qc_report.json', formatReportJSON(report));
  console.log('   ✓ JSON report saved to: ./examples/qc_report.json');

  // Save Markdown report
  writeFileSync('./examples/qc_report.md', formatReportMarkdown(report));
  console.log('   ✓ Markdown report saved to: ./examples/qc_report.md');

  // Save HTML report
  writeFileSync('./examples/qc_report.html', formatReportHTML(report));
  console.log('   ✓ HTML report saved to: ./examples/qc_report.html');

  // Save filtered data
  writeFileSync('./examples/filtered_data.json', JSON.stringify(filtered_data, null, 2));
  console.log('   ✓ Filtered data saved to: ./examples/filtered_data.json\n');

  // =========================================================================
  // STEP 5: Analyze Results
  // =========================================================================

  console.log('📊 Analysis Summary:');
  console.log('─'.repeat(80));

  const passRate = (report.records_passed / report.total_records) * 100;
  const flagRate = (report.records_flagged / report.total_records) * 100;
  const rejectRate = (report.records_rejected / report.total_records) * 100;

  console.log(
    `Pass Rate:    ${passRate.toFixed(1)}% (${report.records_passed}/${report.total_records})`
  );
  console.log(
    `Flag Rate:    ${flagRate.toFixed(1)}% (${report.records_flagged}/${report.total_records})`
  );
  console.log(
    `Reject Rate:  ${rejectRate.toFixed(1)}% (${report.records_rejected}/${report.total_records})\n`
  );

  // Count failures by type
  const failedChecks = report.checks.filter((c) => c.status === 'FAIL');
  const failureTypes: Record<string, number> = {};

  for (const check of failedChecks) {
    failureTypes[check.check_name] = (failureTypes[check.check_name] || 0) + 1;
  }

  if (Object.keys(failureTypes).length > 0) {
    console.log('Failed Check Types:');
    for (const [checkName, count] of Object.entries(failureTypes)) {
      console.log(`   - ${checkName}: ${count}`);
    }
    console.log('');
  }

  // Show outliers
  const extremeOutliers = report.outliers.filter((o) => o.recommendation === 'REJECT');
  const moderateOutliers = report.outliers.filter((o) => o.recommendation === 'FLAG');

  if (extremeOutliers.length > 0) {
    console.log(`⚠️  Extreme Outliers Detected: ${extremeOutliers.length}`);
    for (const outlier of extremeOutliers.slice(0, 5)) {
      console.log(
        `   - ${outlier.metric_name}: ${outlier.value} (${outlier.mad_score.toFixed(2)} MADs from median)`
      );
    }
    console.log('');
  }

  if (moderateOutliers.length > 0) {
    console.log(`🔔 Moderate Outliers Flagged: ${moderateOutliers.length}`);
    for (const outlier of moderateOutliers.slice(0, 5)) {
      console.log(
        `   - ${outlier.metric_name}: ${outlier.value} (${outlier.mad_score.toFixed(2)} MADs from median)`
      );
    }
    console.log('');
  }

  // =========================================================================
  // STEP 6: Show Recommendations
  // =========================================================================

  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    console.log('─'.repeat(80));
    for (const rec of report.recommendations) {
      console.log(`   • ${rec}`);
    }
    console.log('');
  }

  // =========================================================================
  // STEP 7: Demonstrate Strict Mode
  // =========================================================================

  console.log('\n🔒 Running QC Pipeline (Strict Mode)...\n');

  const strictReport = await runQCPipeline(
    {
      games: testData.games,
      player_stats: testData.player_stats,
      simulations: testData.simulations,
      data_source: 'TEST_DATA_STRICT',
    },
    {
      mad_threshold: 4.0,
      auto_reject_failures: true,
      auto_reject_outliers: true,
      include_flagged: false,
      min_confidence_score: 0.8,
    }
  );

  const strictPassRate =
    (strictReport.report.records_passed / strictReport.report.total_records) * 100;

  console.log(`Strict Mode Results:`);
  console.log(
    `   Pass Rate: ${strictPassRate.toFixed(1)}% (${strictReport.report.records_passed}/${strictReport.report.total_records})`
  );
  console.log(
    `   Reject Rate: ${((strictReport.report.records_rejected / strictReport.report.total_records) * 100).toFixed(1)}% (${strictReport.report.records_rejected}/${strictReport.report.total_records})\n`
  );

  // =========================================================================
  // STEP 8: Exit with appropriate code
  // =========================================================================

  if (report.records_rejected > 0) {
    console.log('❌ QC pipeline found data quality issues. Review reports for details.');
    process.exit(1);
  } else {
    console.log('✅ All data passed QC checks. Safe to ingest into D1.');
    process.exit(0);
  }
}

// Run the example
main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
