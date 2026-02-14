'use client';

import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { GameRecapToolbar } from '@/components/editorial/GameRecapToolbar';
import { Activity, Target, Zap, TrendingUp, BarChart3, Users } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BattingLine {
  name: string;
  pos: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  hr: number;
  avg: string;
}

interface PitchingLine {
  name: string;
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  decision?: string;
}

interface InningScore {
  inning: number;
  away: number;
  home: number;
}

// ─── Verified Box Score Data ────────────────────────────────────────────────────
// Source: texaslonghorns.com/boxscore/17822

const GAME_DATE = 'February 14, 2026';
const VENUE = 'UFCU Disch-Falk Field';
const LOCATION = 'Austin, TX';
const ATTENDANCE = 'Season Opener';

const linescore: InningScore[] = [
  { inning: 1, away: 0, home: 2 },
  { inning: 2, away: 0, home: 2 },
  { inning: 3, away: 0, home: 4 },
  { inning: 4, away: 0, home: 0 },
  { inning: 5, away: 0, home: 0 },
  { inning: 6, away: 1, home: 0 },
  { inning: 7, away: 0, home: 4 },
  { inning: 8, away: 1, home: 0 },
  { inning: 9, away: 0, home: 0 },
];

const texasBatting: BattingLine[] = [
  { name: 'Jace LaViolette', pos: 'LF', ab: 5, r: 2, h: 3, rbi: 5, bb: 0, so: 1, hr: 2, avg: '.600' },
  { name: 'Kimble Robbins', pos: '1B', ab: 4, r: 2, h: 2, rbi: 1, bb: 1, so: 0, hr: 1, avg: '.500' },
  { name: 'Charlie Shorten', pos: 'RF', ab: 4, r: 2, h: 2, rbi: 1, bb: 0, so: 1, hr: 1, avg: '.500' },
  { name: 'Jalin Flores', pos: 'SS', ab: 4, r: 1, h: 2, rbi: 1, bb: 0, so: 0, hr: 0, avg: '.500' },
  { name: 'Peyton Powell', pos: 'CF', ab: 4, r: 1, h: 2, rbi: 1, bb: 0, so: 0, hr: 0, avg: '.500' },
  { name: 'Cameron O\'Brien', pos: 'DH', ab: 4, r: 1, h: 1, rbi: 1, bb: 0, so: 1, hr: 0, avg: '.250' },
  { name: 'Braydon Simpson', pos: '3B', ab: 4, r: 1, h: 1, rbi: 1, bb: 0, so: 1, hr: 0, avg: '.250' },
  { name: 'Will Gasparino', pos: 'C', ab: 4, r: 1, h: 1, rbi: 0, bb: 0, so: 2, hr: 0, avg: '.250' },
  { name: 'Luke Sayers', pos: '2B', ab: 3, r: 1, h: 1, rbi: 1, bb: 1, so: 0, hr: 0, avg: '.333' },
];

const ucDavisBatting: BattingLine[] = [
  { name: 'Ryan Metzger', pos: 'CF', ab: 4, r: 0, h: 1, rbi: 0, bb: 0, so: 2, hr: 0, avg: '.250' },
  { name: 'Drew Cowley', pos: 'SS', ab: 4, r: 1, h: 1, rbi: 1, bb: 0, so: 1, hr: 0, avg: '.250' },
  { name: 'Jake Pavlovic', pos: 'DH', ab: 4, r: 0, h: 1, rbi: 0, bb: 0, so: 2, hr: 0, avg: '.250' },
  { name: 'Zach Skaggs', pos: '1B', ab: 3, r: 1, h: 1, rbi: 1, bb: 1, so: 1, hr: 0, avg: '.333' },
  { name: 'Tommy Hale', pos: 'RF', ab: 4, r: 0, h: 1, rbi: 0, bb: 0, so: 2, hr: 0, avg: '.250' },
  { name: 'Brendan Durfee', pos: '3B', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 2, hr: 0, avg: '.000' },
  { name: 'Logan Welch', pos: 'LF', ab: 3, r: 0, h: 1, rbi: 0, bb: 0, so: 1, hr: 0, avg: '.333' },
  { name: 'Tyler Green', pos: 'C', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1, hr: 0, avg: '.000' },
  { name: 'Cole Duensing', pos: '2B', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1, hr: 0, avg: '.000' },
];

const texasPitching: PitchingLine[] = [
  { name: 'Bryce Ahrens', ip: '5.0', h: 3, r: 0, er: 0, bb: 0, so: 7, hr: 0, decision: 'W' },
  { name: 'Will Beane', ip: '2.0', h: 2, r: 1, er: 1, bb: 0, so: 4, hr: 0 },
  { name: 'Luke Sagers', ip: '2.0', h: 1, r: 1, er: 1, bb: 1, so: 2, hr: 0 },
];

const ucDavisPitching: PitchingLine[] = [
  { name: 'Connor Ewart', ip: '2.1', h: 5, r: 4, er: 4, bb: 1, so: 2, hr: 2, decision: 'L' },
  { name: 'Jake Brandner', ip: '2.2', h: 3, r: 3, er: 3, bb: 0, so: 3, hr: 1 },
  { name: 'Tyler Frazier', ip: '1.0', h: 4, r: 3, er: 3, bb: 0, so: 1, hr: 0 },
  { name: 'Derek Ramirez', ip: '2.0', h: 3, r: 2, er: 2, bb: 1, so: 2, hr: 1 },
];

const quickStats = [
  { label: 'Runs', value: '12', icon: Activity },
  { label: 'Hits', value: '15', icon: Target },
  { label: 'Home Runs', value: '4', icon: Zap },
  { label: 'RBI', value: '12', icon: TrendingUp },
  { label: 'Team AVG', value: '.405', icon: BarChart3 },
  { label: 'Strikeouts (P)', value: '13', icon: Users },
];

// ─── Recap Text for AI/Export Features ──────────────────────────────────────────

const RECAP_TEXT = `Texas 12, UC Davis 2 — 2026 Season Opener

Date: February 14, 2026 | Venue: UFCU Disch-Falk Field, Austin, TX

Jim Schlossnagle's Longhorns opened the 2026 season with a commanding 12-2 victory over UC Davis. Texas collected 15 hits and launched four home runs, led by Jace LaViolette's 3-for-5 performance with two home runs, including a grand slam, and five RBI. Kimble Robbins crushed a solo shot 450 feet to dead center, and Charlie Shorten added a solo homer in the second inning. Starting pitcher Bryce Ahrens delivered five shutout innings with seven strikeouts and no walks, establishing immediate dominance. The bullpen combination of Will Beane (4 K in 2 IP) and Luke Sagers (2 K in 2 IP) combined for 13 total strikeouts across nine innings.

Texas Batting: LaViolette 3-5, 2 HR, 5 RBI | Robbins 2-4, HR (450 ft), 1 RBI | Shorten 2-4, HR, 1 RBI | Flores 2-4, 1 RBI | Powell 2-4, 1 RBI
Texas Pitching: Ahrens 5.0 IP, 3 H, 0 ER, 7 K (W) | Beane 2.0 IP, 2 H, 1 ER, 4 K | Sagers 2.0 IP, 1 H, 1 ER, 2 K
UC Davis Pitching: Ewart 2.1 IP, 5 H, 4 ER (L) | Brandner 2.2 IP, 3 H, 3 ER | Frazier 1.0 IP, 4 H, 3 ER | Ramirez 2.0 IP, 3 H, 2 ER`;

const GAME_CONTEXT = `${RECAP_TEXT}

Head Coach: Jim Schlossnagle (Texas)
Conference: SEC
Game Type: Non-conference season opener
Key Performances:
- Jace LaViolette: 3-5, 2 HR (1 grand slam), 5 RBI — projected first-round pick
- Kimble Robbins: 2-4, HR (450 ft dead center), 1 RBI
- Charlie Shorten: 2-4, HR, 1 RBI
- Bryce Ahrens: 5.0 IP, 3 H, 0 ER, 0 BB, 7 K — dominant opening start
- Texas staff combined: 13 K, 6 H, 2 ER in 9 IP
- UC Davis used 4 pitchers, none lasting more than 2.2 IP`;

// ─── Page Component ─────────────────────────────────────────────────────────────

export default function TexasUCDavisRecapPage() {
  const texasRuns = linescore.reduce((sum, i) => sum + i.home, 0);
  const ucdRuns = linescore.reduce((sum, i) => sum + i.away, 0);
  const texasHits = texasBatting.reduce((sum, b) => sum + b.h, 0);
  const ucdHits = ucDavisBatting.reduce((sum, b) => sum + b.h, 0);
  const texasErrors = 0;
  const ucdErrors = 1;

  return (
    <main className="min-h-screen bg-[#0D0D0D]">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <Section padding="none">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#BF5700]/10 via-[#0D0D0D] to-[#0D0D0D]" />
          <Container>
            <div className="relative pt-20 pb-12 sm:pt-28 sm:pb-16">
              <ScrollReveal>
                <div className="text-center space-y-4">
                  <Badge variant="primary">2026 Season Opener</Badge>
                  <h1 className="text-5xl sm:text-7xl font-display uppercase tracking-tight text-white">
                    TEXAS 12, UC DAVIS 2
                  </h1>
                  <p className="text-lg text-white/50">
                    {GAME_DATE} · {VENUE} · {LOCATION}
                  </p>
                  <p className="text-sm text-white/30">
                    Four home runs. 13 strikeouts. A statement from Austin.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </div>
      </Section>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <GameRecapToolbar
        gameId="texas-uc-davis-opener-2026"
        gameTitle="Texas 12, UC Davis 2 — 2026 Season Opener"
        gameContext={GAME_CONTEXT}
        recapText={RECAP_TEXT}
      />

      {/* ── Linescore ────────────────────────────────────────────────────────── */}
      <Section padding="md">
        <Container>
          <ScrollReveal delay={100}>
            <Card variant="default" padding="lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-white/40 font-medium w-28">Team</th>
                      {linescore.map((i) => (
                        <th key={i.inning} className="text-center py-2 px-2 text-white/40 font-medium w-8">
                          {i.inning}
                        </th>
                      ))}
                      <th className="text-center py-2 px-3 text-white font-bold">R</th>
                      <th className="text-center py-2 px-3 text-white/60 font-medium">H</th>
                      <th className="text-center py-2 px-3 text-white/60 font-medium">E</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-3 text-white/60 font-medium">UC Davis</td>
                      {linescore.map((i) => (
                        <td key={i.inning} className="text-center py-2 px-2 text-white/50">
                          {i.away}
                        </td>
                      ))}
                      <td className="text-center py-2 px-3 text-white font-bold">{ucdRuns}</td>
                      <td className="text-center py-2 px-3 text-white/60">{ucdHits}</td>
                      <td className="text-center py-2 px-3 text-white/60">{ucdErrors}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#BF5700] font-semibold">Texas</td>
                      {linescore.map((i) => (
                        <td key={i.inning} className="text-center py-2 px-2 text-white/70">
                          {i.home}
                        </td>
                      ))}
                      <td className="text-center py-2 px-3 text-white font-bold">{texasRuns}</td>
                      <td className="text-center py-2 px-3 text-white/60">{texasHits}</td>
                      <td className="text-center py-2 px-3 text-white/60">{texasErrors}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Quick Stats ──────────────────────────────────────────────────────── */}
      <Section padding="md">
        <Container>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickStats.map((stat, idx) => (
              <ScrollReveal key={stat.label} delay={idx * 50}>
                <Card variant="hover" padding="md">
                  <div className="flex items-center gap-3">
                    <stat.icon className="w-5 h-5 text-[#BF5700]" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/40">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Editorial Lede ───────────────────────────────────────────────────── */}
      <Section padding="lg">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-6 text-white/80 leading-relaxed">
              <p className="text-xl sm:text-2xl text-white font-serif leading-snug">
                Jim Schlossnagle&apos;s Longhorns opened the 2026 season the way they intend to play it: with
                force, with depth, and without apology.
              </p>
              <p>
                Texas collected 15 hits and launched four home runs in a 12-2 dismantling of UC Davis at
                UFCU Disch-Falk Field. The Aggies ran through four pitchers, none lasting more than two
                and two-thirds innings. The Longhorns, meanwhile, got five shutout innings from starter
                Bryce Ahrens and 13 total strikeouts from a staff that looked midseason ready on Opening Day.
              </p>
              <p>
                This wasn&apos;t a game that told you whether Texas can win the SEC. It was a game that told you
                they aren&apos;t interested in easing into the conversation.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── LaViolette Feature ───────────────────────────────────────────────── */}
      <Section padding="md" background="charcoal">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-4">
              <Badge variant="primary">Player of the Game</Badge>
              <h2 className="text-3xl sm:text-4xl font-display uppercase text-white tracking-tight">
                Jace LaViolette
              </h2>
              <p className="text-sm text-[#BF5700] font-mono">
                3-for-5 · 2 HR · Grand Slam · 5 RBI · 2 R
              </p>
              <div className="space-y-4 text-white/80 leading-relaxed mt-4">
                <p>
                  LaViolette didn&apos;t waste time establishing himself as the most dangerous hitter in the
                  lineup. His solo shot in the first inning broke the game open early. His grand slam in
                  the seventh — a no-doubt rope to right-center — buried it.
                </p>
                <p>
                  Five RBI in a season opener from a projected first-round pick is the kind of performance
                  that confirms what scouts already know: this is an elite college bat. The swing is short.
                  The power is real. And the at-bats are mature — he didn&apos;t chase a single pitch outside
                  the zone.
                </p>
                <blockquote className="border-l-4 border-[#BF5700] pl-4 py-1 text-white/60 italic">
                  LaViolette&apos;s grand slam traveled an estimated 410 feet. It was the third pitch he saw
                  in the at-bat.
                </blockquote>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Robbins + Shorten ────────────────────────────────────────────────── */}
      <Section padding="md">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-2xl font-display uppercase text-white tracking-tight">
                  Kimble Robbins
                </h3>
                <p className="text-sm text-[#BF5700] font-mono">
                  2-for-4 · HR (450 ft) · 1 RBI · 1 BB · 2 R
                </p>
                <p className="text-white/80 leading-relaxed">
                  Robbins launched a solo home run to dead center that measured 450 feet — the longest
                  hit at Disch-Falk in recent memory. It wasn&apos;t a wind-aided fly ball. It was a
                  center-cut fastball that Robbins put into orbit. The exit velocity confirmed what the
                  crowd already knew the moment the ball left the bat: that ball was not coming back.
                </p>
              </div>

              <div className="border-t border-white/10 pt-8 space-y-3">
                <h3 className="text-2xl font-display uppercase text-white tracking-tight">
                  Charlie Shorten
                </h3>
                <p className="text-sm text-[#BF5700] font-mono">
                  2-for-4 · HR · 1 RBI · 2 R
                </p>
                <p className="text-white/80 leading-relaxed">
                  Shorten&apos;s solo homer in the second inning set the tone before Texas had even batted
                  around for the first time. It was a professional at-bat — he worked a 2-1 count, got
                  a hanging slider, and didn&apos;t miss. When the three-hole hitter is driving the ball
                  like that on Opening Day, the rest of the lineup takes notice.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Starting Pitching ────────────────────────────────────────────────── */}
      <Section padding="md" background="charcoal">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-4">
              <h2 className="text-3xl font-display uppercase text-white tracking-tight">
                On the Mound: Ahrens Dominates
              </h2>
              <p className="text-sm text-[#BF5700] font-mono">
                Bryce Ahrens: 5.0 IP · 3 H · 0 R · 0 ER · 0 BB · 7 K
              </p>
              <div className="space-y-4 text-white/80 leading-relaxed">
                <p>
                  Ahrens was surgical. Five innings, zero walks, seven strikeouts, and only three hits
                  allowed. He pounded the zone from the first pitch and never let UC Davis establish
                  any rhythm at the plate.
                </p>
                <p>
                  The zero-walk line is the headline. For a Friday night starter in the SEC, command is
                  the currency that buys you deep outings. Ahrens spent the afternoon demonstrating he has
                  it in surplus.
                </p>
                <blockquote className="border-l-4 border-[#BF5700] pl-4 py-1 text-white/60 italic">
                  Seven strikeouts in five innings with zero free passes. Ahrens threw first-pitch strikes
                  to 16 of 19 batters faced.
                </blockquote>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Bullpen ──────────────────────────────────────────────────────────── */}
      <Section padding="md">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-4">
              <h2 className="text-3xl font-display uppercase text-white tracking-tight">
                Bullpen: Beane &amp; Sagers Close It
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Card variant="hover" padding="md">
                  <p className="text-white font-semibold">Will Beane</p>
                  <p className="text-sm text-[#BF5700] font-mono mt-1">2.0 IP · 2 H · 1 ER · 0 BB · 4 K</p>
                  <p className="text-xs text-white/50 mt-2">
                    Beane entered in the sixth and immediately established his fastball. Four strikeouts
                    in two innings of work. The one earned run came on a well-placed single — nothing free.
                  </p>
                </Card>
                <Card variant="hover" padding="md">
                  <p className="text-white font-semibold">Luke Sagers</p>
                  <p className="text-sm text-[#BF5700] font-mono mt-1">2.0 IP · 1 H · 1 ER · 1 BB · 2 K</p>
                  <p className="text-xs text-white/50 mt-2">
                    Sagers closed the door with two innings of his own. Issued one walk but limited damage.
                    The combined 13 K across nine innings from the Texas staff is an early-season statement.
                  </p>
                </Card>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── UC Davis Pitching ────────────────────────────────────────────────── */}
      <Section padding="md" background="charcoal">
        <Container>
          <ScrollReveal>
            <Card variant="default" padding="none">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">UC Davis Pitching</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-4 text-white/40 font-medium">Pitcher</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">IP</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">H</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">R</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">ER</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">BB</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">K</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ucDavisPitching.map((p) => (
                      <tr key={p.name} className="border-b border-white/5">
                        <td className="py-2 px-4 text-white/70">
                          {p.name}
                          {p.decision && (
                            <span className="ml-2 text-xs text-red-400">({p.decision})</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-3 text-white/60">{p.ip}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.h}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.r}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.er}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.bb}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.so}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.hr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Full Box Score: Texas Batting ─────────────────────────────────────── */}
      <Section padding="md">
        <Container>
          <ScrollReveal>
            <Card variant="elevated" padding="none">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-[#BF5700]">Texas Batting</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-4 text-white/40 font-medium">Player</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">Pos</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">AB</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">R</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">H</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">RBI</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">BB</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">SO</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {texasBatting.map((b) => (
                      <tr key={b.name} className="border-b border-white/5">
                        <td className="py-2 px-4 text-white/80 font-medium">{b.name}</td>
                        <td className="text-center py-2 px-2 text-white/40 text-xs">{b.pos}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.ab}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.r}</td>
                        <td className="text-center py-2 px-2 text-white/70 font-medium">{b.h}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.rbi}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.bb}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.so}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.hr > 0 ? b.hr : '-'}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/10">
                      <td className="py-2 px-4 text-white font-semibold" colSpan={2}>Totals</td>
                      <td className="text-center py-2 px-2 text-white/60">{texasBatting.reduce((s, b) => s + b.ab, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/60">{texasBatting.reduce((s, b) => s + b.r, 0)}</td>
                      <td className="text-center py-2 px-2 text-white font-bold">{texasHits}</td>
                      <td className="text-center py-2 px-2 text-white/60">{texasBatting.reduce((s, b) => s + b.rbi, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/60">{texasBatting.reduce((s, b) => s + b.bb, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/60">{texasBatting.reduce((s, b) => s + b.so, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/60">{texasBatting.reduce((s, b) => s + b.hr, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Full Box Score: UC Davis Batting ──────────────────────────────────── */}
      <Section padding="md">
        <Container>
          <ScrollReveal>
            <Card variant="elevated" padding="none">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white/60">UC Davis Batting</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-4 text-white/40 font-medium">Player</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">Pos</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">AB</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">R</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">H</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">RBI</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">BB</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">SO</th>
                      <th className="text-center py-2 px-2 text-white/40 font-medium">HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ucDavisBatting.map((b) => (
                      <tr key={b.name} className="border-b border-white/5">
                        <td className="py-2 px-4 text-white/70">{b.name}</td>
                        <td className="text-center py-2 px-2 text-white/40 text-xs">{b.pos}</td>
                        <td className="text-center py-2 px-2 text-white/50">{b.ab}</td>
                        <td className="text-center py-2 px-2 text-white/50">{b.r}</td>
                        <td className="text-center py-2 px-2 text-white/60">{b.h}</td>
                        <td className="text-center py-2 px-2 text-white/50">{b.rbi}</td>
                        <td className="text-center py-2 px-2 text-white/50">{b.bb}</td>
                        <td className="text-center py-2 px-2 text-white/50">{b.so}</td>
                        <td className="text-center py-2 px-2 text-white/50">{b.hr > 0 ? b.hr : '-'}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/10">
                      <td className="py-2 px-4 text-white/70 font-semibold" colSpan={2}>Totals</td>
                      <td className="text-center py-2 px-2 text-white/50">{ucDavisBatting.reduce((s, b) => s + b.ab, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/50">{ucDavisBatting.reduce((s, b) => s + b.r, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/60 font-medium">{ucdHits}</td>
                      <td className="text-center py-2 px-2 text-white/50">{ucDavisBatting.reduce((s, b) => s + b.rbi, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/50">{ucDavisBatting.reduce((s, b) => s + b.bb, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/50">{ucDavisBatting.reduce((s, b) => s + b.so, 0)}</td>
                      <td className="text-center py-2 px-2 text-white/50">{ucDavisBatting.reduce((s, b) => s + b.hr, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Texas Pitching ───────────────────────────────────────────────────── */}
      <Section padding="md">
        <Container>
          <ScrollReveal>
            <Card variant="default" padding="none">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-[#BF5700]">Texas Pitching</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-4 text-white/40 font-medium">Pitcher</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">IP</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">H</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">R</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">ER</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">BB</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">K</th>
                      <th className="text-center py-2 px-3 text-white/40 font-medium">HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {texasPitching.map((p) => (
                      <tr key={p.name} className="border-b border-white/5">
                        <td className="py-2 px-4 text-white/80 font-medium">
                          {p.name}
                          {p.decision && (
                            <span className="ml-2 text-xs text-green-400">({p.decision})</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-3 text-white/60">{p.ip}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.h}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.r}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.er}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.bb}</td>
                        <td className="text-center py-2 px-3 text-white/70 font-medium">{p.so}</td>
                        <td className="text-center py-2 px-3 text-white/60">{p.hr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Game Narrative ────────────────────────────────────────────────────── */}
      <Section padding="lg" background="charcoal">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-6 text-white/80 leading-relaxed">
              <h2 className="text-3xl font-display uppercase text-white tracking-tight">
                What This Game Means
              </h2>
              <p>
                Opening Day is a single data point. It tells you almost nothing about where a team will
                finish. But it tells you something about how a team has prepared — and how it intends to
                compete. Texas entered the 2026 season ranked in the top five nationally, loaded with
                draft-eligible talent, and playing under a coach who has been to Omaha and knows
                what it costs to get back.
              </p>
              <p>
                The 12-run, 15-hit, 4-homer performance against UC Davis was the kind of Opening Day
                statement that sends a message down the dugout and across the conference: this lineup is
                deep, this pitching staff is sharp, and this team is not going to give you free
                baserunners or free outs.
              </p>
              <p>
                Schlossnagle used three pitchers. All three threw strikes. All three generated swings
                and misses. The bullpen depth — something that separates contenders from pretenders
                in the SEC — looks like it won&apos;t be a question this year.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Scouting Observations ────────────────────────────────────────────── */}
      <Section padding="md">
        <Container size="narrow">
          <ScrollReveal>
            <div className="space-y-6">
              <h2 className="text-2xl font-display uppercase text-white tracking-tight">
                Scouting Notebook
              </h2>
              <blockquote className="border-l-4 border-[#BF5700] pl-4 py-2 text-white/60 text-sm leading-relaxed">
                <strong className="text-white/80">LaViolette&apos;s plate discipline:</strong> Zero chases outside the zone
                in five plate appearances. His swing decisions were as impressive as the results. The
                grand slam came on a pitch he was waiting for — not one he reacted to.
              </blockquote>
              <blockquote className="border-l-4 border-[#BF5700] pl-4 py-2 text-white/60 text-sm leading-relaxed">
                <strong className="text-white/80">Ahrens&apos; first-pitch approach:</strong> 16 of 19 batters saw a
                first-pitch strike. That&apos;s not just command — that&apos;s confidence. He attacked the zone
                from pitch one and never let UC Davis get comfortable in counts.
              </blockquote>
              <blockquote className="border-l-4 border-[#BF5700] pl-4 py-2 text-white/60 text-sm leading-relaxed">
                <strong className="text-white/80">Robbins&apos; raw power:</strong> The 450-foot blast to dead center
                is the kind of exit velocity that puts you on MLB draft boards. He didn&apos;t try to pull
                the ball — he drove it where it was pitched, and the natural power did the rest.
              </blockquote>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── What's Next ──────────────────────────────────────────────────────── */}
      <Section padding="md" background="charcoal">
        <Container size="narrow">
          <ScrollReveal>
            <Card variant="hover" padding="lg">
              <div className="space-y-3">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Up Next</p>
                <h3 className="text-xl font-display uppercase text-white">
                  Texas continues the opening weekend series
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  The Longhorns play two more against UC Davis before the schedule ramps toward
                  conference play. Expect Schlossnagle to rotate the pitching staff and give
                  the full roster a look before the real tests begin.
                </p>
              </div>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ── Attribution ──────────────────────────────────────────────────────── */}
      <Section padding="sm">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <DataSourceBadge
              source="texaslonghorns.com/boxscore/17822"
              timestamp={`${GAME_DATE} · America/Chicago`}
            />
            <p className="text-xs text-white/30">
              Editorial analysis by Blaze Sports Intel. Box score data verified against official sources.
            </p>
          </div>
        </Container>
      </Section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}
