'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { GameRecapToolbar } from '@/components/editorial/GameRecapToolbar';
import { AIAnalysisPanel } from '@/components/editorial/AIAnalysisPanel';
import { NotebookLMExport } from '@/components/editorial/NotebookLMExport';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface PitchingLine {
  name: string;
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  pitches?: number;
  decision?: string;
}

interface InningScore {
  team: string;
  innings: (number | string)[];
  r: number;
  h: number;
  e: number;
}

/* ────────────────────────────────────────────
   Verified Game Data
   Sources: texaslonghorns.com box scores
   ──────────────────────────────────────────── */

// Game 1: Texas 12, UC Davis 2 (7 inn, 10-run rule)
const game1LineScore: InningScore[] = [
  { team: 'UC Davis', innings: [1, 0, 0, 0, 0, 0, 1], r: 2, h: 7, e: 1 },
  { team: 'Texas', innings: [0, 0, 3, 0, 4, 0, 5], r: 12, h: 11, e: 0 },
];


// Game 2: Texas 6, UC Davis 4
const game2LineScore: InningScore[] = [
  { team: 'UC Davis', innings: [2, 0, 0, 0, 0, 0, 0, 2, 0], r: 4, h: 6, e: 1 },
  { team: 'Texas', innings: [0, 0, 0, 0, 4, 2, 0, 0, 'X'], r: 6, h: 8, e: 1 },
];

const game2TexasPitching: PitchingLine[] = [
  { name: 'Luke Harrison', ip: '5.1', h: 5, r: 2, er: 2, bb: 2, so: 6, pitches: 90, decision: 'W (1-0)' },
  { name: 'Thomas Burns', ip: '1.2', h: 0, r: 0, er: 0, bb: 2, so: 4, pitches: 27 },
  { name: 'Jack Higgins', ip: '1.2', h: 1, r: 2, er: 1, bb: 2, so: 3, pitches: 40 },
  { name: 'Hudson Hamilton', ip: '0.1', h: 0, r: 0, er: 0, bb: 0, so: 1, pitches: 5, decision: 'SV (1)' },
];

// Game 3: Texas 9, UC Davis 1
const game3LineScore: InningScore[] = [
  { team: 'UC Davis', innings: [0, 0, 0, 0, 0, 1, 0, 0, 0], r: 1, h: 2, e: 1 },
  { team: 'Texas', innings: [0, 1, 6, 0, 0, 0, 1, 1, 'X'], r: 9, h: 11, e: 3 },
];

const game3TexasPitching: PitchingLine[] = [
  { name: 'Dylan Volantis', ip: '7.0', h: 1, r: 1, er: 0, bb: 1, so: 8, pitches: 78, decision: 'W (1-0)' },
  { name: 'Michael Winter', ip: '2.0', h: 1, r: 0, er: 0, bb: 0, so: 2 },
];

// Series key performers
const performers = [
  { name: 'Ethan Mendoza', pos: '2B', label: 'Series MVP', line: '6-12, 2 HR, 7 RBI, 3 BB', context: '.500 BA, 1.563 OPS — authored the biggest swing in two of three games' },
  { name: 'Dylan Volantis', pos: 'LHP', label: 'SEC Co-POTW', line: '7.0 IP, 1 H, 0 ER, 8 K', context: 'No-hitter into the 6th. Retired 14 of first 16. Conference weekly honors.' },
  { name: 'Anthony Pack Jr.', pos: 'RF', label: 'Table-Setter', line: '6-11 (.545), 2 BB, 5 R', context: 'Constant traffic from the bottom of the order — kept turning it over for the top' },
  { name: 'Aiden Robbins', pos: 'CF', label: 'Portal Impact', line: '5-11 (.455), HR, 4 RBI, 2 SB', context: '450-foot debut HR over YETI Yard. Impacted every game with power and legs.' },
  { name: 'Adrian Rodriguez', pos: 'SS', label: 'Leverage Hitter', line: 'Bases-clearing 2B (G3), RBI 1B (G1)', context: 'Two of the highest-leverage at-bats all weekend — both converted' },
  { name: 'Luke Harrison', pos: 'LHP', label: 'Saturday Arm', line: '5.1 IP, 2 ER, 6 K (90P)', context: 'Worked through a 2-0 deficit and kept the game winnable for the offense' },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM / sharing
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `Texas Week 1 Recap: 27 Runs. One Hit Allowed by Volantis. The Opening Statement.

No. 3 Texas swept UC Davis 3-0 at UFCU Disch-Falk Field, outscoring the Aggies 27-7 across three games to open the 2026 season.

SERIES RESULTS:
Game 1 (Feb 13): Texas 12, UC Davis 2 (7 innings, 10-run rule) — Riojas W
Game 2 (Feb 14): Texas 6, UC Davis 4 — Harrison W, Hamilton SV
Game 3 (Feb 15): Texas 9, UC Davis 1 — Volantis W (SEC Co-Pitcher of the Week)

SERIES STATS:
Team BA: .330 (30-for-91) | Staff ERA: 1.80 | Run Differential: +20
Walks: 25 vs 19 K | OBP: .460+ | Starter WHIP: 0.75

KEY PERFORMERS:
Ethan Mendoza (2B): 6-12, 2 HR, 7 RBI, 1.563 OPS — drove in runs in all three games
Dylan Volantis (LHP): 7.0 IP, 1 H, 0 ER, 8 K — no-hitter into the 6th, SEC Co-POTW
Anthony Pack Jr. (RF): 6-11 (.545), 5 R — constant traffic from the nine-hole
Aiden Robbins (CF): 5-11 (.455), HR (450ft), 4 RBI, 2 SB — Notre Dame transfer
Luke Harrison (LHP): 5.1 IP, 2 ER, 6 K — won Saturday despite 2-0 hole

GAME 1 CAPSULE:
Riojas settled after a rocky first (UC Davis 1-0 lead), then dominated the middle innings. Robbins announced himself with a 450-foot HR in the 3rd. Pack Jr. catalyzed every rally (3-4, 2 RBI). Mendoza's walk-off 3-run HR in the 7th triggered the run rule. Texas hit .367, drew 7 BB, committed 0 errors.

GAME 2: THE COMPETITIVE ONE:
Texas trailed 2-0 through four. Harrison worked through it — 90 pitches, 6 K. The 5th inning flipped everything: Mendoza crushed a game-tying HR (417 feet, 108 mph), then a sacrifice fly and double-steal sequence manufactured two more. Burns threw 4K in relief, Higgins worked through a rough 8th, and Hamilton struck out the last man for the save. Texas drew 9 walks.

GAME 3: VOLANTIS DOMINANCE:
Sunday was the ceiling game. Volantis carried a no-hitter into the 6th, retired 14 of his first 16 batters, and threw 78 pitches across 7 innings of one-hit ball. Rodriguez's bases-clearing double in a 6-run 3rd (11 batters to the plate) broke it open. Michael Winter made his collegiate debut with 2 scoreless innings. Volantis earned SEC Co-Pitcher of the Week honors alongside Oklahoma's Cord Rager and Florida's Cash Strayer.

WHAT THIS SERIES TOLD US:
1. Free bases were a feature, not a fluke — 25 BB compressed variance and turned "one run" innings into "four run" innings
2. The rotation is set: Riojas (Friday), Harrison (Saturday), Volantis (Sunday) — 0.75 starter WHIP
3. Portal additions are real: Robbins (Notre Dame), Becerra (Stanford), Tinney, Larson (LSU) all contributed immediately
4. Bullpen depth is elite: Burns (4K), Higgins (3K), Hamilton (SV), Winter (debut) — four arms who can hold any lead

BSI VERDICT:
Texas did what an elite team is supposed to do in Week 1: dominate the controllables, bank three wins, and reveal a clear identity. One cleanup item — four errors, three in the finale — but the pitching absorbed it without consequence.

UP NEXT:
Tuesday, Feb 17: Lamar at Texas (5 PM CT, UFCU Disch-Falk Field, SEC Network+)
Lamar is 2-1 (WAC) after splitting with Oakland. Capable midweek opponent.

Weekend 2 (Feb 20-22): Michigan State at Texas
MSU took a series at No. 8 Louisville (2-1). Parker Picot had 8 RBI in Game 2. Seymour HR'd in the upset opener. First MSU series win at Louisville since 1993. Louisville dropped from #8 to #15. This is Texas' first real test — the first series where the opponent won't blink.

Fri 6:30 PM | Sat 2:00 PM | Sun 12:00 PM — all at UFCU Disch-Falk Field.

Source: texaslonghorns.com, msuspartans.com, lamarcardinals.com | Blaze Sports Intel | February 16, 2026 CT`;

const GAME_CONTEXT = `Texas swept UC Davis 3-0 in Week 1 of the 2026 season at UFCU Disch-Falk Field, Austin TX. Series totals: 27-7 runs, .330 BA (30-91), 25 BB vs 19 K, OBP .460+, staff ERA 1.80, starter WHIP 0.75.

Game 1 (Feb 13): Texas 12, UC Davis 2 (7 inn, run rule). Riojas W (5.0 IP, 4H, 1ER, 6K, 78P). Robbins 2-run HR (450ft), Mendoza walk-off 3-run HR. Pack Jr 3-4, 2 RBI.
Game 2 (Feb 14): Texas 6, UC Davis 4. Harrison W (5.1 IP, 5H, 2ER, 6K, 90P). Mendoza 3-4, HR (417ft/108mph), 3 RBI. Burns 4K in relief. Hamilton SV. Texas trailed 2-0, scored 6 unanswered. 9 BB drawn.
Game 3 (Feb 15): Texas 9, UC Davis 1. Volantis W (7.0 IP, 1H, 0ER, 8K, 78P) — SEC Co-Pitcher of the Week. No-hitter into 6th, retired 14 of first 16. Rodriguez bases-clearing 2B in 6-run 3rd. Winter 2.0 IP in collegiate debut.

Series performers: Mendoza 6-12, 2 HR, 7 RBI, 1.563 OPS. Pack Jr 6-11 (.545), 5 R. Robbins 5-11, HR, 4 RBI, 2 SB. Starter WHIP: 0.75 across 17.1 IP.

Next: Tuesday vs Lamar (2-1, WAC, Beaumont TX). Then Weekend 2 vs Michigan State (2-1, took series at No. 8 Louisville — Picot 8 RBI in Game 2, Seymour HR in Game 1 upset). MSU Coach Jake Boss Jr. (18th season). Louisville dropped #8 to #15, first home opening series loss since 2011.

Context: Texas won SEC in Year One (2025). Preseason No. 3. Key returnees: Mendoza (.333), Rodriguez (.313), Volantis (1.94 ERA). Portal: Robbins (Notre Dame), Becerra (Stanford), Tinney, Larson (LSU). Jim Schlossnagle HC.`;

/* ────────────────────────────────────────────
   Helper components
   ──────────────────────────────────────────── */

function LineScoreTable({ scores, label }: { scores: InningScore[]; label: string }) {
  const inningCount = scores[0].innings.length;
  return (
    <Card variant="default" padding="none">
      <div className="bg-burnt-orange/5 text-center py-2">
        <span className="font-display text-[10px] uppercase tracking-[3px] text-burnt-orange">
          {label}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead>
            <tr className="font-display text-[11px] uppercase tracking-widest text-text-muted bg-black/30">
              <th className="text-left py-2.5 px-4 w-36" />
              {Array.from({ length: inningCount }, (_, i) => (
                <th key={i} className="text-center py-2.5 w-10">{i + 1}</th>
              ))}
              <th className="text-center py-2.5 w-12 border-l border-border-subtle">R</th>
              <th className="text-center py-2.5 w-12">H</th>
              <th className="text-center py-2.5 w-12">E</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {scores.map((row) => {
              const isTexas = row.team === 'Texas';
              return (
                <tr key={row.team} className="border-t border-border-subtle">
                  <td className={`py-3 px-4 font-display text-sm font-semibold uppercase tracking-wide ${isTexas ? 'text-burnt-orange' : 'text-text-tertiary'}`}>
                    {row.team}
                  </td>
                  {row.innings.map((val, i) => (
                    <td key={i} className={`text-center py-3 ${typeof val === 'string' ? 'text-text-muted' : Number(val) > 0 ? (isTexas ? 'text-text-primary font-semibold' : 'text-text-secondary font-medium') : 'text-text-muted'}`}>
                      {val}
                    </td>
                  ))}
                  <td className={`text-center py-3 border-l border-border-subtle font-bold text-lg ${isTexas ? 'text-burnt-orange' : 'text-text-tertiary'}`}>
                    {row.r}
                  </td>
                  <td className="text-center py-3 text-text-muted">{row.h}</td>
                  <td className="text-center py-3 text-text-muted">{row.e}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PitchingTable({ pitchers, teamLabel }: { pitchers: PitchingLine[]; teamLabel: string }) {
  return (
    <div>
      <h3 className="font-display text-sm uppercase tracking-wider text-burnt-orange mb-3">{teamLabel} Pitching</h3>
      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] font-mono text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-black/20">
                <th className="text-left py-2 px-3">Pitcher</th>
                <th className="text-center py-2 w-10">IP</th>
                <th className="text-center py-2 w-8">H</th>
                <th className="text-center py-2 w-8">R</th>
                <th className="text-center py-2 w-8">ER</th>
                <th className="text-center py-2 w-8">BB</th>
                <th className="text-center py-2 w-8">K</th>
                <th className="text-center py-2 w-10">P</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map((p) => (
                <tr key={p.name} className="border-t border-border-subtle">
                  <td className="py-2 px-3 text-text-secondary">
                    {p.name}
                    {p.decision && <span className="text-burnt-orange ml-1 text-xs">({p.decision})</span>}
                  </td>
                  <td className="text-center text-text-tertiary">{p.ip}</td>
                  <td className="text-center text-text-muted">{p.h}</td>
                  <td className="text-center text-text-muted">{p.r}</td>
                  <td className="text-center text-text-muted">{p.er}</td>
                  <td className="text-center text-text-muted">{p.bb}</td>
                  <td className="text-center text-text-primary font-medium">{p.so}</td>
                  <td className="text-center text-text-muted">{p.pitches ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function TexasWeek1RecapPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-week-1-recap';

  const openAI = (model: 'claude' | 'gemini' = 'claude') => {
    setAiDefaultModel(model);
    setAiOpen(true);
  };

  return (
    <>
      <main id="main-content">
        {/* ── Breadcrumb ── */}
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
              <span className="text-text-secondary">Texas Week 1</span>
            </nav>
          </Container>
        </Section>

        {/* ── Hero ── */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-texas-soil/12 via-transparent to-burnt-orange/6 pointer-events-none" />
          <div className="absolute -top-24 -right-48 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(191,87,0,0.06)_0%,transparent_70%)] pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="primary">Week 1 Recap</Badge>
                  <Badge variant="accent">No. 3 Texas</Badge>
                  <Badge variant="outline">3-0</Badge>
                  <span className="font-mono text-xs text-text-muted">Sweep</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-gradient-blaze text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-1">
                    27 Runs. One Hit Allowed by Volantis.
                  </span>
                  <span className="block text-text-primary text-2xl sm:text-3xl md:text-4xl mt-2">
                    The Opening Statement.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-text-tertiary italic leading-relaxed mb-6">
                  Texas swept UC Davis 27-7 behind a rotation that posted a 0.75 WHIP, a lineup that drew 25 walks in three games, and a Sunday starter who carried a no-hit bid into the sixth. Volantis earned SEC Co-Pitcher of the Week. Now comes Lamar on Tuesday and Michigan State &mdash; fresh off an upset series at No. 8 Louisville &mdash; for Weekend 2.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted tracking-wide">
                  <span>February 13&ndash;15, 2026</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>UFCU Disch-Falk Field</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>3 Games</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Austin, TX</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-muted mt-4">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>~15 min read</span>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Toolbar ── */}
        <GameRecapToolbar
          onOpenAI={() => openAI('claude')}
          articleText={ARTICLE_TEXT}
          articleUrl={articleUrl}
        />

        {/* ── Series Stat Cards ── */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Series BA" value=".330" helperText="30-for-91" />
                <StatCard label="Staff ERA" value="1.80" helperText="5 ER in 25 IP" />
                <StatCard label="Run Diff" value="+20" helperText="27 scored, 7 allowed" />
                <StatCard label="Mendoza OPS" value="1.563" helperText="6-12, 2 HR, 7 RBI" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                Texas walked out of Opening Weekend 3-0, outscoring UC Davis 27-7, and doing it with two traits that usually age well: strike-throwing starters and a lineup that refused to chase early-count outs. If Week 1 is about establishing a baseline, this one was loud.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-secondary mb-6">
                The Longhorns posted <strong className="text-text-primary">25 walks against 19 strikeouts</strong>, hit .330 as a team, and opened the year with an on-base percentage north of .460. The rotation set the tone &mdash; 0.75 starter WHIP across 17.1 innings &mdash; and the offense repeatedly turned &ldquo;one run&rdquo; innings into &ldquo;four run&rdquo; innings.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-tertiary">
                Three different games, three different shapes, one consistent identity. That&rsquo;s the takeaway worth holding.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 1 Capsule ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 1: Texas 12, UC Davis 2
                </h2>
                <span className="font-mono text-xs text-text-muted">7 inn &middot; 10-run rule</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game1LineScore} label="Final &mdash; 7 Innings (10-Run Rule)" />
              </div>

              <Container size="narrow">
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4 mb-6">
                  <p>
                    The opener looked like a normal feel-out game until it didn&rsquo;t. UC Davis grabbed a 1-0 lead in the first, Riojas settled and dominated the middle innings (6 K in 5.0 IP on just 78 pitches), and then Texas detonated: a three-spot in the third on Robbins&rsquo; 450-foot HR and Rodriguez&rsquo;s RBI single, a four-run fifth built on walks and small ball, and a five-run seventh capped by Mendoza&rsquo;s walk-off three-run blast to trigger the run rule.
                  </p>
                  <p className="text-text-tertiary">
                    Pack Jr. went 3-for-4 with 2 RBI and a stolen base from the nine-hole. Texas hit .367, drew 7 walks, and committed zero errors.
                  </p>
                </div>

                <Link
                  href="/college-baseball/editorial/texas-uc-davis-opener-2026"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-burnt-orange hover:text-ember transition-colors"
                >
                  Full Game 1 Recap &rarr;
                </Link>
              </Container>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 2: The Competitive One ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 2: Texas 6, UC Davis 4
                </h2>
                <span className="font-mono text-xs text-text-muted">Saturday &middot; Feb 14</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game2LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    This one required real work. UC Davis hung a deuce in the first off Harrison and Texas spent four innings punching air &mdash; trailing 2-0 through four complete. Harrison kept dealing despite the deficit: 90 pitches, 6 strikeouts, and enough composure to keep his team within striking distance. The bullpen would need to be good. The offense would need to be better.
                  </p>

                  <p>
                    The fifth inning flipped everything. Mendoza crushed a game-tying two-run homer &mdash; 417 feet, 108 mph off the bat &mdash; and the air at Disch-Falk shifted from patient to predatory. A sacrifice fly, then an aggressive double-steal sequence that manufactured an extra run, and suddenly Texas led 4-2. They tacked on two more in the sixth. The deficit was gone.
                  </p>

                  <blockquote className="border-l-[3px] border-burnt-orange pl-6 my-8 font-serif italic text-xl text-[#C9A96E] leading-relaxed">
                    &ldquo;You do not need three hits in an inning if you are willing to accept two walks and a sacrifice fly. That fifth inning was the weekend&rsquo;s micro-thesis in action.&rdquo;
                  </blockquote>

                  <p>
                    The bullpen chain held. Burns came in and struck out four in 1.2 innings of hitless relief. Higgins worked through a two-run eighth &mdash; UC Davis made him earn it with a pair of walks and an RBI single &mdash; but he struck out three to limit the damage. Hamilton inherited two runners in the ninth, threw five pitches, and struck out the final batter to collect the save.
                  </p>

                  <p className="text-text-tertiary">
                    Texas drew 9 walks against 8 strikeouts. Nine free bases in a game you trailed 2-0 &mdash; that&rsquo;s how a lineup erases a deficit without needing to string together five singles.
                  </p>
                </div>
              </ScrollReveal>
            </Container>

            <ScrollReveal direction="up" delay={150}>
              <div className="mt-8">
                <PitchingTable pitchers={game2TexasPitching} teamLabel="Texas" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 3: Volantis Dominance ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 3: Texas 9, UC Davis 1
                </h2>
                <span className="font-mono text-xs text-text-muted">Sunday &middot; Feb 15</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game3LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Sunday was the ceiling game. If Friday was the proof of concept and Saturday was the stress test, Volantis turned Sunday into a statement of dominance: <strong className="text-text-primary">7.0 innings, 1 hit, 0 earned runs, 8 strikeouts on 78 pitches.</strong> He carried a no-hitter into the sixth inning, retired 14 of his first 16 batters, and threw with the efficiency of a pitcher who knew exactly what he wanted to do and did it.
                  </p>

                  <p>
                    The offense didn&rsquo;t wait. A single run in the second put Texas on the board, and then the third inning detonated: 11 batters came to the plate, six runs scored, and the game was functionally over before Volantis had broken a sweat. Rodriguez&rsquo;s bases-clearing double was the blow that broke it open &mdash; a line drive into the right-center gap that emptied the bases and silenced any remaining competitive tension.
                  </p>

                  <p>
                    Michael Winter closed it out with two scoreless innings in his collegiate debut. Two strikeouts, one hit, no nerves. That&rsquo;s a freshman pitching in a game that was already won, but doing it cleanly still matters &mdash; it tells the coaching staff they have another arm they can trust.
                  </p>
                </div>
              </ScrollReveal>

              {/* SEC Co-Pitcher of the Week callout */}
              <ScrollReveal direction="up" delay={150}>
                <div className="bg-[#C9A227]/8 border border-[#C9A227]/20 rounded p-6 my-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-display text-[11px] uppercase tracking-[3px] text-[#C9A227]">
                      SEC Co-Pitcher of the Week
                    </div>
                  </div>
                  <div className="font-display text-lg font-semibold text-text-primary uppercase tracking-wide mb-1">
                    Dylan Volantis
                  </div>
                  <div className="font-mono text-sm text-[#C9A227] mb-3">
                    7.0 IP &middot; 1 H &middot; 0 ER &middot; 8 K &middot; 78 P
                  </div>
                  <p className="font-serif text-sm text-text-tertiary leading-relaxed">
                    Shared with Oklahoma&rsquo;s Cord Rager and Florida&rsquo;s Cash Strayer. Volantis&rsquo; no-hit bid into the sixth was the weekend&rsquo;s cleanest pitching sentence across the SEC.
                  </p>
                </div>
              </ScrollReveal>
            </Container>

            <ScrollReveal direction="up" delay={200}>
              <div className="mt-4">
                <PitchingTable pitchers={game3TexasPitching} teamLabel="Texas" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Key Performers ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Week 1 Performers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {performers.map((p) => (
                  <div
                    key={p.name}
                    className="relative bg-gradient-to-br from-[#2A2A2A]/90 to-charcoal/95 border border-burnt-orange/10 hover:border-burnt-orange/25 rounded p-5 pl-7 overflow-hidden transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-[3px] h-full bg-burnt-orange" />
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="font-display text-base font-semibold uppercase tracking-wide text-[#FAF7F2]">
                        {p.name}
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded">
                        {p.label}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-burnt-orange mb-2">
                      {p.pos}
                    </div>
                    <div className="font-mono text-[13px] text-text-muted leading-relaxed">
                      <span className="text-ember font-medium">{p.line}</span>
                      <br />
                      {p.context}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── What This Series Told Us ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-5 pb-2 border-b border-burnt-orange/15">
                What This Series Actually Told Us
              </h2>

              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-8">
                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-text-primary mb-3">
                    1. Free Bases Were a Feature, Not a Fluke
                  </h3>
                  <p>
                    Texas drew 7 walks in the opener, then doubled down with 9 on Saturday and 9 more on Sunday. Twenty-five walks in three games, and it matters because it compresses variance. You don&rsquo;t need three hits in an inning when you&rsquo;re willing to accept two walks and a sacrifice fly. The lineup has no soft spot &mdash; 1 through 9, every at-bat was competitive &mdash; and that OBP (.460+) is the kind of baseline that holds up against better pitching.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-text-primary mb-3">
                    2. The Rotation Is Set: Riojas&ndash;Harrison&ndash;Volantis
                  </h3>
                  <p>
                    Across three starts, Texas got 17.1 innings, 9 hits, 4 walks, and 23 strikeouts. That 0.75 starter WHIP isn&rsquo;t small-sample hype &mdash; it&rsquo;s a real foundation. Riojas showed he can handle the Friday spot (settled after a rocky first, dominant middle innings). Harrison proved the Saturday role (worked through a 2-0 deficit, kept the game winnable). Volantis was the weekend&rsquo;s cleanest sentence. Each starter handed the bullpen clean innings. That&rsquo;s the structure you build an SEC schedule around.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-text-primary mb-3">
                    3. The Portal Additions Are Real
                  </h3>
                  <p>
                    Robbins from Notre Dame: .455 with a HR, 4 RBI, and 2 stolen bases. Becerra from Stanford: a quiet, settled presence at third. Tinney drew walks behind Robbins &mdash; the lineup protection was already working by Game 1. Larson contributed an RBI double in Saturday&rsquo;s comeback. Schlossnagle didn&rsquo;t just add names from the portal. He added fits. And the chemistry showed from the first inning on &mdash; no one looked like they were playing for a new team.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-text-primary mb-3">
                    4. Bullpen Depth Is Elite
                  </h3>
                  <p>
                    Burns threw 4 K in hitless Saturday relief. Higgins worked through pressure and struck out 3. Hamilton closed the door with a 5-pitch save. Winter debuted with 2 scoreless. Grubbs induced a double play in the opener. That&rsquo;s five arms behind the rotation who can all hold a lead, and none of them looked like they were reaching. When your starters are efficient enough to let the bullpen stay fresh, and your bullpen is deep enough to handle the rare high-stress handoff, the pitching staff is built correctly.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-charcoal text-burnt-orange px-3">
                  BSI Verdict &mdash; Week 1
                </div>
                <div className="font-serif text-lg sm:text-xl leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    Texas did what an elite team is supposed to do in Week 1: dominate the controllables, bank three wins, and reveal a clear identity. The walk edge, the starter WHIP, the 1-through-9 production &mdash; these are repeatable traits, not small-sample noise.
                  </p>
                  <p>
                    One cleanup item: four errors across three games, including three in the Sunday finale. The good news is the pitching and walk volume created enough margin that it never became a story. The better news is that this is usually fixable in February and March &mdash; not a roster-level limitation.
                  </p>
                  <p>
                    Now the calendar starts asking harder questions. Tuesday&rsquo;s Lamar game is about maintaining standards. Weekend 2 against Michigan State is about validating them.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Lamar Preview ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-burnt-orange">Tuesday Preview</span>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card variant="default" padding="lg">
                  <div className="text-center space-y-3 mb-6">
                    <h3 className="font-display text-xl uppercase tracking-wider text-text-primary">
                      Lamar at No. 3 Texas
                    </h3>
                    <div className="font-mono text-sm text-burnt-orange">
                      Tuesday, February 17 &middot; 5:00 PM CT &middot; SEC Network+
                    </div>
                    <div className="font-mono text-xs text-text-muted">
                      UFCU Disch-Falk Field &middot; Austin, TX
                    </div>
                  </div>

                  <div className="border-t border-border-subtle pt-5">
                    <h4 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-3">
                      What Lamar Is Bringing to Austin
                    </h4>
                    <div className="font-serif text-base text-text-secondary leading-relaxed space-y-3">
                      <p>
                        Lamar opened 2-1, splitting a home series against Oakland &mdash; wins of 8-2 and 9-7 before a 3-2 loss in 10 innings. The WAC program out of Beaumont received Baseball America preseason national attention and plays with a profile you&rsquo;d expect from a capable midweek opponent: they can score in chunks and are comfortable playing close late.
                      </p>
                      <p className="text-text-tertiary">
                        In Lamar&rsquo;s opener, Beau Durbin&rsquo;s two-run double and Tab Tracy&rsquo;s two-RBI single turned the second inning into a separator. That&rsquo;s the kind of damage Texas&rsquo; midweek arm needs to prevent.
                      </p>
                    </div>

                    <div className="bg-surface-light border border-border-subtle rounded p-4 mt-5">
                      <h4 className="font-display text-[11px] uppercase tracking-[3px] text-burnt-orange mb-3">
                        Keys for Texas
                      </h4>
                      <div className="font-serif text-sm text-text-tertiary leading-relaxed space-y-2">
                        <p><strong className="text-text-secondary">Keep the walk edge.</strong> Week 1&rsquo;s plate discipline is a repeatable advantage in midweeks, where pitching plans are usually thinner.</p>
                        <p><strong className="text-text-secondary">Win the first pitch.</strong> Lamar&rsquo;s best path is early-count damage. If Texas&rsquo; staff gets strike one, it forces the game into Texas&rsquo; depth.</p>
                        <p><strong className="text-text-secondary">Play clean.</strong> Midweeks are where extra outs become cheap runs. Routine plays, clean defense &mdash; the errors from Sunday need to stay in Sunday.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Michigan State Preview ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#C9A227]">Weekend 2 Preview</span>
              </div>

              <div className="max-w-3xl mx-auto">
                <h3 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary text-center mb-2">
                  Michigan State at No. 3 Texas
                </h3>
                <div className="text-center font-mono text-sm text-burnt-orange mb-8">
                  February 20&ndash;22 &middot; UFCU Disch-Falk Field
                </div>

                {/* MSU at Louisville breakdown */}
                <div className="mb-8">
                  <h4 className="font-display text-sm uppercase tracking-wider text-[#C9A227] mb-4 pb-2 border-b border-[#C9A227]/15">
                    What Michigan State Just Did at Louisville
                  </h4>
                  <div className="font-serif text-base text-text-secondary leading-relaxed space-y-4">
                    <p>
                      The Spartans took a road series from No. 8 Louisville, going 2-1. This is not a team that&rsquo;s going to blink at Disch-Falk.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-surface-light border border-border-subtle rounded p-4">
                        <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Game 1</div>
                        <div className="font-display text-lg font-bold text-text-primary">MSU 4, Louisville 3</div>
                        <div className="font-mono text-[11px] text-text-muted mt-1">
                          Seymour 2-4, 3 RBI, HR &middot; Broski HR &middot; Donovan 5 IP starter &middot; Szczepanski 1.1 IP, 3K save
                        </div>
                      </div>
                      <div className="bg-surface-light border border-border-subtle rounded p-4">
                        <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Game 2</div>
                        <div className="font-display text-lg font-bold text-text-primary">MSU 13, Louisville 4</div>
                        <div className="font-mono text-[11px] text-text-muted mt-1">
                          Parker Picot: 8 RBI &mdash; grand slam + 3-run HR
                        </div>
                      </div>
                      <div className="bg-surface-light border border-border-subtle rounded p-4">
                        <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Game 3</div>
                        <div className="font-display text-lg font-bold text-text-tertiary">Louisville 9, MSU 1</div>
                        <div className="font-mono text-[11px] text-text-muted mt-1">
                          Louisville salvaged the finale
                        </div>
                      </div>
                    </div>

                    <p className="text-text-tertiary">
                      It was Michigan State&rsquo;s first series win at Louisville since 1993. Louisville dropped from No. 8 to No. 15 &mdash; their first home opening series loss since 2011. Coach Jake Boss Jr., now in his 18th season at MSU, sent a message: the Spartans are capable of beating ranked teams on the road.
                    </p>
                  </div>
                </div>

                {/* MSU key players */}
                <div className="mb-8">
                  <h4 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-4 pb-2 border-b border-border">
                    Spartans to Watch
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Seymour', note: '2-4, 3 RBI, HR in opener' },
                      { name: 'Picot', note: '8 RBI day (GS + 3-run HR)' },
                      { name: 'Broski', note: 'HR in Game 1 upset' },
                      { name: 'Donovan', note: '5 IP, 3K — Game 1 starter' },
                    ].map((player) => (
                      <div key={player.name} className="bg-surface-light border border-border-subtle rounded p-3">
                        <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary">{player.name}</div>
                        <div className="font-mono text-[10px] text-text-muted mt-1">{player.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Series keys */}
                <div className="bg-surface-light border border-border-subtle rounded p-5 mb-8">
                  <h4 className="font-display text-[11px] uppercase tracking-[3px] text-burnt-orange mb-4">
                    Series Keys for Texas
                  </h4>
                  <div className="font-serif text-sm text-text-tertiary leading-relaxed space-y-3">
                    <p><strong className="text-text-secondary">Start fast offensively.</strong> Michigan State has already shown it can win on the road. Turning Disch into a factor early matters &mdash; don&rsquo;t let the Spartans settle into the rhythm they found at Louisville.</p>
                    <p><strong className="text-text-secondary">Protect the strike zone.</strong> The Spartans&rsquo; power plays if you give them free baserunners. Texas&rsquo; best version is simple: strike one, expand later. The 0.75 starter WHIP needs to hold.</p>
                    <p><strong className="text-text-secondary">Convert leverage at-bats.</strong> Texas created traffic all weekend. Against a better opponent, the separator is two-out execution, not total hits. The walks set the table &mdash; now the lineup needs to clear it.</p>
                  </div>
                </div>

                {/* Series schedule */}
                <Card variant="default" padding="md">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Game 1</div>
                      <div className="font-display text-sm font-semibold text-text-primary uppercase">Friday</div>
                      <div className="font-mono text-sm text-burnt-orange">6:30 PM CT</div>
                    </div>
                    <div>
                      <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Game 2</div>
                      <div className="font-display text-sm font-semibold text-text-primary uppercase">Saturday</div>
                      <div className="font-mono text-sm text-burnt-orange">2:00 PM CT</div>
                    </div>
                    <div>
                      <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Game 3</div>
                      <div className="font-display text-sm font-semibold text-text-primary uppercase">Sunday</div>
                      <div className="font-mono text-sm text-burnt-orange">12:00 PM CT</div>
                    </div>
                  </div>
                  <div className="text-center font-mono text-xs text-text-muted mt-3 pt-3 border-t border-border-subtle">
                    All games at UFCU Disch-Falk Field &middot; Austin, TX
                  </div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AI Features ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-burnt-orange">Powered by AI</span>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mt-2">
                  Go Deeper
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => openAI('claude')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-charcoal border border-burnt-orange/10 hover:border-burnt-orange/30 rounded transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-burnt-orange mb-1">Claude Analysis</div>
                  <div className="text-text-muted text-xs">Anthropic-powered series breakdown</div>
                </button>
                <button
                  onClick={() => openAI('gemini')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-charcoal border border-burnt-orange/10 hover:border-burnt-orange/30 rounded transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-burnt-orange mb-1">Gemini Analysis</div>
                  <div className="text-text-muted text-xs">Google-powered scouting insights</div>
                </button>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Podcast Export ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="text-center">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-text-muted block mb-2">NotebookLM Integration</span>
                <h3 className="font-display text-lg uppercase tracking-wider text-text-primary mb-4">
                  Turn This Recap Into a Podcast
                </h3>
                <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
                  One click copies the full recap to your clipboard and opens Google NotebookLM. Paste it in and generate an audio overview.
                </p>
                <NotebookLMExport articleText={ARTICLE_TEXT} />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Source Attribution ── */}
        <Section padding="md" className="border-t border-burnt-orange/10">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <DataSourceBadge source="texaslonghorns.com" timestamp="February 13-15, 2026 CT" />
                <DataSourceBadge source="msuspartans.com" timestamp="February 15, 2026 CT" />
                <DataSourceBadge source="lamarcardinals.com" timestamp="February 16, 2026 CT" />
              </div>
              <div className="font-mono text-[11px] text-text-muted leading-relaxed">
                Box scores sourced from Texas Longhorns official stats. Michigan State &amp; Lamar data from official athletic sites.
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  More Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/texas-uc-davis-opener-2026" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  Game 1 Full Recap &rarr;
                </Link>
                <Link href="/college-baseball/editorial/texas-2026" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  2026 Season Preview &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        gameContext={GAME_CONTEXT}
        defaultModel={aiDefaultModel}
      />
    </>
  );
}
