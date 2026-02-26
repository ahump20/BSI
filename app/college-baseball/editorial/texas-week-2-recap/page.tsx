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
   Sources: texaslonghorns.com, msuspartans.com box scores
   ──────────────────────────────────────────── */

// Game 1: Texas 8, Michigan State 1 (Friday, Feb 20)
const game1LineScore: InningScore[] = [
  { team: 'Michigan State', innings: [0, 0, 1, 0, 0, 0, 0, 0, 0], r: 1, h: 5, e: 0 },
  { team: 'Texas', innings: [0, 2, 0, 2, 2, 2, 0, 0, 'X'], r: 8, h: 11, e: 0 },
];

const game1TexasPitching: PitchingLine[] = [
  { name: 'Ruger Riojas', ip: '6.0', h: 3, r: 1, er: 1, bb: 1, so: 10, decision: 'W (2-0)' },
  { name: 'Michael Winter', ip: '1.0', h: 2, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Brett Crossland', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Brody Walls', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 2 },
];

// Game 2: Texas 3, Michigan State 1 (Saturday, Feb 21)
const game2LineScore: InningScore[] = [
  { team: 'Michigan State', innings: [0, 0, 1, 0, 0, 0, 0, 0, 0], r: 1, h: 5, e: 0 },
  { team: 'Texas', innings: [1, 0, 0, 0, 0, 0, 1, 1, 'X'], r: 3, h: 8, e: 0 },
];

const game2TexasPitching: PitchingLine[] = [
  { name: 'Luke Harrison', ip: '4.1', h: 4, r: 1, er: 0, bb: 1, so: 2 },
  { name: 'Haiden Leffew', ip: '0.2', h: 0, r: 0, er: 0, bb: 1, so: 0 },
  { name: 'Max Grubbs', ip: '3.0', h: 0, r: 0, er: 0, bb: 0, so: 2, decision: 'W (1-0)' },
  { name: 'Thomas Burns', ip: '1.0', h: 1, r: 0, er: 0, bb: 0, so: 3, decision: 'SV (1)' },
];

// Game 3: Texas 4, Michigan State 0 (Sunday, Feb 22)
const game3LineScore: InningScore[] = [
  { team: 'Michigan State', innings: [0, 0, 0, 0, 0, 0, 0, 0, 0], r: 0, h: 5, e: 0 },
  { team: 'Texas', innings: [2, 0, 1, 1, 0, 0, 0, 0, 'X'], r: 4, h: 9, e: 0 },
];

const game3TexasPitching: PitchingLine[] = [
  { name: 'Dylan Volantis', ip: '7.0', h: 5, r: 0, er: 0, bb: 1, so: 9, decision: 'W (2-0)' },
  { name: 'Brett Crossland', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 0 },
  { name: 'Thomas Burns', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 2 },
];

// Series key performers
const performers = [
  { name: 'Aiden Robbins', pos: 'CF', label: 'The Cycle', line: '4-4, HR, 3B, 2B, 1B (Sat)', context: 'First Longhorn to hit for the cycle since CJ Hinojosa in 2015. Eleven years between cycles.' },
  { name: 'Ethan Mendoza', pos: '2B', label: 'Run Producer', line: '3-4, 2 XBH, 2 RBI, HR (Fri)', context: 'Third home run in five games. The lineup protection behind Robbins keeps compounding.' },
  { name: 'Dylan Volantis', pos: 'LHP', label: 'Sunday Arm', line: '7.0 IP, 0 ER, 9 K (career high)', context: 'Back-to-back dominant Sundays. 14 IP, 0 ER, 17 K through two weekends. The closer-to-starter conversion is real.' },
  { name: 'Ruger Riojas', pos: 'RHP', label: 'Friday Ace', line: '6.0 IP, 1 ER, 10 K', context: 'From 5.61 ERA last season to dominant through two Friday starts. Ten strikeouts in six innings against a team that took a series at Louisville. The transformation is structural, not small-sample.' },
  { name: 'Carson Tinney', pos: 'C', label: 'On-Base Machine', line: '.316/.567/.684, 11 BB (T-6th nationally)', context: 'Sees more pitches per AB than anyone in the lineup. Protection that doesn\u2019t show up in batting average.' },
  { name: 'Jonah Williams', pos: 'DH', label: 'Sunday Impact', line: '2-3, 2B, RBI (Sun)', context: 'Drove in the game\u2019s first run in the bottom of the first. Quiet production that matters.' },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM / sharing
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `Texas Week 2 Recap: The Cycle, The Shutout, The Statement.

No. 3 Texas swept Michigan State 3-0 at UFCU Disch-Falk Field, outscoring the Spartans 15-2 across three games. Texas is 7-0 through two weekends.

SERIES RESULTS:
Game 1 (Feb 20): Texas 8, Michigan State 1 — Riojas W (10 K)
Game 2 (Feb 21): Texas 3, Michigan State 1 — Robbins hits for the cycle (4-4)
Game 3 (Feb 22): Texas 4, Michigan State 0 — Volantis W (7 IP, 9 K, career high)

SERIES STATS:
Series Run Diff: +13 (15-2) | Staff ERA (series): 0.33 | 1 earned run allowed in 27 IP

SEASON STATS (7-0):
Team BA: .321 | Team OPS: .986 | Staff ERA: 1.53 | WHIP: 0.86 | Run Diff: +43 (56-13)

KEY PERFORMERS:
Aiden Robbins (CF): 4-4, hit for the cycle Saturday — first Longhorn since CJ Hinojosa in 2015 (11 years)
Ethan Mendoza (2B): .462, 12 H, 3 HR, 9 RBI, 1.375 OPS through 7 games — best bat in the lineup
Dylan Volantis (LHP): 14 IP, 0 ER, 17 K, 2 BB through 2 starts — closer-to-starter conversion is dominant
Ruger Riojas (RHP): 11 IP, 2 ER, 19 K through 2 starts (10 K vs MSU) — 5.61 ERA last year to this
Carson Tinney (C): .316/.567/.684, 11 BB (tied 6th nationally) — elite on-base presence

GAME 1: TEXAS 8, MICHIGAN STATE 1 (FRIDAY):
Mendoza authored the offensive blueprint — 3-for-4 with 2 extra-base hits, 2 RBI, and his third home run in five games. Riojas struck out 10 in 6 innings of 1-run ball. Michigan State came in with Louisville series credibility. Riojas didn't care.

GAME 2: TEXAS 3, MICHIGAN STATE 1 (SATURDAY):
The pitching duel. Harrison battled through 4.1 innings (1R, 0ER), Leffew bridged to Grubbs who threw 3 scoreless for the win, Burns closed with a scoreless ninth for the save — and the offense did just enough, because Robbins did everything. Single in the 1st that drove in the game's first run, triple in the 3rd, double in the 6th, solo home run in the 8th. Four at-bats, four hits, four different types. First Longhorn to hit for the cycle since CJ Hinojosa against Kansas State on April 18, 2015. Eleven years.

GAME 3: TEXAS 4, MICHIGAN STATE 0 (SUNDAY):
Volantis threw the first shutout of the season — 7 innings, 5 hits, 0 earned runs, 9 strikeouts (career high). MSU put runners on but couldn't score. Through two Sunday starts: 14 IP, 0 ER, 17 K, 2 BB. The converted closer is pitching like a Friday-caliber arm on Sundays. Williams drove in the game's first run in the bottom of the first. Tinney doubled. Crossland and Burns closed with 2 scoreless.

BSI VERDICT — WEEK 2:
Michigan State came to Austin with Louisville series credibility — 2-1 at a Top 10 program. Texas allowed 2 total runs. The pitching staff has a 1.53 ERA through 7 games. The Riojas transformation (5.61 ERA to dominant) and Volantis closer-to-starter conversion are the pitching narratives that compound. The lineup doesn't have a hole — .321 team BA, .986 OPS, Mendoza hitting .462 with 3 HR. But the schedule is about to start asking real questions.

UP NEXT:
Tuesday, Feb 25: UTRGV at Texas — UTRGV beat Kansas in their opener and took 2-of-3 from Houston on the road. They can fight.

Bruce Bolt College Classic (Feb 27 - Mar 1): Daikin Park, Houston
Fri 7:05 PM: No. 3 Texas vs No. 11 Coastal Carolina (Cameron Flukey, Preseason NPOY)
Sat 7:05 PM: Texas vs Baylor (in-state rivalry)
Sun 2:05 PM: Texas vs Ohio State
Also in the field: Ole Miss (8-0, No. 1 RPI), UTSA (2025 AAC champ)
All games on Space City Home Network + free stream on Astros.com

The first real measuring stick after two weeks of home games.

Source: texaslonghorns.com, msuspartans.com, goutrgv.com, mlb.com/astros, d1baseball.com | Blaze Sports Intel | February 24, 2026 CT`;

const GAME_CONTEXT = `Texas swept Michigan State 3-0 in Week 2 of the 2026 season at UFCU Disch-Falk Field, Austin TX. Series totals: 15-2 runs, 0.33 series ERA, 1 earned run allowed in 27 IP.

Game 1 (Feb 20): Texas 8, Michigan State 1. Riojas W (6.0 IP, 3H, 1ER, 10K). Mendoza 3-4, 2 XBH, 2 RBI, 3rd HR in 5 games.
Game 2 (Feb 21): Texas 3, Michigan State 1. Grubbs W (3.0 IP, 0H, 0ER, 2K in relief). Harrison 4.1 IP, 4H, 1R(0ER). Leffew 0.2 IP bridge. Burns SV (1.0 IP, 3K). Robbins 4-4, hit for the cycle — single 1st, triple 3rd, double 6th, solo HR 8th. First Longhorn cycle since CJ Hinojosa, April 18 2015 vs Kansas State.
Game 3 (Feb 22): Texas 4, Michigan State 0. Volantis W (7.0 IP, 5H, 0ER, 9K — career high). Jonah Williams 2-3, 2B, RBI. Tinney 2B. Crossland + Burns 2.0 IP scoreless.

Season stats (7-0): .321 BA, .986 OPS, 1.53 ERA, 0.86 WHIP, 56-13 run differential.
Mendoza: .462, 12 H, 3 HR, 9 RBI, 1.375 OPS.
Tinney: .316/.567/.684, 11 BB (T-6th nationally).
Riojas: 11 IP, 2 ER, 19 K — 9 K vs UC Davis, 10 K vs MSU (5.61 ERA last season).
Volantis: 14 IP, 0 ER, 17 K, 2 BB (converted from closer — 12 SV, 1.94 ERA as freshman).

Next: Tuesday UTRGV (3-4, beat Kansas, 2-of-3 at Houston). Then Bruce Bolt College Classic (Feb 27 - Mar 1) at Daikin Park, Houston — No. 11 Coastal Carolina (Flukey, Preseason NPOY), Baylor, Ohio State. Also: Ole Miss (8-0, No. 1 RPI), UTSA.`;

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
                  <td className="text-center text-text-muted">{p.pitches ?? '\u2014'}</td>
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

export default function TexasWeek2RecapPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-week-2-recap';

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
              <span className="text-text-secondary">Texas Week 2</span>
            </nav>
          </Container>
        </Section>

        {/* ── Hero ── */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B4513]/12 via-transparent to-burnt-orange/6 pointer-events-none" />
          <div className="absolute -top-24 -right-48 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(191,87,0,0.06)_0%,transparent_70%)] pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="primary">Week 2 Recap</Badge>
                  <Badge variant="accent">No. 3 Texas</Badge>
                  <Badge variant="outline">7-0</Badge>
                  <span className="font-mono text-xs text-text-muted">Sweep</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-gradient-blaze text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-1">
                    The Cycle, The Shutout, The Statement.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-text-tertiary italic leading-relaxed mb-6">
                  Texas swept Michigan State 15-2 behind Robbins&rsquo; cycle &mdash; the first by a Longhorn in eleven years &mdash; a Volantis shutout with a career-high 9 K, and a pitching staff that allowed two total runs in three games. The Spartans came in with a Louisville series win on their resume. It didn&rsquo;t matter. Now comes Coastal Carolina and the first off-site test of the season.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted tracking-wide">
                  <span>February 20&ndash;22, 2026</span>
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
                  <span>~18 min read</span>
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
                <StatCard label="Series ERA" value="0.33" helperText="1 ER in 27 IP" />
                <StatCard label="Run Diff" value="+13" helperText="15 scored, 2 allowed" />
                <StatCard label="Staff K" value="32" helperText="32 K in 27 IP" />
                <StatCard label="Robbins" value="Cycle" helperText="4-4 Sat &mdash; 1st since 2015" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                Michigan State walked into Disch-Falk with a Louisville series win on their resume &mdash; the first Spartan series victory in Louisville since 1993. They left with two total runs across three games. The pitching staff struck out 32 batters in 27 innings. The offense manufactured 15 runs without needing a single crooked-number inning. This was a team that controlled every phase of every game.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-secondary mb-6">
                The headline moment was Robbins&rsquo; cycle on Saturday &mdash; the first by a Longhorn since CJ Hinojosa against Kansas State on April 18, 2015. But the structural takeaway lives in the pitching: <strong className="text-text-primary">1.53 staff ERA, 0.86 WHIP, and a rotation that has thrown 14 straight scoreless innings on Sundays</strong> through Dylan Volantis.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-tertiary">
                Two weekends down, two sweeps banked, and the identity keeps sharpening. The question is no longer whether this team is good. It&rsquo;s whether the schedule will reveal the ceiling.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 1: Texas 8, Michigan State 1 ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 1: Texas 8, Michigan State 1
                </h2>
                <span className="font-mono text-xs text-text-muted">Friday &middot; Feb 20</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game1LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Riojas set the tone in the first inning and never let it drift. Ten strikeouts in six innings of work, with the command to match the stuff. Michigan State managed three hits and one earned run, and even that felt like a concession rather than a crack. The line read like an ace&rsquo;s calling card: 6.0 IP, 3 H, 1 ER, 10 K.
                  </p>

                  <p>
                    Mendoza drove the offense. Three-for-four with two extra-base hits, two RBI, and his third home run in five games to open the season. That&rsquo;s not a hot streak. That&rsquo;s a hitter operating at a different level than his opponent &mdash; a .462 average through the first week and a half with power to all fields. Texas scored in four of the first six innings, turning a 2-0 lead into an 8-1 rout. Borba&rsquo;s two-run shot in the fifth and Pack Jr.&rsquo;s solo blast in the sixth capped the damage.
                  </p>

                  <p className="text-text-tertiary">
                    Winter, Crossland, and Walls combined for three scoreless innings of relief, striking out four. The pen hasn&rsquo;t allowed a run in this series &mdash; 9.2 IP, 0 ER from the bullpen across all three games.
                  </p>
                </div>
              </ScrollReveal>
            </Container>

            <ScrollReveal direction="up" delay={150}>
              <div className="mt-8">
                <PitchingTable pitchers={game1TexasPitching} teamLabel="Texas" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 2: Texas 3, Michigan State 1 (The Cycle Game) ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 2: Texas 3, Michigan State 1
                </h2>
                <span className="font-mono text-xs text-text-muted">Saturday &middot; Feb 21</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game2LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    This was the pitching duel. Harrison battled through 4.1 innings &mdash; four hits, one unearned run &mdash; before handing the ball to a bullpen that slammed the door. Michigan State got their run in the third on a sequence that required an error to score; Harrison&rsquo;s line read 0 ER despite allowing the traffic. Schlossnagle pulled him before the fifth was over, Leffew bridged the gap, and the decision paid off immediately.
                  </p>

                  <p>
                    The offense operated with surgical economy: three runs on eight hits, no wasted at-bats. But the story of this game belonged to one man across four plate appearances, each one different than the last.
                  </p>
                </div>
              </ScrollReveal>

              {/* Robbins Cycle highlight callout */}
              <ScrollReveal direction="up" delay={150}>
                <div className="bg-[#C9A227]/8 border border-[#C9A227]/20 rounded p-6 my-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-display text-[11px] uppercase tracking-[3px] text-[#C9A227]">
                      Hit for the Cycle
                    </div>
                  </div>
                  <div className="font-display text-lg font-semibold text-text-primary uppercase tracking-wide mb-1">
                    Aiden Robbins
                  </div>
                  <div className="font-mono text-sm text-[#C9A227] mb-4">
                    4-for-4 &middot; 1B (1st) &middot; 3B (3rd) &middot; 2B (6th) &middot; HR (8th)
                  </div>
                  <p className="font-serif text-sm text-text-tertiary leading-relaxed mb-3">
                    Single up the middle in the first that drove in the game&rsquo;s first Texas run. Triple down the right-field line in the third. Double to left center in the sixth. Then the solo home run in the eighth to complete it &mdash; a no-doubt pull shot down the right-field line. Two RBI on the day, both on swings that mattered.
                  </p>
                  <p className="font-serif text-sm text-text-muted leading-relaxed">
                    The last Longhorn to hit for the cycle was CJ Hinojosa against Kansas State on April 18, 2015 &mdash; eleven years ago. Robbins, the Notre Dame transfer, needed five games to announce himself with the 450-foot HR in Week 1. He needed seven to write himself into the program&rsquo;s record book.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4">
                  <p>
                    Grubbs came in and threw three scoreless innings to earn the win &mdash; Harrison didn&rsquo;t qualify at 4.1 IP, but the bullpen made it irrelevant. Grubbs didn&rsquo;t allow a hit and struck out two. Burns closed with a scoreless ninth, striking out three, to collect the save. The bullpen chain has been airtight through two weekends &mdash; hand the middle innings to Grubbs, hand the ninth to Burns, game over.
                  </p>
                </div>
              </ScrollReveal>
            </Container>

            <ScrollReveal direction="up" delay={250}>
              <div className="mt-8">
                <PitchingTable pitchers={game2TexasPitching} teamLabel="Texas" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 3: Texas 4, Michigan State 0 (Volantis Shutout) ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 3: Texas 4, Michigan State 0
                </h2>
                <span className="font-mono text-xs text-text-muted">Sunday &middot; Feb 22</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game3LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Volantis threw the first complete-team shutout of the season. Seven innings, five hits, zero earned runs, nine strikeouts &mdash; a new career high, surpassing the eight he put up in the UC Davis Sunday start a week earlier. Michigan State put runners on more than they did against Riojas or the pen, but Volantis stranded all of them. Through two weekends as a starter: <strong className="text-text-primary">14 innings pitched, 0 earned runs, 17 strikeouts, 2 walks.</strong> The former closer who saved 12 games with a 1.94 ERA as a freshman is pitching like a front-of-the-rotation arm in his second career start.
                  </p>

                  <p>
                    Texas scored two in the first and never looked back. Williams drove in the game&rsquo;s first run in the bottom of the first, and the lead grew to 4-0 by the fourth. The offense didn&rsquo;t need to be explosive. Volantis only needed four runs because he wasn&rsquo;t giving any back.
                  </p>

                  <p className="text-text-tertiary">
                    Crossland threw a clean eighth, then Burns struck out two in a scoreless ninth. The Sunday pitching formula &mdash; Volantis into the pen &mdash; hasn&rsquo;t allowed an earned run through two weekends.
                  </p>
                </div>
              </ScrollReveal>
            </Container>

            <ScrollReveal direction="up" delay={150}>
              <div className="mt-8">
                <PitchingTable pitchers={game3TexasPitching} teamLabel="Texas" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Week 2 Performers ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-6 pb-2 border-b border-burnt-orange/15">
                Week 2 Performers
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

        {/* ── Season Stats Update (7-0) ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-5 pb-2 border-b border-burnt-orange/15">
                Season Stats &mdash; 7-0
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="bg-surface-light border border-border-subtle rounded p-4 text-center">
                  <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Team BA</div>
                  <div className="font-display text-2xl font-bold text-burnt-orange">.321</div>
                </div>
                <div className="bg-surface-light border border-border-subtle rounded p-4 text-center">
                  <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Team OPS</div>
                  <div className="font-display text-2xl font-bold text-burnt-orange">.986</div>
                </div>
                <div className="bg-surface-light border border-border-subtle rounded p-4 text-center">
                  <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Staff ERA</div>
                  <div className="font-display text-2xl font-bold text-burnt-orange">1.53</div>
                </div>
                <div className="bg-surface-light border border-border-subtle rounded p-4 text-center">
                  <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">WHIP</div>
                  <div className="font-display text-2xl font-bold text-burnt-orange">0.86</div>
                </div>
              </div>

              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  Through seven games, the run differential is <strong className="text-text-primary">56-13 (+43)</strong>. Texas has outscored opponents by more than four runs per game on average, and the pitching staff hasn&rsquo;t allowed more than four runs in any single contest.
                </p>

                <div className="space-y-4">
                  <h3 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-3">Individual Leaders</h3>

                  <div className="bg-surface-light border border-border-subtle rounded p-4">
                    <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary mb-1">Ethan Mendoza</div>
                    <div className="font-mono text-xs text-burnt-orange mb-1">.462 AVG &middot; 12 H &middot; 3 HR &middot; 9 RBI &middot; 1.375 OPS</div>
                    <div className="font-mono text-[11px] text-text-muted">Best bat in the lineup through two weekends. Hitting for average and power with no platoon weakness.</div>
                  </div>

                  <div className="bg-surface-light border border-border-subtle rounded p-4">
                    <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary mb-1">Carson Tinney</div>
                    <div className="font-mono text-xs text-burnt-orange mb-1">.316/.567/.684 &middot; 11 BB (T-6th nationally)</div>
                    <div className="font-mono text-[11px] text-text-muted">Sees more pitches than anyone in the order. Eleven walks in seven games &mdash; the kind of on-base presence that lengthens every inning.</div>
                  </div>

                  <div className="bg-surface-light border border-border-subtle rounded p-4">
                    <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary mb-1">Ruger Riojas</div>
                    <div className="font-mono text-xs text-burnt-orange mb-1">11 IP &middot; 2 ER &middot; 19 K &middot; 1.64 ERA (10 K vs MSU)</div>
                    <div className="font-mono text-[11px] text-text-muted">Posted a 5.61 ERA in 2025. Through two Friday starts: 19 strikeouts in 11 innings &mdash; 9 K in the opener, 10 K against Michigan State. The leap is real.</div>
                  </div>

                  <div className="bg-surface-light border border-border-subtle rounded p-4">
                    <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary mb-1">Dylan Volantis</div>
                    <div className="font-mono text-xs text-burnt-orange mb-1">14 IP &middot; 0 ER &middot; 17 K &middot; 2 BB &middot; 0.00 ERA</div>
                    <div className="font-mono text-[11px] text-text-muted">Converted from closer (12 SV, 1.94 ERA as freshman) to Sunday starter. Two starts, zero earned runs. Career-high K totals both weekends.</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict — Week 2 ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-[#8B4513]/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-charcoal text-burnt-orange px-3">
                  BSI Verdict &mdash; Week 2
                </div>
                <div className="font-serif text-lg sm:text-xl leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    Michigan State came in with Louisville series credibility &mdash; 2-1 at a Top 10 program, the kind of result that earns respect on the road. Texas allowed two total runs. The Spartans&rsquo; Week 1 strength didn&rsquo;t transfer because Texas&rsquo; pitching didn&rsquo;t give them the fastballs to drive or the free bases to manufacture.
                  </p>
                  <p>
                    The pitching narratives that matter most are the ones that compound. Riojas&rsquo; transformation &mdash; 5.61 ERA in 2025 to 19 K in 11 IP through two Fridays, including 10 K against MSU &mdash; is structural, not streaky. Volantis&rsquo; closer-to-starter conversion &mdash; 14 IP, 0 ER, 17 K on Sundays &mdash; is the kind of development that reshapes a rotation&rsquo;s ceiling. Harrison had a shorter Saturday (4.1 IP), but the bullpen erased any concern: Grubbs threw 3.0 scoreless for the win, Burns closed for the save. The depth covered the one start that wasn&rsquo;t dominant.
                  </p>
                  <p>
                    The lineup doesn&rsquo;t have a hole. Mendoza is hitting .462 with 3 HR. Tinney is tied for sixth nationally in walks. Robbins just hit for the cycle. The offense doesn&rsquo;t need to be explosive because the pitching doesn&rsquo;t force it to be.
                  </p>
                  <p className="text-text-secondary">
                    But the schedule is about to start asking real questions. Two weekends of home games against overmatched opponents is a foundation, not a verdict. Friday night at Daikin Park &mdash; No. 11 Coastal Carolina, Preseason National Player of the Year Cameron Flukey, a 2025 national runner-up program &mdash; is the first pitch that will tell Texas something about itself.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── UTRGV Tuesday Preview ── */}
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
                      UTRGV at No. 3 Texas
                    </h3>
                    <div className="font-mono text-sm text-burnt-orange">
                      Tuesday, February 25 &middot; UFCU Disch-Falk Field
                    </div>
                    <div className="font-mono text-xs text-text-muted">
                      Austin, TX
                    </div>
                  </div>

                  <div className="border-t border-border-subtle pt-5">
                    <h4 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-3">
                      What UTRGV Is Bringing to Austin
                    </h4>
                    <div className="font-serif text-base text-text-secondary leading-relaxed space-y-3">
                      <p>
                        UTRGV is 3-4, and the record undersells the fight. They beat Kansas in their season opener &mdash; 7-4 in front of a sellout 5,862 &mdash; then went to Houston and took two of three from the Cougars. That included an 8-run rally in Game 2 and a 6-run ninth-inning comeback in Game 3 to steal the series. This is a team that can score in bunches when they get hot, and they&rsquo;ve already proven they won&rsquo;t fold on the road against Power 4 opponents.
                      </p>
                      <p className="text-text-tertiary">
                        The flipside: they lost to Texas Tech 21-12, which means they can bleed runs too. Thomas Williams is the key bat. Cienfuegos is the arm to watch. Texas should control this game, but UTRGV has earned the right not to be dismissed.
                      </p>
                    </div>

                    <div className="bg-surface-light border border-border-subtle rounded p-4 mt-5">
                      <h4 className="font-display text-[11px] uppercase tracking-[3px] text-burnt-orange mb-3">
                        Keys for Texas
                      </h4>
                      <div className="font-serif text-sm text-text-tertiary leading-relaxed space-y-2">
                        <p><strong className="text-text-secondary">Midweek pitching depth.</strong> Use the Tuesday game to get reps for arms outside the weekend rotation. The Bruce Bolt Classic is four days away &mdash; manage the workload.</p>
                        <p><strong className="text-text-secondary">Don&rsquo;t let them get comfortable.</strong> UTRGV&rsquo;s Houston series showed they can rally late. Score early, play clean, close the door before momentum shifts.</p>
                        <p><strong className="text-text-secondary">Stay sharp defensively.</strong> The lineup will hit. The question is whether the defense stays clean in a game where the concentration can slip.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Bruce Bolt College Classic Preview ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#C9A227]">Weekend 3 Preview</span>
              </div>

              <div className="max-w-3xl mx-auto">
                <h3 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary text-center mb-2">
                  Bruce Bolt College Classic
                </h3>
                <div className="text-center font-mono text-sm text-burnt-orange mb-2">
                  February 27 &ndash; March 1 &middot; Daikin Park, Houston
                </div>
                <div className="text-center font-mono text-xs text-text-muted mb-8">
                  Space City Home Network + free stream on Astros.com
                </div>

                {/* Texas schedule */}
                <div className="mb-8">
                  <h4 className="font-display text-sm uppercase tracking-wider text-[#C9A227] mb-4 pb-2 border-b border-[#C9A227]/15">
                    Texas Schedule
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#C9A227]/5 border border-[#C9A227]/15 rounded p-4">
                      <div className="font-display text-[10px] uppercase tracking-[3px] text-[#C9A227] mb-1">Friday 7:05 PM</div>
                      <div className="font-display text-lg font-bold text-text-primary">vs No. 11 Coastal Carolina</div>
                      <div className="font-mono text-[11px] text-[#C9A227]/70 mt-1">
                        Flukey &middot; Preseason NPOY &middot; 2025 National Runner-Up (56-14)
                      </div>
                    </div>
                    <div className="bg-surface-light border border-border-subtle rounded p-4">
                      <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Saturday 7:05 PM</div>
                      <div className="font-display text-lg font-bold text-text-primary">vs Baylor</div>
                      <div className="font-mono text-[11px] text-text-muted mt-1">
                        In-state rivalry &middot; Big 12
                      </div>
                    </div>
                    <div className="bg-surface-light border border-border-subtle rounded p-4">
                      <div className="font-display text-[10px] uppercase tracking-[3px] text-text-muted mb-1">Sunday 2:05 PM</div>
                      <div className="font-display text-lg font-bold text-text-primary">vs Ohio State</div>
                      <div className="font-mono text-[11px] text-text-muted mt-1">
                        Big Ten
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matchup analysis */}
                <div className="mb-8">
                  <h4 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-4 pb-2 border-b border-border">
                    Matchup Analysis
                  </h4>
                  <div className="font-serif text-base text-text-secondary leading-relaxed space-y-6">
                    <div>
                      <h5 className="font-display text-sm font-semibold uppercase tracking-wide text-[#C9A227] mb-2">
                        Friday: No. 11 Coastal Carolina &mdash; The Measuring Stick
                      </h5>
                      <p>
                        This is the game that matters. Coastal Carolina went 56-14 last season as the national runner-up, and Cameron Flukey &mdash; the Preseason National Player of the Year &mdash; gives them a legitimate ace. Texas has faced UC Davis and Michigan State. Coastal is the first opponent with top-tier pedigree and a frontline arm. Riojas vs. Flukey on a Friday night at a neutral site in Houston is the kind of matchup that tells you where both programs actually stand. Everything before this was prologue.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary mb-2">
                        Saturday: Baylor &mdash; The Rivalry Factor
                      </h5>
                      <p>
                        In-state games carry their own weight regardless of rankings. Baylor won&rsquo;t bring Coastal&rsquo;s national profile, but the familiarity and recruiting overlap add a layer that doesn&rsquo;t show up in the box score preview. Harrison gets the ball on Saturday. His MSU start was shorter than the staff&rsquo;s standard (4.1 IP), but the bullpen depth means Schlossnagle can be aggressive with the hook. The Bears will compete. Whether they can sustain it against this lineup is the question.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary mb-2">
                        Sunday: Ohio State &mdash; Most Manageable
                      </h5>
                      <p className="text-text-tertiary">
                        Ohio State rounds out the weekend. Of the three opponents, this should be the most straightforward matchup for Volantis and the Sunday pitching formula. But &ldquo;should be&rdquo; is a dangerous phrase three games into a neutral-site tournament &mdash; fatigue, travel, and the unfamiliar ballpark all apply. Treat it like a close game until it isn&rsquo;t one.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other teams in the field */}
                <div className="mb-8">
                  <h4 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-4 pb-2 border-b border-border">
                    Also in the Field
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-light border border-border-subtle rounded p-4">
                      <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary">Ole Miss</div>
                      <div className="font-mono text-[11px] text-[#C9A227] mt-1">8-0 &middot; No. 1 RPI</div>
                      <div className="font-mono text-[10px] text-text-muted mt-1">Texas won&rsquo;t play them this weekend, but they&rsquo;re the best team in the building.</div>
                    </div>
                    <div className="bg-surface-light border border-border-subtle rounded p-4">
                      <div className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary">UTSA</div>
                      <div className="font-mono text-[11px] text-text-muted mt-1">2025 AAC Champions</div>
                      <div className="font-mono text-[10px] text-text-muted mt-1">Won their conference last season. Capable program in a loaded field.</div>
                    </div>
                  </div>
                </div>

                {/* Series keys */}
                <div className="bg-surface-light border border-border-subtle rounded p-5">
                  <h4 className="font-display text-[11px] uppercase tracking-[3px] text-burnt-orange mb-4">
                    What to Watch For
                  </h4>
                  <div className="font-serif text-sm text-text-tertiary leading-relaxed space-y-3">
                    <p><strong className="text-text-secondary">Friday night is the real test.</strong> Coastal Carolina with Flukey on the mound is the first opponent that can match Texas pitch-for-pitch. How Riojas handles a lineup that went to the CWS finals last year defines the weekend.</p>
                    <p><strong className="text-text-secondary">First road-adjacent games of the season.</strong> Two weekends at Disch-Falk built the foundation. Daikin Park in Houston is neutral ground. The crowd advantage disappears. The identity has to travel.</p>
                    <p><strong className="text-text-secondary">Workload management.</strong> Three games in three days at a neutral site with a Tuesday game beforehand. Bullpen depth matters more this weekend than any point so far. Burns, Grubbs, Crossland, and Winter all need to be available and sharp across three nights.</p>
                  </div>
                </div>
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
                <DataSourceBadge source="texaslonghorns.com" timestamp="February 20-22, 2026 CT" />
                <DataSourceBadge source="msuspartans.com" timestamp="February 22, 2026 CT" />
                <DataSourceBadge source="goutrgv.com" timestamp="February 24, 2026 CT" />
                <DataSourceBadge source="mlb.com/astros" timestamp="February 24, 2026 CT" />
                <DataSourceBadge source="d1baseball.com" timestamp="February 24, 2026 CT" />
              </div>
              <div className="font-mono text-[11px] text-text-muted leading-relaxed">
                Box scores sourced from Texas Longhorns and Michigan State official stats. UTRGV and Bruce Bolt Classic data from official athletic sites and D1Baseball.
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  More Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/texas-week-1-recap" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  Week 1 Recap &rarr;
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
