import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const byTheNumbers = [
  { label: 'Games', value: '118+', helper: 'Opening weekend' },
  { label: 'Programs', value: '300+', helper: 'D1 baseball' },
  { label: 'Ranked Matchups', value: '14', helper: 'Top-25 in action' },
  { label: 'Conference Openers', value: '6', helper: 'SEC, ACC, Big 12, Big Ten, Pac-12, AAC' },
];

const topSeries = [
  { matchup: 'UC Davis at No. 3 Texas', conf: 'SEC', capsule: 'Schlossnagle debuts a portal-loaded roster. Robbins (Notre Dame), Becerra (Stanford), Tinney. Riojas gets the Friday start in front of 7,600 at Disch-Falk.' },
  { matchup: 'Indiana State at No. 1 Texas A&M', conf: 'SEC', capsule: 'The defending national champions. Schlottman anchors the rotation. Blue Bell Park opens with a program that knows what Omaha feels like.' },
  { matchup: 'Grambling at No. 2 LSU', conf: 'SEC', capsule: 'Friday night in the Box. Johnson on the mound. 10,000+ expected. This is what college baseball sounds like at its loudest.' },
  { matchup: 'William & Mary at No. 4 Wake Forest', conf: 'ACC', capsule: 'One game from a title. Hartle is a projected top-10 pick. The Deacs reload and open as the ACC favorite.' },
  { matchup: 'Stetson at No. 5 Florida', conf: 'SEC', capsule: 'Sullivan and Caglianone. The two-way star is back and the pitching staff is elite. Gainesville is dreaming big.' },
  { matchup: 'San Jose State at No. 9 Stanford', conf: 'ACC', capsule: 'ACC debut. Montgomery and Dowd carry the offense. The cross-country conference experiment begins.' },
];

const confPreviews = [
  { name: 'SEC', ranked: 13, teams: 16, note: 'The deepest conference in America. 13 ranked teams. Four in the top five.', href: '/college-baseball/editorial/sec-opening-weekend', accent: '#C9A227' },
  { name: 'ACC', ranked: 5, teams: 15, note: 'Stanford and Cal arrive. Wake Forest reloads. Five teams in the top 20.', href: '/college-baseball/editorial/acc-opening-weekend', accent: 'var(--bsi-accent)' },
  { name: 'Big 12', ranked: 5, teams: 14, note: 'TCU leads the way. Kansas is a dark horse. The new Big 12 has real depth.', href: '/college-baseball/editorial/big-12-opening-weekend', accent: 'var(--bsi-primary)' },
  { name: 'Big Ten', ranked: 3, teams: 17, note: 'UCLA is an Omaha favorite. Oregon and USC add punch. The conference is rising.', href: '/college-baseball/editorial/big-ten', accent: '#6B8CAE' },
];

export default function NationalOpeningWeekendPage() {
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
              <Link href="/college-baseball/editorial" className="text-text-muted hover:text-burnt-orange transition-colors">
                Editorial
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">National Opening Weekend</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-[#C9A227]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">National Preview</Badge>
                  <span className="text-text-muted text-sm">February 13, 2026</span>
                  <span className="text-text-muted text-sm">10 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  National Opening Weekend:{' '}
                  <span className="text-gradient-blaze">The Season Starts Now</span>
                </h1>
                <p className="font-serif text-xl text-text-tertiary leading-relaxed">
                  118 games. 300+ programs. The college baseball season opens with 14 ranked teams in action and storylines that will define the road to Omaha.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* By the Numbers */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {byTheNumbers.map((s) => (
                  <StatCard key={s.label} label={s.label} value={s.value} helperText={s.helper} />
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Lede */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Every pitch thrown this weekend is the first sentence of a story that won&rsquo;t end until June in Omaha. Some of those stories will be predictable — Texas A&amp;M defending a title, LSU being LSU, Wake Forest reloading after a CWS finals run. Others will surprise. A freshman arm nobody saw coming. A transfer who transforms a lineup. A mid-major that announces itself against a ranked opponent.
                </p>
                <p>
                  That&rsquo;s what makes opening weekend the best weekend on the calendar. Everything is possible. Nothing is decided. And for the first time since last June, the sport is live.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Top Series */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Must-Watch Series
              </h2>
            </ScrollReveal>
            <div className="space-y-4">
              {topSeries.map((s, i) => (
                <ScrollReveal key={s.matchup} direction="up" delay={Math.min(i * 50, 250)}>
                  <Card variant="default" padding="md">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-text-primary">{s.matchup}</span>
                      <Badge variant="outline">{s.conf}</Badge>
                    </div>
                    <p className="font-serif text-sm text-text-tertiary leading-relaxed">{s.capsule}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Conference Previews */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Conference by Conference
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              {confPreviews.map((c, i) => (
                <ScrollReveal key={c.name} direction="up" delay={i * 60}>
                  <Link href={c.href} className="block group">
                    <Card variant="default" padding="md" className="h-full hover:border-border-strong transition-all relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: c.accent }} />
                      <div className="mt-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-display text-lg font-bold uppercase tracking-wide group-hover:transition-colors" style={{ color: c.accent }}>
                            {c.name}
                          </h3>
                          <div className="flex gap-3 text-xs text-text-muted">
                            <span>{c.ranked} ranked</span>
                            <span>{c.teams} teams</span>
                          </div>
                        </div>
                        <p className="font-serif text-sm text-text-tertiary leading-relaxed">{c.note}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold group-hover:translate-x-1 transition-transform" style={{ color: c.accent }}>
                          Full Preview &rarr;
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* BSI Verdict */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-midnight text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    The preseason polls are noise. The portal grades are projections. The rotation depth charts are guesses. Opening weekend is where all of it meets reality — and reality has a way of rewriting every narrative in the sport.
                  </p>
                  <p>
                    Watch the Friday starters. Watch the nine-hole hitters. Watch the bullpens. The teams that win opening weekend with all three clicking are the ones that will still be playing in June. And the ones that don&rsquo;t? The season is 56 games long. There&rsquo;s time. But the clock starts now.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="md" className="border-t border-burnt-orange/10">
          <Container size="narrow">
            <div className="space-y-4">
              <DataSourceBadge source="D1Baseball / ESPN / BSI Projections" timestamp="February 13, 2026 CT" />
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  All Editorial &rarr;
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
