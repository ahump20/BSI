import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'College Baseball Editorial | Blaze Sports Intel',
  description: 'In-depth analysis, season previews, and editorial coverage of college baseball from Blaze Sports Intel.',
};

const editorialContent = [
  {
    title: 'Texas Longhorns: Reloading for Title Defense',
    slug: 'texas-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'The defending national champions return core pieces and add portal talent. Can they repeat?',
  },
  {
    title: 'Texas A&M Aggies: Building on Success',
    slug: 'texas-am-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Jim Schlossnagle has the Aggies primed for another deep postseason run.',
  },
  {
    title: 'Arkansas Razorbacks: Pitching-First Approach',
    slug: 'arkansas-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Dave Van Horn\'s squad returns elite arms and aims to dominate the SEC West.',
  },
  {
    title: 'Florida Gators: New Era, High Expectations',
    slug: 'florida-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Kevin O\'Sullivan has Florida reloaded with talent across the diamond.',
  },
  {
    title: 'LSU Tigers: Death Valley Dominance',
    slug: 'lsu-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Jay Johnson\'s Tigers return power hitters and a deep pitching staff.',
  },
  {
    title: 'Tennessee Volunteers: Omaha or Bust',
    slug: 'tennessee-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Tony Vitello has built a juggernaut in Knoxville with championship aspirations.',
  },
  {
    title: 'Vanderbilt Commodores: Return to Prominence',
    slug: 'vanderbilt-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Tim Corbin\'s squad looks to reclaim its place among the elite.',
  },
  {
    title: 'Georgia Bulldogs: Building Momentum',
    slug: 'georgia-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Wes Johnson has Georgia trending upward with a balanced roster.',
  },
  {
    title: 'Missouri Tigers: Contenders in the SEC',
    slug: 'missouri-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Kerrick Jackson\'s Tigers return key pieces and add portal talent.',
  },
  {
    title: 'Alabama Crimson Tide: Competitive Edge',
    slug: 'alabama-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Rob Vaughn brings a competitive roster to Tuscaloosa.',
  },
  {
    title: 'Auburn Tigers: Playoff Push',
    slug: 'auburn-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Butch Thompson\'s squad aims for a deep postseason run.',
  },
  {
    title: 'Kentucky Wildcats: Pitching Depth',
    slug: 'kentucky-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Nick Mingione returns quality arms and experienced bats.',
  },
  {
    title: 'Mississippi State Bulldogs: Defensive Foundation',
    slug: 'mississippi-state-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Chris Lemonis builds around elite defense and pitching.',
  },
  {
    title: 'Oklahoma Sooners: SEC Debut',
    slug: 'oklahoma-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Skip Johnson brings a loaded roster to the SEC in year one.',
  },
  {
    title: 'Ole Miss Rebels: Explosive Offense',
    slug: 'ole-miss-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Mike Bianco\'s squad returns power and speed in the lineup.',
  },
  {
    title: 'South Carolina Gamecocks: Tournament Bound',
    slug: 'south-carolina-2026',
    date: 'Feb 13, 2026',
    category: 'Season Preview',
    excerpt: 'Mark Kingston has the Gamecocks positioned for postseason play.',
  },
];

export default function EditorialIndexPage() {
  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white">Editorial</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/10 via-transparent to-[#BF5700]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <Badge variant="primary" className="mb-4">Editorial</Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  College Baseball <span className="text-gradient-blaze">Editorial</span>
                </h1>
                <p className="text-white/60 text-lg md:text-xl leading-relaxed">
                  In-depth analysis, season previews, and expert coverage of college baseball.
                  From SEC powerhouses to under-the-radar programs, we cover what matters.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Editorial Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-8 text-white">
                Latest Editorial
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editorialContent.map((article, index) => (
                <ScrollReveal key={article.slug} direction="up" delay={index * 50}>
                  <Link href={`/college-baseball/editorial/${article.slug}`}>
                    <Card variant="default" padding="lg" className="hover:border-[#BF5700]/50 transition-colors h-full">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary">{article.category}</Badge>
                        <span className="text-white/40 text-xs">{article.date}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">
                        {article.title}
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {article.excerpt}
                      </p>
                      <div className="mt-4 text-[#BF5700] text-sm font-medium">
                        Read More →
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Back to College Baseball */}
        <Section padding="md" borderTop>
          <Container>
            <Link href="/college-baseball" className="text-sm text-white/40 hover:text-[#BF5700] transition-colors">
              ← Back to College Baseball
            </Link>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
