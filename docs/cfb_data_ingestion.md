# NCAA Football Data Ingestion Pipeline

This guide explains how to leverage `etl/cfb_data_ingest.py` to assemble a
unified NCAA football (CFB) data archive for BlazeSportsIntel.com. The workflow
is designed to pull historical and current datasets from the
[CollegeFootballData.com](https://collegefootballdata.com/) (CFBD) API and
persist them in a normalized SQLite database that can be synced into the broader
analytics platform.

## Highlights

- **Modular datasets** – pick and choose from teams, games, advanced team stats,
  recruiting, coaches, drives, and plays.
- **Async ingestion** – batches API calls with controlled concurrency to avoid
  hitting service limits.
- **Durable storage** – every API response is stored as JSON in
  `data/cfb/cfb.sqlite`, making it easy to replay ingests, build warehouse jobs,
  or hydrate downstream services.
- **Environment-aware** – automatically reads your `CFBD_API_KEY` (required for
  premium or high-volume access) without hard-coding secrets.

## Requirements

1. Install Python dependencies (from the project root):

   ```bash
   pip install -r requirements.txt
   ```

2. Acquire a CFBD API token and expose it to the runtime:

   ```bash
   export CFBD_API_KEY="<your-token>"
   ```

   The script can operate without an API key for low-volume endpoints, but a key
   is strongly recommended for full-historical pulls.

## Usage

Run the ingestion module via Python’s module runner:

```bash
python -m etl.cfb_data_ingest \
  --seasons 2005 2006 2007 2008 2009 2010 \
  --datasets teams games stats recruiting coaches drives plays \
  --database data/cfb/cfb.sqlite \
  --max-pages 25 \
  --log-level INFO
```

### Arguments

| Flag | Description |
| ---- | ----------- |
| `--seasons` | List of seasons (calendar years) to harvest. Defaults to `2024`. |
| `--datasets` | Dataset names to ingest. Defaults to `teams games stats recruiting coaches`. |
| `--database` | Target SQLite file. Defaults to `data/cfb/cfb.sqlite`. |
| `--max-pages` | Optional safety stop for paginated endpoints such as `plays`. |
| `--timeout` | HTTP timeout (seconds) per request. Defaults to `60`. |
| `--log-level` | Logging threshold (`DEBUG`, `INFO`, etc.). |

### Dataset Reference

The following datasets are currently wired in:

- `teams`: Current and historical FBS teams.
- `games`: Regular-season game metadata.
- `stats`: Seasonal offensive statistics.
- `recruiting`: Team recruiting class summaries.
- `coaches`: Staff rosters by season.
- `drives`: Drive-level data (large payload; consider `--max-pages`).
- `plays`: Play-level data (very large; always paginate and run in batches).

Extending to additional CFBD endpoints is as simple as appending to
`DATASET_REGISTRY` in `etl/cfb_data_ingest.py`.

## Output Structure

The script creates (or updates) `data/cfb/cfb.sqlite` with two tables:

- `cfb_payloads`: Raw JSON payloads for each dataset/season/page combination.
- `cfb_ingest_log`: Operational log capturing successes and failures for audit
  and observability.

This approach keeps the ingest resilient while deferring heavy
transformations—ideal for integrating with Prefect flows, dbt models, or the
Blaze Sports Intel warehouse loaders.

## Next Steps

1. Schedule recurring jobs (via Prefect, Airflow, or Cloudflare Workers + Cron
   Triggers) to keep the archive current.
2. Build normalization transforms that flatten raw payloads into analytics-ready
   tables (`games`, `teams`, `plays`, etc.).
3. Replicate the SQLite contents into the production Postgres warehouse or cloud
   storage buckets used by BlazeSportsIntel.com.
4. Surface freshness metrics on the Blaze dashboards to track ingest health.

With this pipeline in place you have a single, extensible path for merging
historical and live NCAA football data directly into the Blaze ecosystem.
