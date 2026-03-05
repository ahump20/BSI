import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEC Opening Weekend Preview 2026: 13 Ranked Teams | Blaze Sports Intel',
  description: '13 ranked teams. Texas and Oklahoma in year two of the SEC era. Riojas, Schlottman, Johnson, Sullivan lead the Friday night arms. The deepest conference in college baseball opens play.',
  openGraph: {
    title: 'SEC Baseball Opening Weekend 2026 | Blaze Sports Intel',
    description: 'No other conference places 13 teams in the preseason top 25. The SEC opens 2026 with the strongest Friday night rotation in a decade.',
    type: 'article',
  },
};

const secMatchups = [
  { away: 'UC Davis', at: 'No. 3 Texas', date: 'Feb 13–15', capsule: 'The Longhorns open as Omaha favorites with a retooled roster. Robbins (Notre Dame), Becerra (Stanford), and Tinney fortify a lineup already built around Mendoza and Rodriguez. Riojas gets the Friday start.', watch: 'Transfer portal debuts' },
  { away: 'Indiana State', at: 'No. 1 Texas A&M', date: 'Feb 14–16', capsule: 'The defending national champions reload with talent. Schlottman anchors the rotation and the lineup runs nine deep. College Station will be electric.', watch: 'Championship hangover test' },
  { away: 'Grambling', at: 'No. 2 LSU', date: 'Feb 14–16', capsule: 'Johnson returns to lead the Tigers. The Box will be sold out and the atmosphere will be peak LSU. Expect a dominant opening series.', watch: 'Friday night in the Box' },
  { away: 'Stetson', at: 'No. 5 Florida', date: 'Feb 14–16', capsule: 'Sullivan returns from a stellar freshman campaign. The Gators pitching staff is deep and the lineup has pop. Gainesville expects Omaha.', watch: 'Caeleb Dressel (yes, that one) in the stands' },
  { away: 'NJIT', at: 'No. 7 Tennessee', date: 'Feb 14–16', capsule: 'The Vols lost some big bats but Vitello always reloads. The pitching depth is real and Lindsey Nelson is a fortress.', watch: 'New lineup construction' },
  { away: 'Illinois State', at: 'No. 8 Arkansas', date: 'Feb 14–16', capsule: 'Van Horn has the Hogs in the hunt again. The rotation is elite and the Baum-Walker experience is a weapon all by itself.', watch: 'Friday night arm' },
  { away: 'Wright State', at: 'No. 10 Vanderbilt', date: 'Feb 14–16', capsule: 'Corbin reloads every year. The pitching development pipeline is the best in the country and the lineup has gotten more athletic.', watch: 'Freshman class impact' },
  { away: 'UTSA', at: 'No. 15 Oklahoma', date: 'Feb 14–16', capsule: 'The Sooners are building something real in their SEC era. Skip Johnson has the program trending and the transfer portal haul was strong.', watch: 'SEC integration, year two' },
];

const storylines = [
  { title: '13 Ranked Teams', description: 'No other conference in the country can say that. The SEC places 13 teams in the preseason top 25, including four in the top five. The depth is absurd — even the "down" programs in the league would be conference favorites elsewhere.' },
  { title: 'Transfer Portal Arms Race', description: 'Texas added Robbins (Notre Dame), Becerra (Stanford), and Tinney. A&M retained its core and added selectively. LSU poached from the ACC. The portal has made the SEC deeper and more dangerous, and the teams that won the portal are the ones projected to win Omaha.' },
  { title: 'The Friday Night Starters', description: 'Riojas (Texas), Schlottman (A&M), Johnson (LSU), Sullivan (Florida). The SEC Friday night starter is the most important position in college baseball, and this year the arms at the top are as good as they have been in a decade.' },
  { title: 'New Blood, Year Two', description: 'Oklahoma and Texas are in their second SEC season. The Sooners showed flashes last year but the grind wore them down in May. Texas won the conference in year one — an unprecedented feat. Can both sustain it against the depth of the league?' },
];

export default function SECOpeningWeekendPage() {
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
              <span className="text-text-primary">SEC Opening Weekend</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/10 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Conference Preview</Badge>
                  <span className="text-text-muted text-sm">February 12, 2026</span>
                  <span className="text-text-muted text-sm">12 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  SEC Opening Weekend:{' '}
                  <span className="text-gradient-blaze">The Deepest Conference in America Opens Play</span>
                </h1>
                <p className="font-serif text-xl text-text-tertiary leading-relaxed">
                  13 ranked teams. Four in the top five. A transfer portal arms race that reshaped half the rosters in the league. The SEC doesn&rsquo;t ease into the season — it detonates.
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
                  There is no other conference like this. Not in any sport, at any level, in any country. The SEC puts 13 teams in the preseason top 25 and the programs that didn&rsquo;t make the cut — Missouri, Mississippi State — would be contenders in any other league. The depth is the product. The depth is the weapon. And on Valentine&rsquo;s Day weekend, all 16 programs take the field with Omaha on the line.
                </p>
                <p>
                  The storylines are immediate. Texas won the SEC in year one — the only school in conference history to do that — and reloaded through the portal with Robbins, Becerra, and Tinney. Texas A&amp;M is the defending national champion and returns the core that won it. LSU is LSU. Florida has the kind of pitching staff that makes June feel inevitable. And that&rsquo;s just the top four.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Key Matchups */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#C9A227] mb-6 pb-2 border-b border-[#C9A227]/15">
                Opening Series to Watch
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4">
              {secMatchups.map((m, i) => (
                <ScrollReveal key={m.at} direction="up" delay={Math.min(i * 50, 300)}>
                  <Card variant="default" padding="md" className="h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-text-primary">{m.at}</span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#C9A227] mb-2">
                      {m.away} @ {m.at} &middot; {m.date}
                    </div>
                    <p className="font-serif text-sm text-text-tertiary leading-relaxed mb-3">{m.capsule}</p>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">
                      Watch for: <span className="text-[#C9A227]/70">{m.watch}</span>
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
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#C9A227] mb-6 pb-2 border-b border-[#C9A227]/15">
                Four Storylines That Define the Weekend
              </h2>
            </ScrollReveal>
            <div className="space-y-8">
              {storylines.map((s, i) => (
                <ScrollReveal key={s.title} direction="up" delay={i * 60}>
                  <div className="border-l-[3px] border-[#C9A227]/40 pl-6">
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
              <div className="relative bg-gradient-to-br from-[#C9A227]/8 to-texas-soil/5 border border-[#C9A227]/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-midnight text-[#C9A227] px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    The SEC isn&rsquo;t the best baseball conference in America because of its top teams. It&rsquo;s the best because of its eighth-best team. When your No. 8 program would be a regional host in any other league, the depth is self-evident. Opening weekend won&rsquo;t tell us who wins the conference — it&rsquo;ll tell us who&rsquo;s ready for the war that comes after.
                  </p>
                  <p>
                    Watch the Friday starters. Watch the portal additions. Watch which teams look like they&rsquo;ve been playing together for years versus which ones are still figuring out the lineup card. February answers are small, but they compound. And in the SEC, compounding is the only way to survive.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="md" className="border-t border-[#C9A227]/10">
          <Container size="narrow">
            <div className="space-y-4">
              <DataSourceBadge source="D1Baseball / ESPN / BSI Projections" timestamp="February 12, 2026 CT" />
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-[#C9A227] hover:opacity-70 transition-opacity">
                  All Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/sec" className="font-display text-[13px] uppercase tracking-widest text-[#C9A227] hover:opacity-70 transition-opacity">
                  Full SEC Preview &rarr;
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
