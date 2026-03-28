'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { LiveStatsBadge } from '@/components/editorial/LiveStatsBadge';
import { ArticleMeta } from '@/components/ui/ArticleMeta';
import { teamMetadata } from '@/lib/data/team-metadata';
import type { TeamPreviewData } from './types';

export function SECTeamPreviewTemplate({ data }: { data: TeamPreviewData }) {
  const teamMeta = data.teamSlug ? teamMetadata[data.teamSlug] : null;
  const espnId = teamMeta?.espnId;
  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                College Baseball
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/editorial" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Editorial
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">{data.teamName} 2026 Preview</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ember/10 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">{data.badgeText}</Badge>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">{data.date}</span>
                  <span className="text-[rgba(196,184,165,0.35)] text-sm">{data.readTime}</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  {data.teamName} {data.mascot}:{' '}
                  <span className="text-[var(--bsi-primary)]">{data.heroTitle}</span>
                </h1>
                <p className="text-[var(--bsi-dust)] text-lg md:text-xl leading-relaxed mb-4">
                  {data.heroSubtitle}
                </p>
                <div className="flex items-center gap-4 text-sm text-[rgba(196,184,165,0.35)] flex-wrap">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>Austin, TX</span>
                  <span>|</span>
                  <ArticleMeta
                    readingTime={parseInt(data.readTime || '10', 10) || 10}
                    shareTitle={`${data.teamName} ${data.mascot}: ${data.heroTitle} | BSI`}
                  />
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* The Program */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                The Program
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{data.programStats.allTimeWins}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">All-Time Wins</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{data.programStats.winPct}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Win Percentage</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{data.programStats.cwsAppearances}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">CWS Appearances</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{data.programStats.nationalTitles}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">National Titles</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{data.programStats.confTitles}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Conference Titles</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--bsi-primary)]">{data.programStats.cwsWins}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">CWS Wins</div>
                </Card>
              </div>
              {espnId && <LiveStatsBadge espnId={espnId} />}
            </ScrollReveal>
          </Container>
        </Section>

        {/* 2025 Season Results */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-[var(--bsi-bone)]">
                2025 Season Results
              </h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-xl font-bold text-[var(--bsi-primary)]">{data.record2025}</span>
                <span className="text-[rgba(196,184,165,0.35)] text-sm">{data.record2025Context}</span>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card variant="default" padding="sm" className="text-center">
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">{data.seasonStats2025.teamBA}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Team BA</div>
                </Card>
                <Card variant="default" padding="sm" className="text-center">
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">{data.seasonStats2025.teamERA}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Team ERA</div>
                </Card>
                <Card variant="default" padding="sm" className="text-center">
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">{data.seasonStats2025.homeRuns}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Home Runs</div>
                </Card>
                <Card variant="default" padding="sm" className="text-center">
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">{data.seasonStats2025.stolenBases}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Stolen Bases</div>
                </Card>
                <Card variant="default" padding="sm" className="text-center">
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">{data.seasonStats2025.strikeouts}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Strikeouts</div>
                </Card>
                <Card variant="default" padding="sm" className="text-center">
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">{data.seasonStats2025.opponentBA}</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Opponent BA</div>
                </Card>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
                Season Highlights
              </h3>
              <div className="space-y-2">
                {data.seasonHighlights.map((highlight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[var(--bsi-primary)] mt-1 text-sm">&#9670;</span>
                    <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{highlight}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* 2026 Roster Breakdown — Key Returnees */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-[var(--bsi-bone)]">
                2026 Roster Breakdown
              </h2>
              <p className="text-[rgba(196,184,165,0.35)] mb-8">Key returnees and transfer portal additions</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-4">
                Key Returnees
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-10">
                {data.keyReturnees.map((player) => (
                  <Card key={player.name} variant="default" padding="md">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-display font-bold text-[var(--bsi-bone)] uppercase">{player.name}</h4>
                      <span className="text-xs bg-[var(--surface-press-box)] px-2 py-1 rounded-sm text-[rgba(196,184,165,0.35)]">
                        {player.position} &middot; {player.year}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-[var(--bsi-primary)] mb-2">{player.stats}</div>
                    <p className="text-[rgba(196,184,165,0.35)] text-sm leading-relaxed">{player.bio}</p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-4">
                Transfer Portal Additions
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.transferAdditions.map((player) => (
                  <Card key={player.name} variant="default" padding="md">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-display font-bold text-[var(--bsi-bone)] uppercase text-sm">{player.name}</h4>
                      <span className="text-xs bg-[var(--surface-press-box)] px-2 py-1 rounded-sm text-[rgba(196,184,165,0.35)]">
                        {player.position} &middot; {player.year}
                      </span>
                    </div>
                    <div className="text-xs text-[rgba(196,184,165,0.35)] mb-2">From: {player.fromSchool}</div>
                    {player.stats && <div className="font-mono text-xs text-[var(--bsi-primary)] mb-2">{player.stats}</div>}
                    <p className="text-[rgba(196,184,165,0.35)] text-xs leading-relaxed">{player.bio}</p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Pitching Staff Analysis */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                Pitching Staff Analysis
              </h2>
            </ScrollReveal>

            <div className="space-y-6">
              <ScrollReveal direction="up" delay={100}>
                <Card variant="default" padding="lg">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-3">
                    The Headline
                  </h3>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{data.pitchingAnalysis.headline}</p>
                </Card>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={150}>
                <Card variant="default" padding="lg">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-3">
                    The Rotation
                  </h3>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{data.pitchingAnalysis.rotation}</p>
                </Card>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={200}>
                <Card variant="default" padding="lg">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-3">
                    The Depth
                  </h3>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{data.pitchingAnalysis.depth}</p>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Lineup Analysis */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                Lineup Analysis
              </h2>
            </ScrollReveal>

            <div className="space-y-6">
              <ScrollReveal direction="up" delay={100}>
                <Card variant="default" padding="lg">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-3">
                    The Engine
                  </h3>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{data.lineupAnalysis.engine}</p>
                </Card>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={150}>
                <Card variant="default" padding="lg">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-3">
                    The Middle
                  </h3>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{data.lineupAnalysis.middle}</p>
                </Card>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={200}>
                <Card variant="default" padding="lg">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-primary)] mb-3">
                    The Supporting Cast
                  </h3>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed">{data.lineupAnalysis.supportingCast}</p>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Schedule Highlights */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                2026 Schedule Highlights
              </h2>
            </ScrollReveal>

            <div className="space-y-3">
              {data.scheduleHighlights.map((game, i) => (
                <ScrollReveal key={i} direction="up">
                  <Card variant="default" padding="md">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                      <span className="font-mono text-sm text-[rgba(196,184,165,0.35)] md:w-32 flex-shrink-0">{game.dates}</span>
                      <span className="font-display font-bold text-[var(--bsi-bone)] uppercase text-sm flex-1">{game.opponent}</span>
                      <Badge variant={game.location === 'Home' ? 'primary' : 'secondary'} className="self-start md:self-auto">
                        {game.location}
                      </Badge>
                      <span className="text-[rgba(196,184,165,0.35)] text-xs md:w-48 flex-shrink-0 text-right">{game.notes}</span>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Scouting Verdict */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                Scouting Verdict
              </h2>
              <p className="text-[rgba(196,184,165,0.35)] mb-8 text-sm">20&ndash;80 scouting scale</p>
            </ScrollReveal>

            <div className="space-y-4 max-w-2xl">
              {data.scoutingGrades.map((grade) => (
                <ScrollReveal key={grade.category} direction="up">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--bsi-dust)] text-sm w-40 flex-shrink-0">{grade.category}</span>
                    <div className="flex-1 bg-[var(--surface-press-box)] rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-burnt-orange to-ember rounded-full transition-all duration-700"
                        style={{ width: `${(grade.grade / 80) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm font-bold text-[var(--bsi-primary)] w-8 text-right">{grade.grade}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* BSI Projection */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto text-center">
                <Badge variant="primary" className="mb-4">{data.projectionTier}</Badge>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                  BSI Projection
                </h2>
                <p className="text-[var(--bsi-dust)] text-base md:text-lg leading-relaxed">{data.projectionText}</p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="ESPN / SportsDataIO / D1Baseball"
                timestamp={new Date().toLocaleDateString('en-US', {
                  timeZone: 'America/Chicago',
                  month: 'short', day: 'numeric', year: 'numeric',
                }) + ' CT'}
              />
              <div className="flex gap-4">
                <Link href="/college-baseball/editorial" className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors">
                  More Editorial →
                </Link>
                {data.relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors">
                    {link.label} →
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
