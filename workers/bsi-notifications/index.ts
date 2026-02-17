import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  BSI_PROD_CACHE: KVNamespace;
  TIMEZONE: string;
};

interface Alert {
  id: string;
  type: "close_game" | "upset" | "no_hitter";
  title: string;
  description: string;
  timestamp: string;
}

interface ScoreEntry {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  inning: number;
  inningHalf: "top" | "bottom";
  homeRank?: number;
  awayRank?: number;
  homeHits?: number;
  awayHits?: number;
}

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/*",
  cors({
    origin: [
      "https://blazesportsintel.com",
      "https://blazecraft.app",
      "https://austinhumphrey.com",
    ],
  }),
);

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "bsi-notifications", timestamp: new Date().toISOString() });
});

// ── Get recent college baseball alerts ──────────────────────────────────────
app.get("/api/alerts/college-baseball", async (c) => {
  const kv = c.env.BSI_PROD_CACHE;
  const alerts: Alert[] = [];

  try {
    const list = await kv.list({ prefix: "alert:cbb:" });

    for (const key of list.keys) {
      const value = await kv.get(key.name, "json");
      if (value) {
        alerts.push(value as Alert);
      }
    }

    // Sort by timestamp descending (most recent first)
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error("Failed to fetch alerts:", err);
  }

  return c.json({ alerts, count: alerts.length });
});

// ── Check scores and create alerts ──────────────────────────────────────────
app.post("/api/alerts/check", async (c) => {
  const kv = c.env.BSI_PROD_CACHE;
  const created: Alert[] = [];

  try {
    // Fetch live scores from KV
    const scoresList = await kv.list({ prefix: "scores:cbb:" });
    const scores: ScoreEntry[] = [];

    for (const key of scoresList.keys) {
      const value = await kv.get(key.name, "json");
      if (value) {
        scores.push(value as ScoreEntry);
      }
    }

    for (const game of scores) {
      const scoreDiff = Math.abs(game.homeScore - game.awayScore);
      const now = new Date().toISOString();

      // Close game: within 2 runs in 8th inning or later
      if (scoreDiff <= 2 && game.inning >= 8) {
        const alert: Alert = {
          id: crypto.randomUUID(),
          type: "close_game",
          title: `Close Game: ${game.awayTeam} @ ${game.homeTeam}`,
          description: `${game.awayScore}-${game.homeScore} in the ${game.inningHalf === "top" ? "top" : "bottom"} of the ${game.inning}th`,
          timestamp: now,
        };
        const key = `alert:cbb:${Date.now()}-${alert.id.slice(0, 8)}`;
        await kv.put(key, JSON.stringify(alert), { expirationTtl: 3600 });
        created.push(alert);
      }

      // Upset: lower-ranked team leading higher-ranked team
      if (game.homeRank && game.awayRank) {
        const homeLeading = game.homeScore > game.awayScore;
        const awayLeading = game.awayScore > game.homeScore;

        if (homeLeading && game.homeRank > game.awayRank) {
          // Home team is lower-ranked but leading
          const alert: Alert = {
            id: crypto.randomUUID(),
            type: "upset",
            title: `Upset Alert: #${game.homeRank} ${game.homeTeam} leads #${game.awayRank} ${game.awayTeam}`,
            description: `${game.homeScore}-${game.awayScore} in the ${game.inning}th inning`,
            timestamp: now,
          };
          const key = `alert:cbb:${Date.now()}-${alert.id.slice(0, 8)}`;
          await kv.put(key, JSON.stringify(alert), { expirationTtl: 3600 });
          created.push(alert);
        } else if (awayLeading && game.awayRank > game.homeRank) {
          // Away team is lower-ranked but leading
          const alert: Alert = {
            id: crypto.randomUUID(),
            type: "upset",
            title: `Upset Alert: #${game.awayRank} ${game.awayTeam} leads #${game.homeRank} ${game.homeTeam}`,
            description: `${game.awayScore}-${game.homeScore} in the ${game.inning}th inning`,
            timestamp: now,
          };
          const key = `alert:cbb:${Date.now()}-${alert.id.slice(0, 8)}`;
          await kv.put(key, JSON.stringify(alert), { expirationTtl: 3600 });
          created.push(alert);
        }
      }

      // No-hitter in progress: 5th inning or later with 0 hits
      if (game.inning >= 5) {
        if (game.homeHits === 0) {
          const alert: Alert = {
            id: crypto.randomUUID(),
            type: "no_hitter",
            title: `No-Hitter Alert: ${game.awayTeam} @ ${game.homeTeam}`,
            description: `${game.awayTeam} pitching a no-hitter through ${game.inning} innings`,
            timestamp: now,
          };
          const key = `alert:cbb:${Date.now()}-${alert.id.slice(0, 8)}`;
          await kv.put(key, JSON.stringify(alert), { expirationTtl: 3600 });
          created.push(alert);
        }
        if (game.awayHits === 0) {
          const alert: Alert = {
            id: crypto.randomUUID(),
            type: "no_hitter",
            title: `No-Hitter Alert: ${game.homeTeam} vs ${game.awayTeam}`,
            description: `${game.homeTeam} pitching a no-hitter through ${game.inning} innings`,
            timestamp: now,
          };
          const key = `alert:cbb:${Date.now()}-${alert.id.slice(0, 8)}`;
          await kv.put(key, JSON.stringify(alert), { expirationTtl: 3600 });
          created.push(alert);
        }
      }
    }
  } catch (err) {
    console.error("Alert check failed:", err);
    return c.json({ error: "Alert check failed" }, 500);
  }

  return c.json({ created, count: created.length });
});

export default app;
