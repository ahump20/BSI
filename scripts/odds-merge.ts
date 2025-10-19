#!/usr/bin/env ts-node
/**
 * Merge TheOddsAPI markets onto our game payload schema.
 *
 * Usage:
 *   ts-node scripts/odds-merge.ts --games data/scoreboard.json --odds data/odds.json --output data/merged.json
 */

import fs from 'fs/promises';
import path from 'path';

interface TeamInfo {
  id?: string;
  uid?: string;
  team: {
    id?: string;
    name?: string;
    abbreviation?: string;
    logo?: string;
  };
  score?: number | string;
  winner?: boolean;
  record?: string;
  rank?: number;
}

interface GamePayload {
  id: string;
  uid?: string;
  date?: string;
  name?: string;
  shortName?: string;
  status?: any;
  teams: {
    home: TeamInfo;
    away: TeamInfo;
  };
  odds?: NormalizedOdds | null;
  [key: string]: any;
}

interface ScoreboardPayload {
  games: GamePayload[];
  [key: string]: any;
}

interface TheOddsMarketOutcome {
  name: string;
  price: number;
  point?: number;
}

interface TheOddsMarket {
  key: string;
  outcomes: TheOddsMarketOutcome[];
}

interface TheOddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: TheOddsMarket[];
}

interface TheOddsEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: TheOddsBookmaker[];
}

interface NormalizedOdds {
  provider: string;
  lastUpdated: string;
  spread?: {
    home: { point: number; price: number } | null;
    away: { point: number; price: number } | null;
  };
  moneyline?: {
    home?: number;
    away?: number;
  };
  totals?: {
    points?: number;
    over?: number;
    under?: number;
  };
}

function sanitize(name?: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function findMatchingEvent(game: GamePayload, events: TheOddsEvent[]): TheOddsEvent | undefined {
  const homeName = sanitize(game.teams.home.team.name || game.teams.home.team.abbreviation);
  const awayName = sanitize(game.teams.away.team.name || game.teams.away.team.abbreviation);

  return events.find((event) => {
    const eventHome = sanitize(event.home_team);
    const eventAway = sanitize(event.away_team);
    return eventHome === homeName && eventAway === awayName;
  });
}

function normalizeMarket(bookmaker: TheOddsBookmaker, event: TheOddsEvent): NormalizedOdds | null {
  if (!bookmaker) return null;

  const homeKey = sanitize(event.home_team);
  const awayKey = sanitize(event.away_team);

  const spreadMarket = bookmaker.markets.find((m) => m.key === 'spreads');
  const totalMarket = bookmaker.markets.find((m) => m.key === 'totals');
  const moneylineMarket = bookmaker.markets.find((m) => m.key === 'h2h');

  const odds: NormalizedOdds = {
    provider: bookmaker.title,
    lastUpdated: bookmaker.last_update,
  };

  if (spreadMarket) {
    const homeOutcome = spreadMarket.outcomes.find((o) => sanitize(o.name) === homeKey) || null;
    const awayOutcome = spreadMarket.outcomes.find((o) => sanitize(o.name) === awayKey) || null;
    odds.spread = {
      home: homeOutcome ? { point: homeOutcome.point ?? 0, price: homeOutcome.price } : null,
      away: awayOutcome ? { point: awayOutcome.point ?? 0, price: awayOutcome.price } : null,
    };
  }

  if (moneylineMarket) {
    odds.moneyline = {};
    for (const outcome of moneylineMarket.outcomes) {
      const name = sanitize(outcome.name);
      if (name === homeKey) {
        odds.moneyline.home = outcome.price;
      } else if (name === awayKey) {
        odds.moneyline.away = outcome.price;
      }
    }
  }

  if (totalMarket) {
    const overOutcome = totalMarket.outcomes.find((o) => o.name.toLowerCase() === 'over');
    const underOutcome = totalMarket.outcomes.find((o) => o.name.toLowerCase() === 'under');
    odds.totals = {
      points: overOutcome?.point ?? underOutcome?.point,
      over: overOutcome?.price,
      under: underOutcome?.price,
    };
  }

  return odds;
}

function chooseBookmaker(event: TheOddsEvent): TheOddsBookmaker | null {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return null;
  }
  event.bookmakers.sort((a, b) => new Date(b.last_update).getTime() - new Date(a.last_update).getTime());
  return event.bookmakers[0];
}

async function readJson<T>(filePath: string): Promise<T> {
  const absolute = path.resolve(filePath);
  const raw = await fs.readFile(absolute, 'utf-8');
  return JSON.parse(raw) as T;
}

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for argument ${arg}`);
      }
      result[key] = value;
      i += 1;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gamesPath = args.games;
  const oddsPath = args.odds;
  const outputPath = args.output;

  if (!gamesPath || !oddsPath) {
    console.error('Usage: ts-node scripts/odds-merge.ts --games <games.json> --odds <odds.json> [--output <output.json>]');
    process.exit(1);
  }

  const scoreboard = await readJson<ScoreboardPayload>(gamesPath);
  const oddsResponse = await readJson<{ data?: TheOddsEvent[]; events?: TheOddsEvent[]; }>(oddsPath);
  const oddsEvents = oddsResponse.events || oddsResponse.data || [];

  if (!Array.isArray(scoreboard.games)) {
    console.error('Invalid scoreboard payload: missing games array');
    process.exit(1);
  }

  const mergedGames = scoreboard.games.map((game) => {
    const event = findMatchingEvent(game, oddsEvents);
    if (!event) {
      return { ...game, odds: game.odds ?? null };
    }
    const bookmaker = chooseBookmaker(event);
    const normalized = bookmaker ? normalizeMarket(bookmaker, event) : null;
    return { ...game, odds: normalized };
  });

  const mergedPayload: ScoreboardPayload = {
    ...scoreboard,
    games: mergedGames,
    meta: {
      ...(scoreboard as any).meta,
      oddsProvider: 'TheOddsAPI',
      oddsUpdatedAt: new Date().toISOString(),
    },
  };

  if (outputPath) {
    const absoluteOutput = path.resolve(outputPath);
    await fs.writeFile(absoluteOutput, JSON.stringify(mergedPayload, null, 2));
    console.log(`Merged odds written to ${absoluteOutput}`);
  } else {
    console.log(JSON.stringify(mergedPayload, null, 2));
  }
}

main().catch((error) => {
  console.error('Odds merge failed:', error);
  process.exit(1);
});
