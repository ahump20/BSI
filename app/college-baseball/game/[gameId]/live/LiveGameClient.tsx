'use client';

import { useState, useMemo } from 'react';
import { useGameData } from '../layout';
import Linescore from '@/components/college-baseball/Linescore';
import PlayByPlay from '@/components/college-baseball/PlayByPlay';
import MatchupCard from '@/components/college-baseball/MatchupCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// =============================================================================
// Box Score Section (collapsible)
// =============================================================================

function CollapsibleBoxScore({
  label,
  team,
  batting,
  pitching,
}: {
  label: string;
  team: { abbreviation: string; name: string; ranking?: number; record?: string };
  batting: Array<{
    player: { id: string; name: string; position: string; year?: string };
    ab: number; r: number; h: number; rbi: number; bb: number; so: number; avg: string;
  }>;
  pitching: Array<{
    player: { id: string; name: string; year?: string };
    decision?: string;
    ip: string; h: number; r: number; er: number; bb: number; so: number; era: string;
    pitches?: number; strikes?: number;
  }>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-charcoal hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-midnight rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange relative">
            {team.abbreviation}
            {team.ranking && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-burnt-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {team.ranking}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{team.name}</p>
            {team.record && <p className="text-text-tertiary text-xs">{team.record}</p>}
          </div>
          <span className="text-text-tertiary text-xs ml-2">{label}</span>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border-subtle">
          {/* Batting */}
          <div>
            <div className="px-4 py-2 bg-graphite border-b border-border-subtle">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                Batting
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border-subtle text-text-tertiary text-xs">
                    <th className="text-left p-2.5 font-medium">Player</th>
                    <th className="text-center p-2.5 font-medium w-10">AB</th>
                    <th className="text-center p-2.5 font-medium w-10">R</th>
                    <th className="text-center p-2.5 font-medium w-10">H</th>
                    <th className="text-center p-2.5 font-medium w-10">RBI</th>
                    <th className="text-center p-2.5 font-medium w-10">BB</th>
                    <th className="text-center p-2.5 font-medium w-10">SO</th>
                    <th className="text-center p-2.5 font-medium w-14">AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {batting.map((b, i) => (
                    <tr key={i} className="border-b border-border-subtle hover:bg-white/[0.03] transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-tertiary text-xs w-5">{b.player.position}</span>
                          <span className="text-white font-medium text-sm">{b.player.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{b.ab}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{b.r}</td>
                      <td className="text-center p-2.5 font-mono text-white font-semibold text-sm">{b.h}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{b.rbi}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{b.bb}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{b.so}</td>
                      <td className="text-center p-2.5 font-mono text-text-tertiary text-sm">{b.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pitching */}
          <div>
            <div className="px-4 py-2 bg-graphite border-b border-border-subtle">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                Pitching
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border-subtle text-text-tertiary text-xs">
                    <th className="text-left p-2.5 font-medium">Pitcher</th>
                    <th className="text-center p-2.5 font-medium w-12">IP</th>
                    <th className="text-center p-2.5 font-medium w-10">H</th>
                    <th className="text-center p-2.5 font-medium w-10">R</th>
                    <th className="text-center p-2.5 font-medium w-10">ER</th>
                    <th className="text-center p-2.5 font-medium w-10">BB</th>
                    <th className="text-center p-2.5 font-medium w-10">K</th>
                    <th className="text-center p-2.5 font-medium w-14">ERA</th>
                  </tr>
                </thead>
                <tbody>
                  {pitching.map((p, i) => (
                    <tr key={i} className="border-b border-border-subtle hover:bg-white/[0.03] transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{p.player.name}</span>
                          {p.decision && (
                            <Badge
                              variant={p.decision === 'W' ? 'success' : p.decision === 'L' ? 'error' : 'secondary'}
                              size="sm"
                            >
                              {p.decision}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-center p-2.5 font-mono text-white font-semibold text-sm">{p.ip}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{p.h}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{p.r}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{p.er}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{p.bb}</td>
                      <td className="text-center p-2.5 font-mono text-text-secondary text-sm">{p.so}</td>
                      <td className="text-center p-2.5 font-mono text-text-tertiary text-sm">{p.era}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// Live Game Client
// =============================================================================

export default function LiveGameClient() {
  const { game, loading, error } = useGameData();

  // Derive current pitcher from the most recent pitching line
  const currentPitcher = useMemo(() => {
    if (!game?.boxscore || !game.status.isLive) return undefined;

    // The pitcher currently on the mound is the last one in the opposing team's pitching array
    // If it's top of inning, home team is pitching; bottom, away team is pitching
    const isTop = game.status.inningState === 'Top' || game.status.inningState === 'top';
    const pitchingTeam = isTop ? game.boxscore.home : game.boxscore.away;
    const teamName = isTop ? game.teams.home.name : game.teams.away.name;

    const last = pitchingTeam.pitching[pitchingTeam.pitching.length - 1];
    if (!last) return undefined;

    return {
      name: last.player.name,
      team: teamName,
      stats: {
        era: parseFloat(last.era) || undefined,
        strikeouts: last.so,
        ip: parseFloat(last.ip) || undefined,
      },
    };
  }, [game]);

  // Derive current batter from last batting appearance
  const currentBatter = useMemo(() => {
    if (!game?.boxscore || !game.status.isLive) return undefined;

    const isTop = game.status.inningState === 'Top' || game.status.inningState === 'top';
    const battingTeam = isTop ? game.boxscore.away : game.boxscore.home;
    const teamName = isTop ? game.teams.away.name : game.teams.home.name;

    const last = battingTeam.batting[battingTeam.batting.length - 1];
    if (!last) return undefined;

    return {
      name: last.player.name,
      team: teamName,
      stats: {
        avg: parseFloat(last.avg) || undefined,
        rbi: last.rbi,
        hits: last.h,
        ab: last.ab,
      },
    };
  }, [game]);

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const isLive = game.status.isLive;
  const plays = game.plays ?? [];

  return (
    <div className="space-y-6">
      {/* Linescore */}
      {game.linescore && (
        <Linescore
          homeTeam={{ name: game.teams.home.name, abbreviation: game.teams.home.abbreviation }}
          awayTeam={{ name: game.teams.away.name, abbreviation: game.teams.away.abbreviation }}
          innings={game.linescore.innings}
          totals={game.linescore.totals}
          currentInning={game.status.inning}
          isTopInning={game.status.inningState === 'Top' || game.status.inningState === 'top'}
          isLive={isLive}
        />
      )}

      {/* Current matchup (live only) */}
      {isLive && (currentPitcher || currentBatter) && (
        <MatchupCard
          pitcher={currentPitcher}
          batter={currentBatter}
          isLive
        />
      )}

      {/* Play-by-Play feed */}
      <PlayByPlay
        plays={plays}
        isLive={isLive}
        currentInning={game.status.inning}
        awayAbbr={game.teams.away.abbreviation}
        homeAbbr={game.teams.home.abbreviation}
      />

      {/* Collapsible Box Scores */}
      {game.boxscore && (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-bone">
            Box Score
          </h3>
          <CollapsibleBoxScore
            label="Away"
            team={game.teams.away}
            batting={game.boxscore.away.batting}
            pitching={game.boxscore.away.pitching}
          />
          <CollapsibleBoxScore
            label="Home"
            team={game.teams.home}
            batting={game.boxscore.home.batting}
            pitching={game.boxscore.home.pitching}
          />
        </div>
      )}

      {/* If game hasn't started and there's no data */}
      {!game.linescore && !game.boxscore && plays.length === 0 && (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <svg
              viewBox="0 0 24 24"
              className="w-16 h-16 text-text-tertiary mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <p className="text-text-secondary">Game day experience activates when first pitch hits.</p>
            <p className="text-text-tertiary text-sm mt-2">
              Linescore, play-by-play, box score, and live matchup data will load automatically.
            </p>
            <p className="text-burnt-orange text-sm mt-4 font-semibold">
              {game.status.detailedState}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
