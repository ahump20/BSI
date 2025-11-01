#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { exit } from "node:process";
import {
  BaselineMetrics,
  DataSource,
  QcReport,
  Sport,
  runQualityChecks,
} from "./qc_core";

interface CliOptions {
  inputPath: string;
  source: DataSource;
  sport: Sport;
  sourceUrl: string;
  scrapedAt: string;
  outputPath?: string;
  baselinePath?: string;
}

const SUPPORTED_SOURCES: DataSource[] = [
  "espn_box_score",
  "ncaa_stats",
  "pitch_tracking",
  "game_simulator",
];

const SUPPORTED_SPORTS: Sport[] = ["college_baseball", "mlb", "nfl"];

const parseArgs = (argv: string[]): CliOptions => {
  const options: Partial<CliOptions> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--input":
      case "-i":
        options.inputPath = argv[++i];
        break;
      case "--source":
      case "-s":
        options.source = argv[++i] as DataSource;
        break;
      case "--sport":
        options.sport = argv[++i] as Sport;
        break;
      case "--url":
        options.sourceUrl = argv[++i];
        break;
      case "--scraped-at":
        options.scrapedAt = argv[++i];
        break;
      case "--output":
      case "-o":
        options.outputPath = argv[++i];
        break;
      case "--baseline":
        options.baselinePath = argv[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.inputPath) {
    throw new Error("--input <path> is required");
  }
  if (!options.source || !SUPPORTED_SOURCES.includes(options.source)) {
    throw new Error(`--source must be one of: ${SUPPORTED_SOURCES.join(", ")}`);
  }
  if (!options.sport || !SUPPORTED_SPORTS.includes(options.sport)) {
    throw new Error(`--sport must be one of: ${SUPPORTED_SPORTS.join(", ")}`);
  }
  if (!options.sourceUrl) {
    throw new Error("--url <source-url> is required");
  }
  if (!options.scrapedAt) {
    throw new Error("--scraped-at <timestamp> is required");
  }

  return options as CliOptions;
};

const loadBaseline = async (baselinePath?: string): Promise<BaselineMetrics | undefined> => {
  if (!baselinePath) {
    return undefined;
  }
  const baselineRaw = await readFile(baselinePath, "utf-8");
  const baseline = JSON.parse(baselineRaw) as BaselineMetrics;
  return baseline;
};

const run = async (): Promise<void> => {
  try {
    const options = parseArgs(process.argv.slice(2));
    const [payloadRaw, baseline] = await Promise.all([
      readFile(options.inputPath, "utf-8"),
      loadBaseline(options.baselinePath),
    ]);

    const payload = JSON.parse(payloadRaw);
    const report: QcReport = runQualityChecks({
      source: options.source,
      sport: options.sport,
      sourceUrl: options.sourceUrl,
      scrapedAt: options.scrapedAt,
      payload,
      baseline,
    });

    const output = JSON.stringify(report, null, 2);
    if (options.outputPath) {
      await writeFile(options.outputPath, output, "utf-8");
      console.log(`QC report written to ${options.outputPath}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error("QC analysis failed:", error instanceof Error ? error.message : error);
    exit(1);
  }
};

run();
