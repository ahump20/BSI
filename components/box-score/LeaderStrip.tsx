'use client';

import type { BoxScoreData, TeamInfo } from './BoxScoreTable';

/**
 * LeaderStrip — three-tile callout rendered above the box-score tables.
 *
 * Baseball variant pulls WP / LP / SV from the pitching.decision field,
 * falling back to Top Hitter when decisions haven't landed yet (live games
 * with no official scorekeeping, or early innings).
 *
 * Only renders when signals are unambiguous. If nothing derivable,
 * returns null rather than fabricating leaders.
 */

interface BaseballLeaderStripProps {
  variant: 'baseball';
  boxscore: BoxScoreData;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
}

type LeaderStripProps = BaseballLeaderStripProps;

interface Tile {
  label: string;
  name: string;
  line: string;
  team?: string;
}

function baseballTiles({ boxscore, awayTeam, homeTeam }: BaseballLeaderStripProps): Tile[] {
  const allPitching = [
    ...boxscore.away.pitching.map((p) => ({ ...p, teamAbbr: awayTeam.abbreviation })),
    ...boxscore.home.pitching.map((p) => ({ ...p, teamAbbr: homeTeam.abbreviation })),
  ];

  const wp = allPitching.find((p) => p.decision === 'W');
  const lp = allPitching.find((p) => p.decision === 'L');
  const sv = allPitching.find((p) => p.decision === 'S' || p.decision === 'SV');

  const tiles: Tile[] = [];

  if (wp) {
    tiles.push({
      label: 'Winning Pitcher',
      name: wp.player.name,
      line: `${wp.ip} IP · ${wp.so} K · ${wp.er} ER`,
      team: wp.teamAbbr,
    });
  }

  if (lp) {
    tiles.push({
      label: 'Losing Pitcher',
      name: lp.player.name,
      line: `${lp.ip} IP · ${lp.so} K · ${lp.er} ER`,
      team: lp.teamAbbr,
    });
  }

  if (sv) {
    tiles.push({
      label: 'Save',
      name: sv.player.name,
      line: `${sv.ip} IP · ${sv.so} K · ${sv.h} H`,
      team: sv.teamAbbr,
    });
  }

  // If we have no decisions yet, fall back to top hitter per team when
  // at least one team has recorded an at-bat.
  if (tiles.length === 0) {
    const topAway = pickTopHitter(boxscore.away.batting);
    const topHome = pickTopHitter(boxscore.home.batting);

    if (topAway) {
      tiles.push({
        label: 'Top Hitter · Away',
        name: topAway.player.name,
        line: `${topAway.h}-for-${topAway.ab} · ${topAway.rbi} RBI`,
        team: awayTeam.abbreviation,
      });
    }
    if (topHome) {
      tiles.push({
        label: 'Top Hitter · Home',
        name: topHome.player.name,
        line: `${topHome.h}-for-${topHome.ab} · ${topHome.rbi} RBI`,
        team: homeTeam.abbreviation,
      });
    }
  }

  return tiles;
}

function pickTopHitter(batters: BoxScoreData['away']['batting']) {
  if (!batters.length) return null;
  return [...batters].sort((a, b) => {
    if (b.h !== a.h) return b.h - a.h;
    if (b.rbi !== a.rbi) return b.rbi - a.rbi;
    return (b.hr ?? 0) - (a.hr ?? 0);
  })[0];
}

export function LeaderStrip(props: LeaderStripProps) {
  const tiles = baseballTiles(props);
  if (tiles.length === 0) return null;

  return (
    <div
      className="grid gap-2 mb-4 sm:grid-cols-2 md:grid-cols-3"
      aria-label="Game leaders"
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="heritage-card px-3 py-2.5 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="heritage-stamp">{tile.label}</span>
            {tile.team && (
              <span className="text-text-tertiary text-[0.65rem] font-display uppercase tracking-widest">
                {tile.team}
              </span>
            )}
          </div>
          <div className="text-text-primary font-semibold text-sm truncate">{tile.name}</div>
          <div className="text-text-tertiary text-xs font-mono tabular-nums">{tile.line}</div>
        </div>
      ))}
    </div>
  );
}
