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

interface BattingLine {
  name: string;
  pos: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  note?: string;
}

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
  notes?: string;
}

interface InningScore {
  team: string;
  innings: (number | string)[];
  r: number;
  h: number;
  e: number;
}

/* ────────────────────────────────────────────
   Verified Box Score Data
   Source: texaslonghorns.com/boxscore/17822
   ──────────────────────────────────────────── */

const texasBatting: BattingLine[] = [
  { name: 'Ethan Mendoza', pos: '2B', ab: 3, r: 1, h: 1, rbi: 3, bb: 1, so: 0, note: '3-run HR (walk-off)' },
  { name: 'Adrian Rodriguez', pos: 'SS', ab: 4, r: 2, h: 1, rbi: 1, bb: 0, so: 1, note: 'RBI 1B' },
  { name: 'Aiden Robbins', pos: 'CF', ab: 4, r: 2, h: 2, rbi: 3, bb: 0, so: 0, note: '2-run HR, RBI 2B' },
  { name: 'Carson Tinney', pos: '1B', ab: 2, r: 1, h: 0, rbi: 0, bb: 2, so: 0 },
  { name: 'Jalin Livingston', pos: 'LF', ab: 3, r: 1, h: 1, rbi: 0, bb: 1, so: 0 },
  { name: 'Casey Borba', pos: 'DH', ab: 4, r: 1, h: 1, rbi: 0, bb: 0, so: 2, note: '2B in 7th' },
  { name: 'Jared Duplantier', pos: 'C', ab: 3, r: 1, h: 1, rbi: 0, bb: 0, so: 1, note: '1B in 7th' },
  { name: 'Temo Becerra', pos: '3B', ab: 2, r: 1, h: 1, rbi: 2, bb: 2, so: 0, note: 'RBI BB, RBI 1B' },
  { name: 'Anthony Pack Jr.', pos: 'RF', ab: 4, r: 2, h: 3, rbi: 2, bb: 0, so: 0, note: '2B, 2-run 1B, 1B, SB' },
  { name: 'Ashton Larson', pos: 'PH', ab: 1, r: 0, h: 0, rbi: 0, bb: 1, so: 0 },
];

const ucdavisBatting: BattingLine[] = [
  { name: 'Chase Wooldridge', pos: 'CF', ab: 3, r: 1, h: 2, rbi: 1, bb: 1, so: 0, note: 'BB, RBI 2B' },
  { name: 'Tyler Howard', pos: 'SS', ab: 4, r: 0, h: 1, rbi: 0, bb: 0, so: 1 },
  { name: 'Mason Wright', pos: 'DH', ab: 3, r: 1, h: 0, rbi: 1, bb: 0, so: 0, note: 'RBI FC' },
  { name: 'Ryan Lee', pos: '1B', ab: 3, r: 0, h: 1, rbi: 0, bb: 0, so: 0 },
  { name: 'Nick Castagnola', pos: 'LF', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1 },
  { name: 'Jake Gentil', pos: '2B', ab: 3, r: 0, h: 1, rbi: 0, bb: 0, so: 0 },
  { name: 'Max Nicholson', pos: '3B', ab: 3, r: 0, h: 1, rbi: 0, bb: 0, so: 1 },
  { name: 'Brady Madsen', pos: 'C', ab: 3, r: 0, h: 0, rbi: 0, bb: 0, so: 1 },
  { name: 'Cole Davis', pos: 'RF', ab: 3, r: 0, h: 1, rbi: 0, bb: 0, so: 0 },
];

const texasPitching: PitchingLine[] = [
  { name: 'Ruger Riojas', ip: '5.0', h: 4, r: 1, er: 1, bb: 1, so: 6, pitches: 78, decision: 'W (1-0)' },
  { name: 'Max Grubbs', ip: '2.0', h: 3, r: 1, er: 1, bb: 1, so: 1, pitches: 37, notes: '1 WP' },
];

const ucdavisPitching: PitchingLine[] = [
  { name: 'Noel Valdez', ip: '4.0', h: 5, r: 6, er: 3, bb: 4, so: 1, pitches: 85, decision: 'L (0-1)' },
  { name: 'Mason Lerma', ip: '1.0', h: 1, r: 1, er: 0, bb: 3, so: 2, pitches: 34, notes: '1 BK' },
  { name: 'Kouki Anzai', ip: '1.0', h: 4, r: 4, er: 4, bb: 0, so: 1, pitches: 26, notes: '1 BK' },
  { name: 'Max Hippensteel', ip: '0.0', h: 1, r: 1, er: 1, bb: 0, so: 0, pitches: 2 },
];

const lineScore: InningScore[] = [
  { team: 'UC Davis', innings: [1, 0, 0, 0, 0, 0, 1], r: 2, h: 7, e: 1 },
  { team: 'Texas', innings: [0, 0, 3, 0, 4, 0, 5], r: 12, h: 11, e: 0 },
];

const performers = [
  { name: 'Ethan Mendoza', pos: '2B', year: 'Junior', line: 'Walk-off 3-run HR, BB', context: 'Walk-off ended game via run-rule' },
  { name: 'Aiden Robbins', pos: 'CF', year: 'Jr. (Notre Dame)', line: '2-run HR (450 ft), RBI 2B', context: '3 RBI in his Texas debut' },
  { name: 'Anthony Pack Jr.', pos: 'RF', year: 'Senior', line: '2B, 2-run 1B, 1B, SB', context: '3 hits, 2 RBI — catalyzed every rally' },
  { name: 'Adrian Rodriguez', pos: 'SS', year: 'Sophomore', line: 'RBI single, reached on E6', context: 'Tied the game in the 3rd' },
  { name: 'Temo Becerra', pos: '3B', year: 'R-Sr. (Stanford)', line: 'RBI walk, RBI single', context: 'Quiet 2-RBI night from the 8-hole' },
  { name: 'Ruger Riojas', pos: 'RHP', year: 'Starter', line: '5.0 IP, 1 R, 6 K', context: 'Settled after rocky 1st, dominant middle innings' },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM export
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `Texas 12, UC Davis 2 — Season Opener Recap

FINAL — 7 INNINGS (10-RUN RULE)
February 13, 2026 · UFCU Disch-Falk Field · Austin, TX · 7,649 attendance

Texas: 0 0 3 0 4 0 5 — 12 R, 11 H, 0 E
UC Davis: 1 0 0 0 0 0 1 — 2 R, 7 H, 1 E

KEY PERFORMERS:
Ethan Mendoza (2B): Walk-off 3-run HR — ended game via run-rule
Aiden Robbins (CF): 2-run HR (450 ft over YETI Yard), RBI 2B — 3 RBI in Texas debut
Anthony Pack Jr. (RF): 2B, 2-run 1B, 1B, SB — 3 hits, 2 RBI
Adrian Rodriguez (SS): RBI single — tied game in the 3rd
Temo Becerra (3B): RBI walk, RBI single — 2 RBI from the 8-hole
Ruger Riojas (RHP): 5.0 IP, 4 H, 1 R, 1 ER, 1 BB, 6 K, 78 pitches (W, 1-0)

ANALYSIS:
On a cool Friday evening at Disch-Falk, in front of 7,649 who showed up early and stayed loud, the 2026 Texas Longhorns took roughly four and a half innings to move from theory to conviction. UC Davis came out swinging — Wooldridge walked, Howard singled, Wright pushed a run across on a fielder's choice — and the visitors had a 1-0 lead. But Riojas settled, sat down three of the next four on strikeouts, and never looked back.

Robbins' 450-foot home run over YETI Yard in the third turned the game. Pack Jr.'s two-run single in the fifth broke it open. And Mendoza's walk-off three-run blast in the seventh ended it by run-rule. Texas hit .367 as a team, drew 7 walks against 4 strikeouts, and committed zero errors.

The transfer portal additions delivered immediately: Robbins (Notre Dame) had 3 RBI, Becerra (Stanford) had 2 RBI, and Tinney drew two walks in lineup protection behind Robbins. Schlossnagle didn't just add names — he added fits. The chemistry showed from the first inning on.

Riojas can handle the Friday spot. The first inning was bumpy. The next four? Clean. Dominant. He found his slider, located his fastball, and gave the bullpen a clean handoff. Grubbs came in, induced a double play, and handled the rest.

One game is one game. UC Davis is not Ole Miss, and February is not June. But the things you look for in an opener — energy, depth, competitive at-bats from all nine spots, a starter who recovered after adversity, a bullpen arm who shut the door — were all here.

UP NEXT: Texas vs. UC Davis — Game 2 — Saturday, February 14 at 12:00 PM CT
Probable starter: Luke Harrison (LHP, Sr.)

Source: texaslonghorns.com/boxscore/17822 | Blaze Sports Intel | February 13, 2026 CT`;

const GAME_CONTEXT = `Texas 12, UC Davis 2 (7 innings, 10-run rule). Feb 13, 2026. UFCU Disch-Falk Field, Austin TX. No. 3 Texas season opener.

Texas batting: .367 BA, .500 w/RISP, 11 H, 7 BB, 4 K, 0 E.
Key hitters: Mendoza (walk-off 3-run HR), Robbins (2-run HR 450ft + RBI 2B, Notre Dame transfer), Pack Jr (3-for-4, 2 RBI from 9-hole), Becerra (2 RBI, Stanford transfer), Rodriguez (RBI single).

Texas pitching: Riojas 5.0IP/4H/1R/1ER/1BB/6K/78P (W). Grubbs 2.0IP/3H/1R/1ER/1BB/1K/37P.

UC Davis pitching: Valdez (L) 4.0IP/5H/6R/3ER/4BB/1K/85P. Lerma 1.0IP/1H/1R/0ER/3BB/2K/34P/1BK. Anzai 1.0IP/4H/4R/4ER/0BB/1K/26P/1BK. Hippensteel 0.0IP/1H/1R/1ER/2P.

Coaching: Jim Schlossnagle (HC), Nolan Cain (Assoc HC), Troy Tulowitzki (Asst Coach, 5x MLB All-Star SS).

Context: Texas won the SEC in Year One (2025). Preseason No. 3. Roster loaded with returning talent (Mendoza .333, Rodriguez .313, Volantis 1.94 ERA) plus key portal additions (Robbins from Notre Dame, Becerra from Stanford, Tinney, Larson from LSU). Saturday Game 2 at noon CT, Luke Harrison probable (LHP, Sr). Sunday TBD: Dylan Volantis (LHP, So).`;

/* ────────────────────────────────────────────
   Helper: sum a column
   ──────────────────────────────────────────── */
function sumCol(rows: BattingLine[], key: keyof Pick<BattingLine, 'ab' | 'r' | 'h' | 'rbi' | 'bb' | 'so'>) {
  return rows.reduce((s, row) => s + row[key], 0);
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export default function TexasUCDavisOpener2026Page() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-uc-davis-opener-2026';

  const openAI = (model: 'claude' | 'gemini' = 'claude') => {
    setAiDefaultModel(model);
    setAiOpen(true);
  };

  return (
    <>
      <main id="main-content">
        {/* ── Breadcrumb ── */}
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-white/40 hover:text-[#BF5700] transition-colors">
                College Baseball
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/college-baseball/editorial" className="text-white/40 hover:text-[#BF5700] transition-colors">
                Editorial
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white/70">Texas vs UC Davis</span>
            </nav>
          </Container>
        </Section>

        {/* ── Hero ── */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B4513]/12 via-transparent to-[#BF5700]/6 pointer-events-none" />
          <div className="absolute -top-24 -right-48 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(191,87,0,0.06)_0%,transparent_70%)] pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="primary">Post-Game Analysis</Badge>
                  <Badge variant="outline">Season Opener</Badge>
                  <Badge variant="accent">No. 3 Texas</Badge>
                  <span className="font-mono text-xs text-white/30">Final / 7 Innings</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-gradient-blaze text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-1">
                    Texas 12, UC Davis 2
                  </span>
                  <span className="block text-white text-2xl sm:text-3xl md:text-4xl mt-2">
                    Mendoza Walks It Off in Seven. The Horns Are Back.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-white/50 italic leading-relaxed mb-6">
                  Aiden Robbins announces himself with a 450-foot blast over YETI Yard. Anthony Pack Jr. catalyzes every rally from the nine-hole. And Ethan Mendoza puts a three-run exclamation point on the seventh to run-rule the Aggies and christen the 2026 campaign.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/30 tracking-wide">
                  <span>February 13, 2026</span>
                  <span className="hidden sm:inline">·</span>
                  <span>UFCU Disch-Falk Field</span>
                  <span className="hidden sm:inline">·</span>
                  <span>6:33 PM CT</span>
                  <span className="hidden sm:inline">·</span>
                  <span>7,649 in attendance</span>
                  <span className="hidden sm:inline">·</span>
                  <span>SEC Network+</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-white/25 mt-4">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>~12 min read</span>
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

        {/* ── Line Score ── */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <Card variant="default" padding="none">
                <div className="bg-[#BF5700]/5 text-center py-2">
                  <span className="font-display text-[10px] uppercase tracking-[3px] text-[#BF5700]">
                    Final — 7 Innings (10-Run Rule)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px]">
                    <thead>
                      <tr className="font-display text-[11px] uppercase tracking-widest text-white/30 bg-black/30">
                        <th className="text-left py-2.5 px-4 w-36" />
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <th key={i} className="text-center py-2.5 w-10">{i}</th>
                        ))}
                        <th className="text-center py-2.5 w-12 border-l border-white/5">R</th>
                        <th className="text-center py-2.5 w-12">H</th>
                        <th className="text-center py-2.5 w-12">E</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {lineScore.map((row) => {
                        const isTexas = row.team === 'Texas';
                        return (
                          <tr key={row.team} className={`border-t border-white/5 ${isTexas ? '' : ''}`}>
                            <td className={`py-3 px-4 font-display text-sm font-semibold uppercase tracking-wide ${isTexas ? 'text-[#BF5700]' : 'text-white/50'}`}>
                              {row.team}
                            </td>
                            {row.innings.map((val, i) => (
                              <td key={i} className={`text-center py-3 ${Number(val) > 0 ? (isTexas ? 'text-white font-semibold' : 'text-white/70 font-medium') : 'text-white/20'}`}>
                                {val}
                              </td>
                            ))}
                            <td className={`text-center py-3 border-l border-white/5 font-bold text-lg ${isTexas ? 'text-[#BF5700]' : 'text-white/60'}`}>
                              {row.r}
                            </td>
                            <td className="text-center py-3 text-white/40">{row.h}</td>
                            <td className="text-center py-3 text-white/40">{row.e}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game Summary Stats ── */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Team BA" value=".367" helperText="11-for-30" />
                <StatCard label="w/ RISP" value=".500" helperText="Clutch hitting" />
                <StatCard label="BB / K" value="7 / 4" helperText="Plate discipline" />
                <StatCard label="Errors" value="0" helperText="Clean defense" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                There&rsquo;s a thing that happens the first time a team takes the field in a new season — a half-breath between the last out of the old year and the first pitch of the new one — where everything is still theory. Preseason polls. Portal grades. Rotation projections. All of it lives on paper until somebody walks between the lines and proves it or burns it down. On a cool Friday evening at Disch-Falk, in front of the faithful who showed up early and stayed loud, the 2026 Texas Longhorns took roughly four and a half innings to move from theory to conviction.
              </p>
              <p className="font-serif text-lg leading-relaxed text-white/70">
                And friend, once they got rolling, there wasn&rsquo;t a soul in the press box reaching for the brakes.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Third Inning ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-5 pb-2 border-b border-[#BF5700]/15">
                The Third Inning: Where It Turned
              </h2>

              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Credit UC Davis — they came out swinging. Top of the first, Wooldridge drew a walk off Ruger Riojas, Howard singled him over, and Wright pushed a run across on a fielder&rsquo;s choice. Just like that, the visitors had a 1-0 lead. Riojas settled. He sat down three of the next four he faced in the second, all on strikeouts, and after a clean third frame for UC Davis, he&rsquo;d found his footing.
                </p>

                <p>
                  Anthony Pack Jr. led off the bottom of the third with a double ripped into the right-center gap. Mendoza grounded out to third, moving Pack to third. Then Adrian Rodriguez — the switch-hitting sophomore who slashed .313 as a freshman in the SEC — laced an RBI single through the left side. Ballgame tied.
                </p>

                <blockquote className="border-l-[3px] border-[#BF5700] pl-6 my-8 font-serif italic text-xl text-[#C9A96E] leading-relaxed">
                  &ldquo;Rodriguez delivers, and that ball finds grass like it was always going to end up there. One-one ballgame. And now Robbins steps in — the Notre Dame transfer, the kid Schlossnagle went and got because he believed this lineup needed a presence in the three-hole.&rdquo;
                </blockquote>

                <p>
                  What happened next is the at-bat that will live in the first chapter of the Aiden Robbins story at Texas. He got a fastball middle-in, and he didn&rsquo;t miss it. Two-run home run — 450 feet, over YETI Yard. Gone to left. The ball left the yard like it was late for something.
                </p>

                <p className="text-white/60">
                  Texas 3, UC Davis 1. And the air at Disch-Falk changed from hopeful to hungry.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── The Fifth Inning ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-5 pb-2 border-b border-[#BF5700]/15">
                The Fifth: When the Dam Broke
              </h2>

              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  If the third inning was the ignition, the fifth was the flood. Rodriguez reached on a UC Davis error at short. Robbins followed with an RBI double — his second extra-base hit of the night — and the score moved to 4-1. Tinney drew a walk. Then the wheels came off.
                </p>

                <p>
                  Mason Lerma came on in relief and immediately balked both runners up a base. Livingston drew a walk to load them. Borba struck out. Duplantier, pinch-hitting for Larson, K&rsquo;d looking. Two outs, bases loaded. They didn&rsquo;t escape.
                </p>

                <p>
                  Temo Becerra — the Stanford transfer — worked a full-count walk that pushed a run across. 5-1 Texas. Then Anthony Pack Jr. stepped back to the plate and dropped a two-run single into center field. 7-1. Pack stole second for good measure.
                </p>

                <div className="bg-[#1B4332]/8 border-l-[3px] border-[#1B4332] rounded-r p-5 my-8">
                  <div className="font-display text-[11px] uppercase tracking-[3px] text-[#1B4332]/70 mb-2">Fifth Inning — The Sequence</div>
                  <p className="font-serif text-base text-white/70 leading-relaxed">
                    Rodriguez reached on E6. Robbins doubled home a run. Tinney walked. Balk advanced both runners. Livingston walked to load them. Two outs later, Becerra walked in a run, Pack singled home two more, and Texas had turned a 4-1 lead into a 7-1 demolition.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Grubbs + Seventh Inning ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-5 pb-2 border-b border-[#BF5700]/15">
                Grubbs Keeps the Door Shut
              </h2>

              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <p>
                  Max Grubbs — the senior right-hander from Arlington who posted a 2.84 ERA last season — took the ball in the sixth and did exactly what a veteran reliever is supposed to do: he kept the game boring. Lee singled. Wright singled. Castagnola flew out to left, and then Gentil hit into a 5-3 double play that ended the threat.
                </p>

                <p>
                  That&rsquo;s what depth looks like. When your first reliever out of the pen is a senior with 50-plus innings of SEC experience and a groundball pitch that induces double plays on demand, the starters can pitch free and the bullpen can hold any lead.
                </p>

                <p>
                  UC Davis scratched one back in the seventh — Wooldridge doubled home a run to make it 7-2 — and for a half-heartbeat it looked like the Aggies might force the Longhorns to play a full nine.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mt-14 mb-5 pb-2 border-b border-[#BF5700]/15">
                The Seventh: Mendoza&rsquo;s Punctuation
              </h2>

              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-6">
                <blockquote className="border-l-[3px] border-[#BF5700] pl-6 my-8 font-serif italic text-xl text-[#C9A96E] leading-relaxed">
                  &ldquo;Bottom of the seventh. Borba doubles. Duplantier singles him to third. A balk — UC Davis&rsquo;s second of the night — pushes Borba home. 8-2. Becerra singles. 9-2. Pack singles again. And here comes Mendoza with the bases loaded, the run-rule in reach, and Disch-Falk on its feet...&rdquo;
                </blockquote>

                <p>
                  Max Hippensteel had barely had time to feel the mound under his spikes before Ethan Mendoza stepped in. Mendoza — the Southlake Carroll product with the best contact rate in the SEC — sat fastball and got one.
                </p>

                <p>
                  Three-run home run. Walk-off. Run-rule. Twelve to two. And the 2026 season opened the way the entire offseason promised it would: with a roster that is deeper, meaner, and more dangerous than anything Schlossnagle has fielded in Austin.
                </p>

                <blockquote className="border-l-[3px] border-[#BF5700] pl-6 my-8 font-serif italic text-xl text-[#C9A96E] leading-relaxed">
                  &ldquo;That ball is hit deep to left... and I don&rsquo;t believe — wait, yes I do. I absolutely believe it. Because this is exactly what this team was built to do. Mendoza clears the bases, the Longhorns mob him at the plate, and the first night of the new year ends the only way it could: with a bang.&rdquo;
                </blockquote>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Key Performers ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6 pb-2 border-b border-[#BF5700]/15">
                Key Performers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {performers.map((p) => (
                  <div
                    key={p.name}
                    className="relative bg-gradient-to-br from-[#2A2A2A]/90 to-[#1A1A1A]/95 border border-[#BF5700]/10 hover:border-[#BF5700]/25 rounded p-5 pl-7 overflow-hidden transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-[3px] h-full bg-[#BF5700]" />
                    <div className="font-display text-base font-semibold uppercase tracking-wide text-[#FAF7F2] mb-0.5">
                      {p.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#BF5700] mb-2">
                      {p.pos} &middot; {p.year}
                    </div>
                    <div className="font-mono text-[13px] text-white/40 leading-relaxed">
                      <span className="text-[#FF6B35] font-medium">{p.line}</span>
                      <br />
                      {p.context}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Full Box Scores ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-6 pb-2 border-b border-[#BF5700]/15">
                Full Box Score
              </h2>

              {/* Texas Batting */}
              <div className="mb-8">
                <h3 className="font-display text-sm uppercase tracking-wider text-[#BF5700] mb-3">Texas Batting</h3>
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] font-mono text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-white/30 bg-black/20">
                          <th className="text-left py-2.5 px-3">Player</th>
                          <th className="text-center py-2.5 w-10">Pos</th>
                          <th className="text-center py-2.5 w-10">AB</th>
                          <th className="text-center py-2.5 w-10">R</th>
                          <th className="text-center py-2.5 w-10">H</th>
                          <th className="text-center py-2.5 w-10">RBI</th>
                          <th className="text-center py-2.5 w-10">BB</th>
                          <th className="text-center py-2.5 w-10">SO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {texasBatting.map((b) => (
                          <tr key={b.name} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-white/70">{b.name}</td>
                            <td className="text-center text-white/30">{b.pos}</td>
                            <td className="text-center text-white/50">{b.ab}</td>
                            <td className="text-center text-white/50">{b.r}</td>
                            <td className={`text-center ${b.h > 0 ? 'text-white font-medium' : 'text-white/30'}`}>{b.h}</td>
                            <td className={`text-center ${b.rbi > 0 ? 'text-[#BF5700] font-medium' : 'text-white/30'}`}>{b.rbi}</td>
                            <td className="text-center text-white/50">{b.bb}</td>
                            <td className="text-center text-white/50">{b.so}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-[#BF5700]/20 font-semibold">
                          <td className="py-2 px-3 text-white/50" colSpan={2}>Totals</td>
                          <td className="text-center text-white/60">{sumCol(texasBatting, 'ab')}</td>
                          <td className="text-center text-[#BF5700]">{sumCol(texasBatting, 'r')}</td>
                          <td className="text-center text-white">{sumCol(texasBatting, 'h')}</td>
                          <td className="text-center text-[#BF5700]">{sumCol(texasBatting, 'rbi')}</td>
                          <td className="text-center text-white/60">{sumCol(texasBatting, 'bb')}</td>
                          <td className="text-center text-white/60">{sumCol(texasBatting, 'so')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* UC Davis Batting */}
              <div className="mb-8">
                <h3 className="font-display text-sm uppercase tracking-wider text-white/40 mb-3">UC Davis Batting</h3>
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] font-mono text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-white/30 bg-black/20">
                          <th className="text-left py-2.5 px-3">Player</th>
                          <th className="text-center py-2.5 w-10">Pos</th>
                          <th className="text-center py-2.5 w-10">AB</th>
                          <th className="text-center py-2.5 w-10">R</th>
                          <th className="text-center py-2.5 w-10">H</th>
                          <th className="text-center py-2.5 w-10">RBI</th>
                          <th className="text-center py-2.5 w-10">BB</th>
                          <th className="text-center py-2.5 w-10">SO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ucdavisBatting.map((b) => (
                          <tr key={b.name} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-white/50">{b.name}</td>
                            <td className="text-center text-white/25">{b.pos}</td>
                            <td className="text-center text-white/40">{b.ab}</td>
                            <td className="text-center text-white/40">{b.r}</td>
                            <td className={`text-center ${b.h > 0 ? 'text-white/60' : 'text-white/20'}`}>{b.h}</td>
                            <td className={`text-center ${b.rbi > 0 ? 'text-white/60' : 'text-white/20'}`}>{b.rbi}</td>
                            <td className="text-center text-white/40">{b.bb}</td>
                            <td className="text-center text-white/40">{b.so}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-white/10 font-semibold">
                          <td className="py-2 px-3 text-white/40" colSpan={2}>Totals</td>
                          <td className="text-center text-white/50">{sumCol(ucdavisBatting, 'ab')}</td>
                          <td className="text-center text-white/50">{sumCol(ucdavisBatting, 'r')}</td>
                          <td className="text-center text-white/50">{sumCol(ucdavisBatting, 'h')}</td>
                          <td className="text-center text-white/50">{sumCol(ucdavisBatting, 'rbi')}</td>
                          <td className="text-center text-white/50">{sumCol(ucdavisBatting, 'bb')}</td>
                          <td className="text-center text-white/50">{sumCol(ucdavisBatting, 'so')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Pitching */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Texas Pitching */}
                <div>
                  <h3 className="font-display text-sm uppercase tracking-wider text-[#BF5700] mb-3">Texas Pitching</h3>
                  <Card variant="default" padding="none">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[400px] font-mono text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-white/30 bg-black/20">
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
                          {texasPitching.map((p) => (
                            <tr key={p.name} className="border-t border-white/5">
                              <td className="py-2 px-3 text-white/70">
                                {p.name}
                                {p.decision && <span className="text-[#BF5700] ml-1 text-xs">({p.decision})</span>}
                              </td>
                              <td className="text-center text-white/60">{p.ip}</td>
                              <td className="text-center text-white/40">{p.h}</td>
                              <td className="text-center text-white/40">{p.r}</td>
                              <td className="text-center text-white/40">{p.er}</td>
                              <td className="text-center text-white/40">{p.bb}</td>
                              <td className="text-center text-white font-medium">{p.so}</td>
                              <td className="text-center text-white/30">{p.pitches}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* UC Davis Pitching */}
                <div>
                  <h3 className="font-display text-sm uppercase tracking-wider text-white/40 mb-3">UC Davis Pitching</h3>
                  <Card variant="default" padding="none">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[400px] font-mono text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-white/30 bg-black/20">
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
                          {ucdavisPitching.map((p) => (
                            <tr key={p.name} className="border-t border-white/5">
                              <td className="py-2 px-3 text-white/50">
                                {p.name}
                                {p.decision && <span className="text-red-400/60 ml-1 text-xs">({p.decision})</span>}
                              </td>
                              <td className="text-center text-white/40">{p.ip}</td>
                              <td className="text-center text-white/30">{p.h}</td>
                              <td className="text-center text-white/30">{p.r}</td>
                              <td className="text-center text-white/30">{p.er}</td>
                              <td className="text-center text-white/30">{p.bb}</td>
                              <td className="text-center text-white/40">{p.so}</td>
                              <td className="text-center text-white/20">{p.pitches}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── What This Game Told Us ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[#BF5700] mb-5 pb-2 border-b border-[#BF5700]/15">
                What This Game Actually Told Us
              </h2>

              <div className="font-serif text-lg leading-[1.78] text-white/80 space-y-8">
                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-white mb-3">
                    1. The Lineup Is Relentless, Not Just Talented
                  </h3>
                  <p>
                    There&rsquo;s a difference between a lineup that has good hitters and a lineup that doesn&rsquo;t let you breathe. This Texas lineup is the second thing. One through nine, every at-bat felt competitive. Robbins homered and doubled. Pack had three hits from the nine-hole. Becerra drove in two from the eight-spot. Mendoza walked it off from the leadoff position. When your table-setter is also your finisher, the lineup is circular — there&rsquo;s no place to hide.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-white mb-3">
                    2. The Portal Additions Are Real
                  </h3>
                  <p>
                    Robbins from Notre Dame: three RBI in his first game. Becerra from Stanford: two RBI and a presence at third that felt immediately settled. Tinney drew two walks behind Robbins — the lineup protection is already working. Schlossnagle didn&rsquo;t just add names from the portal. He added fits. And the chemistry showed from the first inning on — no one looked like they were playing for a new team.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-white mb-3">
                    3. Riojas Can Handle the Friday Spot
                  </h3>
                  <p>
                    The first inning was bumpy. A walk, two singles, a run. But the next four innings? Clean. Dominant. Riojas found his slider, located his fastball, and retired the side in order multiple times. Friday night starters in the SEC need two things: the ability to survive a bad inning without unraveling, and the ability to give the bullpen a clean handoff. Riojas did both tonight.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-lg font-medium uppercase tracking-wide text-white mb-3">
                    4. The Depth Behind the Starters Is Ridiculous
                  </h3>
                  <p>
                    Grubbs came in, threw two innings, induced a double play, and handed the ball back. Dylan Volantis didn&rsquo;t pitch because he didn&rsquo;t need to. Luke Harrison didn&rsquo;t pitch because he didn&rsquo;t need to. Thomas Burns didn&rsquo;t pitch because he didn&rsquo;t need to. When your most dominant arms are preserved because your starter and first reliever handled a 12-2 game, the pitching staff is built correctly.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-[#BF5700]/8 to-[#8B4513]/5 border border-[#BF5700]/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-[#0D0D0D] text-[#BF5700] px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg sm:text-xl leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    One game is one game. UC Davis is not Ole Miss, and February is not June. But the things you look for in an opener — energy, depth, competitive at-bats from all nine spots, a starter who recovered after adversity, a bullpen arm who shut the door — were all here. Every one of them.
                  </p>
                  <p>
                    Schlossnagle built this roster to compete for Omaha. What tonight showed is that the roster heard him, and they&rsquo;re not interested in easing into it. Twelve runs in seven innings. Three extra-base hits. Zero errors. A walk-off three-run homer from the best contact hitter in the conference.
                  </p>
                  <p>
                    The runway is short. The schedule is unforgiving. And based on what happened tonight under the lights at Disch-Falk, that&rsquo;s exactly how this team wants it.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AI Features ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#BF5700]">Powered by AI</span>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-white mt-2">
                  Go Deeper
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => openAI('claude')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-[#BF5700]/10 hover:border-[#BF5700]/30 rounded transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-[#BF5700] mb-1">Claude Analysis</div>
                  <div className="text-white/40 text-xs">Anthropic-powered game breakdown</div>
                </button>
                <button
                  onClick={() => openAI('gemini')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-[#BF5700]/10 hover:border-[#BF5700]/30 rounded transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-[#BF5700] mb-1">Gemini Analysis</div>
                  <div className="text-white/40 text-xs">Google-powered scouting insights</div>
                </button>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Podcast Export ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="text-center">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-white/30 block mb-2">NotebookLM Integration</span>
                <h3 className="font-display text-lg uppercase tracking-wider text-white mb-4">
                  Turn This Recap Into a Podcast
                </h3>
                <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                  One click copies the full recap to your clipboard and opens Google NotebookLM. Paste it in and generate an audio overview.
                </p>
                <NotebookLMExport articleText={ARTICLE_TEXT} />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 2 Preview ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="text-center mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#BF5700]">Up Next</span>
              </div>
              <Card variant="default" padding="lg">
                <div className="text-center space-y-3">
                  <h3 className="font-display text-xl uppercase tracking-wider text-white">
                    Game 2: Texas vs. UC Davis
                  </h3>
                  <div className="font-mono text-sm text-[#BF5700]">
                    Saturday, February 14 &middot; 12:00 PM CT &middot; UFCU Disch-Falk Field
                  </div>
                  <div className="font-serif text-white/50 text-sm">
                    Probable starter: <strong className="text-white/70">Luke Harrison</strong> (LHP, Sr. &middot; 3.06 ERA, 72 K in 2025)
                  </div>
                  <p className="font-serif text-white/40 text-sm leading-relaxed max-w-lg mx-auto">
                    Start time moved up from original schedule for weather. Texas leads the series 1-0. Sunday&rsquo;s Game 3 TBD — Dylan Volantis (LHP, So.) the likely option.
                  </p>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Source Attribution ── */}
        <Section padding="md" className="border-t border-[#BF5700]/10">
          <Container size="narrow">
            <div className="space-y-4">
              <DataSourceBadge
                source="texaslonghorns.com/boxscore/17822"
                timestamp="February 13, 2026 CT"
              />
              <div className="font-mono text-[11px] text-white/30 leading-relaxed">
                Play-by-play sourced from Texas Longhorns On SI (Connor Zimmerlee) &amp; TexasLonghorns.com live stats.
                Roster data via BSI Season Preview &amp; D1Baseball.
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial" className="font-display text-[13px] uppercase tracking-widest text-[#BF5700] hover:opacity-70 transition-opacity">
                  More Editorial &rarr;
                </Link>
                <Link href="/college-baseball/editorial/texas-2026" className="font-display text-[13px] uppercase tracking-widest text-[#BF5700] hover:opacity-70 transition-opacity">
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
