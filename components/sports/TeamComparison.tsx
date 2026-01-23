'use client';

/**
 * Team Comparison Component
 *
 * Side-by-side team comparison with visual stat bars, head-to-head history,
 * recent form, and key matchup indicators.
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { UnifiedSportKey, UnifiedTeam, TeamBoxStats } from '@/lib/types/adapters';
import { getSportConfig, getSportTheme, COMPARISON_STATS } from '@/lib/config/sport-config';

export interface TeamStats {
  /** Key stats for comparison - values keyed by stat abbreviation */
  stats: Record<string, number | string>;
  /** Recent game results (W/L) */
  recentForm?: ('W' | 'L' | 'T')[];
  /** Head-to-head record against opponent */
  headToHead?: {
    wins: number;
    losses: number;
    ties?: number;
    lastMeeting?: string;
  };
}

export interface TeamComparisonProps {
  sport: UnifiedSportKey;
  homeTeam: UnifiedTeam;
  awayTeam: UnifiedTeam;
  homeStats: TeamStats;
  awayStats: TeamStats;
  variant?: 'compact' | 'full' | 'matchup-preview';
  className?: string;
}

interface ComparisonBarProps {
  label: string;
  description: string;
  homeValue: number | string;
  awayValue: number | string;
  higherIsBetter: boolean;
  homeColor: string;
  awayColor: string;
}

function ComparisonBar({
  label,
  description,
  homeValue,
  awayValue,
  higherIsBetter,
  homeColor,
  awayColor,
}: ComparisonBarProps) {
  const homeNum = typeof homeValue === 'string' ? parseFloat(homeValue) || 0 : homeValue;
  const awayNum = typeof awayValue === 'string' ? parseFloat(awayValue) || 0 : awayValue;
  const total = Math.abs(homeNum) + Math.abs(awayNum);

  // Determine percentages for bar widths
  const homePercent = total > 0 ? (Math.abs(homeNum) / total) * 100 : 50;
  const awayPercent = total > 0 ? (Math.abs(awayNum) / total) * 100 : 50;

  // Determine who's winning this stat
  const homeBetter = higherIsBetter ? homeNum > awayNum : homeNum < awayNum;
  const awayBetter = higherIsBetter ? awayNum > homeNum : awayNum < homeNum;
  const tied = homeNum === awayNum;

  return (
    <div className="mb-4">
      {/* Stat label and description */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-white/50">{description}</span>
        <span className="text-xs font-semibold text-white/70">{label}</span>
      </div>

      {/* Values */}
      <div className="flex justify-between items-center mb-1">
        <span
          className={`text-sm font-mono font-semibold ${
            homeBetter ? 'text-success' : tied ? 'text-white/70' : 'text-white/50'
          }`}
        >
          {homeValue}
        </span>
        <span
          className={`text-sm font-mono font-semibold ${
            awayBetter ? 'text-success' : tied ? 'text-white/70' : 'text-white/50'
          }`}
        >
          {awayValue}
        </span>
      </div>

      {/* Comparison bars */}
      <div className="flex h-2 gap-1 rounded-full overflow-hidden bg-white/5">
        <div
          className="h-full rounded-l-full transition-all duration-300"
          style={{
            width: `${homePercent}%`,
            backgroundColor: homeBetter ? homeColor : `${homeColor}60`,
          }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-300"
          style={{
            width: `${awayPercent}%`,
            backgroundColor: awayBetter ? awayColor : `${awayColor}60`,
          }}
        />
      </div>
    </div>
  );
}

function RecentForm({ form, label }: { form: ('W' | 'L' | 'T')[]; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="flex gap-1 justify-center">
        {form.slice(0, 5).map((result, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              result === 'W'
                ? 'bg-success/20 text-success'
                : result === 'L'
                  ? 'bg-error/20 text-error'
                  : 'bg-white/10 text-white/50'
            }`}
          >
            {result}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeadToHead({
  record,
  homeAbbr,
  awayAbbr,
}: {
  record: { wins: number; losses: number; ties?: number; lastMeeting?: string };
  homeAbbr: string;
  awayAbbr: string;
}) {
  const total = record.wins + record.losses + (record.ties || 0);

  return (
    <div className="text-center">
      <div className="text-xs text-white/50 mb-1">Head-to-Head</div>
      <div className="text-lg font-bold text-white">
        <span className={record.wins > record.losses ? 'text-success' : ''}>{record.wins}</span>
        <span className="text-white/30 mx-1">-</span>
        <span className={record.losses > record.wins ? 'text-success' : ''}>{record.losses}</span>
        {record.ties !== undefined && record.ties > 0 && (
          <>
            <span className="text-white/30 mx-1">-</span>
            <span>{record.ties}</span>
          </>
        )}
      </div>
      <div className="text-[10px] text-white/40">
        {homeAbbr} leads series ({total} games)
      </div>
      {record.lastMeeting && (
        <div className="text-[10px] text-white/30 mt-0.5">Last: {record.lastMeeting}</div>
      )}
    </div>
  );
}

function TeamHeader({
  team,
  side,
  color,
}: {
  team: UnifiedTeam;
  side: 'home' | 'away';
  color: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${side === 'away' ? 'flex-row-reverse' : ''}`}>
      {team.logo ? (
        <img
          src={team.logo}
          alt={`${team.displayName} logo`}
          className="w-12 h-12 object-contain"
          loading="lazy"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {team.abbreviation.slice(0, 2)}
        </div>
      )}
      <div className={side === 'away' ? 'text-right' : ''}>
        <div className="font-semibold text-white">{team.displayName}</div>
        {team.record && (
          <div className="text-xs text-white/50">
            {team.record.overall}
            {team.record.conference && ` (${team.record.conference})`}
          </div>
        )}
        {team.ranking && (
          <div className="text-xs text-burnt-orange font-semibold">#{team.ranking}</div>
        )}
      </div>
    </div>
  );
}

export function TeamComparison({
  sport,
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  variant = 'full',
  className = '',
}: TeamComparisonProps) {
  const config = getSportConfig(sport);
  const theme = getSportTheme(sport);

  // Get comparison stats for this sport
  const comparisonBars = useMemo(() => {
    return config.comparisonStats.map((statKey) => {
      const statConfig = COMPARISON_STATS[statKey as keyof typeof COMPARISON_STATS];
      const homeVal = homeStats.stats[statKey] ?? 0;
      const awayVal = awayStats.stats[statKey] ?? 0;

      return {
        key: statKey,
        label: statConfig?.label ?? statKey,
        description: statConfig?.description ?? statKey,
        homeValue: homeVal,
        awayValue: awayVal,
        higherIsBetter: statConfig?.higher !== 'worse',
      };
    });
  }, [config.comparisonStats, homeStats.stats, awayStats.stats]);

  const isCompact = variant === 'compact';
  const isMatchupPreview = variant === 'matchup-preview';

  return (
    <div className={className}>
      <Card variant="default">
        {/* Team Headers */}
        <div className="flex justify-between items-start mb-6">
          <TeamHeader team={homeTeam} side="home" color={theme.primary} />
          <div className="text-white/30 text-2xl font-light">vs</div>
          <TeamHeader team={awayTeam} side="away" color={theme.secondary || '#666'} />
        </div>

        {/* Head-to-Head (if available and not compact) */}
        {!isCompact && (homeStats.headToHead || awayStats.headToHead) && (
          <div className="mb-6 py-4 border-y border-white/10">
            <HeadToHead
              record={homeStats.headToHead || { wins: 0, losses: 0 }}
              homeAbbr={homeTeam.abbreviation}
              awayAbbr={awayTeam.abbreviation}
            />
          </div>
        )}

        {/* Recent Form (if available) */}
        {!isCompact && (homeStats.recentForm || awayStats.recentForm) && (
          <div className="flex justify-between mb-6">
            {homeStats.recentForm && (
              <RecentForm form={homeStats.recentForm} label={`${homeTeam.abbreviation} Last 5`} />
            )}
            {awayStats.recentForm && (
              <RecentForm form={awayStats.recentForm} label={`${awayTeam.abbreviation} Last 5`} />
            )}
          </div>
        )}

        {/* Stat Comparison Bars */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Key Matchup Stats
          </h4>
          {comparisonBars.slice(0, isCompact ? 4 : undefined).map((bar) => (
            <ComparisonBar
              key={bar.key}
              label={bar.label}
              description={bar.description}
              homeValue={bar.homeValue}
              awayValue={bar.awayValue}
              higherIsBetter={bar.higherIsBetter}
              homeColor={theme.primary}
              awayColor={theme.secondary || '#666'}
            />
          ))}
        </div>

        {/* Matchup Preview Footer */}
        {isMatchupPreview && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <span className="text-xs text-burnt-orange font-semibold cursor-pointer hover:underline">
              View Full Comparison
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Skeleton loader for TeamComparison
 */
export function TeamComparisonSkeleton({
  variant = 'full',
}: {
  variant?: 'compact' | 'full' | 'matchup-preview';
}) {
  const barCount = variant === 'compact' ? 4 : 6;

  return (
    <Card variant="default">
      {/* Team Headers */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div>
            <div className="skeleton w-24 h-4 rounded mb-1" />
            <div className="skeleton w-16 h-3 rounded" />
          </div>
        </div>
        <div className="skeleton w-8 h-8 rounded" />
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="text-right">
            <div className="skeleton w-24 h-4 rounded mb-1" />
            <div className="skeleton w-16 h-3 rounded" />
          </div>
        </div>
      </div>

      {/* Stat bars */}
      <div className="space-y-4">
        {Array.from({ length: barCount }, (_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="skeleton w-12 h-3 rounded" />
              <div className="skeleton w-8 h-3 rounded" />
            </div>
            <div className="flex justify-between mb-1">
              <div className="skeleton w-8 h-4 rounded" />
              <div className="skeleton w-8 h-4 rounded" />
            </div>
            <div className="skeleton w-full h-2 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TeamComparison;
