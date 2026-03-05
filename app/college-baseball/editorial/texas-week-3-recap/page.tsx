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
   Sources: texaslonghorns.com, goccusports.com, baylorbears.com, ohiostatebuckeyes.com box scores
   BRUCE BOLT College Classic at Daikin Park, Houston TX
   ──────────────────────────────────────────── */

// Game 1: Texas 8, No. 9 Coastal Carolina 1 (Friday, Feb 27)
const game1LineScore: InningScore[] = [
  { team: 'Coastal Carolina', innings: [0, 0, 0, 0, 0, 0, 1, 0, 0], r: 1, h: 3, e: 2 },
  { team: 'Texas', innings: [0, 0, 2, 1, 0, 1, 0, 4, 'X'], r: 8, h: 12, e: 0 },
];

const game1TexasPitching: PitchingLine[] = [
  { name: 'Ruger Riojas', ip: '5.0', h: 1, r: 0, er: 0, bb: 1, so: 11, decision: 'W (3-0)' },
  { name: 'Max Grubbs', ip: '1.0', h: 1, r: 0, er: 0, bb: 0, so: 2 },
  { name: 'Ethan Walker', ip: '1.0', h: 1, r: 1, er: 1, bb: 0, so: 1 },
  { name: 'Brett Crossland', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 2 },
  { name: 'Cal Hamilton', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 2 },
];

// Game 2: Texas 5, Baylor 2 (Saturday, Feb 28)
const game2LineScore: InningScore[] = [
  { team: 'Baylor', innings: [0, 0, 0, 2, 0, 0, 0, 0, 0], r: 2, h: 4, e: 4 },
  { team: 'Texas', innings: [3, 0, 2, 0, 0, 0, 0, 0, 'X'], r: 5, h: 7, e: 1 },
];

const game2TexasPitching: PitchingLine[] = [
  { name: 'Luke Harrison', ip: '3.1', h: 3, r: 2, er: 2, bb: 1, so: 2 },
  { name: 'Max Grubbs', ip: '1.2', h: 0, r: 0, er: 0, bb: 0, so: 1, decision: 'W (2-0)' },
  { name: 'Michael Winter', ip: '1.0', h: 1, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Haiden Leffew', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Ethan Walker', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Thomas Burns', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 1, decision: 'SV (2)' },
];

// Game 3: Texas 10, Ohio State 3 (Sunday, Mar 1 — Championship Game)
const game3LineScore: InningScore[] = [
  { team: 'Texas', innings: [0, 0, 7, 0, 0, 0, 2, 1, 0], r: 10, h: 12, e: 0 },
  { team: 'Ohio State', innings: [0, 0, 0, 0, 1, 1, 1, 0, 0], r: 3, h: 6, e: 1 },
];

const game3TexasPitching: PitchingLine[] = [
  { name: 'Dylan Volantis', ip: '4.2', h: 2, r: 1, er: 1, bb: 1, so: 8 },
  { name: 'Brett Crossland', ip: '1.1', h: 2, r: 1, er: 1, bb: 0, so: 0, decision: 'W (1-0)' },
  { name: 'Brody Walls', ip: '1.0', h: 1, r: 1, er: 1, bb: 1, so: 2 },
  { name: 'Cal Higgins', ip: '2.0', h: 1, r: 0, er: 0, bb: 0, so: 2 },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM / sharing
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `Texas Week 3 Recap: Swept, Celebrated, Still Perfect.

No. 3 Texas went 3-0 at the BRUCE BOLT College Classic at Daikin Park in Houston, beating No. 9 Coastal Carolina 8-1, Baylor 5-2, and Ohio State 10-3 to win the tournament championship. Texas is 11-0, the only undefeated Top 25 team in America.

TOURNAMENT RESULTS:
Game 1 (Feb 27): Texas 8, No. 9 Coastal Carolina 1 — Riojas W (5 IP, 1H, 11K). Robbins 466-ft HR. Becerra 2 HR, 3 RBI.
Game 2 (Feb 28): Texas 5, Baylor 2 — Schlossnagle's 1,000th career D1 win. Pack Jr. 2-for-4, 3 RBI. Bullpen 5.2 scoreless IP.
Game 3 (Mar 1): Texas 10, Ohio State 3 — 7-run 3rd inning. Volantis 4.2 IP, 8K. Crossland first collegiate W. Championship game.

TOURNAMENT STATS:
Season Record: 11-0 (only undefeated Top 25 team)
Team ERA: 1.55 (16 earned runs in 93 IP)
Tournament HR: 4 (season-best, all in Game 1)
Schlossnagle: 1,000th career D1 win (7th active coach, 70th in NCAA history)

KEY PERFORMERS:
Temo Becerra: 4-for-8, 3 HR across tournament — first career multi-HR game Friday. Announced himself as a middle-of-the-order force.
Ruger Riojas: 5 IP, 1H, 0ER, 11K vs No. 9 Coastal Carolina — 3-0, 30 K in 16 IP through 3 starts. Struck out more batters (11) than he allowed baserunners (2) against a national-runner-up program.
Aiden Robbins: 466-ft HR Friday — the longest recorded Longhorn home run this season.
Anthony Pack Jr.: 2-for-4, 3 RBI vs Baylor — drove in the milestone-clinching runs.
Dylan Volantis: 4.2 IP, 8K vs Ohio State — 25 K in 18.2 IP through 3 Sunday starts.

BSI VERDICT — WEEK 3:
The BRUCE BOLT Classic answered the one remaining question: what happens when Texas faces real arms? Coastal Carolina brought a top-10 ranking, a 2025 CWS runner-up pedigree, and their weekend rotation to Houston. Texas scored 8, struck out 17, and played error-free defense. Riojas' 11 K in 5 IP against the best lineup he's faced this season validated the transformation from 5.61-ERA reliever to Friday ace. Becerra's 3-HR tournament breakout adds a power bat that wasn't in the lineup blueprint entering the season. The bullpen covered every gap — 5.2 scoreless IP against Baylor when Harrison exited early, Crossland earning his first collegiate win in the championship, Higgins and Walls combining for 3 IP and 4 K to close out Ohio State.

Schlossnagle's 1,000th win came at a neutral site, against an in-state rival, with five relievers shutting the door. Fitting for a career defined by building programs that travel. Twenty-five years, 1,000-469 (.681). The milestone was earned in motion.

UP NEXT: HCU Tuesday. USC Upstate this weekend. Then SEC opens Mar 13 vs Ole Miss in Oxford. The foundation is built. Now comes the load-bearing test.

Source: texaslonghorns.com, goccusports.com, baylorbears.com, ohiostatebuckeyes.com, d1baseball.com | Blaze Sports Intel | March 3, 2026 CT`;

const GAME_CONTEXT = `Texas went 3-0 at the BRUCE BOLT College Classic (Daikin Park, Houston) in Week 3 of the 2026 season. Texas 8, No. 9 Coastal Carolina 1 / Texas 5, Baylor 2 / Texas 10, Ohio State 3 (championship). Texas is 11-0, only undefeated Top 25 team.

Game 1 (Feb 27): Riojas W (5.0 IP, 1H, 0ER, 11K). Robbins 466-ft HR. Becerra 2 HR, 3 RBI (first career multi-HR). Larson 1 HR. Season-best 4 HR. 17 K as staff.
Game 2 (Feb 28): Schlossnagle 1,000th D1 win (7th active, 70th all-time, 25 yrs, 1000-469 .681). Harrison 3.1 IP, 2R. Grubbs W (1.2 IP, 0R). Bullpen 5.2 scoreless. Burns SV. Pack Jr. 2-for-4, 3 RBI. Baylor 4 errors.
Game 3 (Mar 1): Volantis 4.2 IP, 1R, 8K. Crossland W (first collegiate win). 7-run 3rd (12 batters, knocked out Herrenbruck). Becerra 1 HR, 3 RBI. Mendoza/Rodriguez/Robbins all RBI.

Season: 11-0, 1.55 ERA (16 ER/93 IP). Riojas: 3-0, 16 IP, 30 K. Volantis: 18.2 IP, 1 ER, 25 K. Next: HCU Tue, USC Upstate weekend, SEC opens Mar 13 at Ole Miss.`;

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

export default function TexasWeek3RecapPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-week-3-recap';

  const openAI = (model: 'claude' | 'gemini' = 'claude') => {
    setAiDefaultModel(model);
    setAiOpen(true);
  };

  return (
    <>
      <div>
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
              <span className="text-text-secondary">Texas Week 3</span>
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
                  <Badge variant="primary">Texas Weekly</Badge>
                  <Badge variant="accent">No. 3 Texas</Badge>
                  <Badge variant="outline">11-0</Badge>
                  <span className="font-mono text-xs text-text-muted">Tournament Champions</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary mb-1">
                    Swept, Celebrated,
                  </span>
                  <span className="block text-gradient-blaze text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Still Perfect.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-text-tertiary italic leading-relaxed mb-6">
                  The Longhorns went 3-0 at the BRUCE BOLT College Classic, beat a Top 10 team, collected a coaching milestone, and extended the best start in four years. The schedule asked its first real question. Texas answered 23&ndash;6.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted tracking-wide">
                  <span>February 27 &ndash; March 1, 2026</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Daikin Park, Houston</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>3 Games</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>BRUCE BOLT College Classic</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-muted mt-4">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>March 3, 2026</span>
                  <span>|</span>
                  <span>~14 min read</span>
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

        {/* ── Tournament Stat Cards ── */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Season Record" value="11-0" helperText="Only undefeated Top 25 team in America" />
                <StatCard label="Team ERA" value="1.55" helperText="16 earned runs allowed in 93 innings pitched" />
                <StatCard label="Becerra Classic" value="3 HR" helperText="4-for-8 across tournament &mdash; breakout weekend" />
                <StatCard label="Win No. 1,000" value="Schlossnagle" helperText="7th active D1 coach to reach the milestone" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                The BRUCE BOLT Classic was built to answer the question that two weekends of home dominance couldn&rsquo;t: what happens when Texas faces real arms on neutral ground? Coastal Carolina brought a top-10 ranking and a 2025 CWS runner-up pedigree. Baylor brought an in-state rivalry and the pressure of a coaching milestone on the line. Ohio State brought a championship game. Texas won all three by a combined 23&ndash;6, played error-free ball in two of three contests, and hit a season-best four home runs in a single night.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-secondary mb-6">
                Three different types of wins. Friday was pure overpowering &mdash; Riojas struck out 11 in five innings and the bats launched four home runs against a ranked opponent. Saturday was institutional &mdash; a bullpen grinding out 5.2 scoreless innings to deliver Schlossnagle&rsquo;s 1,000th career D1 victory. Sunday was an avalanche &mdash; a 7-run third inning that turned a championship game into a procession. <strong className="text-text-primary">The identity didn&rsquo;t just hold away from home. It sharpened.</strong>
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-tertiary">
                Eleven games down, no losses, and the only remaining conversation about this start is where it leads. Ole Miss in ten days.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 1: Texas 8, No. 9 Coastal Carolina 1 ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 1: Texas 8, No. 9 Coastal Carolina 1
                </h2>
                <span className="font-mono text-xs text-text-muted">Friday &middot; Feb 27</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game1LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    This was the test the first two weekends couldn&rsquo;t provide and the one Texas couldn&rsquo;t fake its way through. Coastal Carolina reached the College World Series finals in 2025 with a 56-14 record. They carried a top-10 ranking into Daikin Park. Riojas threw five innings of one-hit ball and struck out 11 &mdash; more strikeouts than baserunners allowed. The Chanticleers managed three hits total and committed two errors. Texas played clean defense, zero errors, and hit four home runs in a single game for the first time this season.
                  </p>

                  <p>
                    Temo Becerra authored the offensive statement. His first career multi-homer game &mdash; two home runs and three RBI against a program that went to the CWS finals eight months ago. The power wasn&rsquo;t manufactured off mistake pitches in empty counts. Becerra drove the ball with authority against a rotation built for postseason baseball. Robbins added a 466-foot bomb, the longest measured Longhorn home run this season, the kind of distance that stops a Houston press box mid-sentence. Larson connected for the fourth. Four different bats, four different swings, all leaving the yard.
                  </p>

                  <p className="text-text-tertiary">
                    The bullpen was clean behind Riojas. Grubbs, Walker, Crossland, and Hamilton combined for four innings of relief, allowing one run on two hits with seven strikeouts. Texas totaled 17 strikeouts as a staff &mdash; the highest single-game mark of the season against the best lineup they&rsquo;ve faced.
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

        {/* ── Game 2: Texas 5, Baylor 2 (Win No. 1,000) ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 2: Texas 5, Baylor 2
                </h2>
                <span className="font-mono text-xs text-text-muted">Saturday &middot; Feb 28</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game2LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Harrison lasted 3.1 innings before Schlossnagle pulled him, and in most programs that early exit writes the narrative. Not this one. The bullpen entered with a 3-2 lead in the fourth and didn&rsquo;t allow a baserunner to score for the final 5.2 innings. Grubbs got the win with 1.2 scoreless. Winter, Leffew, and Walker each threw a scoreless frame. Burns closed the door in the ninth for his second save. Five relievers, zero runs, game over.
                  </p>

                  <p>
                    Baylor committed four errors and still only lost by three. That tells you two things: the Bears competed despite the miscues, and Texas didn&rsquo;t need to pile on because the pitching never let the deficit collapse. Anthony Pack Jr. did the heaviest lifting at the plate &mdash; 2-for-4 with three RBI, including run-scoring singles in each of his first two at-bats that built the early 3-0 lead. Casey Borba&rsquo;s safety squeeze in the third pushed it to 5-0 before Baylor clawed back. The offense manufactured early, and the arms held.
                  </p>
                </div>
              </ScrollReveal>

              {/* Schlossnagle 1,000th win callout */}
              <ScrollReveal direction="up" delay={150}>
                <div className="bg-[#C9A227]/8 border border-[#C9A227]/20 rounded p-6 my-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-display text-[11px] uppercase tracking-[3px] text-[#C9A227]">
                      Milestone
                    </div>
                  </div>
                  <div className="font-display text-lg font-semibold text-text-primary uppercase tracking-wide mb-1">
                    Jim Schlossnagle &mdash; 1,000th D1 Win
                  </div>
                  <div className="font-mono text-sm text-[#C9A227] mb-4">
                    25 seasons &middot; 1,000-469 (.681) &middot; 7th active coach &middot; 70th in NCAA history
                  </div>
                  <p className="font-serif text-sm text-text-tertiary leading-relaxed mb-3">
                    The milestone didn&rsquo;t come at Disch-Falk in front of an Austin crowd. It came at a neutral-site tournament in Houston, against an in-state rival, with five relievers combining to shut the door. That&rsquo;s fitting. Schlossnagle&rsquo;s career has been defined by building programs that travel &mdash; from UNLV to TCU to Texas A&amp;M and now Texas.
                  </p>
                  <p className="font-serif text-sm text-text-muted leading-relaxed">
                    He is the seventh active Division I coach to reach 1,000 wins and the 70th in the history of the sport. The number itself matters less than what it represents: twenty-five years of programs that performed away from home, in neutral-site tournaments, in postseason elimination games. A thousand wins earned in motion.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4">
                  <p className="text-text-tertiary">
                    The Saturday formula has emerged across three weekends. Harrison starts but doesn&rsquo;t need to go deep. The bullpen bridge &mdash; Grubbs into the middle relievers into Burns &mdash; covers the back end. Texas is 3-0 in Saturday games despite Harrison averaging fewer than four innings per start. The depth absorbs the short outing every time.
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

        {/* ── Game 3: Texas 10, Ohio State 3 (Championship) ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Game 3: Texas 10, Ohio State 3
                </h2>
                <span className="font-mono text-xs text-text-muted">Sunday &middot; Mar 1 &middot; Championship</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game3LineScore} label="Championship Game" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    The third inning broke the game open and it didn&rsquo;t close. Texas sent twelve batters to the plate, scored seven runs, and knocked Ohio State starter Herrenbruck out of the game before the frame was over. Becerra added another home run &mdash; his third of the tournament &mdash; with three RBI. Mendoza drove in a run and scored. Rodriguez doubled home a run. Robbins singled in a run. The damage was distributed. No single hitter carried the inning; the lineup cycled through and everyone contributed.
                  </p>

                  <p>
                    Volantis continued what has become the most reliable pitching performance in the rotation. Four and two-thirds innings, one run allowed, eight strikeouts. Through three Sunday starts: <strong className="text-text-primary">18.2 innings pitched, 1 earned run, 25 strikeouts.</strong> The converted closer who saved 12 games as a freshman has allowed one earned run in nearly nineteen innings as a starter. The role change is no longer an experiment. It&rsquo;s a structural advantage.
                  </p>

                  <p className="text-text-tertiary">
                    Brett Crossland earned his first collegiate win in relief, throwing 1.1 innings in the middle of the game. Brody Walls struck out two in his inning of work. Cal Higgins closed with two scoreless innings and two strikeouts. The pen held a 7-run lead without incident &mdash; the kind of game where the depth arms get meaningful innings and the championship still never feels in doubt.
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

        {/* ── BSI Verdict — Week 3 ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-charcoal text-burnt-orange px-3">
                  BSI Verdict &mdash; Week 3
                </div>
                <div className="font-serif text-lg sm:text-xl leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    The BRUCE BOLT Classic answered the one remaining question: what happens when Texas faces real arms? Coastal Carolina brought a top-10 ranking and the institutional weight of a 56-14 season that ended in the CWS finals. Texas scored eight, struck out seventeen batters as a staff, played error-free defense, and made the Chanticleers look overmatched. That&rsquo;s not a close win against a good team. That&rsquo;s a statement that the first two weekends of home-field dominance weren&rsquo;t an artifact of the schedule.
                  </p>
                  <p>
                    Riojas&rsquo; line against the best lineup he&rsquo;s faced &mdash; 5 IP, 1 H, 0 ER, 11 K &mdash; validated the transformation. Three starts into the season: 3-0, 30 strikeouts in 16 innings, a 1.13 ERA. The 5.61 ERA from 2025 belongs to a different pitcher. Becerra&rsquo;s 3-HR breakout weekend adds a power dimension that wasn&rsquo;t in the preseason blueprint. The bullpen covered every gap &mdash; 5.2 scoreless innings against Baylor when Harrison exited early, Crossland earning his first collegiate win in the championship, Higgins and Walls closing out Ohio State without stress.
                  </p>
                  <p>
                    Schlossnagle&rsquo;s 1,000th win is the kind of milestone that invites reflection on everything before it &mdash; UNLV, TCU, Texas A&amp;M &mdash; but the more useful frame is what it means for now. He is managing a roster that hasn&rsquo;t lost in eleven games, a pitching staff with a 1.55 ERA, and a lineup that generates runs from multiple spots in the order. The program depth is the product of the same institutional discipline that produced the first 999 wins.
                  </p>
                  <p className="text-text-secondary">
                    But 11-0 against the current strength of schedule is a foundation, not a conclusion. The SEC opens March 13 at Ole Miss. That&rsquo;s when the foundation bears weight &mdash; when the weekend rotation faces conference arms in hostile parks, when the bullpen gets tested in close games against ranked opponents four weekends in a row. Everything so far says Texas is built for it. Nothing so far has proven it.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Pull Quote ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="text-center py-4">
                <blockquote className="font-serif text-2xl sm:text-3xl italic text-text-primary leading-snug mb-4">
                  &ldquo;Eleven strikeouts in five innings against a CWS-finals lineup. The transformation isn&rsquo;t trending &mdash; it&rsquo;s arrived.&rdquo;
                </blockquote>
                <div className="font-mono text-xs text-burnt-orange tracking-wider uppercase">
                  On Ruger Riojas vs. No. 9 Coastal Carolina
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Looking Ahead ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-5 pb-2 border-b border-burnt-orange/15">
                Looking Ahead
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4">
                <p>
                  HCU visits Disch-Falk on Tuesday. USC Upstate comes to Austin for a three-game weekend set March 7&ndash;9. Both are opportunities to manage workload and get depth arms extended reps before the schedule tilts toward the conference gauntlet.
                </p>
                <p className="text-text-tertiary">
                  Then comes March 13: Ole Miss in Oxford. The Rebels were 8-0 and carrying the No. 1 RPI when they shared the Daikin Park concourse with Texas this past weekend. They didn&rsquo;t play each other. In ten days, they will. That series is where the 11-0 record meets a program built to contest it. Everything before Oxford is preparation. Everything after it is conference baseball.
                </p>
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
                  <div className="text-text-muted text-xs">Anthropic-powered tournament breakdown</div>
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
                <DataSourceBadge source="texaslonghorns.com" timestamp="February 27 - March 1, 2026 CT" />
                <DataSourceBadge source="goccusports.com" timestamp="February 27, 2026 CT" />
                <DataSourceBadge source="baylorbears.com" timestamp="February 28, 2026 CT" />
                <DataSourceBadge source="ohiostatebuckeyes.com" timestamp="March 1, 2026 CT" />
                <DataSourceBadge source="d1baseball.com" timestamp="March 3, 2026 CT" />
              </div>
              <div className="font-mono text-[11px] text-text-muted leading-relaxed">
                Box scores sourced from Texas Longhorns, Coastal Carolina, Baylor, and Ohio State official stats. Tournament data from D1Baseball and BRUCE BOLT College Classic records.
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial/weekend-3-recap" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  &larr; Weekend 3 Recap
                </Link>
                <Link href="/college-baseball/editorial/texas-week-2-recap" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  Texas Week 2 Recap &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>

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
