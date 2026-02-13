import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas Baseball 2026 Outlook & Roster Breakdown | College Baseball Editorial',
  description:
    'In-depth 2026 Texas Longhorns baseball preview with key returnees, roster analysis, and what it means for the College World Series race.',
  openGraph: {
    title: 'Texas Baseball 2026 Outlook & Roster Breakdown',
    description:
      'Deep dive on the 2026 Texas Longhorns baseball roster, impact returnees, and their path to Omaha.',
    type: 'article',
  },
};
/* ─── Data ────────────────────────────────────────────────────────────────── */

const keyReturnees = [
  {
    name: 'Ethan Mendoza',
    position: 'INF',
    year: 'Jr.',
    stats: '.333 / .437 / .476',
    capsule:
      '.333 in the SEC is not just good — only four qualified hitters in the conference posted a higher average last season. Mendoza does it from the left side with a contact-first approach, a walk rate north of 12%, and a chase rate that makes pitchers work deep into counts. He sets the table for everything Texas does offensively.',
  },
  {
    name: 'Adrian Rodriguez',
    position: 'INF',
    year: 'So.',
    stats: '.313 / .410 / .516 · 7 HR',
    capsule:
      'Switch-hitters who can slug .500+ as freshmen in the SEC do not come along often. Rodriguez did it while playing Gold Glove-caliber defense at second base and earning Freshman All-American honors. His sophomore jump is the single biggest variable in how high this lineup can climb.',
  },
  {
    name: 'Dylan Volantis',
    position: 'LHP',
    year: 'So.',
    stats: '1.94 ERA · 74 K · 12 SV · 51 IP',
    capsule:
      'Volantis broke a 22-year-old SEC freshman saves record. Then he kept going. Seventy-four strikeouts in 51 innings. A 1.94 ERA against the best conference in college baseball. He shortened every game he entered by two innings, and he is only a sophomore. The most dominant reliever in the sport.',
  },
  {
    name: 'Luke Harrison',
    position: 'LHP',
    year: 'Gr.',
    stats: '3.06 ERA · 89 K · 91 IP',
    capsule:
      'The rotation anchor. Harrison pitched 91 innings last season — the kind of workload that tells you a coach trusts an arm completely. His 3.06 ERA in SEC play was built on a fastball-slider combination that kept right-handed hitters off balance all spring. A graduate arm with this much mileage is invaluable in a 56-game conference grind.',
  },
  {
    name: 'Tanner Witt',
    position: 'RHP',
    year: 'Jr.',
    stats: '3.45 ERA · 67 K · 73 IP',
    capsule:
      'Witt emerged as a reliable weekend option down the stretch, posting a sub-3.00 ERA across his final eight starts. He attacks hitters with a power sinker that generates ground balls and keeps pitch counts low — the kind of arm that gives a coaching staff options in March that pay dividends in June.',
  },
  {
    name: 'Jared Thomas',
    position: 'OF',
    year: 'Jr.',
    stats: '.289 / .371 / .434 · 5 HR · 14 SB',
    capsule:
      'The everyday center fielder combines above-average speed with gap power and a throwing arm that discourages extra bases. Thomas is the kind of player who does not show up in headlines but shows up in wins — a 14-steal, five-home-run season with plus defense is quietly one of the more complete lines on the roster.',
  },
  {
    name: 'Ryan Flores',
    position: 'RHP',
    year: 'So.',
    stats: '3.52 ERA · 58 K · 64 IP',
    capsule:
      'Flores projects as a Friday night starter if his slider continues to develop. He already showed he could pitch in big SEC moments as a freshman — a 7-inning, 2-run performance against Tennessee in April was the kind of outing that earns a rotation spot going into Year Two.',
  },
  {
    name: 'Peyton Williams',
    position: 'C/1B',
    year: 'Jr.',
    stats: '.274 / .358 / .445 · 9 HR',
    capsule:
      'Williams provides something every championship team needs: middle-of-the-order thump from a position that also contributes defensively. His nine home runs led Texas last season, and his ability to catch and play first base gives Schlossnagle lineup flexibility on a daily basis.',
  },
];

const portalAdditions = [
  {
    name: 'Haiden Leffew',
    position: 'RHP',
    from: 'Wake Forest',
    capsule:
      'Leffew did not leave a CWS runner-up program to sit. He came because he saw a roster that could get to Omaha — and a pitching staff where his high-leverage experience from the ACC Tournament and CWS would plug directly into the late innings behind Volantis.',
  },
  {
    name: 'Ashton Larson',
    position: 'RHP',
    from: 'LSU',
    capsule:
      'A national champion bringing a power arm and a ring. Larson pitched meaningful innings for LSU in June and carries the kind of poise that only comes from winning at the highest level. He adds another SEC-tested arm to a bullpen that already runs deep.',
  },
  {
    name: 'Cameron Burns',
    position: 'RHP',
    from: 'Arizona State',
    capsule:
      'Burns features a mid-90s fastball with a wipeout slider and projects as a starter or high-leverage reliever. His Pac-12 experience translates directly to the SEC, and his arm talent gives Schlossnagle another option for weekend rotation spots.',
  },
  {
    name: 'Temo Becerra',
    position: 'INF',
    from: 'Stanford',
    capsule:
      'A versatile infielder who can play three positions and brings a professional approach at the plate. Becerra adds depth and defensive flexibility to a lineup that already has Mendoza and Rodriguez locked in up the middle.',
  },
  {
    name: 'Cody Howard',
    position: 'RHP',
    from: 'Baylor',
    capsule:
      'Stayed in-state for a reason. Howard knows Texas baseball and knows what a trip to Omaha demands. He adds a sinker-heavy ground-ball approach that complements the strikeout-heavy arms already in the bullpen.',
  },
  {
    name: 'Marcus Pendergrass',
    position: 'OF',
    from: 'College of Charleston',
    capsule:
      'A speed-first outfielder who profiles as a pinch-runner and defensive replacement with upside. Pendergrass brings athleticism and energy — the kind of depth piece that wins games in May when rosters are worn thin.',
  },
];

const scheduleHighlights = [
  {
    dates: 'Feb 14–16',
    opponent: 'UC Davis',
    location: 'Austin, TX',
    significance: 'Season opener at Disch-Falk. Schlossnagle sets the tone for Year Two.',
  },
  {
    dates: 'Feb 21–23',
    opponent: 'Bruce Bolt Classic',
    location: 'Houston, TX',
    significance: 'Neutral-site showcase against ranked opponents — a measuring-stick weekend before conference play.',
  },
  {
    dates: 'Mar 13–15',
    opponent: 'Ole Miss',
    location: 'Austin, TX',
    significance: 'SEC opener under the lights at Disch-Falk. The Rebels always bring elite bats. First real test of the pitching depth.',
  },
  {
    dates: 'Mar 27–29',
    opponent: 'Auburn',
    location: 'Auburn, AL',
    significance: 'First true SEC road trip. Plainsman Park is hostile territory — how Texas handles the road will define the middle third of the season.',
  },
  {
    dates: 'Apr 3–5',
    opponent: 'Oklahoma',
    location: 'Austin, TX',
    significance: 'The Red River Rivalry under new conference circumstances. The Sooners are dangerous in their SEC debut year.',
  },
  {
    dates: 'Apr 10–12',
    opponent: 'Texas A&M',
    location: 'College Station, TX',
    significance: 'The Lone Star Series at Blue Bell Park. #1 vs #2. The most anticipated series in college baseball this season.',
  },
  {
    dates: 'Apr 24–26',
    opponent: 'Vanderbilt',
    location: 'Nashville, TN',
    significance: 'Hawkins Field in late April. Vandy always pitches well at home — this series separates contenders from pretenders.',
  },
  {
    dates: 'May 8–10',
    opponent: 'Tennessee',
    location: 'Knoxville, TN',
    significance: 'Lindsey Nelson Stadium with SEC title implications on the line. The road series that could decide the regular-season championship.',
  },
  {
    dates: 'May 15–17',
    opponent: 'Texas A&M',
    location: 'Austin, TX',
    significance: 'The return series at Disch-Falk. If the SEC race is still alive, this weekend is the final word.',
  },
  {
    dates: 'May 19–24',
    opponent: 'SEC Tournament',
    location: 'Hoover, AL',
    significance: 'The SEC Tournament in Hoover — where seeding, matchups, and momentum for the NCAA Tournament are decided in five days.',
  },
];

const scoutingGrades = [
  { category: 'Bullpen', grade: 80, label: 'Elite', assessment: 'Volantis plus seven high-leverage arms. Best relief corps in the country.' },
  { category: 'Coaching', grade: 75, label: 'Plus-Plus', assessment: 'Schlossnagle won the SEC in Year One. Track record speaks for itself.' },
  { category: 'Lineup Depth', grade: 70, label: 'Plus', assessment: 'Mendoza, Rodriguez, Williams 1-through-9 with no easy outs.' },
  { category: 'Schedule Difficulty', grade: 70, label: 'Plus', assessment: 'SEC gauntlet with A&M (twice), Tennessee, Vanderbilt on the road.' },
  { category: 'Rotation', grade: 65, label: 'Above Avg', assessment: 'Harrison anchors. Flores and Burns project forward. Depth over dominance.' },
  { category: 'Defense', grade: 60, label: 'Above Avg', assessment: 'Rodriguez up the middle, Thomas in center. Solid at premium positions.' },
  { category: 'Speed / Baserunning', grade: 60, label: 'Above Avg', assessment: '79 steals last season. Not a track team, but aggressive and smart.' },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function Texas2026EditorialPage() {
  return (
    <>
      <main id="main-content">
        {/* ── 1. Breadcrumb ─────────────────────────────────────────────── */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white/40">
                Editorial
              </span>
              <span className="text-white/20">/</span>
              <span className="text-white">Texas 2026 Preview</span>
            </nav>
          </Container>
        </Section>

        {/* ── 2. Hero ───────────────────────────────────────────────────── */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BF5700]/10 via-transparent to-[#8B4513]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Season Preview</Badge>
                  <span className="text-white/40 text-sm">February 12, 2026</span>
                  <span className="text-white/40 text-sm">15 min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  Texas Longhorns:{' '}
                  <span className="text-[#BF5700]">2026 Season Preview</span>
                </h1>
                <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-4">
                  3,818 wins. 38 College World Series appearances. Six national championships.
                  130 years of baseball at UFCU Disch-Falk Field. After winning the SEC in
                  their inaugural season — a feat no program had accomplished since 1933 — Jim
                  Schlossnagle&apos;s Longhorns reload with the deepest pitching staff in America
                  and a lineup built to chase Omaha.
                </p>
                <div className="flex items-center gap-4 text-sm text-white/30">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>Austin, TX</span>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 3. Program Legacy Stats ───────────────────────────────────── */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="All-Time Wins" value="3,818" helperText=".724 Win Pct" />
                <StatCard label="CWS Appearances" value="38" helperText="NCAA Record" />
                <StatCard label="National Titles" value="6" helperText="Last: 2005" />
                <StatCard label="Conference Titles" value="81" helperText="First SEC: 2025" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 4. The Program — Historical Narrative ─────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                The Program
              </h2>
              <p className="text-white/40 mb-8">130 years. Six titles. One standard.</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="space-y-6">
                <p className="text-white/60 text-lg leading-relaxed">
                  Texas baseball does not rebuild. It reloads. That is not a slogan — it is a
                  statistical reality backed by 130 years of evidence. The Longhorns have won
                  3,818 games at a .724 clip, reached 38 College World Series, and claimed six
                  national championships across six different decades. Eighty-one conference
                  titles. The winningest program in NCAA history by virtually every metric that
                  matters.
                </p>
                <p className="text-white/60 text-lg leading-relaxed">
                  When Jim Schlossnagle left Texas A&amp;M for Austin after the 2024 College
                  World Series, it was the most controversial coaching move in college baseball.
                  The Aggies had just played for a national championship. Schlossnagle walked
                  across the rivalry line the same week. The backlash was immediate and personal.
                  None of it mattered once the games started.
                </p>

                <blockquote className="border-l-4 border-[#BF5700] pl-6 my-8 italic text-white/90 text-lg">
                  &ldquo;Year One answered the question: can they compete in the SEC? Year Two
                  shifts it to the only question that matters — can they win it all?&rdquo;
                </blockquote>

                <p className="text-white/60 text-lg leading-relaxed">
                  Texas was picked eighth in the SEC preseason poll. They won it outright. The
                  first program to claim a conference title in its inaugural season since the
                  league expanded in 1933. Schlossnagle did not ask permission, and he did not
                  need a transition year. He installed a pitching-first identity, leveraged the
                  transfer portal with surgical precision, and built a roster that made the Big
                  12-to-SEC adjustment look routine. Now Year Two raises the stakes.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 5. 2025 Season Recap ──────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                2025: The Proof of Concept
              </h2>
              <p className="text-white/40 mb-6">44-14 overall. 22-8 SEC. Conference champions.</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="max-w-3xl mb-8">
                <p className="text-white/60 text-lg leading-relaxed">
                  Forty-four wins and an SEC championship in an inaugural season is not supposed
                  to happen. The SEC has been the best baseball conference in America for two
                  decades running — programs spend years building to compete, let alone contend.
                  Texas skipped the transition entirely. A team batting average of .275 with 85
                  home runs provided the offense. A collective 3.71 ERA with 526 strikeouts and
                  a .219 opponent batting average provided the pitching. Seventy-nine stolen
                  bases showed the speed. And Schlossnagle earned SEC Coach of the Year for
                  turning a preseason afterthought into the team holding the trophy.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#BF5700]">44-14</div>
                  <div className="text-white/30 text-xs mt-1">Overall Record</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#BF5700]">22-8</div>
                  <div className="text-white/30 text-xs mt-1">SEC Record</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#BF5700]">.275</div>
                  <div className="text-white/30 text-xs mt-1">Team Batting Avg</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#BF5700]">3.71</div>
                  <div className="text-white/30 text-xs mt-1">Team ERA</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#BF5700]">85</div>
                  <div className="text-white/30 text-xs mt-1">Home Runs</div>
                </Card>
                <Card variant="default" padding="md" className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#BF5700]">.219</div>
                  <div className="text-white/30 text-xs mt-1">Opponent Batting Avg</div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 6. Key Returnees ──────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                Key Returnees
              </h2>
              <p className="text-white/40 mb-8">Eight players who form the foundation of a championship-caliber roster</p>
            </ScrollReveal>

            <div className="space-y-4">
              {keyReturnees.map((player) => (
                <ScrollReveal key={player.name} direction="up">
                  <Card variant="default" padding="md">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex items-center gap-3 md:w-56 flex-shrink-0">
                        <div>
                          <span className="font-display text-lg font-bold text-white uppercase">
                            {player.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-white/30 text-xs">{player.position} · {player.year}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-mono text-sm text-[#BF5700] mb-2">{player.stats}</div>
                        <p className="text-white/50 text-sm leading-relaxed">{player.capsule}</p>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── 7. Portal Additions ───────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                Portal Reinforcements
              </h2>
              <p className="text-white/40 mb-8">
                These are not patches. They are reinforcements from programs that played deep into June.
              </p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4">
              {portalAdditions.map((player) => (
                <ScrollReveal key={player.name} direction="up">
                  <Card variant="default" padding="md" className="h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-display text-base font-bold text-white uppercase">
                        {player.name}
                      </span>
                      <Badge variant="secondary" size="sm">{player.position}</Badge>
                    </div>
                    <div className="text-[#BF5700] text-xs font-medium mb-2">via {player.from}</div>
                    <p className="text-white/50 text-sm leading-relaxed">{player.capsule}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── 8. Pitching Deep Dive ─────────────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                The Arms Race
              </h2>
              <p className="text-white/40 mb-8">Why pitching depth is the single biggest differentiator in 2026</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="space-y-8">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    The Closer: Volantis Changes Everything
                  </h3>
                  <p className="text-white/60 leading-relaxed mb-4">
                    A dominant closer transforms a pitching staff from top to bottom. When your
                    back-end arm has a 1.94 ERA and 74 strikeouts in 51 innings, every starter
                    in the rotation knows the game is six innings, not nine. Schlossnagle can be
                    aggressive with his hooks — pull a starter at the first sign of fatigue in
                    the sixth, bridge to Volantis in the eighth, and trust that the lead is safe.
                    That changes how the entire staff approaches its workload across a 56-game
                    conference season.
                  </p>
                  <p className="text-white/60 leading-relaxed">
                    Volantis&apos;s 12 saves as a freshman broke a conference record that had stood
                    for 22 years. His strikeout rate — 13.1 per nine innings — would be elite in
                    professional baseball, let alone the SEC. Opposing hitters posted a .149 average
                    against him. He is not a relief option. He is a competitive weapon.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    The Rotation: Depth Over Dominance
                  </h3>
                  <p className="text-white/60 leading-relaxed mb-4">
                    Texas does not have a single unhittable Friday night ace. What they have is
                    better: four arms who can each give quality starts against ranked opponents.
                    Harrison anchors with 91 innings of SEC experience and a 3.06 ERA. Flores
                    projects forward after a breakout freshman year. Burns arrives from Arizona
                    State with mid-90s velocity and a wipeout slider. Witt provides the
                    ground-ball sinker approach that keeps pitch counts low and defenses engaged.
                  </p>
                  <p className="text-white/60 leading-relaxed">
                    In a conference where you play 30 league games in 10 weekends, rotation depth
                    matters more than one dominant arm. By late April, when arms are tired and
                    the schedule gets relentless, the team with the deepest staff survives. Texas
                    has that staff.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    The Bullpen: Eight Arms You Trust
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    Behind Volantis, the portal additions did not come to Austin to watch. Leffew
                    pitched in the College World Series for Wake Forest. Larson pitched for a
                    national championship at LSU. Howard brings an in-state sinker-heavy approach
                    from Baylor. When you combine those arms with the returning pieces from a
                    bullpen that held opponents to a .219 average, you have a relief corps eight
                    deep with high-leverage experience. Schlossnagle never has to ride a tired
                    arm into the seventh inning because someone behind him has been there before.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 9. Lineup Analysis ────────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                The Lineup
              </h2>
              <p className="text-white/40 mb-8">Contact, power, patience — and no easy outs one through nine</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="space-y-8">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    The Table-Setter: Mendoza Changes the Math
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    A .437 on-base percentage means Mendoza reaches base in nearly half his plate
                    appearances. In a lineup with Rodriguez and Williams hitting behind him, that
                    translates to 15 to 20 extra baserunners per month — runners that the middle
                    of the order can drive in. Mendoza is not a power hitter. He does not need to
                    be. His job is to be on base when the damage hitters come to the plate, and
                    he does it better than almost anyone in the SEC.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    The Middle: Rodriguez, Williams, and the RBI Machine
                  </h3>
                  <p className="text-white/60 leading-relaxed mb-4">
                    Rodriguez and Williams form the kind of three-four combination that opposing
                    pitching coaches game-plan around. Rodriguez brings switch-hitting versatility
                    with a .516 slugging percentage. Williams provides right-handed power with
                    nine home runs and the ability to drive the ball to all fields. You cannot
                    pitch around one without facing the other.
                  </p>
                  <p className="text-white/60 leading-relaxed">
                    The supporting cast matters too. Thomas adds speed and defensive range from
                    center field. Becerra, the Stanford transfer, provides infield flexibility
                    and a professional plate approach. This is not a lineup that relies on two
                    hitters — it is a lineup that can hurt you in every spot.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 10. Schedule ──────────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                The Gauntlet
              </h2>
              <p className="text-white/40 mb-6">
                The most demanding schedule in college baseball — and the matchups that will define the season.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <p className="text-white/60 leading-relaxed mb-8 max-w-3xl">
                The SEC does not give you weeks off. Texas opens conference play at home against
                Ole Miss under the lights at Disch-Falk, travels to Plainsman Park to face Auburn,
                and makes the trip to Blue Bell Park for the marquee Lone Star matchup against
                Texas A&amp;M. The road series at Vanderbilt and Tennessee in late April and May
                could decide the regular-season title. This schedule will test every arm in the
                pitching staff and every bat in the lineup.
              </p>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-4">
              {scheduleHighlights.map((matchup) => (
                <ScrollReveal key={matchup.opponent} direction="up">
                  <Card variant="default" padding="md" className="h-full">
                    <div className="text-[#BF5700] text-sm font-medium mb-1">{matchup.dates}</div>
                    <div className="text-white font-bold mb-1">{matchup.opponent}</div>
                    <div className="text-white/30 text-xs mb-2">{matchup.location}</div>
                    <p className="text-white/50 text-xs leading-relaxed">{matchup.significance}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── 11. Scouting Verdict ──────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                The Scouting Verdict
              </h2>
              <p className="text-white/40 mb-8">
                The 20-80 scale is how scouts evaluate tools. A 50 is average. A 60 is above average.
                An 80 is elite — the best in the sport. Here is where Texas grades out heading into 2026.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <Card variant="default" padding="lg" className="mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-white/40 font-medium">Category</th>
                        <th className="text-center py-3 text-white/40 font-medium w-20">Grade</th>
                        <th className="text-left py-3 text-white/40 font-medium hidden sm:table-cell">Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoutingGrades.map((grade) => (
                        <tr key={grade.category} className="border-b border-white/5 last:border-0">
                          <td className="py-3 text-white font-medium">{grade.category}</td>
                          <td className="py-3 text-center">
                            <span className={`font-mono text-xl font-bold ${
                              grade.grade >= 80
                                ? 'text-green-400'
                                : grade.grade >= 70
                                  ? 'text-[#BF5700]'
                                  : 'text-white'
                            }`}>
                              {grade.grade}
                            </span>
                          </td>
                          <td className="py-3 text-white/50 hidden sm:table-cell">{grade.assessment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </ScrollReveal>

            {/* BSI Projection */}
            <ScrollReveal direction="up" delay={200}>
              <Card variant="default" padding="lg" className="border-[#BF5700]/30 bg-[#BF5700]/5">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="primary">BSI Projection</Badge>
                  <span className="font-display text-lg font-bold text-[#BF5700] uppercase">Omaha Favorite</span>
                </div>
                <p className="text-white/70 leading-relaxed">
                  Texas has the most complete roster in college baseball. The pitching depth —
                  anchored by Volantis and deepened by six arms with high-leverage postseason
                  experience — is the best in the sport. The lineup, led by Mendoza and Rodriguez,
                  combines contact, power, and patience in a way few programs can match. The
                  schedule is a gauntlet — at A&amp;M, at Vanderbilt, at Tennessee — but this is
                  a team built for a 56-game SEC grind, not a soft non-conference sprint.
                  Schlossnagle came to Austin to compete for Omaha. This roster gives him the
                  tools to get there.
                </p>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 12. Attribution ───────────────────────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="texaslonghorns.com / ESPN / SportsDataIO"
                timestamp="Feb 12, 2026 CT"
              />
              <div className="flex gap-4">
                <Link href="/college-baseball" className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                  More Editorial →
                </Link>
                <Link href="/college-baseball/preseason/lone-star-rivalry" className="text-sm text-white/40 hover:text-white transition-colors">
                  Lone Star Rivalry →
                </Link>
                <Link href="/college-baseball/editorial/acc-opening-weekend" className="text-sm text-white/40 hover:text-white transition-colors">
                  ACC Preview →
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
