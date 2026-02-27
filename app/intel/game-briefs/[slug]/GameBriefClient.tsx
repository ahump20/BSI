'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { GameBrief, type GameBriefData } from '@/components/intel/GameBrief';
import { CiteWidget } from '@/components/ui/CiteWidget';
import { JsonLd } from '@/components/JsonLd';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ---------------------------------------------------------------------------
// Seed data — fallback until API provides real briefs
// ---------------------------------------------------------------------------

const SEED_BRIEFS: Record<string, GameBriefData> = {
  'texas-uc-davis-opener-2026': {
    slug: 'texas-uc-davis-opener-2026',
    sport: 'College Baseball',
    date: 'February 14, 2026',
    readTime: '6 min',
    homeTeam: 'Texas',
    awayTeam: 'UC Davis',
    homeScore: 13,
    awayScore: 2,
    venue: 'UFCU Disch-Falk Field, Austin, TX',
    headline: 'Texas 13, UC Davis 2: Volantis Sets the Tone',
    summary:
      'The Longhorns opened the 2026 season with a 13-2 dismantling of UC Davis behind a dominant start from Lucas Volantis. Texas put up five runs in the first two innings and never looked back. The bats were alive across the lineup — seven different Longhorns recorded hits, and the team went 4-for-9 with runners in scoring position.',
    leverageMoments: [
      {
        inning: 'Top 1st',
        description: 'UC Davis loaded the bases with one out against Volantis. He struck out the next two batters on eight pitches to escape the jam.',
        wpShift: '+12% Texas',
      },
      {
        inning: 'Bot 2nd',
        description: 'Texas sent eight batters to the plate, scoring four runs on three consecutive hits. The inning turned a 2-0 lead into a 6-0 cushion.',
        wpShift: '+24% Texas',
      },
      {
        inning: 'Bot 5th',
        description: 'Back-to-back doubles extended the lead to 10-2, effectively ending competitive play.',
        wpShift: '+8% Texas',
      },
    ],
    decidingStats: [
      {
        stat: 'Volantis K/BB',
        value: '8 K / 1 BB',
        context: 'Volantis threw 5.2 innings of one-hit ball, striking out eight and walking one. His fastball sat 93-95 with late life. The lone walk came on a 3-2 slider that missed down.',
        source: 'ESPN',
        timestamp: '2026-02-14T22:30:00Z',
      },
      {
        stat: 'RISP Hitting',
        value: '4-for-9 (.444)',
        context: 'Texas was aggressive early in counts with runners on. Three of the four RISP hits came on the first or second pitch of the at-bat.',
        source: 'Highlightly',
        timestamp: '2026-02-14T22:30:00Z',
      },
      {
        stat: 'First-Inning Runs',
        value: '2 (5 total in first 2 inn.)',
        context: 'Setting the tone early is a David Pierce hallmark. Texas has scored in the first inning in 68% of their wins over the last two seasons.',
        source: 'BSI Historical',
        timestamp: '2026-02-14T22:30:00Z',
      },
    ],
    wpChartPlaceholder: true,
  },
};

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface GameApiResponse {
  game?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    venue?: string;
    date?: string;
    status?: string;
  };
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export function GameBriefClient({ slug }: { slug: string }) {
  // Try to extract a game ID from the slug for API lookup
  // Seed briefs use descriptive slugs, not game IDs
  const isSeedBrief = slug in SEED_BRIEFS;

  const { data: gameData, loading } =
    useSportData<GameApiResponse>(
      isSeedBrief ? null : `/api/college-baseball/game/${slug}`,
      { skip: isSeedBrief }
    );

  // Use seed data as fallback
  const seedBrief = SEED_BRIEFS[slug];
  const brief: GameBriefData | null = seedBrief || (gameData?.game ? {
    slug,
    sport: 'College Baseball',
    date: gameData.game.date || '',
    readTime: '5 min',
    homeTeam: gameData.game.homeTeam,
    awayTeam: gameData.game.awayTeam,
    homeScore: gameData.game.homeScore,
    awayScore: gameData.game.awayScore,
    venue: gameData.game.venue || '',
    headline: `${gameData.game.awayTeam} ${gameData.game.awayScore}, ${gameData.game.homeTeam} ${gameData.game.homeScore}`,
    summary: '',
    leverageMoments: [],
    decidingStats: [],
    wpChartPlaceholder: true,
  } : null);

  if (loading && !brief) {
    return (
      <>
        <div>
          <Section padding="lg">
            <Container>
              <div className="max-w-3xl animate-pulse space-y-4">
                <div className="h-6 bg-border-subtle rounded w-1/4" />
                <div className="h-10 bg-border-subtle rounded w-3/4" />
                <div className="h-40 bg-surface-light rounded-xl" />
                <div className="h-4 bg-surface-light rounded w-full" />
                <div className="h-4 bg-surface-light rounded w-5/6" />
              </div>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  if (!brief) {
    return (
      <>
        <div>
          <Section padding="lg">
            <Container>
              <h1 className="font-display text-2xl font-bold text-text-primary uppercase">Brief Not Found</h1>
              <p className="text-text-muted mt-2">
                This game brief doesn&#39;t exist yet.{' '}
                <Link href="/intel/game-briefs" className="text-burnt-orange hover:text-ember transition-colors">
                  Browse all briefs &#8594;
                </Link>
              </p>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: brief.headline,
          author: { '@type': 'Person', name: 'Austin Humphrey' },
          publisher: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: brief.date || '2026-02-14',
          url: `https://blazesportsintel.com/intel/game-briefs/${brief.slug}`,
        }}
      />
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Intel', href: '/intel' },
                { label: 'Game Briefs', href: '/intel/game-briefs' },
                { label: `${brief.awayTeam} vs. ${brief.homeTeam}` },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <GameBrief brief={brief} />

            <div className="mt-12 max-w-3xl">
              <CiteWidget
                title={brief.headline}
                path={`/intel/game-briefs/${brief.slug}`}
                date={brief.date || '2026-02-14'}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/intel/game-briefs" className="hover:text-text-secondary transition-colors">
                &#8592; All Game Briefs
              </Link>
              <Link href="/intel" className="hover:text-text-secondary transition-colors">
                Intel Dashboard
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
