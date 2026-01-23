'use client';

/**
 * Sport Page Container
 *
 * Shared container component that replaces duplicated logic across sport pages.
 * Provides consistent layout and sections for scores, standings, teams, and comparisons.
 */

import { type ReactNode, useState, useEffect } from 'react';
import type { UnifiedSportKey } from '@/lib/types/adapters';
import { getSportConfig, getSportTheme } from '@/lib/config/sport-config';
import { LiveScoresPanel } from './LiveScoresPanel';
import { StandingsTable } from './StandingsTable';

export type SportPageSection = 'scores' | 'standings' | 'teams' | 'compare' | 'rankings';

export interface SportPageProps {
  sport: UnifiedSportKey;
  /** Page title - defaults to sport display name */
  title?: string;
  /** Sections to display in order */
  sections: SportPageSection[];
  /** Custom header content */
  headerContent?: ReactNode;
  /** Custom content to insert after header */
  children?: ReactNode;
  className?: string;
}

/**
 * Page layout wrapper with consistent header styling
 */
function PageLayout({
  title,
  subtitle,
  accentColor,
  headerContent,
  children,
}: {
  title: string;
  subtitle?: string;
  accentColor: string;
  headerContent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-charcoal/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-display font-bold ${accentColor}`}>{title}</h1>
              {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
            </div>
            {headerContent}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

/**
 * Section wrapper with consistent spacing and title
 */
function Section({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      {title && <h2 className="text-xl font-display font-semibold text-white mb-4">{title}</h2>}
      {children}
    </section>
  );
}

/**
 * Team Comparison Selector Component
 * Allows users to select two teams for comparison
 */
export function TeamComparisonSelector({ sport }: { sport: UnifiedSportKey }) {
  const [teams, setTeams] = useState<Array<{ id: string; name: string; abbreviation: string }>>([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sportApiKey = sport === 'ncaaf' ? 'cfb' : sport;
    fetch(`/api/${sportApiKey}/teams`)
      .then((r) => r.json())
      .then((data) => {
        setTeams(data.teams || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sport]);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Compare Teams</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Team 1</label>
          <select
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
            disabled={loading}
          >
            <option value="">Select team...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Team 2</label>
          <select
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
            disabled={loading}
          >
            <option value="">Select team...</option>
            {teams
              .filter((t) => t.id !== team1)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      <button
        className="mt-4 w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
        disabled={!team1 || !team2}
      >
        Compare Teams
      </button>
    </div>
  );
}

/**
 * Main SportPage component
 */
export function SportPage({
  sport,
  title,
  sections,
  headerContent,
  children,
  className = '',
}: SportPageProps) {
  const config = getSportConfig(sport);
  const theme = getSportTheme(sport);

  const displayTitle = title || config.displayName;

  // Convert sport key to API-compatible format
  const sportApiKey = sport === 'ncaaf' ? 'cfb' : sport;

  return (
    <PageLayout title={displayTitle} accentColor={theme.accent} headerContent={headerContent}>
      <div className={className}>
        {/* Custom content */}
        {children}

        {/* Dynamic sections */}
        {sections.map((section) => {
          switch (section) {
            case 'scores':
              return (
                <Section key="scores" title="Live Scores">
                  <LiveScoresPanel sport={sport} pollInterval={config.pollingInterval} />
                </Section>
              );

            case 'standings':
              return (
                <Section key="standings">
                  <StandingsTable sport={sportApiKey as any} />
                </Section>
              );

            case 'compare':
              return (
                <Section key="compare" title="Team Comparison">
                  <TeamComparisonSelector sport={sport} />
                </Section>
              );

            case 'teams':
              return (
                <Section key="teams" title="Teams">
                  <TeamsGrid sport={sport} />
                </Section>
              );

            case 'rankings':
              return (
                <Section key="rankings" title="Rankings">
                  <RankingsDisplay sport={sport} />
                </Section>
              );

            default:
              return null;
          }
        })}
      </div>
    </PageLayout>
  );
}

/**
 * Teams grid placeholder - displays all teams for a sport
 */
function TeamsGrid({ sport }: { sport: UnifiedSportKey }) {
  return (
    <div className="glass-card p-6 text-center text-white/50">
      <p>Teams grid for {getSportConfig(sport).displayName}</p>
      <p className="text-xs mt-2">Connect to teams API to populate</p>
    </div>
  );
}

/**
 * Rankings display placeholder - shows poll rankings for college sports
 */
function RankingsDisplay({ sport }: { sport: UnifiedSportKey }) {
  const config = getSportConfig(sport);

  return (
    <div className="glass-card p-6 text-center text-white/50">
      <p>Rankings for {config.displayName}</p>
      <p className="text-xs mt-2">Connect to rankings API to populate</p>
    </div>
  );
}

/**
 * Two-column layout for sport pages
 */
export function SportPageTwoColumn({
  sport,
  title,
  mainContent,
  sidebarContent,
  headerContent,
  className = '',
}: {
  sport: UnifiedSportKey;
  title?: string;
  mainContent: ReactNode;
  sidebarContent: ReactNode;
  headerContent?: ReactNode;
  className?: string;
}) {
  const config = getSportConfig(sport);
  const theme = getSportTheme(sport);

  const displayTitle = title || config.displayName;

  return (
    <PageLayout title={displayTitle} accentColor={theme.accent} headerContent={headerContent}>
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
        {/* Main content - 2 columns on large screens */}
        <div className="lg:col-span-2">{mainContent}</div>

        {/* Sidebar - 1 column on large screens */}
        <aside className="space-y-6">{sidebarContent}</aside>
      </div>
    </PageLayout>
  );
}

/**
 * Game detail page layout
 */
export function GameDetailLayout({
  sport,
  gameTitle,
  mainContent,
  sidebarContent,
  backHref,
  className = '',
}: {
  sport: UnifiedSportKey;
  gameTitle: string;
  mainContent: ReactNode;
  sidebarContent?: ReactNode;
  backHref?: string;
  className?: string;
}) {
  const theme = getSportTheme(sport);

  return (
    <div className="min-h-screen">
      {/* Header with back button */}
      <header className="border-b border-white/10 bg-charcoal/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {backHref && (
              <a href={backHref} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </a>
            )}
            <h1 className={`text-xl font-display font-bold ${theme.accent}`}>{gameTitle}</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div
          className={`grid grid-cols-1 ${sidebarContent ? 'lg:grid-cols-3' : ''} gap-6 ${className}`}
        >
          <div className={sidebarContent ? 'lg:col-span-2' : ''}>{mainContent}</div>
          {sidebarContent && <aside>{sidebarContent}</aside>}
        </div>
      </main>
    </div>
  );
}

export default SportPage;
