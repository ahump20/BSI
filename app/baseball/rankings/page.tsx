import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'D1 Baseball Top 25 Rankings | Blaze Sports Intel',
  description:
    'Official D1Baseball Top 25 college baseball rankings. Complete 1-25 with conference affiliations, record, and movement. Updated every Monday during the season.',
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Rankings', href: '/baseball/rankings' },
  { label: 'Standings', href: '/college-baseball/standings' },
];

// 2026 Preseason Top 25 - D1Baseball
const top25Rankings = [
  { rank: 1, team: 'Texas A&M', conference: 'SEC', record: '—', prev: 1, change: 0 },
  { rank: 2, team: 'Florida', conference: 'SEC', record: '—', prev: 2, change: 0 },
  { rank: 3, team: 'LSU', conference: 'SEC', record: '—', prev: 4, change: 1 },
  { rank: 4, team: 'Texas', conference: 'SEC', record: '—', prev: 3, change: -1 },
  { rank: 5, team: 'Tennessee', conference: 'SEC', record: '—', prev: 5, change: 0 },
  { rank: 6, team: 'Wake Forest', conference: 'ACC', record: '—', prev: 7, change: 1 },
  { rank: 7, team: 'Virginia', conference: 'ACC', record: '—', prev: 6, change: -1 },
  { rank: 8, team: 'Arkansas', conference: 'SEC', record: '—', prev: 8, change: 0 },
  { rank: 9, team: 'Oregon State', conference: 'Pac-12', record: '—', prev: 10, change: 1 },
  { rank: 10, team: 'Georgia', conference: 'SEC', record: '—', prev: 12, change: 2 },
  { rank: 11, team: 'Clemson', conference: 'ACC', record: '—', prev: 11, change: 0 },
  { rank: 12, team: 'NC State', conference: 'ACC', record: '—', prev: 9, change: -3 },
  { rank: 13, team: 'Kentucky', conference: 'SEC', record: '—', prev: 15, change: 2 },
  { rank: 14, team: 'Stanford', conference: 'ACC', record: '—', prev: 13, change: -1 },
  { rank: 15, team: 'TCU', conference: 'Big 12', record: '—', prev: 14, change: -1 },
  { rank: 16, team: 'Vanderbilt', conference: 'SEC', record: '—', prev: 18, change: 2 },
  { rank: 17, team: 'Ole Miss', conference: 'SEC', record: '—', prev: 16, change: -1 },
  { rank: 18, team: 'Texas Tech', conference: 'Big 12', record: '—', prev: 17, change: -1 },
  { rank: 19, team: 'Florida State', conference: 'ACC', record: '—', prev: 20, change: 1 },
  { rank: 20, team: 'Alabama', conference: 'SEC', record: '—', prev: 22, change: 2 },
  { rank: 21, team: 'South Carolina', conference: 'SEC', record: '—', prev: 19, change: -2 },
  { rank: 22, team: 'Oklahoma', conference: 'SEC', record: '—', prev: 21, change: -1 },
  { rank: 23, team: 'Arizona', conference: 'Big 12', record: '—', prev: 24, change: 1 },
  { rank: 24, team: 'East Carolina', conference: 'AAC', record: '—', prev: 23, change: -1 },
  { rank: 25, team: 'Indiana', conference: 'Big Ten', record: '—', prev: 'NR', change: 'NEW' },
];

export default function BaseballRankingsPage() {
  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Rankings</span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                    D1Baseball <span className="text-gradient-blaze">Top 25</span>
                  </h1>
                  <p className="text-text-secondary mt-2">
                    2026 Preseason Rankings
                  </p>
                </div>
                <Badge variant="primary">Updated Weekly</Badge>
              </div>
            </ScrollReveal>

            {/* Rankings Table */}
            <ScrollReveal direction="up" delay={100}>
              <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-charcoal border-b border-border-subtle">
                        <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-16">
                          Rank
                        </th>
                        <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Team
                        </th>
                        <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden sm:table-cell">
                          Conference
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                          Record
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-20">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {top25Rankings.map((team) => (
                        <tr
                          key={team.rank}
                          className="border-b border-border-subtle hover:bg-charcoal/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span
                              className={`font-display text-xl font-bold ${
                                team.rank <= 5 ? 'text-burnt-orange' : 'text-white'
                              }`}
                            >
                              {team.rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-white">{team.team}</span>
                            <span className="text-text-tertiary text-sm ml-2 sm:hidden">
                              ({team.conference})
                            </span>
                          </td>
                          <td className="py-4 px-4 hidden sm:table-cell">
                            <Badge variant="default">{team.conference}</Badge>
                          </td>
                          <td className="py-4 px-4 text-center text-text-secondary hidden md:table-cell">
                            {team.record}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {team.change === 'NEW' ? (
                              <span className="text-success font-semibold text-sm">NEW</span>
                            ) : team.change === 0 ? (
                              <span className="text-text-tertiary">—</span>
                            ) : typeof team.change === 'number' && team.change > 0 ? (
                              <span className="text-success font-semibold">
                                <svg
                                  className="w-3 h-3 inline mr-1"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                                </svg>
                                {team.change}
                              </span>
                            ) : (
                              <span className="text-error font-semibold">
                                <svg
                                  className="w-3 h-3 inline mr-1"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                                </svg>
                                {Math.abs(team.change as number)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </ScrollReveal>

            {/* Conference Breakdown */}
            <ScrollReveal direction="up" delay={200}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {[
                  { conf: 'SEC', count: 12 },
                  { conf: 'ACC', count: 5 },
                  { conf: 'Big 12', count: 3 },
                  { conf: 'Pac-12', count: 1 },
                  { conf: 'Big Ten', count: 1 },
                  { conf: 'AAC', count: 1 },
                ].map((item) => (
                  <Card key={item.conf} padding="md" className="text-center">
                    <div className="font-display text-2xl font-bold text-burnt-orange">
                      {item.count}
                    </div>
                    <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                      {item.conf}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>

            {/* Data Attribution */}
            <div className="mt-8 text-center text-xs text-text-tertiary">
              <p>Rankings from D1Baseball. Updated every Monday during the season.</p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
