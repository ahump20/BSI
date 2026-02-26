'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { IntelSignup } from '@/components/home/IntelSignup';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ── Daily Digest types ───────────────────────────────────────────────

interface DailyEditorial {
  id: number;
  date: string;
  title: string;
  preview: string;
  teams: string[];
  wordCount: number;
  createdAt: string;
}

interface EditorialListResponse {
  editorials: DailyEditorial[];
  meta: { source: string; fetched_at: string; timezone: string };
  message?: string;
}

// ── Filter tags ──────────────────────────────────────────────────────────

type FilterTag = 'All' | 'SEC' | 'Big 12' | 'Big Ten' | 'Weekly' | 'National' | 'Team Preview' | 'Conference';

const FILTER_TAGS: FilterTag[] = ['All', 'SEC', 'Big 12', 'Big Ten', 'Weekly', 'National', 'Team Preview', 'Conference'];

// ── Projection tier badge styling ──────────────────────────────────────

type Tier = 'Omaha Favorite' | 'Contender' | 'Dark Horse' | 'Bubble' | 'Sleeper' | 'Rebuilding';

const tierStyles: Record<Tier, string> = {
  'Omaha Favorite': 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/30',
  Contender: 'bg-burnt-orange/20 text-ember border-burnt-orange/30',
  'Dark Horse': 'bg-surface-medium text-text-secondary border-border-strong',
  Bubble: 'bg-surface-light text-text-muted border-border',
  Sleeper: 'bg-surface-light text-text-muted border-border',
  Rebuilding: 'bg-surface-light text-text-muted border-border-subtle',
};

function TierBadge({ tier }: { tier: string }) {
  const style = tierStyles[tier as Tier] || tierStyles.Bubble;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${style}`}>
      {tier}
    </span>
  );
}

// ── Team data ──────────────────────────────────────────────────────────

interface TeamCard {
  name: string;
  slug: string;
  mascot: string;
  record: string;
  tier: string;
}

const SEC_TEAMS: TeamCard[] = [
  { name: 'Texas', slug: 'texas', mascot: 'Longhorns', record: '8-0', tier: 'Omaha Favorite' },
  { name: 'Texas A&M', slug: 'texas-am', mascot: 'Aggies', record: '7-0', tier: 'Omaha Favorite' },
  { name: 'LSU', slug: 'lsu', mascot: 'Tigers', record: '8-0', tier: 'Omaha Favorite' },
  { name: 'Florida', slug: 'florida', mascot: 'Gators', record: '7-0', tier: 'Omaha Favorite' },
  { name: 'Arkansas', slug: 'arkansas', mascot: 'Razorbacks', record: '6-1', tier: 'Contender' },
  { name: 'Auburn', slug: 'auburn', mascot: 'Tigers', record: '6-1', tier: 'Contender' },
  { name: 'Mississippi State', slug: 'mississippi-state', mascot: 'Bulldogs', record: '8-0', tier: 'Contender' },
  { name: 'Oklahoma', slug: 'oklahoma', mascot: 'Sooners', record: '7-0', tier: 'Contender' },
  { name: 'Georgia', slug: 'georgia', mascot: 'Bulldogs', record: '6-1', tier: 'Contender' },
  { name: 'Tennessee', slug: 'tennessee', mascot: 'Volunteers', record: '5-2', tier: 'Contender' },
  { name: 'Vanderbilt', slug: 'vanderbilt', mascot: 'Commodores', record: '5-2', tier: 'Contender' },
  { name: 'Kentucky', slug: 'kentucky', mascot: 'Wildcats', record: '5-2', tier: 'Dark Horse' },
  { name: 'South Carolina', slug: 'south-carolina', mascot: 'Gamecocks', record: '5-2', tier: 'Dark Horse' },
  { name: 'Ole Miss', slug: 'ole-miss', mascot: 'Rebels', record: '8-0', tier: 'Dark Horse' },
  { name: 'Alabama', slug: 'alabama', mascot: 'Crimson Tide', record: '4-3', tier: 'Bubble' },
  { name: 'Missouri', slug: 'missouri', mascot: 'Tigers', record: '3-4', tier: 'Rebuilding' },
];

const BIG12_TEAMS: TeamCard[] = [
  { name: 'Kansas', slug: 'kansas', mascot: 'Jayhawks', record: '5-2', tier: 'Dark Horse' },
  { name: 'Oklahoma State', slug: 'oklahoma-state', mascot: 'Cowboys', record: '4-3', tier: 'Dark Horse' },
  { name: 'Arizona', slug: 'arizona', mascot: 'Wildcats', record: '4-3', tier: 'Dark Horse' },
  { name: 'Arizona State', slug: 'arizona-state', mascot: 'Sun Devils', record: '4-3', tier: 'Dark Horse' },
  { name: 'West Virginia', slug: 'west-virginia', mascot: 'Mountaineers', record: '5-1', tier: 'Bubble' },
  { name: 'Baylor', slug: 'baylor', mascot: 'Bears', record: '5-2', tier: 'Bubble' },
  { name: 'TCU', slug: 'tcu', mascot: 'Horned Frogs', record: '2-5', tier: 'Bubble' },
  { name: 'Houston', slug: 'houston', mascot: 'Cougars', record: '4-3', tier: 'Bubble' },
  { name: 'UCF', slug: 'ucf', mascot: 'Knights', record: '4-3', tier: 'Bubble' },
  { name: 'Texas Tech', slug: 'texas-tech', mascot: 'Red Raiders', record: '3-4', tier: 'Rebuilding' },
  { name: 'Cincinnati', slug: 'cincinnati', mascot: 'Bearcats', record: '3-4', tier: 'Rebuilding' },
  { name: 'BYU', slug: 'byu', mascot: 'Cougars', record: '3-4', tier: 'Rebuilding' },
  { name: 'Kansas State', slug: 'kansas-state', mascot: 'Wildcats', record: '3-4', tier: 'Rebuilding' },
  { name: 'Utah', slug: 'utah', mascot: 'Utes', record: '2-5', tier: 'Rebuilding' },
];

const BIGTEN_TEAMS: TeamCard[] = [
  { name: 'UCLA', slug: 'ucla', mascot: 'Bruins', record: '8-0', tier: 'Omaha Favorite' },
  { name: 'Oregon', slug: 'oregon', mascot: 'Ducks', record: '5-2', tier: 'Contender' },
  { name: 'USC', slug: 'usc', mascot: 'Trojans', record: '4-3', tier: 'Contender' },
  { name: 'Michigan', slug: 'michigan', mascot: 'Wolverines', record: '4-3', tier: 'Dark Horse' },
  { name: 'Iowa', slug: 'iowa', mascot: 'Hawkeyes', record: '4-3', tier: 'Dark Horse' },
  { name: 'Nebraska', slug: 'nebraska', mascot: 'Cornhuskers', record: '5-2', tier: 'Bubble' },
  { name: 'Illinois', slug: 'illinois', mascot: 'Fighting Illini', record: '5-2', tier: 'Bubble' },
  { name: 'Indiana', slug: 'indiana', mascot: 'Hoosiers', record: '4-3', tier: 'Bubble' },
  { name: 'Penn State', slug: 'penn-state', mascot: 'Nittany Lions', record: '4-3', tier: 'Bubble' },
  { name: 'Michigan State', slug: 'michigan-state', mascot: 'Spartans', record: '4-3', tier: 'Bubble' },
  { name: 'Purdue', slug: 'purdue', mascot: 'Boilermakers', record: '4-3', tier: 'Bubble' },
  { name: 'Rutgers', slug: 'rutgers', mascot: 'Scarlet Knights', record: '3-4', tier: 'Bubble' },
  { name: 'Washington', slug: 'washington', mascot: 'Huskies', record: '3-4', tier: 'Bubble' },
  { name: 'Ohio State', slug: 'ohio-state', mascot: 'Buckeyes', record: '2-5', tier: 'Rebuilding' },
  { name: 'Maryland', slug: 'maryland', mascot: 'Terrapins', record: '3-4', tier: 'Rebuilding' },
  { name: 'Minnesota', slug: 'minnesota', mascot: 'Golden Gophers', record: '3-4', tier: 'Rebuilding' },
  { name: 'Northwestern', slug: 'northwestern', mascot: 'Wildcats', record: '3-4', tier: 'Rebuilding' },
];

// ── Standalone articles ────────────────────────────────────────────────

interface FeatureArticle {
  title: string;
  slug: string;
  description: string;
  date: string;
  readTime: string;
  badge: string;
  tags: FilterTag[];
  /** Team slugs this article covers (matches teamMetadata keys) */
  teams?: string[];
}

export type { FeatureArticle };

export const FEATURE_ARTICLES: FeatureArticle[] = [
  {
    title: 'Weekend 3 Preview: Globe Life Gets the Real Test',
    slug: 'weekend-3-preview',
    description: 'UCLA faces Tennessee. Mississippi State puts its 8-0 record on the line. Eight undefeated Top 25 teams enter the weekend — the Amegy Bank series at Globe Life tells us which ones are built for June.',
    date: 'February 25, 2026',
    readTime: '12 min',
    badge: 'Weekly Preview',
    tags: ['National', 'Weekly'],
    teams: ['ucla', 'tennessee', 'mississippi-state', 'texas', 'auburn'],
  },
  {
    title: 'What Two Weekends of College Baseball Actually Told Us',
    slug: 'what-two-weekends-told-us',
    description: 'Eight undefeated Top 25 teams. A 22-year save record broken. Two cycles in one weekend. Here is what the data says matters — and what was noise.',
    date: 'February 25, 2026',
    readTime: '12 min',
    badge: 'Analysis',
    tags: ['National'],
    teams: ['ucla', 'mississippi-state', 'texas', 'florida', 'lsu', 'tennessee', 'auburn'],
  },
  {
    title: 'Roch Cholowsky: The No. 1 Pick Through Two Weekends',
    slug: 'roch-cholowsky-2026-draft-profile',
    description: 'UCLA shortstop Roch Cholowsky hit 3 HR vs No. 7 TCU including a Game 1 grand slam. 6 HR through 7 games. Full scouting report and draft analysis.',
    date: 'February 25, 2026',
    readTime: '10 min',
    badge: 'Draft Profile',
    tags: ['National'],
    teams: ['ucla'],
  },
  {
    title: 'Liam Peterson: The Walk Problem and the No. 9 Pick',
    slug: 'liam-peterson-2026-draft-profile',
    description: 'Florida\'s ace walked 5 batters on Opening Day and didn\'t survive the fourth inning. The No. 9 overall prospect and No. 3 college arm has three Friday starts to answer the question: mechanical or mental?',
    date: 'February 25, 2026',
    readTime: '9 min',
    badge: 'Draft Profile',
    tags: ['SEC'],
    teams: ['florida'],
  },
  {
    title: 'Dylan Volantis: 14 IP. 0 ER. The Conversion Is Real.',
    slug: 'dylan-volantis-2026-draft-profile',
    description: 'Texas LHP Dylan Volantis converted from closer to Sunday starter. 14 IP, 0 ER, 17 K through two starts. SEC Freshman of the Year in 2025. Draft stock analysis.',
    date: 'February 25, 2026',
    readTime: '10 min',
    badge: 'Draft Profile',
    tags: ['SEC'],
    teams: ['texas'],
  },
  {
    title: 'Tyce Armstrong: Three Grand Slams and a 50-Year Record',
    slug: 'tyce-armstrong-2026-draft-profile',
    description: 'Baylor first baseman hit three grand slams in a single game — only the second player in NCAA D1 history to do it. 12 RBI. ESPN Player of the Week. What it means for the draft.',
    date: 'February 25, 2026',
    readTime: '8 min',
    badge: 'Draft Profile',
    tags: ['Big 12'],
    teams: ['baylor'],
  },
  {
    title: 'Jackson Flora: 100 MPH and a New Arsenal',
    slug: 'jackson-flora-2026-draft-profile',
    description: 'UCSB right-hander Jackson Flora touched 100 mph and debuted new curveball and changeup against No. 20 Southern Miss. No. 14 on MLB Pipeline. Full scouting report.',
    date: 'February 25, 2026',
    readTime: '8 min',
    badge: 'Draft Profile',
    tags: ['National'],
    teams: ['uc-santa-barbara'],
  },
  {
    title: 'Weekend 2 Recap: The No. 1 Showed Up. The Rest Got Sorted.',
    slug: 'weekend-2-recap',
    description: 'UCLA swept TCU 30-8. Two players hit for the cycle. Auburn emerged at Globe Life. The complete BSI breakdown.',
    date: 'February 24, 2026',
    readTime: '15 min',
    badge: 'Weekend 2 Recap',
    tags: ['Weekly', 'National'],
    teams: ['ucla', 'tcu', 'auburn', 'texas', 'mississippi-state', 'lsu'],
  },
  {
    title: 'Texas Week 1: 27 Runs. One Hit Allowed by Volantis.',
    slug: 'texas-week-1-recap',
    description: 'The Longhorns swept UC Davis 27-7. Volantis earned SEC honors. Now Michigan State — fresh off upsetting No. 8 Louisville — arrives for Weekend 2.',
    date: 'February 16, 2026',
    readTime: '15 min',
    badge: 'Texas Weekly',
    tags: ['SEC', 'Weekly', 'Team Preview'],
    teams: ['texas'],
  },
  {
    title: 'Week 1 Recap: Three Grand Slams. One Record Book.',
    slug: 'week-1-recap',
    description: 'Opening Weekend separated contenders from pretenders across 118 games.',
    date: 'February 16, 2026',
    readTime: '18 min',
    badge: 'Week 1 Recap',
    tags: ['Weekly', 'National'],
    teams: ['baylor', 'texas', 'ucla', 'oklahoma', 'auburn'],
  },
  {
    title: 'National Opening Weekend Preview',
    slug: 'national-opening-weekend',
    description: '118 games. 300+ programs. The college baseball season starts now.',
    date: 'February 13, 2026',
    readTime: '10 min',
    badge: 'National',
    tags: ['National', 'Weekly'],
  },
  {
    title: 'SEC Opening Weekend Preview',
    slug: 'sec-opening-weekend',
    description: '13 ranked teams. The deepest conference in America opens play.',
    date: 'February 12, 2026',
    readTime: '12 min',
    badge: 'SEC',
    tags: ['SEC', 'Conference', 'Weekly'],
  },
  {
    title: 'ACC Opening Weekend: Coast to Coast',
    slug: 'acc-opening-weekend',
    description: 'Stanford and Cal arrive. Wake Forest reloads after the CWS finals.',
    date: 'February 12, 2026',
    readTime: '8 min',
    badge: 'ACC',
    tags: ['Conference', 'Weekly'],
  },
  {
    title: 'Big 12 Opening Weekend Preview',
    slug: 'big-12-opening-weekend',
    description: 'The new-look Big 12 features 14 baseball programs and real depth.',
    date: 'February 12, 2026',
    readTime: '8 min',
    badge: 'Big 12',
    tags: ['Big 12', 'Conference', 'Weekly'],
  },
  {
    title: 'Week 1 Preview: What to Watch',
    slug: 'week-1-preview',
    description: 'The matchups, pitching duels, and storylines that matter most.',
    date: 'February 11, 2026',
    readTime: '6 min',
    badge: 'Weekly',
    tags: ['Weekly', 'National'],
  },
];

// ── Conference data ────────────────────────────────────────────────────

interface ConferenceData {
  name: string;
  tag: FilterTag;
  tagline: string;
  teams: number;
  ranked: number;
  href: string;
  accent: string;
}

const CONFERENCES: ConferenceData[] = [
  {
    name: 'SEC',
    tag: 'SEC',
    tagline: 'The Standard',
    teams: 16,
    ranked: 13,
    href: '/college-baseball/editorial/sec',
    accent: '#C9A227',
  },
  {
    name: 'Big 12',
    tag: 'Big 12',
    tagline: 'New Blood',
    teams: 14,
    ranked: 5,
    href: '/college-baseball/editorial/big-12',
    accent: 'var(--bsi-primary)',
  },
  {
    name: 'Big Ten',
    tag: 'Big Ten',
    tagline: 'Northern Rising',
    teams: 17,
    ranked: 3,
    href: '/college-baseball/editorial/big-ten',
    accent: '#6B8CAE',
  },
];

// Conference section → tag mapping
const CONFERENCE_SECTIONS: { tag: FilterTag; title: string; tagline: string; teams: TeamCard[]; accent: string; confHref: string }[] = [
  { tag: 'SEC', title: 'SEC', tagline: 'The Standard', teams: SEC_TEAMS, accent: '#C9A227', confHref: '/college-baseball/editorial/sec' },
  { tag: 'Big 12', title: 'Big 12', tagline: 'New Blood', teams: BIG12_TEAMS, accent: 'var(--bsi-primary)', confHref: '/college-baseball/editorial/big-12' },
  { tag: 'Big Ten', title: 'Big Ten', tagline: 'Northern Rising', teams: BIGTEN_TEAMS, accent: '#6B8CAE', confHref: '/college-baseball/editorial/big-ten' },
];

// ── Filter bar ─────────────────────────────────────────────────────────

function TagFilterBar({ activeTag, onTagChange }: { activeTag: FilterTag; onTagChange: (tag: FilterTag) => void }) {
  return (
    <Section padding="sm" className="border-b border-border sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-sm">
      <Container>
        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1" aria-label="Filter articles by tag">
          {FILTER_TAGS.map((tag) => {
            const isActive = tag === activeTag;
            return (
              <button
                key={tag}
                onClick={() => onTagChange(tag)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider
                  border transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/40'
                    : 'bg-surface-light text-text-muted border-border hover:text-text-tertiary hover:border-border-subtle'
                  }
                `}
                aria-pressed={isActive}
              >
                {tag}
              </button>
            );
          })}
        </nav>
      </Container>
    </Section>
  );
}

// ── Card components ────────────────────────────────────────────────────

function TeamPreviewCard({ team }: { team: TeamCard }) {
  return (
    <Link href={`/college-baseball/editorial/${team.slug}-2026`} className="block group">
      <div className="bg-surface-light border border-border-subtle rounded-lg p-4 hover:border-burnt-orange/40 hover:bg-surface-medium transition-all h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors truncate">
              {team.name}
            </h4>
            <p className="text-text-muted text-xs">{team.mascot}</p>
          </div>
          <TierBadge tier={team.tier} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-text-muted text-xs font-mono">{team.record}</span>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-text-muted group-hover:text-burnt-orange/60 transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function ConferenceSection({
  title,
  tagline,
  teams,
  accent,
  confHref,
}: {
  title: string;
  tagline: string;
  teams: TeamCard[];
  accent: string;
  confHref: string;
}) {
  return (
    <Section padding="lg" borderTop>
      <Container>
        <ScrollReveal direction="up">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: accent }} />
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                  {title}
                </h2>
              </div>
              <p className="text-text-muted text-sm ml-4 pl-3">{tagline} — {teams.length} team previews</p>
            </div>
            <Link href={confHref} className="hidden md:flex items-center gap-1.5 text-sm font-semibold hover:text-ember transition-colors" style={{ color: accent }}>
              Full {title} Preview
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {teams.map((team, i) => (
            <ScrollReveal key={team.slug} direction="up" delay={Math.min(i * 30, 300)}>
              <TeamPreviewCard team={team} />
            </ScrollReveal>
          ))}
        </div>
        <div className="mt-6 md:hidden">
          <Link href={confHref}>
            <Button variant="secondary" size="sm">Full {title} Preview →</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

// ── Daily Digest Section ─────────────────────────────────────────────

function DailyDigestSection() {
  const { data, loading } = useSportData<EditorialListResponse>(
    '/api/college-baseball/editorial/list'
  );

  const editorials = data?.editorials ?? [];

  // Don't render this section if there are no digests and we're done loading
  if (!loading && editorials.length === 0) return null;

  return (
    <Section padding="md" borderTop>
      <Container>
        <ScrollReveal direction="up">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 rounded-full bg-ember" />
                <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-text-primary">
                  Daily AI Digest
                </h2>
              </div>
              <p className="text-text-muted text-sm ml-4 pl-3">
                AI-generated analysis from BSI's editorial pipeline
              </p>
            </div>
          </div>
        </ScrollReveal>

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-light border border-border-subtle rounded-lg p-5 animate-pulse">
                <div className="h-3 bg-surface-light rounded w-24 mb-3" />
                <div className="h-5 bg-surface-light rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-light rounded w-full" />
                <div className="h-3 bg-surface-light rounded w-5/6 mt-1" />
              </div>
            ))}
          </div>
        )}

        {!loading && editorials.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editorials.slice(0, 5).map((editorial, i) => (
              <ScrollReveal key={editorial.id} direction="up" delay={i * 60}>
                <Link
                  href={`/college-baseball/editorial/daily/${editorial.date}`}
                  className="block group"
                >
                  <Card variant="default" padding="md" className="h-full hover:border-ember/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">AI Digest</Badge>
                      <span className="text-text-muted text-xs">
                        {new Date(editorial.date + 'T12:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {editorial.wordCount > 0 && (
                        <span className="text-text-muted text-xs">
                          {Math.ceil(editorial.wordCount / 250)} min
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-ember transition-colors mb-1.5">
                      {editorial.title}
                    </h3>
                    {editorial.preview && (
                      <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                        {editorial.preview}
                      </p>
                    )}
                    {editorial.teams.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {editorial.teams.slice(0, 3).map((team) => (
                          <span
                            key={team}
                            className="text-[10px] text-text-muted bg-surface-light px-1.5 py-0.5 rounded"
                          >
                            {team}
                          </span>
                        ))}
                        {editorial.teams.length > 3 && (
                          <span className="text-[10px] text-text-muted">
                            +{editorial.teams.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function EditorialHubPage() {
  const [activeTag, setActiveTag] = useState<FilterTag>('All');

  // Filter feature articles by tag
  const filteredArticles = activeTag === 'All'
    ? FEATURE_ARTICLES
    : FEATURE_ARTICLES.filter((a) => a.tags.includes(activeTag));

  const featured = filteredArticles[0] ?? null;
  const remainingArticles = filteredArticles.slice(featured ? 1 : 0);

  // Filter conference preview cards
  const filteredConferences = activeTag === 'All' || activeTag === 'Conference'
    ? CONFERENCES
    : CONFERENCES.filter((c) => c.tag === activeTag);

  // Filter conference team sections
  // 'Team Preview' shows all conference team grids; conference tags show their own; 'All' shows all
  const filteredSections = activeTag === 'All' || activeTag === 'Team Preview'
    ? CONFERENCE_SECTIONS
    : CONFERENCE_SECTIONS.filter((s) => s.tag === activeTag);

  // Determine which top-level sections are visible
  const showConferenceCards = activeTag === 'All' || activeTag === 'Conference' || activeTag === 'SEC' || activeTag === 'Big 12' || activeTag === 'Big Ten';
  const showFeatureArticles = filteredArticles.length > 0;
  const showTeamSections = activeTag === 'All' || activeTag === 'Team Preview' || activeTag === 'SEC' || activeTag === 'Big 12' || activeTag === 'Big Ten';

  // Empty state
  const nothingToShow = !showFeatureArticles && !showConferenceCards && !showTeamSections;

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Editorial</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/8 via-transparent to-[#C9A227]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mb-8">
                <Badge variant="primary" className="mb-4">2026 Season</Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-4">
                  College Baseball{' '}
                  <span className="text-gradient-blaze">Editorial</span>
                </h1>
                <p className="text-text-tertiary text-lg leading-relaxed">
                  47 team season previews. 3 conference breakdowns. Scouting grades on the 20-80 scale.
                  Projection tiers from Omaha Favorite to Rebuilding. The depth this sport has always deserved.
                </p>
              </div>
            </ScrollReveal>

            {/* Featured Article (only when we have articles to show) */}
            {featured && (
              <ScrollReveal direction="up" delay={100}>
                <Link href={`/college-baseball/editorial/${featured.slug}`} className="block group">
                  <div className="relative bg-gradient-to-r from-burnt-orange/15 to-[#C9A227]/10 border border-burnt-orange/25 rounded-xl p-6 md:p-8 hover:border-burnt-orange/50 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-[#C9A227]/10 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary">{featured.badge}</Badge>
                        <span className="text-text-muted text-sm">{featured.date}</span>
                        <span className="text-text-muted text-sm">{featured.readTime}</span>
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors mb-2">
                        {featured.title}
                      </h2>
                      <p className="text-text-tertiary max-w-xl">{featured.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-burnt-orange text-sm font-semibold group-hover:text-ember transition-colors">
                        Read article
                        <svg viewBox="0 0 24 24" className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            )}
          </Container>
        </Section>

        {/* Daily AI Digest — fetches from /api/college-baseball/editorial/list */}
        <DailyDigestSection />

        {/* Weekly Recaps — static editorial pages */}
        {(activeTag === 'All' || activeTag === 'Weekly' || activeTag === 'National') && (
          <Section padding="md" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                      <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-text-primary">
                        Weekly Recaps
                      </h2>
                    </div>
                    <p className="text-text-muted text-sm ml-4 pl-3">
                      National-scope breakdowns of each weekend&apos;s results, rankings movement, and matchups to watch
                    </p>
                  </div>
                </div>
              </ScrollReveal>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ScrollReveal direction="up" delay={0}>
                  <Link href="/college-baseball/editorial/weekend-2-recap" className="block group">
                    <Card variant="default" padding="md" className="h-full hover:border-burnt-orange/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="primary">Weekend 2</Badge>
                        <span className="text-text-muted text-xs">Feb 24, 2026</span>
                        <span className="text-text-muted text-xs">15 min</span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors mb-1.5">
                        The No. 1 Showed Up. The Rest Got Sorted.
                      </h3>
                      <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                        UCLA swept TCU 30-8. Two cycles hit. Auburn announced itself at Globe Life. Plus Weekend 3 preview.
                      </p>
                    </Card>
                  </Link>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={60}>
                  <Link href="/college-baseball/editorial/week-1-recap" className="block group">
                    <Card variant="default" padding="md" className="h-full hover:border-burnt-orange/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="primary">Week 1</Badge>
                        <span className="text-text-muted text-xs">Feb 16, 2026</span>
                        <span className="text-text-muted text-xs">18 min</span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors mb-1.5">
                        Three Grand Slams. One Record Book. The Season Starts Now.
                      </h3>
                      <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                        Tyce Armstrong ties a 50-year record. Michigan State stuns Louisville. Oklahoma storms the Shriners.
                      </p>
                    </Card>
                  </Link>
                </ScrollReveal>
              </div>
            </Container>
          </Section>
        )}

        {/* Tag Filter Bar */}
        <TagFilterBar activeTag={activeTag} onTagChange={setActiveTag} />

        {/* Conference Preview Cards */}
        {showConferenceCards && filteredConferences.length > 0 && (
          <Section padding="md">
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-tertiary mb-6">
                  Conference Previews
                </h2>
              </ScrollReveal>
              <div className="grid md:grid-cols-3 gap-4">
                {filteredConferences.map((conf, i) => (
                  <ScrollReveal key={conf.name} direction="up" delay={i * 80}>
                    <Link href={conf.href} className="block group">
                      <Card variant="default" padding="lg" className="h-full hover:border-border-strong transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg" style={{ backgroundColor: conf.accent }} />
                        <div className="mt-2">
                          <h3 className="font-display text-xl font-bold uppercase tracking-wide group-hover:transition-colors" style={{ color: conf.accent }}>
                            {conf.name}
                          </h3>
                          <p className="text-text-muted text-sm mt-1 italic">{conf.tagline}</p>
                          <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
                            <span>{conf.teams} teams</span>
                            <span>{conf.ranked} ranked</span>
                          </div>
                          <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold group-hover:translate-x-1 transition-transform" style={{ color: conf.accent }}>
                            Explore
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Feature Articles */}
        {remainingArticles.length > 0 && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-tertiary mb-6">
                  Feature Articles
                </h2>
              </ScrollReveal>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {remainingArticles.map((article, i) => (
                  <ScrollReveal key={article.slug} direction="up" delay={i * 60}>
                    <Link href={`/college-baseball/editorial/${article.slug}`} className="block group">
                      <Card variant="default" padding="md" className="h-full hover:border-burnt-orange/30 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{article.badge}</Badge>
                          <span className="text-text-muted text-xs">{article.readTime}</span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors mb-1.5">
                          {article.title}
                        </h3>
                        <p className="text-text-muted text-xs leading-relaxed">{article.description}</p>
                        <p className="text-text-muted text-[10px] mt-3">{article.date}</p>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Team Previews by Conference */}
        {showTeamSections && filteredSections.map((section) => (
          <ConferenceSection
            key={section.tag}
            title={section.title}
            tagline={section.tagline}
            teams={section.teams}
            accent={section.accent}
            confHref={section.confHref}
          />
        ))}

        {/* Empty state when filter matches nothing */}
        {nothingToShow && (
          <Section padding="lg">
            <Container>
              <div className="text-center py-12">
                <p className="text-text-muted text-sm">No editorial content matches this filter yet.</p>
                <button
                  onClick={() => setActiveTag('All')}
                  className="mt-4 text-burnt-orange hover:text-ember text-sm font-semibold transition-colors"
                >
                  Clear filter
                </button>
              </div>
            </Container>
          </Section>
        )}

        {/* Stats Band */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="font-display text-3xl font-bold text-burnt-orange">47</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Team Previews</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-burnt-orange">3</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Conferences</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-[#C9A227]">20-80</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Scouting Scale</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-burnt-orange">15</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Feature Articles</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Email Capture */}
        <Section padding="md" borderTop>
          <Container>
            <div className="max-w-md mx-auto">
              <IntelSignup sport="college_baseball" />
            </div>
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="sm" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-text-muted text-xs">
                Data: ESPN / SportsDataIO / D1Baseball — February 2026
              </p>
              <Link href="/college-baseball" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                ← Back to College Baseball
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
