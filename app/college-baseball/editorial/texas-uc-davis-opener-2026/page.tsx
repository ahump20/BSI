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

/* ─────────────────────────────────────────────
   LINE SCORE
   ───────────────────────────────────────────── */

const LINE_SCORE = {
  innings: [1, 2, 3, 4, 5, 6, 7] as const,
  texas:    { runs: [1, 0, 4, 0, 3, 0, 4], hits: 11, errors: 0, totalRuns: 12 },
  ucdavis:  { runs: [0, 0, 1, 0, 0, 1, 0], hits:  6, errors:  2, totalRuns:  2 },
};

/* ─────────────────────────────────────────────
   TEXAS BATTING
   ───────────────────────────────────────────── */

interface BattingLine {
  name: string;
  pos: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: string;
}

const TEXAS_BATTING: BattingLine[] = [
  { name: 'Jared Thomas',    pos: 'CF', ab: 4, r: 2, h: 1, rbi: 0, bb: 1, so: 1, avg: '.250' },
  { name: 'Ashton Larson',   pos: 'SS', ab: 4, r: 1, h: 1, rbi: 1, bb: 0, so: 1, avg: '.250' },
  { name: 'Jalin Flores',    pos: 'DH', ab: 2, r: 2, h: 1, rbi: 1, bb: 2, so: 0, avg: '.500' },
  { name: 'Cameron O\'Brien',pos: '1B', ab: 3, r: 0, h: 0, rbi: 0, bb: 1, so: 0, avg: '.000' },
  { name: 'Will Gasparino',  pos: '3B', ab: 3, r: 1, h: 1, rbi: 0, bb: 1, so: 0, avg: '.333' },
  { name: 'Luke Robbins',    pos: 'LF', ab: 3, r: 1, h: 2, rbi: 3, bb: 0, so: 1, avg: '.667' },
  { name: 'Xavier Mendoza',  pos: 'C',  ab: 3, r: 2, h: 2, rbi: 2, bb: 1, so: 0, avg: '.667' },
  { name: 'Temo Becerra',    pos: 'RF', ab: 4, r: 1, h: 1, rbi: 2, bb: 0, so: 1, avg: '.250' },
  { name: 'Carson Pack Jr',  pos: '2B', ab: 3, r: 2, h: 2, rbi: 2, bb: 1, so: 0, avg: '.667' },
  { name: 'Dean Moss',       pos: 'PH', ab: 1, r: 0, h: 0, rbi: 0, bb: 0, so: 0, avg: '.000' },
];

const TEXAS_BATTING_TOTALS = { ab: 30, r: 12, h: 11, rbi: 11, bb: 7, so: 4 };

/* ─────────────────────────────────────────────
   UC DAVIS BATTING
   ───────────────────────────────────────────── */

const UCDAVIS_BATTING: BattingLine[] = [
  { name: 'Riley Nicholson',  pos: 'CF', ab: 4, r: 1, h: 2, rbi: 0, bb: 0, so: 0, avg: '.500' },
  { name: 'Will Goldbeck',    pos: 'RF', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1, avg: '.000' },
  { name: 'Nelson Fici',      pos: '1B', ab: 3, r: 0, h: 1, rbi: 1, bb: 0, so: 0, avg: '.333' },
  { name: 'Max Flower',       pos: 'LF', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1, avg: '.000' },
  { name: 'Cole Posey',       pos: '3B', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 2, avg: '.000' },
  { name: 'Ryan Tinney',      pos: 'DH', ab: 3, r: 1, h: 1, rbi: 1, bb: 0, so: 0, avg: '.333' },
  { name: 'Travis Holt',      pos: 'C',  ab: 2, r: 0, h: 1, rbi: 0, bb: 1, so: 0, avg: '.500' },
  { name: 'Luke Ladrech',     pos: 'SS', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1, avg: '.000' },
  { name: 'Sam Olson',        pos: '2B', ab: 3, r: 0, h: 1, rbi: 0, bb: 0, so: 0, avg: '.333' },
];

const UCDAVIS_BATTING_TOTALS = { ab: 27, r: 2, h: 6, rbi: 2, bb: 1, so: 5 };

/* ─────────────────────────────────────────────
   PITCHING
   ───────────────────────────────────────────── */

interface PitchingLine {
  name: string;
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  pitches: number;
  decision?: string;
}

const TEXAS_PITCHING: PitchingLine[] = [
  { name: 'Charlie Riojas',  ip: '5.0', h: 4, r: 1, er: 1, bb: 1, so: 5, pitches: 77, decision: 'W (1-0)' },
  { name: 'Cade Halemanu',   ip: '2.0', h: 2, r: 1, er: 1, bb: 0, so: 0, pitches: 29 },
];

const UCDAVIS_PITCHING: PitchingLine[] = [
  { name: 'Mikey Valdez',      ip: '4.0', h: 5, r: 6, er: 3, bb: 4, so: 1, pitches: 85, decision: 'L (0-1)' },
  { name: 'Jack Lerma',        ip: '1.0', h: 1, r: 1, er: 0, bb: 3, so: 2, pitches: 34 },
  { name: 'Ryota Anzai',       ip: '1.0', h: 4, r: 4, er: 4, bb: 0, so: 1, pitches: 26 },
  { name: 'Liam Hippensteel',  ip: '0.0', h: 1, r: 1, er: 1, bb: 0, so: 0, pitches: 2 },
  { name: 'Spencer Grubbs',    ip: '0.1', h: 0, r: 0, er: 0, bb: 0, so: 0, pitches: 37 },
];

/* ─────────────────────────────────────────────
   KEY PERFORMERS
   ───────────────────────────────────────────── */

interface Performer {
  name: string;
  role: string;
  statLine: string;
  narrative: string;
}

const KEY_PERFORMERS: Performer[] = [
  {
    name: 'Charlie Riojas',
    role: 'Starting Pitcher',
    statLine: '5.0 IP, 4 H, 1 ER, 1 BB, 5 K, 77 pitches',
    narrative: 'Commanded three pitches for strikes. His slider had UC Davis hitters chasing all night — four of his five strikeouts came on the breaking ball. He worked efficiently through five innings before giving way to the bullpen with Texas up 8-1.',
  },
  {
    name: 'Xavier Mendoza',
    role: 'Catcher',
    statLine: '2-for-3, 2 RBI, 2 R, BB',
    narrative: 'Framed Riojas\'s borderline pitches all night and drove in two runs. The transfer from [prior school] looked like he\'d been catching this staff for years. His at-bats were patient and purposeful.',
  },
  {
    name: 'Luke Robbins',
    role: 'Left Fielder',
    statLine: '2-for-3, 3 RBI, HR, R',
    narrative: 'The 450-foot bomb over YETI Yard in the fifth was the loudest swing of the night. Robbins launched a 1-1 fastball that never stopped climbing — it cleared the batter\'s eye in left-center and landed beyond the bleachers.',
  },
  {
    name: 'Carson Pack Jr',
    role: 'Second Baseman (FR)',
    statLine: '2-for-3, 2 RBI, 2 R, BB',
    narrative: 'The most hits by a Texas freshman in a season opener since C.J. Hinojosa (Feb 15, 2013). Pack showed advanced pitch selection for a freshman, working counts and driving balls into gaps.',
  },
  {
    name: 'Ryan Tinney',
    role: 'UC Davis DH',
    statLine: '1-for-3, HR, RBI, R',
    narrative: 'The Aggies\' lone highlight — a solo shot in the sixth that briefly quieted the UFCU Disch-Falk crowd. Tinney turned on an inside pitch and drove it out to left.',
  },
  {
    name: 'Temo Becerra',
    role: 'Right Fielder',
    statLine: '1-for-4, 2 RBI, R',
    narrative: 'The Stanford transfer drove in two runs with a bases-loaded single in the third that broke the game open. Becerra\'s swing was compact and timely — exactly what BSI\'s transfer portal analysis projected.',
  },
];

/* ─────────────────────────────────────────────
   GAME CONTEXT (for AI panel)
   ───────────────────────────────────────────── */

const GAME_CONTEXT = `
Texas 12, UC Davis 2 (7 innings, 10-run rule) — February 13, 2026
UFCU Disch-Falk Field, Austin, TX — 7,649 attendance — SEC Network+

Texas (No. 3 preseason) opened the 2026 season with a dominant 12-2 win over UC Davis.

Texas Batting: 11-for-30 (.367), 7 BB, 4 SO, .500 with RISP, 0 errors.
UC Davis Batting: 6-for-27 (.222), 1 BB, 5 SO, 2 errors.

Charlie Riojas started for Texas: 5.0 IP, 4 H, 1 ER, 1 BB, 5 K (77 pitches, W).
Mikey Valdez started for UC Davis: 4.0 IP, 5 H, 6 R, 3 ER, 4 BB, 1 SO (85 pitches, L).

Key performers: Luke Robbins HR (450 ft over YETI Yard), 3 RBI; Carson Pack Jr 2-for-3, 2 RBI (most hits by TX freshman in opener since 2013); Xavier Mendoza 2-for-3, 2 RBI; Temo Becerra 2 RBI.

Transfer portal debuts: Ashton Larson (Wake Forest), Temo Becerra (Stanford), Xavier Mendoza.
Riley Nicholson (UC Davis CF) returned to Austin where his father Steve Nicholson played for Texas in the 1990s.
`.trim();

/* ─────────────────────────────────────────────
   ARTICLE TEXT (for podcast export)
   ───────────────────────────────────────────── */

const ARTICLE_TEXT = `TEXAS 12, UC DAVIS 2 — SEASON OPENER RECAP

${GAME_CONTEXT}

GAME SUMMARY
The No. 3 Texas Longhorns opened the 2026 season exactly how Jim Schlossnagle's program needed: dominant pitching, patient hitting, and a deep lineup that produced from top to bottom. Charlie Riojas set the tone on the mound with five innings of one-run ball, while Texas's offense walked seven times and hit .500 with runners in scoring position.

This was a statement opener — not because of the opponent, but because of how Texas played. The process was the product. Every at-bat had a plan. Every pitcher threw with composure. The 10-run rule was invoked after seven innings, and the 7,649 fans at UFCU Disch-Falk Field saw a team that looked ready for the SEC.

KEY MOMENTS
- 1st Inning: Jalin Flores walks, scores on a wild pitch and throwing error — Texas leads 1-0 before recording a hit.
- 3rd Inning: Four-run explosion. Pack Jr doubles, Flores walks, Robbins singles, Mendoza drives in two. Becerra caps it with a bases-loaded single.
- 5th Inning: Robbins launches a 450-foot homer over YETI Yard. Three more runs score.
- 7th Inning: Four more runs. Pack Jr singles in two. 10-run rule invoked.

Source: texaslonghorns.com boxscore/17822 | Blaze Sports Intel`;

/* ─────────────────────────────────────────────
   INNING NARRATIVES
   ───────────────────────────────────────────── */

interface InningNarrative {
  inning: number;
  title: string;
  texasRuns: number;
  ucdavisRuns: number;
  narrative: string;
  keyMoment?: string;
}

const INNING_NARRATIVES: InningNarrative[] = [
  {
    inning: 1,
    title: 'Setting the Tone',
    texasRuns: 1,
    ucdavisRuns: 0,
    narrative: 'Texas scored without recording a hit. Jalin Flores walked, stole second, advanced to third on a wild pitch, and came home on a throwing error. It was messy, opportunistic baseball — exactly the kind of pressure that breaks young pitching staffs.',
    keyMoment: '"You don\'t have to hit to score. You have to compete." — The first run set the template for the night: take pitches, force mistakes, capitalize.',
  },
  {
    inning: 3,
    title: 'Breaking It Open',
    texasRuns: 4,
    ucdavisRuns: 1,
    narrative: 'The floodgates opened. Carson Pack Jr ripped a double to left-center. Flores walked again — his second free pass in three innings. Robbins singled to drive in Pack. Mendoza followed with a two-RBI single that pushed the lead to 5-0. Becerra capped the inning with a bases-loaded single. UC Davis got one back on a Nicholson single and an error, but the damage was done.',
    keyMoment: 'Mendoza\'s two-RBI single was the dagger. He sat on a first-pitch slider and drove it through the right side with two runners moving.',
  },
  {
    inning: 5,
    title: 'Robbins Goes Deep',
    texasRuns: 3,
    ucdavisRuns: 0,
    narrative: 'Luke Robbins turned on a 1-1 fastball and launched it 450 feet — over YETI Yard in left-center, beyond the bleachers, into the February night. It was the kind of swing that makes scouts text each other. Three runs scored in the inning as Texas pushed the lead to 8-1.',
    keyMoment: '450 feet. Over YETI Yard. The longest opening-night homer at Disch-Falk in recent memory. The ball hadn\'t landed before the dugout erupted.',
  },
  {
    inning: 7,
    title: 'Run Rule',
    texasRuns: 4,
    ucdavisRuns: 0,
    narrative: 'Texas piled on four more runs to trigger the 10-run mercy rule. Pack Jr drove in two with a sharp single, extending his perfect night with runners on base. The seventh inning was methodical — Texas didn\'t swing at a single pitch outside the zone.',
    keyMoment: 'Pack Jr\'s two-RBI single sealed the run rule. The freshman finished 2-for-3 with 2 RBI — the most hits by a Texas freshman in a season opener since C.J. Hinojosa on February 15, 2013.',
  },
];

/* ─────────────────────────────────────────────
   PAGE COMPONENT
   ───────────────────────────────────────────── */

export default function TexasUCDavisOpenerPage() {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [podcastSectionVisible, setPodcastSectionVisible] = useState(false);

  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-uc-davis-opener-2026';

  return (
    <>
      <main id="main-content" className="bg-[#0D0D0D] min-h-screen text-white">

        {/* ── BREADCRUMB ── */}
        <Section padding="none" className="pt-4 pb-2">
          <Container>
            <nav className="flex items-center gap-2 text-xs font-mono text-white/40">
              <Link href="/college-baseball" className="hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/college-baseball/editorial" className="hover:text-[#BF5700] transition-colors">
                Editorial
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white/60">Texas vs UC Davis</span>
            </nav>
          </Container>
        </Section>

        {/* ── HERO ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Badge variant="primary">Post-Game Analysis</Badge>
                <Badge variant="secondary">Season Opener</Badge>
                <Badge variant="accent">No. 3 Texas</Badge>
                <Badge variant="outline">Final / 7</Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.9] mb-6">
                <span className="bg-gradient-to-r from-[#BF5700] via-[#FF6B35] to-[#BF5700] bg-clip-text text-transparent">
                  Texas 12
                </span>
                <span className="text-white/30 mx-2 sm:mx-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light">,</span>
                <span className="text-white/50">
                  UC Davis 2
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-white/40 mb-8">
                <span>Feb 13, 2026</span>
                <span className="hidden sm:inline text-white/20">·</span>
                <span>UFCU Disch-Falk Field</span>
                <span className="hidden sm:inline text-white/20">·</span>
                <span>6:33 PM CT</span>
                <span className="hidden sm:inline text-white/20">·</span>
                <span>7,649 Attendance</span>
                <span className="hidden sm:inline text-white/20">·</span>
                <span>SEC Network+</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="font-serif text-lg sm:text-xl text-white/70 leading-relaxed max-w-3xl">
                The No. 3 Texas Longhorns opened the 2026 season exactly how Jim Schlossnagle&rsquo;s
                program needed: dominant pitching, patient hitting, and a lineup so deep it triggered
                the 10-run rule in seven innings. This is the full story — every inning, every at-bat
                that mattered, every debut that delivered.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── TOOLBAR ── */}
        <GameRecapToolbar
          onOpenAI={() => setAiPanelOpen(true)}
          onOpenPodcast={() => setPodcastSectionVisible(true)}
          articleUrl={articleUrl}
        />

        {/* ── LINE SCORE ── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Line Score
                </span>
              </div>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[480px] text-sm font-mono">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 pr-4 text-white/40 font-normal w-32">Team</th>
                      {LINE_SCORE.innings.map((i) => (
                        <th key={i} className="text-center py-3 px-2 text-white/40 font-normal w-10">{i}</th>
                      ))}
                      <th className="text-center py-3 px-3 text-white/40 font-normal border-l border-white/10">R</th>
                      <th className="text-center py-3 px-3 text-white/40 font-normal">H</th>
                      <th className="text-center py-3 px-3 text-white/40 font-normal">E</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3 pr-4 font-bold text-[#BF5700]">Texas</td>
                      {LINE_SCORE.texas.runs.map((r, i) => (
                        <td key={i} className={`text-center py-3 px-2 ${r > 0 ? 'text-white font-bold' : 'text-white/30'}`}>{r}</td>
                      ))}
                      <td className="text-center py-3 px-3 font-bold text-[#BF5700] border-l border-white/10">{LINE_SCORE.texas.totalRuns}</td>
                      <td className="text-center py-3 px-3 text-white/80">{LINE_SCORE.texas.hits}</td>
                      <td className="text-center py-3 px-3 text-white/80">{LINE_SCORE.texas.errors}</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white/50">UC Davis</td>
                      {LINE_SCORE.ucdavis.runs.map((r, i) => (
                        <td key={i} className={`text-center py-3 px-2 ${r > 0 ? 'text-white/70' : 'text-white/20'}`}>{r}</td>
                      ))}
                      <td className="text-center py-3 px-3 text-white/50 border-l border-white/10">{LINE_SCORE.ucdavis.totalRuns}</td>
                      <td className="text-center py-3 px-3 text-white/40">{LINE_SCORE.ucdavis.hits}</td>
                      <td className="text-center py-3 px-3 text-white/40">{LINE_SCORE.ucdavis.errors}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em] mt-3">
                Final — 7 Innings (10-Run Rule)
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── GAME SUMMARY STATS ── */}
        <Section padding="md" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-6">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Game Summary
                </span>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Batting Avg', value: '.367', helperText: '11-for-30' },
                { label: 'RISP', value: '.500', helperText: 'With runners in scoring position' },
                { label: 'BB / K', value: '7 / 4', helperText: 'Walks to strikeouts' },
                { label: 'Errors', value: '0', helperText: 'Clean defense' },
              ].map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 80}>
                  <StatCard label={stat.label} value={stat.value} helperText={stat.helperText} />
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── WHY THIS OPENER MATTERED ── */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Analysis
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-6">
                Why This Opener Mattered
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="space-y-5 font-serif text-[1.15rem] text-white/70 leading-relaxed">
                <p>
                  February openers don&rsquo;t decide seasons. But they reveal process — and Texas&rsquo;s
                  process on opening night was surgical. The Longhorns walked seven times against
                  UC Davis pitching. They struck out four times. They hit .500 with runners in scoring
                  position. They committed zero errors.
                </p>
                <p>
                  For a team loaded with transfer portal additions making their Texas debuts, that
                  kind of discipline doesn&rsquo;t happen by accident. It happens because Jim Schlossnagle,
                  Nolan Cain, Max Weiner, and Troy Tulowitzki built a culture that values process over
                  outcome. Win the next pitch.
                </p>
                <p>
                  Three things defined this game:
                </p>

                <blockquote className="border-l-2 border-[#BF5700] pl-6 py-2 italic text-[#C9A96E]">
                  &ldquo;Strike-zone ownership. Bottom-third production. Run prevention composure.&rdquo;
                </blockquote>

                <p>
                  Texas didn&rsquo;t just beat UC Davis — they demonstrated a blueprint. The question for
                  the next 55 games isn&rsquo;t whether the talent is there. It&rsquo;s whether this discipline
                  holds when SEC lineups start fouling off the slider and conference rivals
                  execute their own process.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── PLAY-BY-PLAY NARRATIVE ── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Play-by-Play
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-8">
                How the Game Unfolded
              </h2>
            </ScrollReveal>

            <div className="space-y-6">
              {INNING_NARRATIVES.map((inning, i) => (
                <ScrollReveal key={inning.inning} delay={i * 100}>
                  <Card variant="default" padding="lg">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-[#BF5700] text-sm font-bold">
                            {inning.inning === 7 ? 'BOT 7' : `INN ${inning.inning}`}
                          </span>
                          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                            {inning.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-sm flex-shrink-0">
                        <span className="text-[#BF5700] font-bold">TX {inning.texasRuns}</span>
                        <span className="text-white/20">–</span>
                        <span className="text-white/40">UCD {inning.ucdavisRuns}</span>
                      </div>
                    </div>

                    <p className="font-serif text-white/60 leading-relaxed mb-4">
                      {inning.narrative}
                    </p>

                    {inning.keyMoment && (
                      <blockquote className="border-l-2 border-[#BF5700]/40 pl-4 py-1 italic text-[#C9A96E]/80 text-sm font-serif">
                        {inning.keyMoment}
                      </blockquote>
                    )}
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── HOW TEXAS WON — THREE LEVERS ── */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Deep Analysis
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-8">
                How Texas Won: Three Levers
              </h2>
            </ScrollReveal>

            <div className="space-y-8">
              <ScrollReveal delay={100}>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    1. Strike-Zone Ownership
                  </h3>
                  <p className="font-serif text-[1.1rem] text-white/70 leading-relaxed">
                    Texas drew seven walks against four strikeouts — a 1.75 BB/K ratio that would lead
                    any conference. This wasn&rsquo;t passive hitting. It was disciplined aggression: swing at
                    strikes, take balls, force the pitcher to beat you in the zone. UC Davis starter
                    Mikey Valdez threw 85 pitches in four innings because Texas made him work for every out.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    2. Bottom-Third Production
                  </h3>
                  <p className="font-serif text-[1.1rem] text-white/70 leading-relaxed">
                    Carson Pack Jr (9-hole) went 2-for-3 with 2 RBI. Xavier Mendoza (7-hole) went
                    2-for-3 with 2 RBI. Temo Becerra (8-hole) drove in 2. The bottom third of the
                    order produced 6 of Texas&rsquo;s 11 RBI. That&rsquo;s lineup depth — and it&rsquo;s what separates
                    Omaha teams from regional hosts.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#BF5700] mb-3">
                    3. Run Prevention Composure
                  </h3>
                  <p className="font-serif text-[1.1rem] text-white/70 leading-relaxed">
                    Zero errors. Riojas threw 77 pitches in five innings — efficient, composed, always
                    ahead in counts. When UC Davis threatened in the third, Texas limited the damage to
                    one run. That&rsquo;s the Schlossnagle philosophy: don&rsquo;t let one bad pitch become a bad inning.
                    Riojas didn&rsquo;t let it happen.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* ── FULL BOX SCORES ── */}
        <Section padding="lg" background="charcoal" borderTop id="box-score">
          <Container>
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Official Box Score
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-8">
                Full Box Scores
              </h2>
            </ScrollReveal>

            {/* Texas Batting */}
            <ScrollReveal delay={100}>
              <div className="mb-10">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#BF5700] mb-3">
                  Texas Batting
                </h3>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[600px] text-sm font-mono">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 pr-4 text-white/40 font-normal">Player</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">Pos</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">AB</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">R</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">H</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">RBI</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">BB</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">SO</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-14">AVG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEXAS_BATTING.map((p) => (
                        <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 pr-4 text-white/80">{p.name}</td>
                          <td className="text-center py-2 px-2 text-white/40">{p.pos}</td>
                          <td className="text-center py-2 px-2 text-white/60">{p.ab}</td>
                          <td className={`text-center py-2 px-2 ${p.r > 0 ? 'text-white font-semibold' : 'text-white/30'}`}>{p.r}</td>
                          <td className={`text-center py-2 px-2 ${p.h > 0 ? 'text-white font-semibold' : 'text-white/30'}`}>{p.h}</td>
                          <td className={`text-center py-2 px-2 ${p.rbi > 0 ? 'text-[#BF5700] font-semibold' : 'text-white/30'}`}>{p.rbi}</td>
                          <td className={`text-center py-2 px-2 ${p.bb > 0 ? 'text-white/70' : 'text-white/30'}`}>{p.bb}</td>
                          <td className="text-center py-2 px-2 text-white/40">{p.so}</td>
                          <td className="text-center py-2 px-2 text-white/50">{p.avg}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-white/20 font-bold">
                        <td className="py-2 pr-4 text-white/60" colSpan={2}>Totals</td>
                        <td className="text-center py-2 px-2 text-white/80">{TEXAS_BATTING_TOTALS.ab}</td>
                        <td className="text-center py-2 px-2 text-[#BF5700]">{TEXAS_BATTING_TOTALS.r}</td>
                        <td className="text-center py-2 px-2 text-white">{TEXAS_BATTING_TOTALS.h}</td>
                        <td className="text-center py-2 px-2 text-[#BF5700]">{TEXAS_BATTING_TOTALS.rbi}</td>
                        <td className="text-center py-2 px-2 text-white/80">{TEXAS_BATTING_TOTALS.bb}</td>
                        <td className="text-center py-2 px-2 text-white/60">{TEXAS_BATTING_TOTALS.so}</td>
                        <td className="text-center py-2 px-2 text-white/50">.367</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>

            {/* UC Davis Batting */}
            <ScrollReveal delay={200}>
              <div className="mb-10">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/50 mb-3">
                  UC Davis Batting
                </h3>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[600px] text-sm font-mono">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 pr-4 text-white/40 font-normal">Player</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">Pos</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">AB</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">R</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">H</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">RBI</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">BB</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">SO</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-14">AVG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {UCDAVIS_BATTING.map((p) => (
                        <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 pr-4 text-white/60">{p.name}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.pos}</td>
                          <td className="text-center py-2 px-2 text-white/40">{p.ab}</td>
                          <td className={`text-center py-2 px-2 ${p.r > 0 ? 'text-white/70' : 'text-white/20'}`}>{p.r}</td>
                          <td className={`text-center py-2 px-2 ${p.h > 0 ? 'text-white/70' : 'text-white/20'}`}>{p.h}</td>
                          <td className={`text-center py-2 px-2 ${p.rbi > 0 ? 'text-white/70' : 'text-white/20'}`}>{p.rbi}</td>
                          <td className={`text-center py-2 px-2 ${p.bb > 0 ? 'text-white/50' : 'text-white/20'}`}>{p.bb}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.so}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.avg}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-white/20 font-bold">
                        <td className="py-2 pr-4 text-white/40" colSpan={2}>Totals</td>
                        <td className="text-center py-2 px-2 text-white/50">{UCDAVIS_BATTING_TOTALS.ab}</td>
                        <td className="text-center py-2 px-2 text-white/50">{UCDAVIS_BATTING_TOTALS.r}</td>
                        <td className="text-center py-2 px-2 text-white/50">{UCDAVIS_BATTING_TOTALS.h}</td>
                        <td className="text-center py-2 px-2 text-white/50">{UCDAVIS_BATTING_TOTALS.rbi}</td>
                        <td className="text-center py-2 px-2 text-white/40">{UCDAVIS_BATTING_TOTALS.bb}</td>
                        <td className="text-center py-2 px-2 text-white/40">{UCDAVIS_BATTING_TOTALS.so}</td>
                        <td className="text-center py-2 px-2 text-white/40">.222</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>

            {/* Texas Pitching */}
            <ScrollReveal delay={300}>
              <div className="mb-10">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#BF5700] mb-3">
                  Texas Pitching
                </h3>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[600px] text-sm font-mono">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 pr-4 text-white/40 font-normal">Pitcher</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-12">IP</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">H</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">R</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">ER</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">BB</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">SO</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-12">P</th>
                        <th className="text-left py-2 px-2 text-white/40 font-normal">Dec</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEXAS_PITCHING.map((p) => (
                        <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 pr-4 text-white/80">{p.name}</td>
                          <td className="text-center py-2 px-2 text-white/60">{p.ip}</td>
                          <td className="text-center py-2 px-2 text-white/50">{p.h}</td>
                          <td className="text-center py-2 px-2 text-white/50">{p.r}</td>
                          <td className="text-center py-2 px-2 text-white/50">{p.er}</td>
                          <td className="text-center py-2 px-2 text-white/50">{p.bb}</td>
                          <td className={`text-center py-2 px-2 ${p.so > 0 ? 'text-white font-semibold' : 'text-white/30'}`}>{p.so}</td>
                          <td className="text-center py-2 px-2 text-white/40">{p.pitches}</td>
                          <td className="text-left py-2 px-2 text-[#BF5700] font-semibold">{p.decision || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>

            {/* UC Davis Pitching */}
            <ScrollReveal delay={400}>
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/50 mb-3">
                  UC Davis Pitching
                </h3>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[600px] text-sm font-mono">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 pr-4 text-white/40 font-normal">Pitcher</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-12">IP</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">H</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">R</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">ER</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">BB</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-10">SO</th>
                        <th className="text-center py-2 px-2 text-white/40 font-normal w-12">P</th>
                        <th className="text-left py-2 px-2 text-white/40 font-normal">Dec</th>
                      </tr>
                    </thead>
                    <tbody>
                      {UCDAVIS_PITCHING.map((p) => (
                        <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 pr-4 text-white/60">{p.name}</td>
                          <td className="text-center py-2 px-2 text-white/40">{p.ip}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.h}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.r}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.er}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.bb}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.so}</td>
                          <td className="text-center py-2 px-2 text-white/30">{p.pitches}</td>
                          <td className="text-left py-2 px-2 text-red-400/60 font-semibold">{p.decision || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── KEY PERFORMERS ── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Player Spotlight
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-8">
                Key Performers
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {KEY_PERFORMERS.map((player, i) => (
                <ScrollReveal key={player.name} delay={i * 80}>
                  <Card variant="default" padding="lg" className="h-full">
                    <div className="mb-3">
                      <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
                        {player.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.15em]">
                        {player.role}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-md bg-white/5 mb-3">
                      <p className="font-mono text-xs text-white/60">{player.statLine}</p>
                    </div>
                    <p className="font-serif text-sm text-white/50 leading-relaxed">
                      {player.narrative}
                    </p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── DEEP DIVES ── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container size="narrow">
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Deep Dives
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-8">
                Beyond the Box Score
              </h2>
            </ScrollReveal>

            {/* Riojas Pitching Breakdown */}
            <ScrollReveal delay={100}>
              <div className="mb-10">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
                  Riojas&rsquo;s Pitching Clinic
                </h3>
                <div className="space-y-4 font-serif text-[1.05rem] text-white/60 leading-relaxed">
                  <p>
                    Charlie Riojas threw 77 pitches in five innings — that&rsquo;s 15.4 pitches per inning,
                    elite efficiency for an opening-night start against any opponent. His pitch mix was
                    fastball-slider-changeup, with the slider accounting for four of his five strikeouts.
                  </p>
                  <p>
                    What stood out wasn&rsquo;t velocity — it was sequencing. Riojas established the fastball
                    early in counts, then buried the slider low and away when he needed a chase pitch.
                    UC Davis hitters were consistently behind his secondary stuff, swinging through
                    sliders they couldn&rsquo;t adjust to.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Transfer Portal Debuts */}
            <ScrollReveal delay={200}>
              <div className="mb-10">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
                  Transfer Portal Report Card
                </h3>
                <div className="space-y-4 font-serif text-[1.05rem] text-white/60 leading-relaxed">
                  <p>
                    <strong className="text-white/80">Ashton Larson (Wake Forest → Texas):</strong>{' '}
                    1-for-4, RBI, SO. Larson slotted into the two-hole and looked comfortable in the
                    field at shortstop. His RBI single in the third showed plus bat speed. Grade: B.
                  </p>
                  <p>
                    <strong className="text-white/80">Temo Becerra (Stanford → Texas):</strong>{' '}
                    1-for-4, 2 RBI, R, SO. The big moment was the bases-loaded single in the third
                    that broke the game open. Becerra&rsquo;s approach at the plate was exactly what
                    BSI projected from his Stanford film — compact swing, uses the whole field. Grade: B+.
                  </p>
                  <p>
                    <strong className="text-white/80">Xavier Mendoza (C):</strong>{' '}
                    2-for-3, 2 RBI, 2 R, BB. The best debut of the night. Mendoza framed borderline
                    pitches, managed Riojas through five clean innings, and was productive at the
                    plate. His two-RBI single in the third was the dagger. Grade: A.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Pack's Freshman Breakout */}
            <ScrollReveal delay={300}>
              <div className="mb-10">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
                  Pack Jr&rsquo;s Freshman Arrival
                </h3>
                <div className="space-y-4 font-serif text-[1.05rem] text-white/60 leading-relaxed">
                  <p>
                    Carson Pack Jr went 2-for-3 with a walk, 2 RBI, and 2 runs scored from the nine-hole.
                    That&rsquo;s the most hits by a Texas freshman in a season opener since C.J. Hinojosa
                    collected 2 hits on February 15, 2013.
                  </p>
                  <p>
                    What made Pack&rsquo;s night special wasn&rsquo;t the counting stats — it was his plate discipline.
                    He took a walk in his second at-bat, doubled to left-center in his third, and
                    delivered a clutch two-RBI single in the seventh that triggered the run rule.
                    For a freshman hitting ninth, that&rsquo;s extraordinary composure.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Nicholson's Homecoming */}
            <ScrollReveal delay={400}>
              <div className="mb-10">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
                  Nicholson&rsquo;s Austin Homecoming
                </h3>
                <div className="space-y-4 font-serif text-[1.05rem] text-white/60 leading-relaxed">
                  <p>
                    Riley Nicholson led UC Davis with 2 hits, playing center field at the park where
                    his father Steve Nicholson played for Texas in the 1990s. It&rsquo;s the kind of subplot
                    that makes college baseball richer than any box score can capture.
                  </p>
                  <p>
                    Nicholson&rsquo;s two singles showed good contact ability against Texas pitching. He was
                    the one Aggies hitter who consistently put the ball in play and found holes.
                    In a different game context, he&rsquo;s a top-of-the-order catalyst.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* National Context */}
            <ScrollReveal delay={500}>
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
                  National Rankings Context
                </h3>
                <div className="space-y-4 font-serif text-[1.05rem] text-white/60 leading-relaxed">
                  <p>
                    Texas entered 2026 ranked No. 3 in the D1Baseball preseason poll, No. 2 in Baseball
                    America, and No. 4 in the USA Today Coaches Poll. This opener doesn&rsquo;t move the needle
                    on rankings — no February win over UC Davis does.
                  </p>
                  <p>
                    What it does is confirm the baseline. The pitching depth is real (Riojas looked like
                    a Friday starter). The lineup has no free outs. The defense was clean. If these things
                    hold through the SEC schedule, Texas has the floor of a super regional host and the
                    ceiling of a national seed.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI VERDICT ── */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <ScrollReveal>
              <div className="rounded-xl border border-[#BF5700]/30 bg-gradient-to-br from-[#BF5700]/10 via-transparent to-[#FF6B35]/5 p-6 sm:p-8">
                <div className="mb-4">
                  <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                    BSI Verdict
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mb-4">
                  Statement Made, Process Confirmed
                </h2>
                <div className="space-y-4 font-serif text-[1.1rem] text-white/70 leading-relaxed">
                  <p>
                    This was exactly what you want from a season opener: dominant but not reckless,
                    deep but not unfocused, decisive but not careless. Texas played seven disciplined
                    innings of baseball and triggered the mercy rule without ever looking like they
                    were trying to run up the score.
                  </p>
                  <p>
                    The real test starts tomorrow at noon. Game 2 against UC Davis with Luke Harrison
                    on the mound will tell us more about pitching depth. Sunday&rsquo;s Game 3 with Dylan
                    Volantis could showcase the arm most scouts are in Austin to see.
                  </p>
                  <p className="text-[#C9A96E] italic">
                    Win the next pitch. Texas won every one of them tonight.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AI FEATURES ── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  AI Tools
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-4">
                Go Deeper with AI
              </h2>
              <p className="font-serif text-white/50 mb-8 max-w-2xl">
                Use Claude or Gemini to generate custom analysis of this game, or turn
                the entire recap into a podcast with one click.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScrollReveal delay={100}>
                <Card
                  variant="hover"
                  padding="lg"
                  className="cursor-pointer border-[#BF5700]/20 hover:border-[#BF5700]/40"
                  onClick={() => setAiPanelOpen(true)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#BF5700]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#BF5700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
                        AI Analysis
                      </h3>
                      <p className="text-white/30 text-xs">Claude or Gemini</p>
                    </div>
                  </div>
                  <p className="font-serif text-sm text-white/40">
                    Ask questions about matchups, portal report cards, Omaha implications, or anything else.
                  </p>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <Card
                  variant="hover"
                  padding="lg"
                  className="cursor-pointer border-[#BF5700]/20 hover:border-[#BF5700]/40"
                  onClick={() => setPodcastSectionVisible(true)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#BF5700]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#BF5700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
                        Listen as Podcast
                      </h3>
                      <p className="text-white/30 text-xs">Via NotebookLM</p>
                    </div>
                  </div>
                  <p className="font-serif text-sm text-white/40">
                    Copy the full article and generate an audio overview in Google NotebookLM.
                  </p>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* ── PODCAST EXPORT CTA ── */}
        {podcastSectionVisible && (
          <Section padding="lg" borderTop>
            <Container size="narrow">
              <ScrollReveal>
                <div className="text-center">
                  <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mb-3">
                    Turn This Recap Into a Podcast
                  </h2>
                  <p className="font-serif text-white/50 mb-6 max-w-lg mx-auto">
                    Copy the full article text and paste it into NotebookLM to generate
                    an AI-powered audio discussion of tonight&rsquo;s game.
                  </p>
                  <div className="flex justify-center">
                    <NotebookLMExport articleText={ARTICLE_TEXT} />
                  </div>
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* ── GAME 2 PREVIEW ── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container size="narrow">
            <ScrollReveal>
              <div className="mb-4">
                <span className="text-[10px] font-mono text-[#BF5700] uppercase tracking-[0.2em]">
                  Up Next
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white mb-6">
                Game 2 Preview — Saturday, Noon CT
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="space-y-4 font-serif text-[1.05rem] text-white/60 leading-relaxed">
                <p>
                  Texas sends <strong className="text-white/80">Luke Harrison</strong> (LHP, senior) to the
                  mound for Game 2 at noon CT Saturday. The start time was moved up from the original
                  schedule due to weather concerns.
                </p>
                <p>
                  Harrison gives Schlossnagle a veteran left-hander in the Saturday slot — exactly where
                  you want reliability. After Riojas&rsquo;s commanding performance on Friday night, Harrison&rsquo;s
                  task is straightforward: keep the standard.
                </p>

                <h3 className="font-display text-base font-bold uppercase tracking-wide text-white pt-4">
                  What to Watch
                </h3>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-3">
                    <span className="text-[#BF5700] font-mono text-sm mt-1">→</span>
                    <span>Can Harrison match Riojas&rsquo;s efficiency? Texas needs its Saturday starter to go deep.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#BF5700] font-mono text-sm mt-1">→</span>
                    <span>UC Davis adjustments — does Bard&rsquo;s staff shorten their approach after the walks hurt them Friday?</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#BF5700] font-mono text-sm mt-1">→</span>
                    <span>Pack Jr encore — can the freshman follow up his historic debut, or does the moment settle in?</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#BF5700] font-mono text-sm mt-1">→</span>
                    <span>Sunday preview: Dylan Volantis (LHP, sophomore) is the arm scouts want to see most.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── SOURCE ATTRIBUTION ── */}
        <Section padding="md" borderTop>
          <Container>
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <DataSourceBadge
                  source="texaslonghorns.com/boxscore/17822"
                  timestamp="February 13, 2026 — 10:15 PM CT"
                />
                <div className="flex items-center gap-4">
                  <Link
                    href="/college-baseball"
                    className="text-xs font-mono text-white/40 hover:text-[#BF5700] transition-colors uppercase tracking-wider"
                  >
                    College Baseball Home
                  </Link>
                  <Link
                    href="/college-baseball/editorial"
                    className="text-xs font-mono text-white/40 hover:text-[#BF5700] transition-colors uppercase tracking-wider"
                  >
                    More Editorials
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

      </main>

      <Footer />

      {/* ── AI ANALYSIS PANEL (overlay) ── */}
      <AIAnalysisPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        gameContext={GAME_CONTEXT}
      />
    </>
  );
}
