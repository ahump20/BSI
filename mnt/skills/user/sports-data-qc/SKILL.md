# Sports Data QC Skill

## When to Use
Use this skill whenever scraped college baseball (priority), MLB, or NFL datasets need validation before landing in Cloudflare D1. Trigger it for:
- ESPN box scores and play-by-play payloads.
- NCAA statistics pages (team standings, player season totals).
- Pitch-tracking feeds (TrackMan, Hawkeye, Rapsodo exports).
- Internal game simulator output (win probabilities, Monte Carlo score grids).

Avoid running it for soccer or unsupported sports — the rule sets intentionally exclude them.

## Architecture Patterns
This skill mirrors the single-cell-rna-qc layout: modular validation core, CLI runner, and reporting utilities. It is tuned for Blaze Sports Intel’s Cloudflare Worker stack (Workers + D1 + KV).

### Approach 1 — Cloudflare Worker API (Production)
1. Deploy `workers/qc/sports-data-qc.ts` via Wrangler with D1 (`QC_DB`) and KV (`QC_CACHE`) bindings.
2. POST scraped payloads to the Worker. It validates data, annotates outliers, stores QC summaries in KV, and upserts baselines into D1 for drift tracking.
3. Integrate with upstream scraper Workers by enqueueing QC jobs after fetch+normalize.

Use this path for live ingestion, automated alerts, and any pipeline that must block bad data before it hits Diamond Insights surfaces.

### Approach 2 — Local CLI (Backfill & Forensics)
1. Run `npm run qc:analysis -- --input <file> --source <source> --sport <sport> --url <url> --scraped-at <ISO>`.
2. Optional `--baseline <file>` loads stored baseline metrics to compare against historical distributions.
3. Review the JSON output and the Markdown summary from `qc_reporting.ts` before promoting data.

This path is ideal for manual audits, backfills, or debugging suspect games prior to replays in production.

## Examples
- **College baseball ESPN box score**: `npm run qc:analysis -- --input workers/qc/examples/espn_box_score_sample.json --source espn_box_score --sport college_baseball --url https://www.espn.com/college-baseball/game/_/gameId/401885001 --scraped-at 2025-03-15T22:35:14Z --output tmp/qc_report.json`
- **NCAA standings refresh**: `npm run qc:analysis -- --input workers/qc/examples/ncaa_stats_sample.json --source ncaa_stats --sport college_baseball --url https://stats.ncaa.org/team/roster/123 --scraped-at 2025-03-17T03:12:00Z`
- **Pitch tracking session**: `npm run qc:analysis -- --input workers/qc/examples/pitch_tracking_sample.json --source pitch_tracking --sport mlb --url https://api.trackmanbaseball.com/game/654321 --scraped-at 2025-03-19T01:05:22Z`
- **Simulator batch**: `npm run qc:analysis -- --input workers/qc/examples/simulator_sample.json --source game_simulator --sport college_baseball --url https://blazesportsintel.com/sim/2025-texam-ark --scraped-at 2025-03-20T12:00:00Z`

The QC engine always flags suspicious data but leaves the ultimate accept/reject decision to operators — “Standard over vibes.”
