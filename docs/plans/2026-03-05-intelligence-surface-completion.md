# Intelligence Surface Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the stripped `/v1/matchup` worker endpoint to local source, deploy the linter's IntelStreamCard game-page additions, and extend intelligence to the scores listing via a non-nested drawer pattern.

**Architecture:** The worker handles two intelligence modes: streaming SSE via `/v1/analyze` (free, all game states) and structured JSON via `/v1/matchup` (pro, pregame only). Frontend surfaces intelligence at two levels: the game detail page (both cards already integrated) and the scores listing (new drawer pattern that renders below each scheduled GameCard, outside the Link wrapper to avoid nested-interactive violations).

**Tech Stack:** Hono (worker), React/Tailwind (frontend), BSI_AI_CACHE + BSI_KEYS KV, Cloudflare Pages + Workers

---

### Task 1: Restore `/v1/matchup` endpoint to local worker source

The linter stripped the matchup additions. The deployed Cloudflare worker still has them, but local is 293 lines (down from 496). Re-add everything to bring local in sync with deployed.

**Files:**
- Modify: `workers/bsi-intelligence-stream/index.ts` (currently 293 lines)
- Modify: `workers/bsi-intelligence-stream/wrangler.toml`

**Step 1: Add BSI_KEYS to wrangler.toml**

After the existing `[[kv_namespaces]]` block (BSI_AI_CACHE), add:
```toml
[[kv_namespaces]]
binding = "BSI_KEYS"
id = "b7ff9178798d4a238afff79522f651e8"
```

**Step 2: Update Env interface**

Change:
```typescript
interface Env {
  BSI_AI_CACHE: KVNamespace;
  ANTHROPIC_API_KEY: string;
}
```
To:
```typescript
interface Env {
  BSI_AI_CACHE: KVNamespace;
  BSI_KEYS: KVNamespace;
  ANTHROPIC_API_KEY: string;
}
```

**Step 3: Add new types after AnthropicStreamChunk interface**

Insert after the closing brace of `AnthropicStreamChunk`:
```typescript
interface TeamStats {
  batting: { wrcPlus: number; obp: number; slg: number };
  pitching: { fip: number; eraMinus: number; kPct: number; bbPct: number };
}

interface MatchupRequest {
  homeTeam: string;
  awayTeam: string;
  gameId?: string;
  gameTime?: string;
  sport: Sport;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

interface MatchupCard {
  keyEdge: string;
  offense: {
    home: { teamName: string; wrcPlus: number; obp: number; slg: number };
    away: { teamName: string; wrcPlus: number; obp: number; slg: number };
  };
  pitching: {
    home: { teamName: string; fip: number; eraMinus: number; kPct: number; bbPct: number };
    away: { teamName: string; fip: number; eraMinus: number; kPct: number; bbPct: number };
  };
  prediction: {
    favoriteTeam: string;
    winProbability: number;
    predictedTotal: number;
  };
  fullAnalysis: string;
}
```

**Step 4: Add constants after ANTHROPIC_STREAM_URL**

```typescript
const MATCHUP_SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel analytics engine. You produce structured matchup analysis as valid JSON only.

You MUST respond with ONLY a valid JSON object. No prose, markdown, code fences, or explanation outside the JSON.

Required JSON schema:
{
  "keyEdge": "string — single sentence identifying the decisive competitive advantage",
  "offense": {
    "home": { "teamName": "string", "wrcPlus": number, "obp": number, "slg": number },
    "away": { "teamName": "string", "wrcPlus": number, "obp": number, "slg": number }
  },
  "pitching": {
    "home": { "teamName": "string", "fip": number, "eraMinus": number, "kPct": number, "bbPct": number },
    "away": { "teamName": "string", "fip": number, "eraMinus": number, "kPct": number, "bbPct": number }
  },
  "prediction": {
    "favoriteTeam": "string — exactly one of the two team names",
    "winProbability": number,
    "predictedTotal": number
  },
  "fullAnalysis": "string — 400-550 token prose analysis"
}

Rules:
- keyEdge must name a specific team and reason, not "it's a toss-up"
- fullAnalysis leads with the claim, no throat-clearing, no headers or bullets
- If stats are absent, reason from what you know about these programs and conference context
- winProbability range: 51 (near coin flip) to 75 (heavy favorite)
- predictedTotal is total combined runs, use one decimal place`;

const MATCHUP_CACHE_TTL = 6 * 3600; // 6 hours
```

**Step 5: Add CORS X-BSI-Key header**

Change:
```typescript
allowHeaders: ['Content-Type', 'Authorization'],
```
To:
```typescript
allowHeaders: ['Content-Type', 'Authorization', 'X-BSI-Key'],
```

**Step 6: Add resolveTier + buildMatchupPrompt helpers after buildCacheKey**

```typescript
/** Resolve tier from API key in BSI_KEYS KV. Returns 'free' if missing/invalid. */
async function resolveTier(url: URL, headers: Headers, env: Env): Promise<string> {
  const keyValue = headers.get('X-BSI-Key') ?? url.searchParams.get('key') ?? '';
  if (!keyValue || !env.BSI_KEYS) return 'free';
  try {
    const raw = await env.BSI_KEYS.get(`key:${keyValue}`);
    if (!raw) return 'free';
    const data = JSON.parse(raw) as { tier?: string; expires?: number };
    if (data.expires && data.expires < Date.now()) return 'free';
    return data.tier || 'free';
  } catch {
    return 'free';
  }
}

function buildMatchupPrompt(req: MatchupRequest): string {
  const lines: string[] = [
    `Analyze this ${req.sport} matchup:`,
    `${req.awayTeam} (away) vs ${req.homeTeam} (home)${req.gameTime ? ` — ${req.gameTime}` : ''}`,
    '',
  ];

  if (req.homeStats) {
    lines.push(`${req.homeTeam} season stats:`);
    lines.push(`  Offense: wRC+ ${req.homeStats.batting.wrcPlus}, OBP ${req.homeStats.batting.obp.toFixed(3)}, SLG ${req.homeStats.batting.slg.toFixed(3)}`);
    lines.push(`  Pitching: FIP ${req.homeStats.pitching.fip.toFixed(2)}, ERA- ${req.homeStats.pitching.eraMinus}, K% ${req.homeStats.pitching.kPct.toFixed(1)}, BB% ${req.homeStats.pitching.bbPct.toFixed(1)}`);
    lines.push('');
  }

  if (req.awayStats) {
    lines.push(`${req.awayTeam} season stats:`);
    lines.push(`  Offense: wRC+ ${req.awayStats.batting.wrcPlus}, OBP ${req.awayStats.batting.obp.toFixed(3)}, SLG ${req.awayStats.batting.slg.toFixed(3)}`);
    lines.push(`  Pitching: FIP ${req.awayStats.pitching.fip.toFixed(2)}, ERA- ${req.awayStats.pitching.eraMinus}, K% ${req.awayStats.pitching.kPct.toFixed(1)}, BB% ${req.awayStats.pitching.bbPct.toFixed(1)}`);
    lines.push('');
  }

  if (!req.homeStats && !req.awayStats) {
    lines.push('No team stats provided. Reason from what you know about these programs and their conference context.');
    lines.push('');
  }

  lines.push('Return the matchup analysis JSON now.');
  return lines.join('\n');
}
```

**Step 7: Add POST /v1/matchup route BEFORE app.notFound**

```typescript
/**
 * POST /api/intelligence/v1/matchup
 *
 * Body: MatchupRequest
 * Response: MatchupCard JSON
 *
 * Pro tier required. KV cached 6h.
 */
app.post('/v1/matchup', async (c) => {
  const url = new URL(c.req.url);
  const tier = await resolveTier(url, new Headers(Object.fromEntries(c.req.raw.headers)), c.env);
  if (tier !== 'pro') {
    return c.json({ error: 'Pro tier required', upgrade: '/pricing' }, 403);
  }

  const body = await c.req.json<MatchupRequest>().catch(() => null);
  if (!body?.homeTeam || !body?.awayTeam || !body?.sport) {
    return c.json({ error: 'homeTeam, awayTeam, and sport are required' }, 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `matchup:${body.sport}:${body.homeTeam}:${body.awayTeam}:${body.gameId ?? today}`;
  const cached = await c.env.BSI_AI_CACHE.get(cacheKey, 'text');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-BSI-Cache': 'HIT' },
    });
  }

  const userMessage = buildMatchupPrompt(body);
  let aiResponse: Response;
  try {
    aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': c.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        thinking: { type: 'adaptive' },
        output_config: { format: { type: 'json_object' } },
        system: MATCHUP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: `AI service unreachable: ${msg}` }, 502);
  }

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    return c.json({ error: `AI service error ${aiResponse.status}`, detail: errText.slice(0, 200) }, 502);
  }

  const data = await aiResponse.json() as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    return c.json({ error: 'No text response from AI' }, 502);
  }

  const rawJson = textBlock.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let card: MatchupCard;
  try {
    card = JSON.parse(rawJson) as MatchupCard;
  } catch {
    return c.json({ error: 'AI returned malformed JSON', raw: rawJson.slice(0, 500) }, 502);
  }

  await c.env.BSI_AI_CACHE.put(cacheKey, JSON.stringify(card), { expirationTtl: MATCHUP_CACHE_TTL });

  return new Response(JSON.stringify(card), {
    headers: {
      'Content-Type': 'application/json',
      'X-BSI-Cache': 'MISS',
      'X-BSI-Model': 'claude-opus-4-6',
    },
  });
});
```

**Step 8: Deploy**
```bash
wrangler deploy --config workers/bsi-intelligence-stream/wrangler.toml
```
Expected: "Deployed bsi-intelligence-stream triggers" with both KV bindings listed.

**Step 9: Verify**
```bash
curl -s https://blazesportsintel.com/api/intelligence/health
# Expected: {"status":"ok","model":"claude-sonnet-4-6",...}

curl -s -X POST https://blazesportsintel.com/api/intelligence/v1/matchup \
  -H "Content-Type: application/json" \
  -d '{"homeTeam":"Texas","awayTeam":"LSU","sport":"college-baseball"}'
# Expected: {"error":"Pro tier required","upgrade":"/pricing"}
```

---

### Task 2: Rebuild and deploy frontend

The linter added `IntelStreamCard` pregame/live/postgame to `CollegeGameSummaryClient.tsx`. Not yet deployed.

**Files:**
- No changes needed — `CollegeGameSummaryClient.tsx` already has the linter's additions

**Step 1: Build**
```bash
npm run build 2>&1 | tail -5
```
Expected: "Deployment complete" or build success.

**Step 2: Deploy**
```bash
npm run deploy:production 2>&1 | tail -10
```
Expected: "Deployment complete!"

---

### Task 3: Add intelligence drawer to scores listing

`GameCard` is a full `<Link>` wrapper — nested interactive elements are invalid HTML. Add intelligence as a sibling element BELOW each scheduled game card using a new `GameIntelTrigger` component. Clicking "Get Pregame Intel" toggles an `IntelStreamCard` below that game's card without navigating away.

**Files:**
- Modify: `app/college-baseball/scores/page.tsx`

**Step 1: Add imports at top of scores page**

```typescript
import { IntelStreamCard } from '@/components/intel/IntelStreamCard';
```

Note: `useState` is already imported via `{ useState, useEffect, useMemo }`.

**Step 2: Add GameIntelTrigger component above GameCard**

```typescript
function GameIntelTrigger({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);
  if (game.status !== 'scheduled') return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-display uppercase tracking-widest text-text-tertiary hover:text-burnt-orange transition-colors"
      >
        <span
          className="w-1 h-1 rounded-full bg-current"
          style={{ opacity: open ? 1 : 0.5 }}
        />
        {open ? 'Hide Intel' : 'Pregame Intel'}
      </button>
      {open && (
        <div className="pb-2">
          <IntelStreamCard
            homeTeam={game.homeTeam.name}
            awayTeam={game.awayTeam.name}
            sport="college-baseball"
            gameId={game.id}
            analysisType="pregame"
          />
        </div>
      )}
    </div>
  );
}
```

**Step 3: Render GameIntelTrigger below each GameCard**

Find the place in the page where `<GameCard game={game} />` is rendered (inside the grid map) and add the trigger beneath it as a sibling:

```tsx
// Before:
<GameCard game={game} />

// After:
<div key={game.id}>
  <GameCard game={game} />
  <GameIntelTrigger game={game} />
</div>
```

Note: if the map already has a `key` on the outer element, move it to the new wrapping `div`.

**Step 4: Typecheck**
```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "scores/page.tsx"
```
Expected: no output (no errors).

**Step 5: Build + Deploy**
```bash
npm run build 2>&1 | tail -5 && npm run deploy:production 2>&1 | tail -5
```

---

### Task 4: Smoke test all surfaces

**Step 1: Intelligence worker endpoints**
```bash
# Health
curl -s https://blazesportsintel.com/api/intelligence/health
# → {"status":"ok","model":"claude-sonnet-4-6",...}

# Tier gate
curl -s -X POST https://blazesportsintel.com/api/intelligence/v1/matchup \
  -H "Content-Type: application/json" \
  -d '{"homeTeam":"Texas","awayTeam":"LSU","sport":"college-baseball"}'
# → {"error":"Pro tier required","upgrade":"/pricing"}

# SSE stream (free)
curl -s -X POST https://blazesportsintel.com/api/intelligence/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"question":"What gives Texas the edge over LSU?","analysisType":"pregame"}' \
  --max-time 5
# → SSE events with data: {"text":"..."} chunks
```

**Step 2: Frontend pages load**
```bash
curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/college-baseball/scores
# → 200

curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/college-baseball/game/placeholder
# → 200
```

**Step 3: Confirm IntelStreamCard SSE fires on game page**

Open `https://blazesportsintel.com/college-baseball/game/placeholder` in browser dev tools → Network tab → confirm POST to `/api/intelligence/v1/analyze` fires on load for pregame games.
