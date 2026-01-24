'use client';

/**
 * Historical Context Component
 *
 * Displays historical tidbits, fun facts, records, streaks, and rivalry information
 * for games, teams, matchups, and players.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { UnifiedSportKey } from '@/lib/types/adapters';
import { getSportTheme } from '@/lib/config/sport-config';

/**
 * Types of contextual facts
 */
export type FactType = 'record' | 'streak' | 'milestone' | 'rivalry' | 'history' | 'stat';

/**
 * Relevance level for sorting/filtering facts
 */
export type FactRelevance = 'high' | 'medium' | 'low';

/**
 * A single contextual fact/tidbit
 */
export interface ContextualFact {
  id: string;
  type: FactType;
  headline: string;
  detail?: string;
  relevance: FactRelevance;
  /** Optional source attribution */
  source?: string;
  /** ISO timestamp when fact was generated/updated */
  timestamp?: string;
  /** Associated entity IDs (team, player, game) */
  entityIds?: string[];
}

export interface HistoricalContextProps {
  sport: UnifiedSportKey;
  context: 'game' | 'team' | 'matchup' | 'player';
  /** Entity IDs to fetch context for (team IDs, player IDs, game ID) */
  entityIds: string[];
  variant?: 'inline' | 'card' | 'sidebar';
  /** Maximum number of facts to display */
  maxFacts?: number;
  /** Pre-loaded facts (skips API fetch) */
  facts?: ContextualFact[];
  className?: string;
}

/**
 * Icon component for fact types
 */
function FactIcon({ type }: { type: FactType }) {
  switch (type) {
    case 'record':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'streak':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    case 'milestone':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    case 'rivalry':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    case 'history':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

/**
 * Single fact item display
 */
function FactItem({
  fact,
  variant,
  accentColor,
}: {
  fact: ContextualFact;
  variant: 'inline' | 'card' | 'sidebar';
  accentColor: string;
}) {
  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-2 py-2">
        <span className={accentColor}>
          <FactIcon type={fact.type} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-white text-sm">{fact.headline}</span>
          {fact.detail && <span className="text-white/50 text-sm ml-1">{fact.detail}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="flex items-start gap-2">
        <span className={`${accentColor} mt-0.5`}>
          <FactIcon type={fact.type} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{fact.headline}</p>
          {fact.detail && <p className="text-white/50 text-xs mt-1">{fact.detail}</p>}
          {fact.source && <p className="text-white/30 text-[10px] mt-1">{fact.source}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Fetch historical context from API
 */
async function fetchContext(
  sport: UnifiedSportKey,
  context: string,
  entityIds: string[]
): Promise<ContextualFact[]> {
  try {
    const params = new URLSearchParams({
      sport,
      context,
      entities: entityIds.join(','),
    });
    const res = await fetch(`/api/v1/context?${params}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { facts?: ContextualFact[] };
    return data.facts || [];
  } catch {
    return [];
  }
}

/**
 * Example static facts for demo/fallback
 */
function getStaticFacts(sport: UnifiedSportKey, context: string): ContextualFact[] {
  // Return empty for now - API will provide real facts
  // This could be expanded with cached/static tidbits
  return [];
}

export function HistoricalContext({
  sport,
  context,
  entityIds,
  variant = 'card',
  maxFacts = 5,
  facts: propFacts,
  className = '',
}: HistoricalContextProps) {
  const [facts, setFacts] = useState<ContextualFact[]>(propFacts || []);
  const [loading, setLoading] = useState(!propFacts);
  const theme = getSportTheme(sport);

  useEffect(() => {
    if (propFacts) {
      setFacts(propFacts);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const fetched = await fetchContext(sport, context, entityIds);
      if (!cancelled) {
        // Fall back to static facts if API returns nothing
        const finalFacts = fetched.length > 0 ? fetched : getStaticFacts(sport, context);
        setFacts(finalFacts);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sport, context, entityIds.join(','), propFacts]);

  // Sort by relevance (high first)
  const sortedFacts = [...facts]
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.relevance] - order[b.relevance];
    })
    .slice(0, maxFacts);

  // Don't render if no facts
  if (!loading && sortedFacts.length === 0) {
    return null;
  }

  // Inline variant renders as simple list
  if (variant === 'inline') {
    return (
      <div className={className}>
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="skeleton w-4 h-4 rounded" />
            <div className="skeleton flex-1 h-4 rounded" />
          </div>
        ) : (
          sortedFacts.map((fact) => (
            <FactItem key={fact.id} fact={fact} variant="inline" accentColor={theme.accent} />
          ))
        )}
      </div>
    );
  }

  // Sidebar variant for game detail pages
  if (variant === 'sidebar') {
    return (
      <aside className={`w-full lg:w-80 ${className}`}>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Quick Facts
        </h3>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex gap-2">
                    <div className="skeleton w-4 h-4 rounded" />
                    <div className="flex-1">
                      <div className="skeleton w-full h-4 rounded mb-1" />
                      <div className="skeleton w-2/3 h-3 rounded" />
                    </div>
                  </div>
                </div>
              ))
            : sortedFacts.map((fact) => (
                <FactItem key={fact.id} fact={fact} variant="sidebar" accentColor={theme.accent} />
              ))}
        </div>
      </aside>
    );
  }

  // Card variant (default)
  return (
    <Card variant="default" className={className}>
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        Historical Context
      </h3>
      <div className="space-y-2">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg">
                <div className="flex gap-2">
                  <div className="skeleton w-4 h-4 rounded" />
                  <div className="flex-1">
                    <div className="skeleton w-full h-4 rounded mb-1" />
                    <div className="skeleton w-2/3 h-3 rounded" />
                  </div>
                </div>
              </div>
            ))
          : sortedFacts.map((fact) => (
              <FactItem key={fact.id} fact={fact} variant="card" accentColor={theme.accent} />
            ))}
      </div>
    </Card>
  );
}

/**
 * Pre-built rivalry fact for common matchups
 */
export function createRivalryFact(
  team1: string,
  team2: string,
  record: { wins: number; losses: number; ties?: number },
  rivalryName?: string
): ContextualFact {
  const total = record.wins + record.losses + (record.ties || 0);
  const leader = record.wins > record.losses ? team1 : team2;
  const headline = rivalryName
    ? `${rivalryName}: ${total} meetings`
    : `${team1} vs ${team2}: ${total} meetings`;

  return {
    id: `rivalry-${team1}-${team2}`,
    type: 'rivalry',
    headline,
    detail: `${leader} leads ${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ''}`,
    relevance: 'high',
  };
}

/**
 * Create a streak fact
 */
export function createStreakFact(
  entity: string,
  streakType: string,
  count: number,
  positive: boolean
): ContextualFact {
  return {
    id: `streak-${entity}-${streakType}`,
    type: 'streak',
    headline: `${entity}: ${count}-game ${streakType} streak`,
    relevance: positive ? 'high' : 'medium',
  };
}

/**
 * Create a record/milestone fact
 */
export function createMilestoneFact(
  entity: string,
  milestone: string,
  value: string | number,
  context?: string
): ContextualFact {
  return {
    id: `milestone-${entity}-${milestone}`,
    type: 'milestone',
    headline: `${entity}: ${value} ${milestone}`,
    detail: context,
    relevance: 'high',
  };
}

export default HistoricalContext;
