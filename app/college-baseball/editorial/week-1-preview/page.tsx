import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const topMatchups = [
  { away: 'UC Davis', home: 'No. 3 Texas', date: 'Feb 13–15', network: 'SEC Network+', why: 'Schlossnagle debuts a portal-loaded roster. Riojas on Friday, Harrison on Saturday, Volantis on Sunday. The Longhorns are built to win it all — this is the first data point.' },
  { away: 'Indiana State', home: 'No. 1 Texas A&M', date: 'Feb 14–16', network: 'SEC Network', why: 'The defending national champions open at Blue Bell Park. Can Schlottman pick up where he left off in Omaha? The most talent-rich roster in America takes the field.' },
  { away: 'Grambling', home: 'No. 2 LSU', date: 'Feb 14–16', network: 'SEC Network+', why: 'Alex Box Stadium on a Friday night in February is already electric. Johnson on the bump. The Tigers have Omaha tattooed on their eyelids.' },
  { away: 'William & Mary', home: 'No. 4 Wake Forest', date: 'Feb 14–16', network: 'ACC Network', why: 'One game from a national title last year. Bennett, Wilken, and Hartle return. The Deacs open as the ACC favorite and the second-best team in the country.' },
  { away: 'Stetson', home: 'No. 5 Florida', date: 'Feb 14–16', network: 'SEC Network+', why: 'Sullivan is the truth. The Gators have the pitching to compete with anyone in the country and Gainesville is already dreaming about June.' },
  { away: 'San Jose State', home: 'No. 9 Stanford', date: 'Feb 14–16', network: 'ACC Network Extra', why: 'The Cardinal open their ACC era at home. Montgomery and Dowd carry the offense. Esquer has Omaha talent — can it translate in a new conference?' },
];

const pitchingDuels = [
  { starter: 'Ruger Riojas (Texas)', opponent: 'Noel Valdez (UC Davis)', day: 'Friday, Feb 13', note: 'Riojas takes the Friday mantle for the Longhorns. Slider-fastball combo, mid-90s. UC Davis counters with Valdez — a crafty lefty with command.' },
  { starter: 'Josh Hartle (Wake Forest)', opponent: 'TBD (William & Mary)', day: 'Friday, Feb 14', note: 'Hartle is a projected top-10 draft pick. Electric stuff, 97 mph heater. The best Friday night arm in the ACC.' },
  { starter: 'Jac Caglianone (Florida)', opponent: 'TBD (Stetson)', day: 'Friday, Feb 14', note: 'Two-way star. Throws 100 and hits it 450. The most dynamic player in college baseball opens his junior season.' },
];

const storylines = [
  { title: 'Transfer Portal Report Cards', description: 'Texas (Robbins, Becerra, Tinney), A&M (selective retention), LSU (ACC poaching), Wake Forest (targeted additions). Opening weekend is the first live look at whether portal rosters have chemistry or just talent.' },
  { title: 'The SEC Gauntlet Begins', description: '13 ranked teams in one conference. The depth is unprecedented. Opening weekend sets the tone — which programs are ready for the grind and which ones need time to gel.' },
  { title: 'ACC Realignment, Day One', description: 'Stanford and Cal play their first ACC games. Coast-to-coast conference play begins. The travel, the competition, the culture shock — it all starts this weekend.' },
  { title: 'Freshman Impact Players', description: 'Every February reveals the freshmen who are ready. Watch the lineup cards carefully — the programs trusting true freshmen in opening weekend are the ones who believe they have special talent.' },
];

export default function Week1PreviewPage() {
  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/college-baseball/editorial" className="text-white/40 hover:text-burnt-orange transition-colors">
                Editorial
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white">Week 1 Preview</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-ember/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Weekly Preview</Badge>
                  <span className="text-white/40 text-sm">February 11, 2026</span>
                  <span className="text-white/40 text-sm">6 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  Week 1:{' '}
                  <span className="text-gradient-blaze">What to Watch</span>
                </h1>
                <p className="font-serif text-xl text-white/50 leading-relaxed">
                  The matchups, pitching duels, and storylines that matter most as 300+ programs open the 2026 college baseball season.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Top Matchups */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Six Series to Watch
              </h2>
            </ScrollReveal>
            <div className="space-y-4">
              {topMatchups.map((m, i) => (
                <ScrollReveal key={m.home} direction="up" delay={Math.min(i * 50, 250)}>
                  <Card variant="default" padding="md">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-white">{m.away} at {m.home}</span>
                      <span className="font-mono text-[10px] text-white/30">{m.date}</span>
                      <Badge variant="outline">{m.network}</Badge>
                    </div>
                    <p className="font-serif text-sm text-white/60 leading-relaxed">{m.why}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Pitching Duels */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Pitching Duels
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-4">
              {pitchingDuels.map((d, i) => (
                <ScrollReveal key={d.starter} direction="up" delay={i * 80}>
                  <Card variant="default" padding="md" className="h-full">
                    <div className="font-display text-xs uppercase tracking-wider text-burnt-orange mb-2">{d.day}</div>
                    <div className="font-display text-sm font-bold uppercase tracking-wide text-white mb-1">{d.starter}</div>
                    <div className="font-mono text-[10px] text-white/30 mb-3">vs {d.opponent}</div>
                    <p className="font-serif text-sm text-white/50 leading-relaxed">{d.note}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Storylines */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                The Storylines
              </h2>
            </ScrollReveal>
            <div className="space-y-8">
              {storylines.map((s, i) => (
                <ScrollReveal key={s.title} direction="up" delay={i * 60}>
                  <div className="border-l-[3px] border-burnt-orange/40 pl-6">
                    <h3 className="font-display text-lg font-medium uppercase tracking-wide text-white mb-2">{s.title}</h3>
                    <p className="font-serif text-base text-white/60 leading-relaxed">{s.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="md" className="border-t border-burnt-orange/10">
          <Container size="narrow">
            <div className="space-y-4">
              <DataSourceBadge source="D1Baseball / ESPN / BSI Projections" timestamp="February 11, 2026 CT" />
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
