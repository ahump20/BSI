import { QcReport } from "./qc_core";

export interface ReportSummary {
  markdown: string;
  actionableItems: string[];
}

const statusEmoji: Record<string, string> = {
  pass: "✅",
  warn: "⚠️",
  fail: "❌",
};

const formatCheckSummary = (report: QcReport): string => {
  return report.checks
    .map((check) => {
      const emoji = statusEmoji[check.status];
      const metrics = check.metrics
        ? ` (metrics: ${Object.entries(check.metrics)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ")})`
        : "";
      const impacted = check.impactedRecords.length > 0
        ? ` — impacted: ${check.impactedRecords.join(", ")}`
        : "";
      return `- ${emoji} **${check.check}**: ${check.details}${metrics}${impacted}`;
    })
    .join("\n");
};

const formatOutliers = (report: QcReport): string => {
  if (report.outliers.length === 0) {
    return "No outliers flagged.";
  }
  return report.outliers
    .map((outlier) => {
      const direction = outlier.modifiedZScore >= 0 ? "above" : "below";
      return `- ${outlier.id} · ${outlier.metric}=${outlier.value.toFixed(3)} (${direction} median ${outlier.median.toFixed(3)}, MAD=${outlier.mad.toFixed(3)})`; // prettier-ignore
    })
    .join("\n");
};

const formatDistribution = (report: QcReport): string => {
  return report.distribution
    .map((entry) => {
      const shift = entry.previousMean !== undefined
        ? `Δ=${(entry.delta ?? 0).toFixed(4)} (${entry.percentageChange?.toFixed(2) ?? "0.00"}%)`
        : "No baseline";
      return `- ${entry.metric}: current=${entry.currentMean.toFixed(4)} (${shift}), sample=${entry.sampleSize}`;
    })
    .join("\n");
};

export const generateMarkdownReport = (report: QcReport): ReportSummary => {
  const header = `# Blaze Sports QC Report\\n\\n` +
    `**Source:** ${report.source} (${report.sport})\\n\\n` +
    `**Scrape URL:** ${report.metadata.sourceUrl}\\n\\n` +
    `**Scraped (America/Chicago):** ${report.metadata.scrapedAt}\\n\\n` +
    `**Confidence:** ${(report.metadata.confidence * 100).toFixed(1)}%\\n\\n`;

  const summary = `## Summary\\n` +
    `- Records evaluated: ${report.summary.recordsEvaluated}\\n` +
    `- Records flagged: ${report.summary.recordsFlagged}\\n` +
    `- Records filtered: ${report.summary.recordsFiltered} (${report.summary.filteredPercentage}% filtered)\\n`;

  const checks = `## Checks\\n${formatCheckSummary(report)}\\n`;
  const outliers = `## MAD Outliers\\n${formatOutliers(report)}\\n`;
  const distribution = `## Distribution Shifts\\n${formatDistribution(report)}\\n`;
  const recommendations = `## Recommendations\\n${report.recommendations.map((item) => `- ${item}`).join("\n")}`;

  return {
    markdown: `${header}${summary}\n${checks}\n${outliers}\n${distribution}\n${recommendations}\n`,
    actionableItems: report.recommendations,
  };
};

export const summarizeForKv = (report: QcReport): Record<string, unknown> => ({
  source: report.source,
  sport: report.sport,
  confidence: report.metadata.confidence,
  generatedAt: report.generatedAt,
  recordsFlagged: report.summary.recordsFlagged,
  filteredPercentage: report.summary.filteredPercentage,
});
