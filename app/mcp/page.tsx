import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'BSI MCP — College Baseball Intelligence, Wired for AI',
  description:
    'Model Context Protocol server exposing all 330 NCAA Division I college baseball programs to Claude, Cursor, Cline, and any MCP-compatible AI client. Live scores, sabermetrics, rankings, schedules.',
  alternates: { canonical: 'https://blazesportsintel.com/mcp' },
  openGraph: {
    title: 'BSI MCP — Wire Your AI Agent to D1 College Baseball',
    description:
      'Nine read-only MCP tools covering scores, standings, sabermetrics, and schedules for 330 D1 programs. One endpoint. Free tier.',
    url: 'https://blazesportsintel.com/mcp',
    type: 'website',
  },
};

const TOOLS: Array<{ name: string; description: string }> = [
  {
    name: 'bsi_get_scoreboard',
    description:
      "Today's D1 scores and game results — live and final, with venue and status.",
  },
  {
    name: 'bsi_get_standings',
    description:
      'Conference standings with wins, losses, run differential, streak, and record.',
  },
  { name: 'bsi_get_rankings', description: 'The current D1Baseball Top 25 with movement.' },
  {
    name: 'bsi_get_team_sabermetrics',
    description:
      'Advanced batting and pitching metrics for a team: wOBA, wRC+, FIP, ERA-, BABIP, ISO.',
  },
  {
    name: 'bsi_get_leaderboard',
    description:
      'Top hitters or pitchers by an advanced metric, filterable by conference.',
  },
  {
    name: 'bsi_get_conference_power_index',
    description: 'SOS-adjusted conference rankings from standings and run differential.',
  },
  {
    name: 'bsi_get_player_stats',
    description:
      'Search for a player by name and get batting or pitching stats, position, team.',
  },
  {
    name: 'bsi_get_team_schedule',
    description: 'Full team schedule — past results and upcoming games.',
  },
  {
    name: 'bsi_get_match_detail',
    description:
      'Match detail with venue, weather, win predictions, play-by-play, and team stats.',
  },
];

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "blaze-sports-intel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://sabermetrics.blazesportsintel.com/mcp"]
    }
  }
}`;

const CURL_EXAMPLE = `curl -sX POST https://sabermetrics.blazesportsintel.com/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \\
  | jq '.result.tools | map(.name)'`;

export default function McpPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24 text-[var(--color-text,#F5F2EB)]">
      {/* Hero */}
      <div className="mb-12">
        <p className="mb-3 font-display text-xs tracking-[0.2em] uppercase text-[var(--color-accent-primary,#BF5700)]">
          Blaze Sports Intel · Model Context Protocol Server
        </p>
        <h1 className="mb-4 font-hero text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[0.02em]">
          College Baseball Intelligence,
          <br />
          Wired for AI.
        </h1>
        <p className="font-body italic text-[clamp(1.125rem,2vw,1.375rem)] text-[var(--color-text-muted,#C4B8A5)] max-w-2xl">
          One endpoint gives your Claude, Cursor, or Cline agent every D1 program's live
          score, sabermetric rollup, and weekly Top 25 movement — with source attribution
          on every response.
        </p>
      </div>

      {/* Call-outs */}
      <div className="grid gap-4 md:grid-cols-3 mb-16">
        <div className="rounded-[2px] border border-white/10 p-5">
          <p className="mb-1 font-display text-[0.6875rem] tracking-[0.15em] uppercase text-[var(--color-text-muted,#C4B8A5)]">
            Coverage
          </p>
          <p className="font-body text-lg">330 D1 Teams</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted,#C4B8A5)]">
            Every Power 4 and mid-major program.
          </p>
        </div>
        <div className="rounded-[2px] border border-white/10 p-5">
          <p className="mb-1 font-display text-[0.6875rem] tracking-[0.15em] uppercase text-[var(--color-text-muted,#C4B8A5)]">
            Sabermetrics
          </p>
          <p className="font-body text-lg">wOBA · wRC+ · FIP · ERA-</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted,#C4B8A5)]">
            Park-adjusted and D1-calibrated.
          </p>
        </div>
        <div className="rounded-[2px] border border-white/10 p-5">
          <p className="mb-1 font-display text-[0.6875rem] tracking-[0.15em] uppercase text-[var(--color-text-muted,#C4B8A5)]">
            Auth
          </p>
          <p className="font-body text-lg">Free, No Key Required</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted,#C4B8A5)]">
            30 requests per minute per caller.
          </p>
        </div>
      </div>

      {/* Connect — Claude Desktop */}
      <section className="mb-12">
        <h2 className="mb-4 pb-2 border-b border-[var(--color-accent-primary,#BF5700)]/30 font-display text-lg tracking-[0.1em] uppercase">
          Connect from Claude Desktop
        </h2>
        <p className="mb-4 text-[var(--color-text-muted,#C4B8A5)]">
          Add this block to your Claude Desktop config at{' '}
          <code className="font-mono text-sm text-[var(--color-accent-gold,#FDB913)]">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>{' '}
          (macOS) or{' '}
          <code className="font-mono text-sm text-[var(--color-accent-gold,#FDB913)]">
            %APPDATA%\Claude\claude_desktop_config.json
          </code>{' '}
          (Windows). Restart Claude Desktop, and the nine tools appear in the tools picker.
        </p>
        <pre className="rounded-[2px] bg-black/40 border-l-2 border-[var(--color-accent-primary,#BF5700)] p-5 overflow-x-auto font-mono text-sm">
          <code>{CLAUDE_DESKTOP_CONFIG}</code>
        </pre>
      </section>

      {/* Connect — Cursor / Cline */}
      <section className="mb-12">
        <h2 className="mb-4 pb-2 border-b border-[var(--color-accent-primary,#BF5700)]/30 font-display text-lg tracking-[0.1em] uppercase">
          Cursor, Cline, and other MCP clients
        </h2>
        <p className="mb-4 text-[var(--color-text-muted,#C4B8A5)]">
          Any MCP-compatible client can reach this server over streamable HTTP. Point it
          at the remote URL, or use <code className="font-mono text-sm">mcp-remote</code>{' '}
          as a bridge if the client only speaks stdio locally.
        </p>
        <p className="mb-2 font-display text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted,#C4B8A5)]">
          Direct URL
        </p>
        <pre className="mb-4 rounded-[2px] bg-black/40 border-l-2 border-[var(--color-accent-primary,#BF5700)] p-5 font-mono text-sm">
          <code>https://sabermetrics.blazesportsintel.com/mcp</code>
        </pre>
        <p className="mb-2 font-display text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted,#C4B8A5)]">
          Probe from the command line
        </p>
        <pre className="rounded-[2px] bg-black/40 border-l-2 border-[var(--color-accent-primary,#BF5700)] p-5 overflow-x-auto font-mono text-sm">
          <code>{CURL_EXAMPLE}</code>
        </pre>
      </section>

      {/* Tools */}
      <section className="mb-12">
        <h2 className="mb-4 pb-2 border-b border-[var(--color-accent-primary,#BF5700)]/30 font-display text-lg tracking-[0.1em] uppercase">
          Nine tools
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-5 font-display text-[0.6875rem] tracking-[0.15em] uppercase text-[var(--color-text-muted,#C4B8A5)]">
                  Name
                </th>
                <th className="text-left py-2 font-display text-[0.6875rem] tracking-[0.15em] uppercase text-[var(--color-text-muted,#C4B8A5)]">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.name} className="border-b border-white/5">
                  <td className="py-3 pr-5 whitespace-nowrap text-[var(--color-accent,#FF6B35)]">
                    {t.name}
                  </td>
                  <td className="py-3 font-body text-[0.9375rem] text-[var(--color-text-muted,#C4B8A5)]">
                    {t.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* REST mirror */}
      <section className="mb-12">
        <h2 className="mb-4 pb-2 border-b border-[var(--color-accent-primary,#BF5700)]/30 font-display text-lg tracking-[0.1em] uppercase">
          Or call REST directly
        </h2>
        <p className="mb-4 text-[var(--color-text-muted,#C4B8A5)]">
          If you'd rather ship plain JSON to a dashboard, every MCP tool mirrors to a
          REST endpoint under <code className="font-mono text-sm">/v1/*</code>. Full spec
          at{' '}
          <a
            href="https://sabermetrics.blazesportsintel.com/docs"
            className="text-[var(--color-accent,#FF6B35)] border-b border-transparent hover:border-[var(--color-accent,#FF6B35)]"
          >
            /docs
          </a>
          .
        </p>
      </section>

      {/* Data sources */}
      <section className="mb-12">
        <h2 className="mb-4 pb-2 border-b border-[var(--color-accent-primary,#BF5700)]/30 font-display text-lg tracking-[0.1em] uppercase">
          Where the data comes from
        </h2>
        <p className="mb-3 text-[var(--color-text-muted,#C4B8A5)]">
          <strong className="text-[var(--color-text,#F5F2EB)]">Highlightly</strong>{' '}
          — primary live-score and venue source. All 330 D1 programs.
        </p>
        <p className="mb-3 text-[var(--color-text-muted,#C4B8A5)]">
          <strong className="text-[var(--color-text,#F5F2EB)]">BSI Savant</strong> —
          advanced metrics computed on a 6-hour cron. wOBA, wRC+, FIP, ERA- calibrated
          against D1 linear weights and park factors.
        </p>
        <p className="mb-3 text-[var(--color-text-muted,#C4B8A5)]">
          <strong className="text-[var(--color-text,#F5F2EB)]">ESPN Site API</strong>{' '}
          — rankings and schedule fallback.
        </p>
        <p className="mt-4 text-sm text-[var(--color-text-muted,#C4B8A5)]">
          Every response carries a <code className="font-mono">meta</code> block with
          <code className="font-mono"> source</code> and{' '}
          <code className="font-mono">fetched_at</code>, plus an{' '}
          <code className="font-mono">X-Request-Id</code> header for tracing.
        </p>
      </section>

      {/* Footer links */}
      <section className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 font-display text-xs uppercase tracking-[0.1em]">
        <a
          href="https://sabermetrics.blazesportsintel.com/docs"
          className="text-[var(--color-accent,#FF6B35)] hover:underline"
        >
          Interactive Docs →
        </a>
        <a
          href="https://sabermetrics.blazesportsintel.com/openapi.json"
          className="text-[var(--color-accent,#FF6B35)] hover:underline"
        >
          OpenAPI Spec
        </a>
        <a
          href="https://sabermetrics.blazesportsintel.com/health"
          className="text-[var(--color-accent,#FF6B35)] hover:underline"
        >
          Health
        </a>
        <Link
          href="/college-baseball"
          className="text-[var(--color-accent,#FF6B35)] hover:underline"
        >
          Browse BSI
        </Link>
      </section>
    </main>
  );
}
