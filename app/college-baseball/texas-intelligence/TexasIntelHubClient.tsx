'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SabermetricsPanel } from '@/components/college-baseball/SabermetricsPanel';
import { ConferencePositionCard } from '@/components/college-baseball/ConferencePositionCard';
import { TeamVideoPanel } from '@/components/college-baseball/TeamVideoPanel';
import { SocialIntelTeamPanel } from '@/components/college-baseball/SocialIntelTeamPanel';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { FEATURE_ARTICLES } from '@/app/college-baseball/editorial/page';

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ESPN_ID = '251';
const ACCENT = '#BF5700';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TeamResponse {
  record?: { wins?: number; losses?: number };
  ranking?: number;
  conference_record?: { wins?: number; losses?: number };
  next_game?: { opponent?: string; date?: string; location?: string };
  meta?: { source?: string; fetched_at?: string };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasIntelHubClient() {
  const meta = teamMetadata[TEAM_ID];
  const logoUrl = getLogoUrl(meta?.espnId || ESPN_ID, meta?.logoId);

  const { data: teamData, loading: teamLoading } = useSportData<TeamResponse>(
    `/api/college-baseball/teams/${meta?.espnId || ESPN_ID}`,
    { timeout: 10000 },
  );

  const texasArticles = useMemo(
    () => FEATURE_ARTICLES.filter((a) => a.teams?.includes(TEAM_ID)).slice(0, 4),
    [],
  );

  const record = teamData?.record;
  const ranking = teamData?.ranking;
  const confRecord = teamData?.conference_record;
  const nextGame = teamData?.next_game;

  return (
    <>
      <main id="main-content">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/teams/texas" className="text-text-muted hover:text-burnt-orange transition-colors">
                Texas
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Intelligence Hub</span>
            </nav>
          </Container>
        </Section>

        {/* ── 1. Hero ────────────────────────────────────────────── */}
        <Section padding="xl" className="relative overflow-hidden bg-[var(--surface-scoreboard)]">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/5 via-transparent to-burnt-orange/3 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-surface-light/50 flex items-center justify-center overflow-hidden">
                  <img src={logoUrl} alt="Texas Longhorns" className="w-14 h-14 object-contain" loading="eager" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="heritage-stamp text-[10px]">Intelligence Hub</span>
                    {ranking && (
                      <Badge variant="accent" size="sm">#{ranking} National</Badge>
                    )}
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-text-primary">
                    Texas Longhorns Baseball
                  </h1>
                  <p className="text-text-secondary text-lg mt-3 max-w-2xl leading-relaxed">
                    6 CWS titles. 38 CWS appearances. The winningest program in college baseball history.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-muted">
                    <span>UFCU Disch-Falk Field</span>
                    <span className="text-border-subtle">|</span>
                    <span>Austin, TX</span>
                    <span className="text-border-subtle">|</span>
                    <span>SEC</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 2. Live Dashboard Strip ────────────────────────────── */}
        <Section padding="md" className="bg-[var(--surface-dugout)] border-y border-border">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardStat
                label="Record"
                value={record ? `${record.wins}-${record.losses}` : null}
                loading={teamLoading}
              />
              <DashboardStat
                label="SEC Record"
                value={confRecord ? `${confRecord.wins}-${confRecord.losses}` : null}
                loading={teamLoading}
              />
              <DashboardStat
                label="National Rank"
                value={ranking ? `#${ranking}` : null}
                loading={teamLoading}
                accent
              />
              <DashboardStat
                label="Next Game"
                value={nextGame?.opponent ?? null}
                sub={nextGame?.date ?? undefined}
                loading={teamLoading}
              />
            </div>
          </Container>
        </Section>

        {/* ── 3. Roster Sabermetrics ─────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Roster Advanced Metrics
              </h2>
            </ScrollReveal>
            <SabermetricsPanel
              teamId={TEAM_ID}
              espnId={meta?.espnId || ESPN_ID}
              accent={ACCENT}
            />
          </Container>
        </Section>

        {/* ── 4. SEC Conference Position ──────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <ConferencePositionCard
                teamId={TEAM_ID}
                espnId={meta?.espnId || ESPN_ID}
                conference="SEC"
                accent={ACCENT}
              />
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 5. Film Room ───────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Film Room
              </h2>
            </ScrollReveal>
            <TeamVideoPanel teamId={TEAM_ID} />
          </Container>
        </Section>

        {/* ── 6. Social Intelligence ─────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Social Intelligence
              </h2>
            </ScrollReveal>
            <SocialIntelTeamPanel teamId={TEAM_ID} />
          </Container>
        </Section>

        {/* ── 7. Program History Excerpt ──────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-burnt-orange" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span>Program History</span>
                    <Badge variant="secondary" size="sm">Est. 1895</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    The Texas Longhorns baseball program is the winningest in NCAA history.
                    Six national championships, 38 College World Series appearances, and a
                    pipeline that has produced over 100 MLB draft picks. From Augie Garrido&apos;s
                    dynasty years to the Schlossnagle era, the program carries one of the deepest
                    legacies in American sport.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <HistoryStat label="National Titles" value="6" />
                    <HistoryStat label="CWS Appearances" value="38" />
                    <HistoryStat label="Conference Titles" value="33" />
                    <HistoryStat label="MLB Draft Picks" value="100+" />
                  </div>
                  <Link
                    href="/college-baseball/texas-history"
                    className="inline-flex items-center gap-2 text-sm text-burnt-orange hover:text-ember transition-colors font-medium"
                  >
                    Explore Full History &rarr;
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 8. Editorial Cross-Links ───────────────────────────── */}
        {texasArticles.length > 0 && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                  Recent Coverage
                </h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {texasArticles.map((article) => (
                  <ScrollReveal key={article.slug} direction="up">
                    <Link href={`/college-baseball/editorial/${article.slug}`}>
                      <Card variant="default" padding="md" className="h-full hover:border-burnt-orange/30 transition-colors cursor-pointer">
                        <CardContent>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" size="sm">{article.badge}</Badge>
                            <span className="text-text-muted text-xs">{article.date}</span>
                          </div>
                          <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary mb-2 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                            {article.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* ── 9. Footer Navigation ───────────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="BSI Intelligence"
                timestamp={
                  teamData?.meta?.fetched_at
                    ? new Date(teamData.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/college-baseball/teams/texas"
                  className="text-sm text-burnt-orange hover:text-ember transition-colors"
                >
                  Team Detail &rarr;
                </Link>
                <Link
                  href="/college-baseball/teams/texas/intelligence"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Sabermetrics Deep Dive &rarr;
                </Link>
                <Link
                  href="/college-baseball/texas-history"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Program History &rarr;
                </Link>
                <Link
                  href="/college-baseball/editorial"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  All Editorial &rarr;
                </Link>
                <Link
                  href="/college-baseball/savant"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  BSI Savant &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function DashboardStat({
  label,
  value,
  sub,
  loading,
  accent,
}: {
  label: string;
  value: string | null;
  sub?: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <div className="text-center py-2">
      {loading ? (
        <div className="h-8 w-16 mx-auto bg-surface-light rounded animate-pulse" />
      ) : (
        <div
          className="font-mono text-2xl font-bold"
          style={{ color: accent && value ? ACCENT : undefined }}
        >
          {value ?? '—'}
        </div>
      )}
      <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-text-muted text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xl font-bold text-burnt-orange">{value}</div>
      <div className="text-text-muted text-xs mt-1">{label}</div>
    </div>
  );
}
