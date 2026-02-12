'use client';

/**
 * MatchTracking — Broadcast-derived player tracking data display
 *
 * Shows physical output metrics (distance, sprints, top speed) for both
 * teams in a game, derived from SkillCorner's broadcast CV pipeline.
 *
 * Per the CV sports survey:
 *   - SkillCorner covers 80+ leagues from standard broadcast feeds
 *   - No stadium-installed cameras required — the only viable tracking
 *     solution for D1 sports venues
 *   - Metrics: player speed, distance, sprint counts, high-intensity efforts
 *
 * Usage:
 *   <MatchTracking matchData={trackingSummary} />
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { MatchTrackingSummary, TeamTrackingData, PlayerTrackingData } from '@/lib/api-clients/skillcorner';

interface MatchTrackingProps {
  matchData?: MatchTrackingSummary | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function speedColor(kmh: number): string {
  if (kmh >= 34) return 'text-green-400';
  if (kmh >= 32) return 'text-blue-400';
  if (kmh >= 28) return 'text-white';
  return 'text-text-secondary';
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MatchTracking({ matchData }: MatchTrackingProps) {
  const [selectedTeam, setSelectedTeam] = useState<'away' | 'home'>('home');

  if (!matchData) {
    return (
      <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Player Tracking</span>
          <Badge variant="secondary" size="sm">SkillCorner</Badge>
        </div>
        <p className="text-text-secondary text-sm">
          Broadcast-derived tracking data via SkillCorner. Shows player speed, distance,
          sprint counts, and physical output extracted from standard video feeds — no
          stadium cameras required.
        </p>
      </div>
    );
  }

  const team: TeamTrackingData = selectedTeam === 'home' ? matchData.homeTeam : matchData.awayTeam;
  const opponent: TeamTrackingData = selectedTeam === 'home' ? matchData.awayTeam : matchData.homeTeam;

  return (
    <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Player Tracking</span>
          <Badge variant="primary" size="sm">SkillCorner CV</Badge>
        </div>
        <span className="text-text-tertiary text-xs">{matchData.competition} | {matchData.date}</span>
      </div>

      {/* Team Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedTeam('away')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            selectedTeam === 'away'
              ? 'bg-burnt-orange text-white'
              : 'bg-graphite text-text-secondary hover:text-white'
          }`}
        >
          {matchData.awayTeam.abbreviation}
        </button>
        <button
          onClick={() => setSelectedTeam('home')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            selectedTeam === 'home'
              ? 'bg-burnt-orange text-white'
              : 'bg-graphite text-text-secondary hover:text-white'
          }`}
        >
          {matchData.homeTeam.abbreviation}
        </button>
      </div>

      {/* Team Metrics Comparison */}
      <div className="bg-graphite rounded-lg p-3 mb-4">
        <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Team Averages</h4>
        <div className="space-y-2">
          {[
            { label: 'Avg Distance', home: formatDistance(matchData.homeTeam.metrics.avgTotalDistanceM), away: formatDistance(matchData.awayTeam.metrics.avgTotalDistanceM) },
            { label: 'Sprint Distance', home: formatDistance(matchData.homeTeam.metrics.avgSprintDistanceM), away: formatDistance(matchData.awayTeam.metrics.avgSprintDistanceM) },
            { label: 'Top Speed', home: `${matchData.homeTeam.metrics.avgTopSpeedKmh.toFixed(1)} km/h`, away: `${matchData.awayTeam.metrics.avgTopSpeedKmh.toFixed(1)} km/h` },
            { label: 'Sprint Count', home: `${matchData.homeTeam.metrics.avgSprintCount}`, away: `${matchData.awayTeam.metrics.avgSprintCount}` },
            { label: 'High Intensity', home: `${matchData.homeTeam.metrics.avgHighIntensityEfforts}`, away: `${matchData.awayTeam.metrics.avgHighIntensityEfforts}` },
          ].map((row) => (
            <div key={row.label} className="flex items-center text-xs">
              <span className="text-text-secondary font-mono w-16 text-right">{row.away}</span>
              <span className="flex-1 text-center text-text-tertiary">{row.label}</span>
              <span className="text-white font-mono w-16">{row.home}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player Table */}
      <div>
        <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
          {team.teamName} — Player Output
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-2 text-text-tertiary font-semibold">Player</th>
                <th className="text-right py-2 text-text-tertiary font-semibold">Dist</th>
                <th className="text-right py-2 text-text-tertiary font-semibold">Top Spd</th>
                <th className="text-right py-2 text-text-tertiary font-semibold">Sprints</th>
                <th className="text-right py-2 text-text-tertiary font-semibold">Min</th>
              </tr>
            </thead>
            <tbody>
              {team.players
                .sort((a, b) => b.metrics.totalDistanceM - a.metrics.totalDistanceM)
                .map((player) => (
                  <tr key={player.playerId} className="border-b border-border-subtle/50 hover:bg-charcoal/50">
                    <td className="py-2">
                      <span className="text-white font-semibold">{player.playerName}</span>
                      <span className="text-text-tertiary ml-1">({player.position})</span>
                    </td>
                    <td className="py-2 text-right font-mono text-text-secondary">
                      {formatDistance(player.metrics.totalDistanceM)}
                    </td>
                    <td className={`py-2 text-right font-mono ${speedColor(player.metrics.topSpeedKmh)}`}>
                      {player.metrics.topSpeedKmh.toFixed(1)}
                    </td>
                    <td className="py-2 text-right font-mono text-text-secondary">
                      {player.metrics.sprintCount}
                    </td>
                    <td className="py-2 text-right font-mono text-text-tertiary">
                      {player.metrics.minutesPlayed}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conditions */}
      {matchData.conditions && (
        <div className="mt-3 flex gap-3 text-[10px] text-text-tertiary">
          {matchData.conditions.temperature && <span>{matchData.conditions.temperature}°F</span>}
          {matchData.conditions.humidity && <span>{matchData.conditions.humidity}% humidity</span>}
          {matchData.conditions.surface && <span>{matchData.conditions.surface}</span>}
        </div>
      )}

      {/* Attribution */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-text-tertiary text-[10px]">SkillCorner broadcast-derived tracking</span>
        <span className="text-text-tertiary text-[10px]">No stadium cameras required</span>
      </div>
    </div>
  );
}
