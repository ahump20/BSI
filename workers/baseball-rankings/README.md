# Baseball Rankings Edge Worker

This worker serves a production-ready HTML table for the Blaze Sports Intel Top 25
college baseball rankings. It fetches a verified rankings JSON payload, renders
an accessible table, and caches the markup in Cloudflare KV for responsive
sub-250ms delivery on `/baseball/rankings`.

## Local development

Run the worker locally with Wrangler using the shared worker entry point:

```bash
wrangler dev --config wrangler.worker.toml
```

The dev server will listen on `http://127.0.0.1:8787/baseball/rankings`.

## Production deployment

Deploy the updated worker to Cloudflare with:

```bash
wrangler deploy --config wrangler.worker.toml
```

The command targets the `blazesports-game-monitor` worker configured in
`wrangler.worker.toml` and publishes the `/baseball/rankings` endpoint with the
latest HTML table rendering.

## Environment configuration

`wrangler.toml` and `wrangler.worker.toml` define the following bindings:

- `RANKINGS_CACHE`: Cloudflare KV namespace used to persist the rendered HTML for
  quick retrieval on repeat requests (default TTL: 6 hours).
- `BASEBALL_RANKINGS_SOURCE_URL`: Override for the rankings JSON source. Defaults
  to the verified Blaze Sports Intel GitHub dataset.
- `BASEBALL_RANKINGS_CACHE_TTL`: Optional TTL override (in seconds) for the KV entry.

These settings keep the endpoint aligned with BlazeSportsIntel.com’s production
caching and data governance standards.
