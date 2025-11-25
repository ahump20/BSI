/**
 * Sports Data Quality Control - Reporting Module
 *
 * Generates human-readable QC summary reports and visualizations.
 * Produces JSON, Markdown, and HTML output formats.
 *
 * @module qc_reporting
 */

import type { QCReport, QCCheckResult, OutlierResult } from './qc_core';

// ============================================================================
// REPORT FORMATTING
// ============================================================================

/**
 * Format QC report as JSON (for API responses)
 */
export function formatReportJSON(report: QCReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format QC report as Markdown (for documentation/logging)
 */
export function formatReportMarkdown(report: QCReport): string {
  const lines: string[] = [];

  lines.push(`# Data Quality Control Report`);
  lines.push(`**Report ID:** ${report.report_id}`);
  lines.push(`**Timestamp:** ${report.timestamp}`);
  lines.push(`**Data Source:** ${report.data_source}`);
  lines.push('');

  // Summary section
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Records:** ${report.total_records}`);
  lines.push(
    `- **Passed:** ${report.records_passed} (${percentage(report.records_passed, report.total_records)}%)`
  );
  lines.push(
    `- **Flagged:** ${report.records_flagged} (${percentage(report.records_flagged, report.total_records)}%)`
  );
  lines.push(
    `- **Rejected:** ${report.records_rejected} (${percentage(report.records_rejected, report.total_records)}%)`
  );
  lines.push('');

  // Metrics comparison
  lines.push('## Metrics Comparison');
  lines.push('');
  lines.push('| Metric | Before | After | Change |');
  lines.push('|--------|--------|-------|--------|');

  if (
    report.metrics_before.mean_batting_avg !== undefined &&
    report.metrics_after.mean_batting_avg !== undefined
  ) {
    const change = report.metrics_after.mean_batting_avg - report.metrics_before.mean_batting_avg;
    lines.push(
      `| Mean Batting Avg | ${report.metrics_before.mean_batting_avg.toFixed(3)} | ${report.metrics_after.mean_batting_avg.toFixed(3)} | ${change >= 0 ? '+' : ''}${change.toFixed(3)} |`
    );
  }

  if (
    report.metrics_before.median_pitch_velocity !== undefined &&
    report.metrics_after.median_pitch_velocity !== undefined
  ) {
    const change =
      report.metrics_after.median_pitch_velocity - report.metrics_before.median_pitch_velocity;
    lines.push(
      `| Median Pitch Velocity | ${report.metrics_before.median_pitch_velocity.toFixed(1)} mph | ${report.metrics_after.median_pitch_velocity.toFixed(1)} mph | ${change >= 0 ? '+' : ''}${change.toFixed(1)} mph |`
    );
  }

  if (
    report.metrics_before.median_exit_velocity !== undefined &&
    report.metrics_after.median_exit_velocity !== undefined
  ) {
    const change =
      report.metrics_after.median_exit_velocity - report.metrics_before.median_exit_velocity;
    lines.push(
      `| Median Exit Velocity | ${report.metrics_before.median_exit_velocity.toFixed(1)} mph | ${report.metrics_after.median_exit_velocity.toFixed(1)} mph | ${change >= 0 ? '+' : ''}${change.toFixed(1)} mph |`
    );
  }

  const completenessChange =
    report.metrics_after.completeness_percentage - report.metrics_before.completeness_percentage;
  lines.push(
    `| Data Completeness | ${report.metrics_before.completeness_percentage.toFixed(1)}% | ${report.metrics_after.completeness_percentage.toFixed(1)}% | ${completenessChange >= 0 ? '+' : ''}${completenessChange.toFixed(1)}% |`
  );

  lines.push('');

  // Validation checks
  lines.push('## Validation Checks');
  lines.push('');

  const failedChecks = report.checks.filter((c) => c.status === 'FAIL');
  const warningChecks = report.checks.filter((c) => c.status === 'WARNING');
  const passedChecks = report.checks.filter((c) => c.status === 'PASS');

  lines.push(`- **Failed:** ${failedChecks.length}`);
  lines.push(`- **Warnings:** ${warningChecks.length}`);
  lines.push(`- **Passed:** ${passedChecks.length}`);
  lines.push('');

  if (failedChecks.length > 0) {
    lines.push('### Failed Checks');
    lines.push('');
    const failedSummary = summarizeChecks(failedChecks);
    for (const [checkName, count] of Object.entries(failedSummary)) {
      lines.push(`- **${checkName}:** ${count} failure(s)`);
    }
    lines.push('');
  }

  if (warningChecks.length > 0) {
    lines.push('### Warning Checks');
    lines.push('');
    const warningSummary = summarizeChecks(warningChecks);
    for (const [checkName, count] of Object.entries(warningSummary)) {
      lines.push(`- **${checkName}:** ${count} warning(s)`);
    }
    lines.push('');
  }

  // Outliers
  if (report.outliers.length > 0) {
    lines.push('## Outlier Detection');
    lines.push('');

    const rejectOutliers = report.outliers.filter((o) => o.recommendation === 'REJECT');
    const flagOutliers = report.outliers.filter((o) => o.recommendation === 'FLAG');
    const acceptOutliers = report.outliers.filter((o) => o.recommendation === 'ACCEPT');

    lines.push(`- **Extreme Outliers (>7 MADs):** ${rejectOutliers.length}`);
    lines.push(`- **Moderate Outliers (5-7 MADs):** ${flagOutliers.length}`);
    lines.push(`- **Within Normal Range (<5 MADs):** ${acceptOutliers.length}`);
    lines.push('');

    if (rejectOutliers.length > 0) {
      lines.push('### Extreme Outliers');
      lines.push('');
      lines.push('| Metric | Value | MAD Score | Recommendation |');
      lines.push('|--------|-------|-----------|----------------|');

      for (const outlier of rejectOutliers.slice(0, 20)) {
        // Limit to top 20
        lines.push(
          `| ${outlier.metric_name} | ${outlier.value.toFixed(2)} | ${outlier.mad_score.toFixed(2)} | ${outlier.recommendation} |`
        );
      }

      if (rejectOutliers.length > 20) {
        lines.push(`| ... | ... | ... | ... |`);
        lines.push(`\n*Showing 20 of ${rejectOutliers.length} extreme outliers*\n`);
      }

      lines.push('');
    }

    if (flagOutliers.length > 0) {
      lines.push('### Moderate Outliers (Review Recommended)');
      lines.push('');
      const outlierSummary = summarizeOutliers(flagOutliers);
      for (const [metric, count] of Object.entries(outlierSummary)) {
        lines.push(`- **${metric}:** ${count} outlier(s)`);
      }
      lines.push('');
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format QC report as HTML (for web dashboards)
 */
export function formatReportHTML(report: QCReport): string {
  const html: string[] = [];

  html.push('<!DOCTYPE html>');
  html.push('<html lang="en">');
  html.push('<head>');
  html.push('  <meta charset="UTF-8">');
  html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  html.push('  <title>QC Report - ' + report.report_id + '</title>');
  html.push('  <style>');
  html.push(getReportCSS());
  html.push('  </style>');
  html.push('</head>');
  html.push('<body>');
  html.push('  <div class="container">');

  // Header
  html.push('    <header>');
  html.push('      <h1>Data Quality Control Report</h1>');
  html.push(`      <div class="metadata">`);
  html.push(`        <span><strong>Report ID:</strong> ${report.report_id}</span>`);
  html.push(
    `        <span><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</span>`
  );
  html.push(`        <span><strong>Data Source:</strong> ${report.data_source}</span>`);
  html.push(`      </div>`);
  html.push('    </header>');

  // Summary cards
  html.push('    <section class="summary">');
  html.push('      <div class="card">');
  html.push(`        <h3>Total Records</h3>`);
  html.push(`        <div class="stat">${report.total_records}</div>`);
  html.push('      </div>');
  html.push('      <div class="card success">');
  html.push(`        <h3>Passed</h3>`);
  html.push(`        <div class="stat">${report.records_passed}</div>`);
  html.push(
    `        <div class="percentage">${percentage(report.records_passed, report.total_records)}%</div>`
  );
  html.push('      </div>');
  html.push('      <div class="card warning">');
  html.push(`        <h3>Flagged</h3>`);
  html.push(`        <div class="stat">${report.records_flagged}</div>`);
  html.push(
    `        <div class="percentage">${percentage(report.records_flagged, report.total_records)}%</div>`
  );
  html.push('      </div>');
  html.push('      <div class="card error">');
  html.push(`        <h3>Rejected</h3>`);
  html.push(`        <div class="stat">${report.records_rejected}</div>`);
  html.push(
    `        <div class="percentage">${percentage(report.records_rejected, report.total_records)}%</div>`
  );
  html.push('      </div>');
  html.push('    </section>');

  // Metrics comparison
  html.push('    <section class="metrics">');
  html.push('      <h2>Metrics Comparison</h2>');
  html.push('      <table>');
  html.push('        <thead>');
  html.push('          <tr><th>Metric</th><th>Before</th><th>After</th><th>Change</th></tr>');
  html.push('        </thead>');
  html.push('        <tbody>');

  if (
    report.metrics_before.mean_batting_avg !== undefined &&
    report.metrics_after.mean_batting_avg !== undefined
  ) {
    const change = report.metrics_after.mean_batting_avg - report.metrics_before.mean_batting_avg;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    html.push(`          <tr>`);
    html.push(`            <td>Mean Batting Avg</td>`);
    html.push(`            <td>${report.metrics_before.mean_batting_avg.toFixed(3)}</td>`);
    html.push(`            <td>${report.metrics_after.mean_batting_avg.toFixed(3)}</td>`);
    html.push(
      `            <td class="${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(3)}</td>`
    );
    html.push(`          </tr>`);
  }

  if (
    report.metrics_before.median_pitch_velocity !== undefined &&
    report.metrics_after.median_pitch_velocity !== undefined
  ) {
    const change =
      report.metrics_after.median_pitch_velocity - report.metrics_before.median_pitch_velocity;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    html.push(`          <tr>`);
    html.push(`            <td>Median Pitch Velocity</td>`);
    html.push(`            <td>${report.metrics_before.median_pitch_velocity.toFixed(1)} mph</td>`);
    html.push(`            <td>${report.metrics_after.median_pitch_velocity.toFixed(1)} mph</td>`);
    html.push(
      `            <td class="${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(1)} mph</td>`
    );
    html.push(`          </tr>`);
  }

  const completenessChange =
    report.metrics_after.completeness_percentage - report.metrics_before.completeness_percentage;
  const changeClass = completenessChange >= 0 ? 'positive' : 'negative';
  html.push(`          <tr>`);
  html.push(`            <td>Data Completeness</td>`);
  html.push(`            <td>${report.metrics_before.completeness_percentage.toFixed(1)}%</td>`);
  html.push(`            <td>${report.metrics_after.completeness_percentage.toFixed(1)}%</td>`);
  html.push(
    `            <td class="${changeClass}">${completenessChange >= 0 ? '+' : ''}${completenessChange.toFixed(1)}%</td>`
  );
  html.push(`          </tr>`);

  html.push('        </tbody>');
  html.push('      </table>');
  html.push('    </section>');

  // Validation checks
  const failedChecks = report.checks.filter((c) => c.status === 'FAIL');
  const warningChecks = report.checks.filter((c) => c.status === 'WARNING');

  if (failedChecks.length > 0 || warningChecks.length > 0) {
    html.push('    <section class="checks">');
    html.push('      <h2>Validation Checks</h2>');

    if (failedChecks.length > 0) {
      html.push('      <h3>Failed Checks</h3>');
      html.push('      <ul class="check-list error">');
      const failedSummary = summarizeChecks(failedChecks);
      for (const [checkName, count] of Object.entries(failedSummary)) {
        html.push(`        <li><strong>${checkName}:</strong> ${count} failure(s)</li>`);
      }
      html.push('      </ul>');
    }

    if (warningChecks.length > 0) {
      html.push('      <h3>Warnings</h3>');
      html.push('      <ul class="check-list warning">');
      const warningSummary = summarizeChecks(warningChecks);
      for (const [checkName, count] of Object.entries(warningSummary)) {
        html.push(`        <li><strong>${checkName}:</strong> ${count} warning(s)</li>`);
      }
      html.push('      </ul>');
    }

    html.push('    </section>');
  }

  // Outliers
  if (report.outliers.length > 0) {
    const rejectOutliers = report.outliers.filter((o) => o.recommendation === 'REJECT');
    const flagOutliers = report.outliers.filter((o) => o.recommendation === 'FLAG');

    html.push('    <section class="outliers">');
    html.push('      <h2>Outlier Detection</h2>');
    html.push('      <p>');
    html.push(`        Extreme Outliers: <strong>${rejectOutliers.length}</strong> | `);
    html.push(`        Moderate Outliers: <strong>${flagOutliers.length}</strong>`);
    html.push('      </p>');

    if (rejectOutliers.length > 0) {
      html.push('      <h3>Extreme Outliers (>7 MADs)</h3>');
      html.push('      <table>');
      html.push('        <thead>');
      html.push(
        '          <tr><th>Metric</th><th>Value</th><th>MAD Score</th><th>Recommendation</th></tr>'
      );
      html.push('        </thead>');
      html.push('        <tbody>');

      for (const outlier of rejectOutliers.slice(0, 20)) {
        html.push(`          <tr>`);
        html.push(`            <td>${outlier.metric_name}</td>`);
        html.push(`            <td>${outlier.value.toFixed(2)}</td>`);
        html.push(`            <td>${outlier.mad_score.toFixed(2)}</td>`);
        html.push(
          `            <td><span class="badge error">${outlier.recommendation}</span></td>`
        );
        html.push(`          </tr>`);
      }

      html.push('        </tbody>');
      html.push('      </table>');

      if (rejectOutliers.length > 20) {
        html.push(
          `      <p class="note">Showing 20 of ${rejectOutliers.length} extreme outliers</p>`
        );
      }
    }

    html.push('    </section>');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    html.push('    <section class="recommendations">');
    html.push('      <h2>Recommendations</h2>');
    html.push('      <ul>');
    for (const rec of report.recommendations) {
      html.push(`        <li>${rec}</li>`);
    }
    html.push('      </ul>');
    html.push('    </section>');
  }

  html.push('  </div>');
  html.push('</body>');
  html.push('</html>');

  return html.join('\n');
}

/**
 * Generate console-friendly summary output
 */
export function formatReportConsole(report: QCReport): string {
  const lines: string[] = [];

  lines.push('\n' + '='.repeat(80));
  lines.push('  DATA QUALITY CONTROL REPORT');
  lines.push('='.repeat(80));
  lines.push(`Report ID:    ${report.report_id}`);
  lines.push(`Timestamp:    ${report.timestamp}`);
  lines.push(`Data Source:  ${report.data_source}`);
  lines.push('');

  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Records:   ${report.total_records}`);
  lines.push(
    `  ✓ Passed:      ${report.records_passed} (${percentage(report.records_passed, report.total_records)}%)`
  );
  lines.push(
    `  ⚠ Flagged:     ${report.records_flagged} (${percentage(report.records_flagged, report.total_records)}%)`
  );
  lines.push(
    `  ✗ Rejected:    ${report.records_rejected} (${percentage(report.records_rejected, report.total_records)}%)`
  );
  lines.push('');

  const failedChecks = report.checks.filter((c) => c.status === 'FAIL');
  const warningChecks = report.checks.filter((c) => c.status === 'WARNING');

  if (failedChecks.length > 0 || warningChecks.length > 0) {
    lines.push('VALIDATION ISSUES');
    lines.push('-'.repeat(80));
    lines.push(`Failed Checks:   ${failedChecks.length}`);
    lines.push(`Warning Checks:  ${warningChecks.length}`);
    lines.push('');
  }

  if (report.outliers.length > 0) {
    const rejectOutliers = report.outliers.filter((o) => o.recommendation === 'REJECT');
    const flagOutliers = report.outliers.filter((o) => o.recommendation === 'FLAG');

    lines.push('OUTLIER DETECTION');
    lines.push('-'.repeat(80));
    lines.push(`Extreme Outliers (>7 MADs):   ${rejectOutliers.length}`);
    lines.push(`Moderate Outliers (5-7 MADs): ${flagOutliers.length}`);
    lines.push('');
  }

  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(80));
    for (const rec of report.recommendations) {
      lines.push(`• ${rec}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(80) + '\n');

  return lines.join('\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate percentage with proper rounding
 */
function percentage(value: number, total: number): string {
  if (total === 0) return '0.0';
  return ((value / total) * 100).toFixed(1);
}

/**
 * Summarize checks by name with counts
 */
function summarizeChecks(checks: QCCheckResult[]): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const check of checks) {
    summary[check.check_name] = (summary[check.check_name] || 0) + 1;
  }

  return summary;
}

/**
 * Summarize outliers by metric with counts
 */
function summarizeOutliers(outliers: OutlierResult[]): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const outlier of outliers) {
    summary[outlier.metric_name] = (summary[outlier.metric_name] || 0) + 1;
  }

  return summary;
}

/**
 * CSS for HTML reports
 */
function getReportCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    h1 {
      color: #1a1a1a;
      margin-bottom: 15px;
    }

    h2 {
      color: #333;
      margin: 30px 0 15px;
      font-size: 24px;
    }

    h3 {
      color: #555;
      margin: 20px 0 10px;
      font-size: 18px;
    }

    .metadata {
      display: flex;
      gap: 30px;
      color: #666;
      font-size: 14px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }

    .card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #ccc;
    }

    .card.success {
      border-left-color: #28a745;
    }

    .card.warning {
      border-left-color: #ffc107;
    }

    .card.error {
      border-left-color: #dc3545;
    }

    .card h3 {
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin: 0 0 10px;
    }

    .card .stat {
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
    }

    .card .percentage {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #555;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .positive {
      color: #28a745;
    }

    .negative {
      color: #dc3545;
    }

    .check-list {
      list-style: none;
      padding: 0;
    }

    .check-list li {
      padding: 10px;
      margin: 5px 0;
      border-left: 4px solid #ccc;
      background: #f8f9fa;
    }

    .check-list.error li {
      border-left-color: #dc3545;
    }

    .check-list.warning li {
      border-left-color: #ffc107;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.error {
      background: #dc3545;
      color: white;
    }

    .badge.warning {
      background: #ffc107;
      color: #333;
    }

    .badge.success {
      background: #28a745;
      color: white;
    }

    .recommendations ul {
      list-style: disc;
      padding-left: 30px;
    }

    .recommendations li {
      margin: 10px 0;
    }

    .note {
      font-size: 14px;
      color: #666;
      font-style: italic;
      margin-top: 10px;
    }

    section {
      margin: 30px 0;
    }
  `;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Save QC report to KV storage (for Cloudflare Workers)
 */
export async function saveReportToKV(
  report: QCReport,
  kv: KVNamespace,
  ttl: number = 86400 // 24 hours default
): Promise<void> {
  const key = `qc:report:${report.report_id}`;
  await kv.put(key, JSON.stringify(report), {
    expirationTtl: ttl,
  });
}

/**
 * Retrieve QC report from KV storage
 */
export async function getReportFromKV(reportId: string, kv: KVNamespace): Promise<QCReport | null> {
  const key = `qc:report:${reportId}`;
  const data = await kv.get(key, 'json');
  return data as QCReport | null;
}

/**
 * List recent QC reports from KV (requires prefix listing)
 */
export async function listRecentReports(kv: KVNamespace, limit: number = 50): Promise<string[]> {
  const list = await kv.list({ prefix: 'qc:report:', limit });
  return list.keys.map((k) => k.name.replace('qc:report:', ''));
}
