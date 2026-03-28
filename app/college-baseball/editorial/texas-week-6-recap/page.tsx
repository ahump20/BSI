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
import { BSIVerdict } from '@/components/editorial/BSIVerdict';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

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
   Sources: texaslonghorns.com box scores #17839, #17840, #17841
   auburntigers.com recaps, Warren Nolan team sheet
   Texas at No. 5 Auburn — Plainsman Park, Auburn AL
   ──────────────────────────────────────────── */

// Game 1: Auburn 4, Texas 3 (Friday, Mar 20) — Walk-off
const game1LineScore: InningScore[] = [
  { team: 'Texas', innings: [0, 1, 0, 0, 0, 1, 0, 0, 1], r: 3, h: 3, e: 1 },
  { team: 'Auburn', innings: [1, 0, 0, 0, 0, 0, 0, 0, 3], r: 4, h: 9, e: 1 },
];

const game1TexasPitching: PitchingLine[] = [
  { name: 'Ruger Riojas', ip: '6.1', h: 6, r: 1, er: 1, bb: 1, so: 6, pitches: 99 },
  { name: 'Haiden Leffew', ip: '1.2', h: 1, r: 1, er: 0, bb: 0, so: 1 },
  { name: 'Ethan Walker', ip: '0.2', h: 2, r: 2, er: 1, bb: 0, so: 0, decision: 'L' },
];

// Game 2: Texas 7, Auburn 6 (Saturday, Mar 21) — Bounce-back
const game2LineScore: InningScore[] = [
  { team: 'Texas', innings: [0, 2, 4, 0, 0, 0, 1, 0, 0], r: 7, h: 11, e: 0 },
  { team: 'Auburn', innings: [0, 0, 0, 1, 0, 1, 3, 1, 0], r: 6, h: 10, e: 2 },
];

const game2TexasPitching: PitchingLine[] = [
  { name: 'Luke Harrison', ip: '5.2', h: 6, r: 2, er: 2, bb: 1, so: 6, decision: 'W (3-0)' },
  { name: 'Max Grubbs', ip: '1.0', h: 3, r: 3, er: 3, bb: 0, so: 0 },
  { name: 'Brett Crossland', ip: '0.1', h: 0, r: 0, er: 0, bb: 0, so: 0 },
  { name: 'Sam Cozart', ip: '1.0', h: 1, r: 1, er: 1, bb: 0, so: 1 },
  { name: 'Thomas Burns', ip: '1.0', h: 0, r: 0, er: 0, bb: 3, so: 1, decision: 'SV' },
];

// Game 3: Texas 5, Auburn 0 (Sunday, Mar 22) — First-ever SEC shutout
const game3LineScore: InningScore[] = [
  { team: 'Texas', innings: [0, 2, 0, 2, 0, 0, 0, 1, 0], r: 5, h: 9, e: 1 },
  { team: 'Auburn', innings: [0, 0, 0, 0, 0, 0, 0, 0, 0], r: 0, h: 4, e: 0 },
];

const game3TexasPitching: PitchingLine[] = [
  { name: 'Dylan Volantis', ip: '4.0', h: 2, r: 0, er: 0, bb: 4, so: 4, pitches: 94 },
  { name: 'Sam Cozart', ip: '2.2', h: 0, r: 0, er: 0, bb: 0, so: 3, decision: 'W (4-0)' },
  { name: 'Brett Crossland', ip: '1.0', h: 1, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Haiden Leffew', ip: '0.1', h: 0, r: 0, er: 0, bb: 0, so: 0 },
  { name: 'Max Grubbs', ip: '1.0', h: 1, r: 0, er: 0, bb: 0, so: 1 },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM / sharing
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `Texas Week 6 Recap: Punched, Then Answered.

No. 2 Texas went 2-2 in Week 6: a midweek loss to Tarleton State 6-1 at Disch-Falk, then a 2-of-3 road series win at No. 5 Auburn (L 3-4, W 7-6, W 5-0). Texas is 20-3 overall, 4-2 in SEC play, No. 2 nationally, No. 1 RPI.

TARLETON STATE (Mar 17): Tarleton won 6-1 at Disch-Falk. Texas managed 2 hits all night. After Carson Tinney's solo homer in the 1st, 34 consecutive batters failed to reach base. Five Tarleton pitchers combined for 12 strikeouts. Highest-ranked win in program history.

GAME 1 (Mar 20): Auburn 4, Texas 3 — Walk-off. Riojas went 6.1 IP, 1 ER, 6K on 99 pitches. Auburn's Marciano matched with 7 IP, 9K, 1 ER. Robbins hit two solo home runs. Texas led 3-1 entering the 9th. Bristol Carter's 2-run single to center and a CF miscue allowed the winning run. Auburn extended its win streak to 12.

GAME 2 (Mar 21): Texas 7, Auburn 6 — Bounce-back. Harrison W (5.2 IP, 2 ER, 6K). Texas built a 6-0 lead through 3 innings: Monsour 2-run single (2nd), Robbins 417-ft HR off the batter's eye (3rd), Duplantier first career HR — 3-run blast over the 37-ft left-field wall (3rd). Auburn rallied — Rembert solo HR in the 7th, 3 runs in the 7th total, 1 in the 8th to make it 7-6. Burns walked the bases loaded with 2 outs in the 9th before inducing a ground ball to Becerra. Record crowd of 8,037 at Plainsman Park.

GAME 3 (Mar 22): Texas 5, Auburn 0 — First-ever SEC shutout. Five pitchers (Volantis 4.0, Cozart 2.2, Crossland, Leffew, Grubbs) combined for the zero. Borba crushed a 103-mph 2-run HR over the left-field monster in the 2nd. Tinney added a two-out, 2-RBI single in the 4th. Auburn went 0-for-9 with runners in scoring position and stranded 12. Cozart threw 2.2 hitless innings with 3K. Series win snapped Auburn's 12-game streak.

SERIES STAR: Aiden Robbins — 6-for-13 (.462), 3 HR, 3 RBI across the three games.

SEC LANDSCAPE: Seven teams tied at 4-2 (Texas, Mississippi State, Auburn, Kentucky, Georgia, Oklahoma, Arkansas). Alabama swept Florida — Tyler Fay threw the first solo no-hitter in 84 years (13K, 2BB). Oklahoma won 2-of-3 at LSU — defending champs now 16-9, completely unranked. Mississippi State swept Vanderbilt for the first time since 2000. South Carolina fired Paul Mainieri after a 22-6 loss to Arkansas.

UCLA REMAINS NO. 1: 21-2, 9-0 Big Ten, 15-game win streak. 6-0 vs. ranked opponents. Roch Cholowsky projected No. 1 pick. The ranking is defensible on poll logic (margin of dominance, +130 run differential). Texas's case is stronger on selection math (RPI No. 1, SOS No. 5, Q1 record 7-2).

WEEK 7 PREVIEW: Houston Tuesday (Schroeder Park), then Oklahoma Thu-Sat at Disch-Falk — all three games on SEC Network. Projected rotation: Riojas (Thu), Harrison (Fri), Volantis (Sat). Oklahoma (19-5, 4-2 SEC) is the SEC's biggest surprise — unranked preseason, now No. 8 with .292 BA, .897 OPS, 70 stolen bases in 76 attempts. First time both programs ranked top-10 in baseball since 2009.

Source: texaslonghorns.com, auburntigers.com, Warren Nolan, d1baseball.com, ESPN | Blaze Sports Intel | March 24, 2026 CT`;

const GAME_CONTEXT = `Texas went 2-2 in Week 6: L to Tarleton State 6-1 (midweek), then 2-of-3 at No. 5 Auburn (L 3-4 walk-off, W 7-6, W 5-0 shutout). Texas is 20-3, 4-2 SEC, No. 2 nationally, No. 1 RPI.

Game 1 (Mar 20): Auburn 4, Texas 3. Walk-off. Riojas 6.1 IP, 1ER, 6K. Robbins 2 solo HR. Texas led 3-1 in 9th. Carter 2-run single + CF error = walk-off.
Game 2 (Mar 21): Texas 7, Auburn 6. Harrison W 5.2 IP, 2ER, 6K. Monsour 2-RBI, Robbins 417-ft HR, Duplantier first career HR (3-run). Burns SV (3 BB in 9th, groundout to end it). Record crowd 8,037.
Game 3 (Mar 22): Texas 5, Auburn 0. First-ever SEC shutout. Five arms: Volantis 4.0 IP, Cozart W 2.2 hitless IP/3K, Crossland, Leffew, Grubbs. Borba 2-run HR. Tinney 2-RBI single. Auburn 0-for-9 RISP, 12 LOB.

Robbins series: 6-for-13, 3 HR. SEC: 7-way tie at 4-2. Oklahoma next — Thu-Sat at Disch-Falk, all SEC Network. UCLA unanimous No. 1 (21-2, 15-game streak).`;

/* ────────────────────────────────────────────
   Helper components
   ──────────────────────────────────────────── */

function LineScoreTable({ scores, label }: { scores: InningScore[]; label: string }) {
  const inningCount = scores[0].innings.length;
  return (
    <Card variant="default" padding="none">
      <div className="bg-[var(--bsi-primary)]/5 text-center py-2">
        <span className="font-display text-[10px] uppercase tracking-[3px] text-[var(--bsi-primary)]">
          {label}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead>
            <tr className="font-display text-[11px] uppercase tracking-widest text-[rgba(196,184,165,0.35)] bg-black/30">
              <th className="text-left py-2.5 px-4 w-36" />
              {Array.from({ length: inningCount }, (_, i) => (
                <th key={i} className="text-center py-2.5 w-10">{i + 1}</th>
              ))}
              <th className="text-center py-2.5 w-12 border-l border-[var(--border-vintage)]">R</th>
              <th className="text-center py-2.5 w-12">H</th>
              <th className="text-center py-2.5 w-12">E</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {scores.map((row) => {
              const isTexas = row.team === 'Texas';
              return (
                <tr key={row.team} className="border-t border-[var(--border-vintage)]">
                  <td className={`py-3 px-4 font-display text-sm font-semibold uppercase tracking-wide ${isTexas ? 'text-[var(--bsi-primary)]' : 'text-[rgba(196,184,165,0.5)]'}`}>
                    {row.team}
                  </td>
                  {row.innings.map((val, i) => (
                    <td key={i} className={`text-center py-3 ${typeof val === 'string' ? 'text-[rgba(196,184,165,0.35)]' : Number(val) > 0 ? (isTexas ? 'text-[var(--bsi-bone)] font-semibold' : 'text-[var(--bsi-dust)] font-medium') : 'text-[rgba(196,184,165,0.35)]'}`}>
                      {val}
                    </td>
                  ))}
                  <td className={`text-center py-3 border-l border-[var(--border-vintage)] font-bold text-lg ${isTexas ? 'text-[var(--bsi-primary)]' : 'text-[rgba(196,184,165,0.5)]'}`}>
                    {row.r}
                  </td>
                  <td className="text-center py-3 text-[rgba(196,184,165,0.35)]">{row.h}</td>
                  <td className="text-center py-3 text-[rgba(196,184,165,0.35)]">{row.e}</td>
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
      <h3 className="font-display text-sm uppercase tracking-wider text-[var(--bsi-primary)] mb-3">{teamLabel} Pitching</h3>
      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] font-mono text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)] bg-black/20">
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
                <tr key={p.name} className="border-t border-[var(--border-vintage)]">
                  <td className="py-2 px-3 text-[var(--bsi-dust)]">
                    {p.name}
                    {p.decision && <span className="text-[var(--bsi-primary)] ml-1 text-xs">({p.decision})</span>}
                  </td>
                  <td className="text-center text-[rgba(196,184,165,0.5)]">{p.ip}</td>
                  <td className="text-center text-[rgba(196,184,165,0.35)]">{p.h}</td>
                  <td className="text-center text-[rgba(196,184,165,0.35)]">{p.r}</td>
                  <td className="text-center text-[rgba(196,184,165,0.35)]">{p.er}</td>
                  <td className="text-center text-[rgba(196,184,165,0.35)]">{p.bb}</td>
                  <td className="text-center text-[var(--bsi-bone)] font-medium">{p.so}</td>
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

export default function TexasWeek6RecapPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-week-6-recap';

  const openAI = (model: 'claude' | 'gemini' = 'claude') => {
    setAiDefaultModel(model);
    setAiOpen(true);
  };

  return (
    <>
      <ArticleJsonLd
        headline="Texas Week 6: Punched, Then Answered"
        description="Texas took 2-of-3 at No. 5 Auburn after a crushing Friday walk-off loss. Aiden Robbins hit 3 home runs. Sunday was the program's first-ever SEC shutout. Texas is 20-3, No. 2 nationally, No. 1 RPI."
        datePublished="2026-03-24"
        url="/college-baseball/editorial/texas-week-6-recap"
        sport="College Baseball"
      />
      <div>
        {/* ── Breadcrumb ── */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                College Baseball
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/editorial" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Editorial
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-dust)]">Texas Week 6</span>
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
                  <Badge variant="accent">No. 2 Texas</Badge>
                  <Badge variant="outline">20-3</Badge>
                  <span className="font-mono text-xs text-[rgba(196,184,165,0.35)]">SEC: 4-2 &middot; RPI No. 1</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--bsi-bone)] mb-1">
                    Punched,
                  </span>
                  <span className="block text-[var(--bsi-primary)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Then Answered.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-[rgba(196,184,165,0.5)] italic leading-relaxed mb-6">
                  A midweek stumble at Disch-Falk. A walk-off gut punch on Friday night. Then two wins at the fifth-ranked team in America &mdash; the last one a shutout that hadn&rsquo;t been done in SEC play in program history. Texas turned a turbulent week into a r&eacute;sum&eacute;-building one.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[rgba(196,184,165,0.35)] tracking-wide">
                  <span>March 17 &ndash; 22, 2026</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Plainsman Park, Auburn AL</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Week 6 &middot; 4 Games</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-[rgba(196,184,165,0.35)] mt-4">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>March 24, 2026</span>
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

        {/* ── Stat Cards ── */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Robbins Series" value="3 HR" helperText="6-for-13 (.462) at Auburn &mdash; carried the offense" />
                <StatCard label="First SEC Shutout" value="5-0" helperText="Five pitchers combined for the program&rsquo;s first-ever shutout in conference play" />
                <StatCard label="Season Record" value="20-3" helperText="No. 2 nationally &middot; No. 1 RPI &middot; 4-2 SEC" />
                <StatCard label="Crowd at Auburn" value="8,037" helperText="Record attendance at Plainsman Park for Saturday&rsquo;s game" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                The Auburn series tested the exact stress points Texas had shown in conference play: late-inning execution, role clarity at the back of the bullpen, and the ability to respond after getting punched. Friday answered with a walk-off that turned on a defensive miscue. Saturday answered with power, chaos, and a closer who survived his own wildness. Sunday answered with five arms and zero runs &mdash; the first time Texas had done that in SEC history.
              </p>
              <p className="font-serif text-lg leading-relaxed text-[var(--bsi-dust)] mb-6">
                Before Auburn, there was Tarleton State. That loss sits in the record and in the conversation. A WAC program walked into Disch-Falk and held the No. 2 team in America to two hits. It happened. <strong className="text-[var(--bsi-bone)]">What happened next is the story.</strong>
              </p>
              <p className="font-serif text-lg leading-relaxed text-[rgba(196,184,165,0.5)]">
                Twenty wins and three losses. Two SEC series won. The No. 1 RPI. And a pattern that keeps repeating: lose the Friday opener, then take the series anyway. Whether that pattern is a vulnerability or a feature depends on what Oklahoma does this weekend.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Tarleton State Callout ── */}
        <Section padding="md">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="bg-[#8B0000]/8 border border-[#8B0000]/20 rounded-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="font-display text-[11px] uppercase tracking-[3px] text-[#C44536]">
                    Midweek &middot; March 17
                  </div>
                </div>
                <div className="font-display text-lg font-semibold text-[var(--bsi-bone)] uppercase tracking-wide mb-1">
                  Tarleton State 6, No. 2 Texas 1
                </div>
                <div className="font-mono text-sm text-[#C44536] mb-4">
                  UFCU Disch-Falk Field &middot; 2 hits &middot; 12 strikeouts &middot; 34 consecutive outs after the 1st inning
                </div>
                <p className="font-serif text-sm text-[rgba(196,184,165,0.5)] leading-relaxed mb-3">
                  Carson Tinney homered in the first inning. Then nothing. Thirty-four consecutive Texas batters failed to reach base. Five Tarleton pitchers &mdash; a WAC program at 13-7 &mdash; combined for 12 strikeouts against the second-ranked team in America. Ethan Jaques earned the win with three hitless relief innings. It was the highest-ranked victory in Tarleton State&rsquo;s program history.
                </p>
                <p className="font-serif text-sm text-[rgba(196,184,165,0.35)] leading-relaxed">
                  The loss doesn&rsquo;t define the week. But hiding it would be dishonest. Texas went 2-2, not 2-1. The Auburn story only means what it means because Tarleton happened first.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Game 1: Auburn 4, Texas 3 (Walk-off) ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[#C44536]" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)]">
                  Game 1: Auburn 4, Texas 3
                </h2>
                <span className="font-mono text-xs text-[rgba(196,184,165,0.35)]">Friday &middot; Mar 20 &middot; Walk-off</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game1LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    This was an ace duel that deserved a better ending. Riojas delivered 6.1 innings of one-run ball on 99 pitches, striking out six and walking one. Auburn&rsquo;s Jake Marciano was better &mdash; 7.0 innings, nine strikeouts, one earned run, holding Texas to two hits through eight innings. The game belonged to the pitchers until it didn&rsquo;t.
                  </p>

                  <p>
                    Aiden Robbins carried the offense alone. His first solo home run in the second inning tied the game at one. His second put Texas ahead in the sixth. When he launched the third run across on a fielder&rsquo;s choice play in the ninth, Texas led 3-1 entering the bottom of the frame. Two outs from a road statement win against a top-five team riding a 12-game win streak.
                  </p>

                  <p>
                    Then Bristol Carter roped a two-run single to center. The ball scooted past Robbins in center field for an error that allowed the winning run to score. <strong className="text-[var(--bsi-bone)]">Auburn 4, Texas 3. Walk-off. The Tigers&rsquo; 12-game streak survived on one swing and one miscue.</strong>
                  </p>

                  <p className="text-[rgba(196,184,165,0.5)]">
                    The tactical takeaway isn&rsquo;t &ldquo;Texas can&rsquo;t hit&rdquo; &mdash; three hits in an ace duel happens. It&rsquo;s that in a low-hit game you must be airtight on the last three outs. Texas had the pitching to win. The margin collapsed on one defensive execution and one high-leverage baserunner sequence.
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

        {/* ── Game 2: Texas 7, Auburn 6 (Bounce-back) ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[var(--bsi-primary)]" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)]">
                  Game 2: Texas 7, Auburn 6
                </h2>
                <span className="font-mono text-xs text-[rgba(196,184,165,0.35)]">Saturday &middot; Mar 21 &middot; Record Crowd</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game2LineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Texas attacked early and used Auburn&rsquo;s defensive mistakes as fuel. Maddox Monsour &mdash; making his first SEC start at DH &mdash; ripped a two-out, two-run single in the second inning that drove in two unearned runs off Auburn errors. Then the third inning happened: Robbins launched a 417-foot, 109-mph missile off the batter&rsquo;s eye, and freshman Jayden Duplantier uncorked his first career home run &mdash; a three-run blast over the 37-foot left-field wall on a full-count breaking ball. Six runs through three innings. Message sent.
                  </p>

                  <p>
                    Luke Harrison escaped a bases-loaded, no-out jam in the first inning and settled in for 5.2 strong innings of two-run ball with six strikeouts. Then the bridge got messy. Grubbs allowed three runs in the seventh, including a Chris Rembert solo home run. Auburn tacked on one more in the eighth to make it 7-6. In front of a record crowd of 8,037 at Plainsman Park, closer Thomas Burns walked the bases loaded with two outs in the ninth.
                  </p>

                  <p>
                    <strong className="text-[var(--bsi-bone)]">Then Burns induced a ground ball to third baseman Temo Becerra. Series even.</strong>
                  </p>

                  <p className="text-[rgba(196,184,165,0.5)]">
                    This is the kind of SEC win that builds belief because it isn&rsquo;t sterile. Texas proved it could flip immediately after a walk-off loss and still win when the bullpen doesn&rsquo;t give you a clean final nine outs. The Burns ninth is a concern. The fact that it ended with a ground ball rather than a run is the distinction between a resilient team and a collapsing one.
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

        {/* ── Game 3: Texas 5, Auburn 0 (First-ever SEC Shutout) ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-[#C9A227]" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)]">
                  Game 3: Texas 5, Auburn 0
                </h2>
                <span className="font-mono text-xs text-[rgba(196,184,165,0.35)]">Sunday &middot; Mar 22 &middot; First-ever SEC Shutout</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={game3LineScore} label="Final &mdash; Program History" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    The Sunday blueprint worked. Dylan Volantis opened with four scoreless innings on 94 pitches &mdash; command was inconsistent (four walks), but he kept Auburn off the board. Then Sam Cozart entered and threw 2.2 hitless innings with three strikeouts, earning the win. Crossland handled the bridge. Leffew recorded an out. Grubbs closed. Five arms, zero runs, four hits allowed. <strong className="text-[var(--bsi-bone)]">The program&rsquo;s first-ever shutout in SEC play.</strong>
                  </p>

                  <p>
                    Casey Borba supplied the early separation &mdash; a 103-mph, two-run home run over the left-field monster in the second inning, the kind of opposite-field authority that forces a staff to pitch around the middle of the order. Carson Tinney added a clutch two-out, two-RBI single in the fourth. The approach was deliberate: take the run, don&rsquo;t chase perfection, and let the pitching bury them.
                  </p>

                  <p className="text-[rgba(196,184,165,0.5)]">
                    Auburn went 0-for-9 with runners in scoring position and stranded twelve. They put traffic on early &mdash; Volantis threw 77 pitches by the third inning, and Auburn loaded the bases twice. But the Texas bullpen&rsquo;s sequencing held through the final eight outs. The series win snapped Auburn&rsquo;s 12-game winning streak, handed them their first SEC loss, and marked Texas&rsquo;s first road series win over a top-5 team since defeating No. 3 TCU on May 9, 2021.
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

        {/* ── BSI Verdict — Week 6 ── */}
        <BSIVerdict>
                  <p>
                    The Friday-night pattern is now a documented feature of this Texas team. In both SEC series &mdash; Ole Miss and Auburn &mdash; the Longhorns lost the opener via ninth-inning collapse, then won the series by taking Games 2 and 3. The Ole Miss loss was a blown 7-3 ninth-inning lead on a Tristan Bissetta grand slam. The Auburn loss was a two-run single and a center-field miscue with two outs. Different mechanics, same outcome: Texas enters every SEC weekend trailing 0-1 before proving it can recover.
                  </p>
                  <p>
                    That pattern is not sustainable as a strategy. You cannot bank on losing Friday and winning Saturday-Sunday through an entire SEC schedule. But the resilience itself &mdash; the fact that both Saturday games featured early offensive aggression and both Sundays featured dominant pitching &mdash; suggests something structural. This team has a response mechanism. The question is whether it can avoid needing one.
                  </p>
                  <p>
                    The bullpen hierarchy is clearer after Auburn. Cozart is the highest-trust multi-inning bridge &mdash; he earned the win Sunday and handled leverage Saturday. Crossland is a strikeout-capable matchup option. Burns remains the closer by title, but his SEC-only numbers (5.87 ERA, 4 BB in 2.0 IP) explain why Texas avoided using him Sunday entirely. The ninth inning is this team&rsquo;s thinnest margin.
                  </p>
                  <p className="text-[var(--bsi-dust)]">
                    But the r&eacute;sum&eacute; keeps stacking. 20-3. No. 1 RPI. SOS No. 5. A 7-2 Quadrant 1 record. Series wins at Ole Miss and at No. 5 Auburn. If Texas keeps winning two of three in league play, the national-seed conversation isn&rsquo;t aspirational &mdash; it&rsquo;s already mathematical. The Auburn series didn&rsquo;t just save the week from the Tarleton embarrassment. It may have been the strongest road weekend any team has had this season.
                  </p>
        </BSIVerdict>

        {/* ── UCLA at No. 1 ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-5 pb-2 border-b border-[var(--bsi-primary)]/15">
                No. 1 Check: UCLA
              </h2>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    UCLA sits atop every major poll at 21-2 overall, 9-0 in the Big Ten &mdash; the best conference-opening stretch in program history &mdash; riding a 15-game winning streak, the longest active streak in Division I. They are 6-0 against ranked opponents, including a three-game sweep of No. 7 TCU (outscoring them 30-8). The rotation is anchored by Logan Reddemann (6-0), the lineup features consensus projected No. 1 overall pick Roch Cholowsky, and Will Gasparino (a Texas transfer) led the nation in home runs early at 10.
                  </p>
                  <p>
                    The ranking is defensible on poll logic. UCLA&rsquo;s margin of dominance is extreme: +130 run differential (212-82), a .302/.433/.520 team slash line, and 3.33 ERA. They are crushing opponents while maintaining a top-tier win rate. ELO models grade them as the No. 1 team in the country right now, and poll voters reward the &ldquo;best team right now&rdquo; thesis.
                  </p>
                  <p>
                    <strong className="text-[var(--bsi-bone)]">But it&rsquo;s also fragile in the selection-math sense.</strong> Texas has the higher RPI (No. 1 vs. UCLA&rsquo;s No. 6), the much stronger strength of schedule (No. 5 vs. No. 43), and more Quadrant 1 volume (7-2 vs. 3-0). The NCAA&rsquo;s pre-championship manual explicitly values RPI, quadrant records, SOS, and road results &mdash; the exact categories where Texas leads. If Texas keeps winning series in the SEC, the combination of schedule weight and Q1 accumulation gives them a compelling argument for No. 1 even if UCLA&rsquo;s run differential remains gaudier.
                  </p>
                </div>
              </ScrollReveal>

              {/* Metrics comparison table */}
              <ScrollReveal direction="up" delay={150}>
                <div className="my-8">
                  <Card variant="default" padding="none">
                    <div className="bg-[var(--bsi-primary)]/5 text-center py-2">
                      <span className="font-display text-[10px] uppercase tracking-[3px] text-[var(--bsi-primary)]">
                        UCLA vs. Texas &mdash; By the Numbers
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)] bg-black/20">
                            <th className="text-left py-2.5 px-4">Metric</th>
                            <th className="text-center py-2.5 w-32">UCLA</th>
                            <th className="text-center py-2.5 w-32">Texas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['Record', '21-2', '20-3'],
                            ['Conference', 'Big Ten (9-0)', 'SEC (4-2)'],
                            ['RPI', '6', '1'],
                            ['Strength of Schedule', '43', '5'],
                            ['Quadrant 1 Record', '3-0', '7-2'],
                            ['Team BA / OBP / SLG', '.302 / .433 / .520', '.311 / .428 / .538'],
                            ['Team ERA', '3.33', '2.72'],
                            ['K/BB Ratio', '2.80', '3.26'],
                            ['Run Differential', '+130 (212-82)', '+63 (205-142)'],
                          ].map(([metric, ucla, texas]) => (
                            <tr key={metric} className="border-t border-[var(--border-vintage)]">
                              <td className="py-2.5 px-4 text-[var(--bsi-dust)] text-xs">{metric}</td>
                              <td className="text-center py-2.5 text-[rgba(196,184,165,0.5)]">{ucla}</td>
                              <td className="text-center py-2.5 text-[var(--bsi-primary)] font-medium">{texas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <p className="font-serif text-lg leading-[1.78] text-[rgba(196,184,165,0.5)]">
                  The clean conclusion: <strong className="text-[var(--bsi-dust)]">UCLA&rsquo;s No. 1 ranking is defensible as a quality-and-dominance statement. Texas&rsquo;s profile is stronger as a schedule-and-selection statement.</strong> Both can be true simultaneously. The distinction only collapses if both teams reach the selection committee table in June &mdash; and by then, the SEC gauntlet will have provided its own answer.
                </p>
              </ScrollReveal>
            </Container>
          </Container>
        </Section>

        {/* ── SEC Landscape ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-5 pb-2 border-b border-[var(--bsi-primary)]/15">
                SEC Landscape: Week 6
              </h2>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Seven teams share first place in the SEC at 4-2: Texas, Mississippi State, Auburn, Kentucky, Georgia, Oklahoma, and Arkansas. Four more sit at 3-3 (Ole Miss, Florida, Alabama, Tennessee). The conference&rsquo;s combined non-conference record of 236-56 (.808) underscores why every SEC series win carries outsized r&eacute;sum&eacute; weight. Ten to eleven SEC teams appear across the three major polls.
                  </p>

                  <p>
                    <strong className="text-[var(--bsi-bone)]">Alabama swept No. 18 Florida 3-0</strong>, headlined by Tyler Fay&rsquo;s no-hitter on Friday &mdash; 13 strikeouts, 2 walks, the first solo no-no in Alabama baseball in 84 years. Brady Neal drove in 11 runs across the series. Alabama entered the Top 25; Florida plummeted 11 spots in the coaches poll and fell out of Baseball America&rsquo;s rankings entirely. A program-altering weekend for the Crimson Tide.
                  </p>

                  <p>
                    <strong className="text-[var(--bsi-bone)]">Oklahoma won 2-of-3 at LSU</strong>, clinching the rubber game 4-3 on an eighth-inning rally aided by two LSU errors. The defending national champions dropped to 16-9 (2-4 SEC) with a cratered RPI of 109 &mdash; completely unranked for the first time since 2019. Oklahoma, picked to finish in the bottom half of the SEC, is now No. 8 in the country.
                  </p>

                  <p>
                    Mississippi State swept Vanderbilt for the first time since March 2000. Tomas Valincius struck out 14 on Saturday. Vanderbilt, preseason No. 23, sits at 13-12 with a five-game losing streak and an RPI of 178. The Brian O&rsquo;Connor rebuild at Mississippi State is ahead of schedule.
                  </p>

                  <p className="text-[rgba(196,184,165,0.5)]">
                    And then there&rsquo;s South Carolina. Paul Mainieri was fired on March 21 after a 22-6 blowout loss to Arkansas &mdash; his sixth consecutive defeat. Mainieri went 40-40 overall and 6-28 in SEC play during his tenure. Interim coach Monte Lee (former Clemson HC) has taken over, with Coastal Carolina&rsquo;s Kevin Schnall reportedly the primary target. The coaching change mid-season is a structural marker: SEC programs don&rsquo;t wait.
                  </p>
                </div>
              </ScrollReveal>
            </Container>
          </Container>
        </Section>

        {/* ── Oklahoma Preview ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-5 pb-2 border-b border-[var(--bsi-primary)]/15">
                Week 7 Preview: Oklahoma
              </h2>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    Texas hosts Houston on Tuesday at Schroeder Park (6:30 PM CT, ESPN+), then welcomes No. 8 Oklahoma to Disch-Falk for a Thursday-through-Saturday SEC series &mdash; all three games on SEC Network linear television. ESPN has designated it the Series of the Week.
                  </p>
                </div>
              </ScrollReveal>

              {/* Schedule table */}
              <ScrollReveal direction="up" delay={120}>
                <div className="my-6">
                  <Card variant="default" padding="none">
                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)] bg-black/20">
                            <th className="text-left py-2.5 px-4">Game</th>
                            <th className="text-left py-2.5">Date</th>
                            <th className="text-center py-2.5 w-24">Time (CT)</th>
                            <th className="text-center py-2.5 w-28">TV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['Game 1', 'Thu, Mar 26', '7:00 PM', 'SEC Network'],
                            ['Game 2', 'Fri, Mar 27', '7:00 PM', 'SEC Network'],
                            ['Game 3', 'Sat, Mar 28', '4:00 PM', 'SEC Network'],
                          ].map(([game, date, time, tv]) => (
                            <tr key={game} className="border-t border-[var(--border-vintage)]">
                              <td className="py-2.5 px-4 text-[var(--bsi-primary)] font-medium">{game}</td>
                              <td className="py-2.5 text-[var(--bsi-dust)]">{date}</td>
                              <td className="text-center py-2.5 text-[rgba(196,184,165,0.5)]">{time}</td>
                              <td className="text-center py-2.5 text-[rgba(196,184,165,0.35)]">{tv}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={150}>
                <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-6">
                  <p>
                    The projected rotation follows Texas&rsquo;s established order on normal rest from the Auburn series: Riojas (Thursday), Harrison (Friday), Volantis as opener/bulk Saturday with Cozart positioned as the primary bridge.
                  </p>

                  <p>
                    Oklahoma (19-5, 4-2 SEC) has been the conference&rsquo;s biggest surprise &mdash; unranked in the preseason, the Sooners have rocketed to No. 8 by winning six consecutive weekend series, including taking 2-of-3 at LSU in Week 6. Their cumulative profile is aggressive: .292 team batting average, .897 OPS, 24 home runs, 154 walks, and 70 stolen bases in 76 attempts. The top-of-order impact names include Trey Gambill (1.167 OPS), Brendan Brock (.985 OPS, 6 HR), Camden Johnson, and Jaxon Willits. They arrive in Austin with momentum and the numbers to prove it.
                  </p>

                  <p>
                    Several storylines converge. Both teams enter at 4-2 in SEC play, part of the seven-way tie for first. This marks the first time both programs have been ranked in the top 10 heading into a baseball matchup since 2009. Texas carries the Friday-night pattern &mdash; 0-2 in SEC openers, 4-0 in Games 2 and 3. Whether Schlossnagle&rsquo;s club can break the Game 1 curse, and whether the ninth-inning questions around Burns can be resolved, will define the narrative.
                  </p>

                  <p className="text-[rgba(196,184,165,0.5)]">
                    Against Oklahoma&rsquo;s running game (70-for-76), the first-order tactical key is controlling the bases without giving away fastballs. That means varying holds, using slide steps selectively, and calling pitches that create catcher throw opportunities. If Texas just ignores it, they&rsquo;re playing into Oklahoma&rsquo;s preferred chaos.
                  </p>
                </div>
              </ScrollReveal>
            </Container>
          </Container>
        </Section>

        {/* ── Pull Quote ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="text-center py-4">
                <blockquote className="font-serif text-2xl sm:text-3xl italic text-[var(--bsi-bone)] leading-snug mb-4">
                  &ldquo;Five arms, zero runs, four hits. The shutout that hadn&rsquo;t been done in SEC play in program history &mdash; and it came on the road at the fifth-ranked team in America.&rdquo;
                </blockquote>
                <div className="font-mono text-xs text-[var(--bsi-primary)] tracking-wider uppercase">
                  On Sunday&rsquo;s Texas 5, Auburn 0
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Looking Ahead ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-5 pb-2 border-b border-[var(--bsi-primary)]/15">
                Looking Ahead
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-[var(--bsi-dust)] space-y-4">
                <p>
                  Week 7 is about protecting the gains from Week 6. Don&rsquo;t give back midweek sloppiness at Houston. Win the first two innings &mdash; mentally and on the scoreboard &mdash; against an Oklahoma team that&rsquo;s built to pressure you. Break the Friday-night pattern. The series is at Disch-Falk, which means Texas controls the environment for the first time in an SEC weekend.
                </p>
                <p className="text-[rgba(196,184,165,0.5)]">
                  A series win over Oklahoma would give Texas three consecutive SEC series wins (Ole Miss, Auburn, Oklahoma) and functionally separate them from the seven-team pack at the top of the standings. A series loss would drop them into the middle of it. The margin is that narrow. The opportunity is that real.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── AI Features ── */}
        <Section padding="lg" background="charcoal">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--bsi-primary)]">Powered by AI</span>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-bone)] mt-2">
                  Go Deeper
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => openAI('claude')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-charcoal border border-[var(--bsi-primary)]/10 hover:border-[var(--bsi-primary)]/30 rounded-sm transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-[var(--bsi-primary)] mb-1">Claude Analysis</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs">Anthropic-powered series breakdown</div>
                </button>
                <button
                  onClick={() => openAI('gemini')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-charcoal border border-[var(--bsi-primary)]/10 hover:border-[var(--bsi-primary)]/30 rounded-sm transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-[var(--bsi-primary)] mb-1">Gemini Analysis</div>
                  <div className="text-[rgba(196,184,165,0.35)] text-xs">Google-powered scouting insights</div>
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
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[rgba(196,184,165,0.35)] block mb-2">NotebookLM Integration</span>
                <h3 className="font-display text-lg uppercase tracking-wider text-[var(--bsi-bone)] mb-4">
                  Turn This Recap Into a Podcast
                </h3>
                <p className="text-[rgba(196,184,165,0.35)] text-sm mb-6 max-w-md mx-auto">
                  One click copies the full recap to your clipboard and opens Google NotebookLM. Paste it in and generate an audio overview.
                </p>
                <NotebookLMExport articleText={ARTICLE_TEXT} />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Source Attribution ── */}
        <Section padding="md" className="border-t border-[var(--bsi-primary)]/10">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <DataSourceBadge source="texaslonghorns.com" timestamp="March 20-22, 2026 CT" />
                <DataSourceBadge source="auburntigers.com" timestamp="March 22, 2026 CT" />
                <DataSourceBadge source="Warren Nolan" timestamp="March 22, 2026 CT" />
                <DataSourceBadge source="d1baseball.com" timestamp="March 23, 2026 CT" />
                <DataSourceBadge source="ESPN" timestamp="March 23, 2026 CT" />
              </div>
              <div className="font-mono text-[11px] text-[rgba(196,184,165,0.35)] leading-relaxed">
                Box scores sourced from Texas Longhorns official stats (games #17839, #17840, #17841) and Auburn Tigers recaps. Inning-by-inning line scores reconstructed from official game summaries and verified R/H/E totals. SEC standings via Warren Nolan. Rankings from D1Baseball, Baseball America, and USA Today Coaches Poll (March 23). Player season stats from Texas official cumulative statistics (March 22).
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial/weekend-5-recap" className="font-display text-[13px] uppercase tracking-widest text-[var(--bsi-primary)] hover:opacity-70 transition-opacity">
                  &larr; Weekend 5 Recap
                </Link>
                <Link href="/college-baseball/editorial/texas-week-3-recap" className="font-display text-[13px] uppercase tracking-widest text-[var(--bsi-primary)] hover:opacity-70 transition-opacity">
                  Texas Week 3 Recap &rarr;
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
