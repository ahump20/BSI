import { nanoid } from "nanoid";
import { z } from "zod";
import {
  BaselineMetrics,
  DataSource,
  QcReport,
  Sport,
  runQualityChecks,
} from "../../mnt/skills/user/sports-data-qc/scripts/qc_core";
import {
  generateMarkdownReport,
  summarizeForKv,
} from "../../mnt/skills/user/sports-data-qc/scripts/qc_reporting";

interface Env {
  QC_DB: D1Database;
  QC_CACHE: KVNamespace;
}

const requestSchema = z.object({
  source: z.enum(["espn_box_score", "ncaa_stats", "pitch_tracking", "game_simulator"]),
  sport: z.enum(["college_baseball", "mlb", "nfl"]),
  sourceUrl: z.string().url(),
  scrapedAt: z.string().datetime(),
  payload: z.unknown(),
});

const fetchBaseline = async (
  env: Env,
  source: DataSource,
  sport: Sport,
): Promise<BaselineMetrics | undefined> => {
  const row = await env.QC_DB.prepare(
    `SELECT source, sport, mean_batting_average, mean_pitch_velocity, mean_exit_velocity, mean_win_probability_home, sample_size, computed_at
     FROM qc_baselines
     WHERE source = ?1 AND sport = ?2
     ORDER BY datetime(computed_at) DESC
     LIMIT 1`,
  )
    .bind(source, sport)
    .first();

  if (!row) {
    return undefined;
  }

  return {
    source: row.source as DataSource,
    sport: row.sport as Sport,
    meanBattingAverage: row.mean_batting_average ?? undefined,
    meanPitchVelocity: row.mean_pitch_velocity ?? undefined,
    meanExitVelocity: row.mean_exit_velocity ?? undefined,
    meanWinProbabilityHome: row.mean_win_probability_home ?? undefined,
    sampleSize: row.sample_size ?? 0,
    computedAt: row.computed_at,
  };
};

const persistBaseline = async (env: Env, report: QcReport): Promise<void> => {
  const { rawMetrics } = report;
  const statement = env.QC_DB.prepare(
    `INSERT INTO qc_baselines (source, sport, mean_batting_average, mean_pitch_velocity, mean_exit_velocity, mean_win_probability_home, sample_size, computed_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT(source, sport)
     DO UPDATE SET
       mean_batting_average = excluded.mean_batting_average,
       mean_pitch_velocity = excluded.mean_pitch_velocity,
       mean_exit_velocity = excluded.mean_exit_velocity,
       mean_win_probability_home = excluded.mean_win_probability_home,
       sample_size = excluded.sample_size,
       computed_at = excluded.computed_at`,
  );

  await statement
    .bind(
      report.source,
      report.sport,
      rawMetrics.battingAverageMean ?? rawMetrics.avgBattingAverage ?? null,
      rawMetrics.pitchVelocityMean ?? rawMetrics.avgVelocity ?? null,
      rawMetrics.exitVelocityMean ?? null,
      rawMetrics.homeWinProbability ?? null,
      rawMetrics.sampleSize ?? 0,
      report.generatedAt,
    )
    .run();
};

const persistReport = async (env: Env, report: QcReport, markdown: string): Promise<void> => {
  const reportId = nanoid();
  await env.QC_DB.prepare(
    `INSERT INTO qc_reports (id, source, sport, confidence, generated_at, payload)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
  )
    .bind(reportId, report.source, report.sport, report.metadata.confidence, report.generatedAt, JSON.stringify(report))
    .run();

  await env.QC_DB.prepare(
    `INSERT INTO qc_report_documents (report_id, markdown)
     VALUES (?1, ?2)`,
  )
    .bind(reportId, markdown)
    .run();

  await env.QC_CACHE.put(
    `qc:${report.source}:${report.sport}`,
    JSON.stringify(summarizeForKv(report)),
    { expirationTtl: 3600 },
  );
};

const respondJson = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    ...init,
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return respondJson({ error: "Method not allowed" }, { status: 405 });
    }

    const requestId = request.headers.get("cf-ray") ?? nanoid();

    let parsed: z.infer<typeof requestSchema>;
    try {
      const json = await request.json();
      parsed = requestSchema.parse(json);
    } catch (error) {
      return respondJson(
        {
          error: "Invalid JSON payload",
          details: error instanceof Error ? error.message : String(error),
          requestId,
        },
        { status: 400 },
      );
    }

    try {
      const baseline = await fetchBaseline(env, parsed.source, parsed.sport);
      const report = runQualityChecks({
        source: parsed.source,
        sport: parsed.sport,
        sourceUrl: parsed.sourceUrl,
        scrapedAt: parsed.scrapedAt,
        payload: parsed.payload,
        baseline,
      });

      const { markdown } = generateMarkdownReport(report);

      await persistReport(env, report, markdown);
      try {
        await persistBaseline(env, report);
      } catch (baselineError) {
        console.error("Failed to upsert baseline", baselineError);
      }

      return respondJson({
        requestId,
        report,
      });
    } catch (error) {
      return respondJson(
        {
          error: "QC processing failed",
          details: error instanceof Error ? error.message : String(error),
          requestId,
        },
        { status: 500 },
      );
    }
  },
};
