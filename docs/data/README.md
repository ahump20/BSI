# Data Platform Handbook

## Connection Endpoints

| Target | Variable | Notes |
| --- | --- | --- |
| Supabase (read/write) | `SUPABASE_DATABASE_URL` | Provisioned in Supabase > Project Settings > Database. Use the pooled connection string for ingestion workers. |
| Supabase read replica | `SUPABASE_REPLICA_URL` | Optional. Point API pages at the read replica to isolate OLTP load. |
| Vercel Postgres (preview) | `VERCEL_POSTGRES_URL` | Used by preview deployments when Supabase is not available. Inject through Vercel Environment Variables. |
| Cloudflare Worker | `DATABASE_URL` | The worker expects the Supabase primary string. Set via `wrangler secret put DATABASE_URL`. |
| Next.js runtime | `DATABASE_URL` | Inject through Vercel (`vercel env`) so the App Router and Prisma client share the same credentials. |

All URLs must include `?pgbouncer=true&connection_limit=1` when targeting Supabase from edge functions to keep connections under quota.

## Migration Workflow

1. **Model updates** – edit `prisma/schema.prisma` and run `pnpm prisma format`.
2. **Generate SQL** – run `pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_init/migration.sql` for fresh installs, or `pnpm prisma migrate dev --name <change>` when a Postgres instance is available.
3. **Apply locally** – point `DATABASE_URL` at your local Postgres (e.g. `postgresql://postgres:postgres@localhost:5432/bsi`) and run `pnpm prisma migrate dev`.
4. **Apply remotely** – `pnpm prisma migrate deploy` inside CI with `DATABASE_URL` targeting Supabase. The GitHub Action `prisma-schema-diff.yml` (see `.github/workflows`) blocks drift before deployment.
5. **Regenerate client** – `pnpm prisma generate` runs automatically during `pnpm build`, but you can force a refresh with `pnpm prisma generate` after editing the schema.

> ⚠️ In this workspace no Postgres instance is running, so `pnpm prisma migrate dev --name init` fails with `P1001`. Use the `--create-only` or `migrate diff` workflow above while developing offline, then let CI run the full command against Supabase.

## Credentials Checklist

- Store Supabase credentials in 1Password (`BlazeSportsIntel › Databases`). Rotate quarterly.
- Mirror the primary `DATABASE_URL` into Cloudflare (Workers KV secret) and Vercel (Environment Variables > Production & Preview).
- For local development create `.env` with the Supabase connection string or start Dockerized Postgres and run `pnpm prisma migrate dev`.
- Keep `migration_lock.toml` committed so team members use the same provider.

## Observability

- Prisma logs (`query`, `warn`, `error`) are enabled in development via `lib/db/prisma.ts`.
- Cloudflare Worker ingestion logs push to Analytics Engine (`env.ANALYTICS`).
- Supabase exposes pg_stat_statements; pin heavy queries in Metabase dashboard `Supabase › Prisma Hot Queries`.
