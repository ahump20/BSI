# BSI MCP — Connection Guide

The Blaze Sports Intel MCP server is live at **`https://sabermetrics.blazesportsintel.com/mcp`**. This document covers every way to connect — from Claude Desktop to custom agents — with copy-paste snippets.

- Protocol: Model Context Protocol (JSON-RPC 2.0 over streamable HTTP)
- Protocol version: `2024-11-05`
- Auth: none required; rate-limited at 30 req/min per bearer token or IP
- Spec: [`/openapi.json`](https://sabermetrics.blazesportsintel.com/openapi.json)
- Interactive docs: [`/docs`](https://sabermetrics.blazesportsintel.com/docs)

## Claude Desktop

Edit the config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add (or merge) the `blaze-sports-intel` entry into `mcpServers`:

```json
{
  "mcpServers": {
    "blaze-sports-intel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://sabermetrics.blazesportsintel.com/mcp"]
    }
  }
}
```

Quit Claude Desktop entirely (⌘Q / Alt+F4) and reopen. The nine BSI tools appear in the tools picker. Try:

> Using blaze-sports-intel, show me the top five SEC hitters by wRC+ this season.

## Cursor

Cursor reads `.cursor/mcp.json` in your workspace or the global config at `~/.cursor/mcp.json`. Add:

```json
{
  "mcpServers": {
    "blaze-sports-intel": {
      "url": "https://sabermetrics.blazesportsintel.com/mcp"
    }
  }
}
```

## Cline (VS Code extension)

In VS Code, open Cline's MCP settings and add:

```json
{
  "name": "blaze-sports-intel",
  "transport": "streamableHttp",
  "url": "https://sabermetrics.blazesportsintel.com/mcp"
}
```

## Claude.ai Custom Connector

Claude.ai supports remote MCP servers via the Custom Connector interface in Settings → Connectors. Paste the URL and save:

```
https://sabermetrics.blazesportsintel.com/mcp
```

## Raw curl (JSON-RPC)

### Initialize handshake

```bash
curl -sX POST https://sabermetrics.blazesportsintel.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "curl-probe", "version": "1.0" }
    }
  }' | jq .
```

### List the nine tools

```bash
curl -sX POST https://sabermetrics.blazesportsintel.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | jq '.result.tools | map({name, description})'
```

### Call a tool

```bash
curl -sX POST https://sabermetrics.blazesportsintel.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "bsi_get_team_sabermetrics",
      "arguments": { "team": "texas" }
    }
  }' | jq '.result.content[0].text | fromjson'
```

## MCP Inspector (debugging)

The MCP Inspector is the canonical tool for probing any MCP server end-to-end:

```bash
npx @modelcontextprotocol/inspector@latest
```

Open `http://localhost:5173`, enter `https://sabermetrics.blazesportsintel.com/mcp`, and click **Connect**. Every tool call is logged with request/response pairs — great for verifying argument shapes and seeing the raw `meta` block.

## REST mirror (no MCP client required)

Every MCP tool has a REST counterpart under `/v1/*`. Useful for dashboards, edge workers, or anything that isn't an AI agent:

```bash
# Scoreboard
curl -s "https://sabermetrics.blazesportsintel.com/v1/scoreboard?conference=SEC" | jq .

# Team sabermetrics
curl -s "https://sabermetrics.blazesportsintel.com/v1/teams/texas/stats" | jq '.batting'

# Leaderboard
curl -s "https://sabermetrics.blazesportsintel.com/v1/leaderboard?metric=woba&limit=10" | jq .
```

## Response contract

All responses — MCP or REST — include a `meta` block and `X-Request-Id` header:

```json
{
  "meta": {
    "source": "highlightly",
    "fetched_at": "2026-04-12T11:30:00.000Z",
    "timezone": "America/Chicago"
  }
}
```

Sources you may see:
- `highlightly` — live from Highlightly API (primary for scores)
- `espn` — live from ESPN Site API (primary for rankings)
- `bsi-savant` — BSI's 6-hour sabermetric compute (primary for analytics)
- `bsi-proxy` — pass-through from the main BSI Worker
- `espn-fallback` / `espn-computed` — ESPN as fallback when primary unavailable
- `unavailable` — no source answered; response includes `message` with guidance

## Rate limits

- 30 requests per minute per bearer token (preferred) or IP address (fallback).
- Exceeding the limit returns HTTP 429 with a JSON-RPC error code `-32029`.
- Cache TTLs (applied transparently): scoreboard 60s, standings 5min, rankings 1hr, team sabermetrics 6hr, team schedule 1hr, leaderboard 6hr, power index 1hr, match detail 60s, player stats 1hr.

## Upstream ceiling

BSI proxies to Highlightly via RapidAPI, ESPN Site API, and its own D1-backed savant compute. The practical ceiling is Highlightly's tier — expect upstream throttling to begin around ~10 concurrent if a cold cache is hit. The in-process cache layer absorbs most of this, but heavy custom-agent usage should expect occasional `upstream_throttle` in the segmented error buckets surfaced by the stress test (`scripts/stress-test-mcp.ts`).

## Questions

File an issue at `github.com/ahump20/BSI` or reach out via `blazesportsintel.com`.
