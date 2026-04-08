'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import type { TeamMeta } from '@/lib/data/team-metadata';
import CompareStatsClient from './CompareStatsClient';

/* ── Types ─────────────────────────────────────────────────────────── */

interface TeamOverview {
  name: string;
  slug: string;
  conference: string;
  record: string;
  logo: string;
  meta?: TeamMeta;
}

interface TeamApiResponse {
  team?: {
    name?: string;
    displayName?: string;
    abbreviation?: string;
    conference?: string;
    record?: string;
    standingSummary?: string;
    logos?: Array<{ href?: string }>;
    [key: string]: unknown;
  };
  record?: string;
  conference?: string;
  meta?: { source?: string; fetched_at?: string };
  [key: string]: unknown;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function resolveTeamOverview(slug: string, apiData: TeamApiResponse | null): TeamOverview {
  const meta = teamMetadata[slug];
  const teamObj = apiData?.team;

  const name = meta?.name || teamObj?.displayName || teamObj?.name || slugToDisplayName(slug);
  const conference = meta?.conference || teamObj?.conference || apiData?.conference || '';
  const record = apiData?.record || teamObj?.record || teamObj?.standingSummary || '';
  const logo = meta
    ? getLogoUrl(meta.espnId, meta.logoId, meta.localLogo)
    : teamObj?.logos?.[0]?.href || '';

  return { name, slug, conference, record, logo, meta };
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function ComparePageClient() {
  const [team1Slug, setTeam1Slug] = useState('');
  const [team2Slug, setTeam2Slug] = useState('');
  const [team1, setTeam1] = useState<TeamOverview | null>(null);
  const [team2, setTeam2] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState<string | undefined>();

  // Read real team slugs from the browser URL (not Next.js params,
  // which may be "placeholder" when served via Worker proxy fallback)
  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    // URL: /college-baseball/compare/{team1}/{team2}
    const compareIdx = segments.indexOf('compare');
    const t1 = compareIdx >= 0 && segments[compareIdx + 1] ? segments[compareIdx + 1] : '';
    const t2 = compareIdx >= 0 && segments[compareIdx + 2] ? segments[compareIdx + 2] : '';

    if (!t1 || !t2 || t1 === 'placeholder' || t2 === 'placeholder') {
      setError('Two teams are required for comparison.');
      setLoading(false);
      return;
    }

    setTeam1Slug(t1);
    setTeam2Slug(t2);
  }, []);

  // Fetch team data once slugs are resolved
  useEffect(() => {
    if (!team1Slug || !team2Slug) return;

    async function fetchTeams(): Promise<void> {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/college-baseball/teams/${team1Slug}`).then((r) =>
            r.ok ? (r.json() as Promise<TeamApiResponse>) : null,
          ),
          fetch(`/api/college-baseball/teams/${team2Slug}`).then((r) =>
            r.ok ? (r.json() as Promise<TeamApiResponse>) : null,
          ),
        ]);

        const t1 = resolveTeamOverview(team1Slug, res1);
        const t2 = resolveTeamOverview(team2Slug, res2);

        setTeam1(t1);
        setTeam2(t2);
        setFetchedAt(new Date().toISOString());
      } catch {
        setError('Failed to load team data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [team1Slug, team2Slug]);

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <div>
          <Section padding="lg" className="relative overflow-hidden">
            <Container center>
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-surface-dugout rounded-sm w-64 mx-auto" />
                <div className="h-12 bg-surface-dugout rounded-sm w-96 mx-auto" />
                <div className="h-6 bg-surface-dugout rounded-sm w-48 mx-auto" />
              </div>
            </Container>
          </Section>
          <Section padding="lg" className="bg-surface-scoreboard">
            <Container>
              <div className="grid md:grid-cols-2 gap-6">
                {[0, 1].map((i) => (
                  <Card key={i} padding="lg">
                    <div className="animate-pulse space-y-4">
                      <div className="h-16 w-16 bg-surface-press-box rounded-full mx-auto" />
                      <div className="h-6 bg-surface-press-box rounded-sm w-32 mx-auto" />
                      <div className="h-4 bg-surface-press-box rounded-sm w-24 mx-auto" />
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="h-4 bg-surface-press-box rounded-sm" />
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  /* ── Error state ───────────────────────────────────────────────── */
  if (error || !team1 || !team2) {
    return (
      <>
        <div>
          <Section padding="lg">
            <Container center>
              <Badge variant="secondary" className="mb-4">Compare</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-center uppercase tracking-wide mb-4 text-bsi-bone">
                Team Not Found
              </h1>
              <p className="text-bsi-dust text-center max-w-md mx-auto mb-6">
                {error || "We couldn't find one or both teams. They may not have data available yet."}
              </p>
              <div className="flex justify-center">
                <Link
                  href="/college-baseball/compare"
                  className="btn-heritage-fill px-6 py-2 text-sm"
                >
                  Pick Different Teams
                </Link>
              </div>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  /* ── Main comparison ───────────────────────────────────────────── */
  const nameA = team1.name;
  const nameB = team2.name;

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-vintage/30">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-bsi-dust hover:text-burnt-orange transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-bsi-dust">/</span>
              <Link
                href="/college-baseball/compare"
                className="text-bsi-dust hover:text-burnt-orange transition-colors"
              >
                Compare
              </Link>
              <span className="text-bsi-dust">/</span>
              <span className="text-bsi-bone">
                {nameA} vs {nameB}
              </span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-burnt-orange/10 via-transparent to-burnt-orange/10 pointer-events-none" />
          <Container center>
            <Badge variant="primary" className="mb-4">
              Head-to-Head
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-2">
              <span className="text-burnt-orange">{nameA}</span>
              <span className="text-bsi-dust mx-3">vs</span>
              <span className="text-burnt-orange">{nameB}</span>
            </h1>
            {(team1.conference || team2.conference) && (
              <p className="text-bsi-dust text-center text-lg">
                {team1.conference}
                {team1.conference && team2.conference && team1.conference !== team2.conference
                  ? ` vs ${team2.conference}`
                  : ''}
              </p>
            )}
          </Container>
        </Section>

        {/* Team Cards */}
        <Section padding="lg" className="bg-surface-scoreboard">
          <Container>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team A */}
              <Card padding="lg" className="border-burnt-orange/20">
                <div className="text-center mb-6">
                  {team1.logo && (
                    <img
                      src={team1.logo}
                      alt={nameA}
                      className="w-16 h-16 mx-auto mb-3 object-contain"
                    />
                  )}
                  <Link
                    href={`/college-baseball/teams/${team1Slug}`}
                    className="font-display text-2xl font-bold text-bsi-bone uppercase hover:text-burnt-orange transition-colors"
                  >
                    {nameA}
                  </Link>
                  {team1.conference && (
                    <div className="text-bsi-dust text-sm mt-1">{team1.conference}</div>
                  )}
                  {team1.record && (
                    <div className="text-bsi-bone font-mono text-sm mt-1">{team1.record}</div>
                  )}
                </div>
              </Card>

              {/* Team B */}
              <Card padding="lg" className="border-burnt-orange/20">
                <div className="text-center mb-6">
                  {team2.logo && (
                    <img
                      src={team2.logo}
                      alt={nameB}
                      className="w-16 h-16 mx-auto mb-3 object-contain"
                    />
                  )}
                  <Link
                    href={`/college-baseball/teams/${team2Slug}`}
                    className="font-display text-2xl font-bold text-bsi-bone uppercase hover:text-burnt-orange transition-colors"
                  >
                    {nameB}
                  </Link>
                  {team2.conference && (
                    <div className="text-bsi-dust text-sm mt-1">{team2.conference}</div>
                  )}
                  {team2.record && (
                    <div className="text-bsi-bone font-mono text-sm mt-1">{team2.record}</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Live Savant Comparison */}
            <CompareStatsClient
              team1Slug={team1Slug}
              team2Slug={team2Slug}
              team1Name={nameA}
              team2Name={nameB}
            />

            {/* Footer Links */}
            <Card padding="lg" className="mt-8 border-burnt-orange/20">
              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  href="/college-baseball/compare"
                  className="text-sm text-burnt-orange hover:text-ember transition-colors"
                >
                  Compare Other Teams
                </Link>
                <Link
                  href="/college-baseball"
                  className="text-sm text-bsi-dust hover:text-bsi-bone transition-colors"
                >
                  Back to College Baseball
                </Link>
              </div>
            </Card>

            {fetchedAt && (
              <div className="mt-6">
                <DataFreshnessIndicator
                  lastUpdated={new Date(fetchedAt)}
                  source="BSI Savant"
                  refreshInterval={21600}
                />
              </div>
            )}
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
