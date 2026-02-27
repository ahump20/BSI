import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const big12Matchups = [
  { away: 'Dallas Baptist', at: 'No. 11 TCU', date: 'Feb 14–16', capsule: 'The Horned Frogs are the Big 12 favorite. Pitching depth is elite, the lineup is balanced, and the Fort Worth faithful will be out in force. Kirk Saarloos has this program humming.', watch: 'Friday starter depth' },
  { away: 'Omaha', at: 'No. 17 Kansas', date: 'Feb 14–16', capsule: 'The Jayhawks are a legitimate dark horse for Omaha. Ritch Price has built something real in Lawrence and the roster is deep enough to compete in a loaded Big 12.', watch: 'Kansas as a national contender' },
  { away: 'Cal Poly', at: 'No. 18 Oklahoma State', date: 'Feb 14–16', capsule: 'Josh Holliday has the Cowboys reloaded. Stillwater is a tough place to play and the pitching staff has arms that miss bats.', watch: 'Bullpen depth' },
  { away: 'Grand Canyon', at: 'Arizona', date: 'Feb 14–16', capsule: 'The Wildcats are in the dark horse conversation. Chip Hale has the program trending and the talent is there for a regional host.', watch: 'Power in the lineup' },
  { away: 'UTRGV', at: 'Arizona State', date: 'Feb 14–16', capsule: 'The Sun Devils have pieces. Willie Bloomquist is building steadily in Tempe. A breakout season is possible if the pitching develops.', watch: 'Sophomore class' },
  { away: 'Lamar', at: 'Houston', date: 'Feb 14–16', capsule: 'The Cougars are building in the Big 12 era. Todd Whitting has the program competitive but the conference is unforgiving.', watch: 'Big 12 adjustment, year two' },
];

const storylines = [
  { title: 'TCU Sets the Standard', description: 'The Horned Frogs are the preseason favorite and it is not particularly close. Kirk Saarloos has elite pitching, a deep lineup, and a program that knows what Omaha looks like. The Big 12 runs through Fort Worth until someone proves otherwise.' },
  { title: 'Kansas Is for Real', description: 'This is not a typo. The Jayhawks are ranked and they deserve it. Ritch Price has quietly built one of the most competitive programs in the conference and the 2026 roster has the depth to make a regional — or more.' },
  { title: 'The 14-Team Experiment', description: 'The Big 12 has 14 baseball programs now, a mix of traditional powers (TCU, Oklahoma State), rising programs (Kansas, Arizona), and rebuilding projects (Utah, Kansas State). The conference tournament will be chaotic and the regular season race is wide open.' },
  { title: 'Post-Realignment Identity', description: 'With Texas and Oklahoma gone to the SEC, the Big 12 is finding its identity. TCU has stepped into the flagship role. Arizona and Arizona State bring Pac-12 pedigree. The conference is different but it is not weaker — it is deeper.' },
];

export default function Big12OpeningWeekendPage() {
  return (
    <>
      <div>
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
              <span className="text-text-primary">Big 12 Opening Weekend</span>
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
                  <Badge variant="primary">Conference Preview</Badge>
                  <span className="text-text-muted text-sm">February 12, 2026</span>
                  <span className="text-text-muted text-sm">8 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  Big 12 Opening Weekend:{' '}
                  <span className="text-gradient-blaze">14 Teams, Real Depth</span>
                </h1>
                <p className="font-serif text-xl text-text-tertiary leading-relaxed">
                  The new-look Big 12 features 14 baseball programs, a legitimate Omaha contender in TCU, and more depth than the national conversation gives it credit for.
                </p>
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
                  The Big 12 lost Texas and Oklahoma to the SEC. It gained Arizona, Arizona State, UCF, Houston, Cincinnati, BYU, and others from various conferences. The identity shifted. The geography expanded. And in 2026, the conference is finding out what it actually is — not what it used to be.
                </p>
                <p>
                  What it is: deeper than you think. TCU is a legitimate Omaha contender. Kansas has built something quietly special. Oklahoma State reloads every year. Arizona brings Pac-12 pedigree and desert heat. The Big 12 may not have the SEC&rsquo;s top-end depth, but the middle of the conference is competitive and the bottom is not as far away as the rankings suggest.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Key Series */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Opening Series to Watch
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              {big12Matchups.map((m, i) => (
                <ScrollReveal key={m.at} direction="up" delay={Math.min(i * 50, 250)}>
                  <Card variant="default" padding="md" className="h-full">
                    <div className="font-display text-sm font-bold uppercase tracking-wide text-text-primary mb-1">{m.at}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-burnt-orange mb-2">
                      {m.away} @ {m.at} &middot; {m.date}
                    </div>
                    <p className="font-serif text-sm text-text-tertiary leading-relaxed mb-3">{m.capsule}</p>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">
                      Watch for: <span className="text-ember/70">{m.watch}</span>
                    </div>
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
                Four Storylines for the Big 12
              </h2>
            </ScrollReveal>
            <div className="space-y-8">
              {storylines.map((s, i) => (
                <ScrollReveal key={s.title} direction="up" delay={i * 60}>
                  <div className="border-l-[3px] border-burnt-orange/40 pl-6">
                    <h3 className="font-display text-lg font-medium uppercase tracking-wide text-text-primary mb-2">{s.title}</h3>
                    <p className="font-serif text-base text-text-tertiary leading-relaxed">{s.description}</p>
                  </div>
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
                    The Big 12 is not the SEC. It doesn&rsquo;t need to be. What it is: a 14-team conference with a genuine Omaha contender at the top, three or four programs capable of hosting regionals, and enough depth in the middle to make every weekend series competitive. TCU is the team to beat. Kansas is the team nobody wants to face. And the rest of the conference is better than you think.
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
              <DataSourceBadge source="D1Baseball / ESPN / BSI Projections" timestamp="February 12, 2026 CT" />
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  All Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/big-12" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  Full Big 12 Preview &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
