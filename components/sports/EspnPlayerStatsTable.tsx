/**
 * Shared ESPN player stats table — renders multi-group stat tables for any sport.
 *
 * Used by CFB, NBA, and NFL BoxScoreClient components. Each sport passes its own
 * playerStats data and configuration:
 * - CFB: split mode with benchLabel="Reserves"
 * - NBA: split mode with benchLabel="Bench"
 * - NFL: flat mode (active players only, no starters/bench split)
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { BoxscorePlayerAthlete, BoxscorePlayerGroup } from './espn-boxscore-types';

interface EspnPlayerStatsTableProps {
  playerStats: BoxscorePlayerGroup[];
  /** 'split' = starters/bench/DNP sections (CFB, NBA). 'flat' = active players only (NFL). */
  mode?: 'split' | 'flat';
  /** Label for the bench section in split mode. Default: "Bench" */
  benchLabel?: string;
}

function PlayerRow({ player }: { player: BoxscorePlayerAthlete }) {
  return (
    <tr className="border-b border-[var(--border-vintage)] last:border-0 hover:bg-[var(--surface-press-box)]">
      <td className="p-2 text-[var(--bsi-bone)] font-medium whitespace-nowrap sticky left-0 bg-inherit">
        <span>{player.athlete?.shortName || player.athlete?.displayName || '-'}</span>
        {player.athlete?.position?.abbreviation && (
          <span className="text-[rgba(196,184,165,0.5)] text-xs ml-1.5">
            {player.athlete.position.abbreviation}
          </span>
        )}
      </td>
      {(player.stats || []).map((val, sIdx) => (
        <td key={sIdx} className="p-2 text-center font-mono text-[var(--bsi-dust)] text-xs">
          {val}
        </td>
      ))}
    </tr>
  );
}

function SectionHeader({ label, colSpan, muted }: { label: string; colSpan: number; muted?: boolean }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-[var(--surface-dugout)] ${
          muted ? 'text-[rgba(196,184,165,0.5)]' : 'text-[var(--bsi-primary)]'
        }`}
      >
        {label}
      </td>
    </tr>
  );
}

export function EspnPlayerStatsTable({
  playerStats,
  mode = 'split',
  benchLabel = 'Bench',
}: EspnPlayerStatsTableProps) {
  return (
    <>
      {playerStats.map((teamGroup, tIdx) => {
        const teamAbbr = teamGroup.team?.abbreviation || (tIdx === 0 ? 'Away' : 'Home');
        const teamName = teamGroup.team?.displayName || teamAbbr;
        const statGroups = (teamGroup.statistics || []).filter(Boolean);

        if (statGroups.length === 0) {
          return (
            <Card key={tIdx} variant="default" padding="md">
              <CardHeader><CardTitle>{teamName}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-[rgba(196,184,165,0.5)] text-sm py-4">No player statistics available</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={tIdx} variant="default" padding="md">
            <CardHeader><CardTitle>{teamName}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {statGroups.map((statGroup, gIdx) => {
                  if (!statGroup) return null;
                  const headers = statGroup.labels || statGroup.names || [];
                  const athletes = statGroup.athletes || [];
                  const groupName = statGroup.name || statGroup.type || '';
                  const colSpan = headers.length + 1;

                  if (mode === 'flat') {
                    const activePlayers = athletes.filter((a) => !a.didNotPlay);
                    if (activePlayers.length === 0) return null;

                    return (
                      <div key={gIdx}>
                        {groupName && (
                          <div className="px-2 py-1.5 mb-2 text-xs text-[var(--bsi-primary)] font-semibold uppercase tracking-wide bg-[var(--surface-dugout)] rounded-sm">
                            {groupName}
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border-vintage)]">
                                <th className="text-left p-2 text-[rgba(196,184,165,0.5)] sticky left-0 bg-inherit">Player</th>
                                {headers.map((h, hIdx) => (
                                  <th key={hIdx} className="text-center p-2 text-[rgba(196,184,165,0.5)] text-xs uppercase">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activePlayers.map((player, pIdx) => (
                                <PlayerRow key={pIdx} player={player} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  // Split mode: starters / bench / DNP
                  const starters = athletes.filter((a) => a.athlete?.starter && !a.didNotPlay);
                  const bench = athletes.filter((a) => !a.athlete?.starter && !a.didNotPlay);
                  const dnp = athletes.filter((a) => a.didNotPlay);

                  // Critical fix: don't return null when DNP has entries — show the DNP section
                  if (starters.length + bench.length + dnp.length === 0) return null;

                  return (
                    <div key={gIdx}>
                      {groupName && (
                        <div className="px-2 py-1.5 mb-2 text-xs text-[var(--bsi-primary)] font-semibold uppercase tracking-wide bg-[var(--surface-dugout)] rounded-sm">
                          {groupName}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border-vintage)]">
                              <th className="text-left p-2 text-[rgba(196,184,165,0.5)] sticky left-0 bg-inherit">Player</th>
                              {headers.map((h, hIdx) => (
                                <th key={hIdx} className="text-center p-2 text-[rgba(196,184,165,0.5)] text-xs uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {starters.length > 0 && (
                              <>
                                <SectionHeader label="Starters" colSpan={colSpan} />
                                {starters.map((p, i) => <PlayerRow key={i} player={p} />)}
                              </>
                            )}
                            {bench.length > 0 && (
                              <>
                                <SectionHeader label={benchLabel} colSpan={colSpan} />
                                {bench.map((p, i) => <PlayerRow key={i} player={p} />)}
                              </>
                            )}
                            {dnp.length > 0 && (
                              <>
                                <SectionHeader label="Did Not Play" colSpan={colSpan} muted />
                                {dnp.map((player, dIdx) => (
                                  <tr key={dIdx} className="border-b border-[var(--border-vintage)] last:border-0">
                                    <td className="p-2 text-[rgba(196,184,165,0.5)] whitespace-nowrap">
                                      {player.athlete?.shortName || player.athlete?.displayName || '-'}
                                    </td>
                                    <td colSpan={headers.length} className="p-2 text-[rgba(196,184,165,0.5)] text-xs italic">
                                      {player.reason || 'DNP'}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
