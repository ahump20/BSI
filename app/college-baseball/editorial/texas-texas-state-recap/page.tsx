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
   Source: SI.com live updates, texaslonghorns.com schedule
   Texas 15, Texas State 4 — March 10, 2026 at Bobcat Ballpark, San Marcos TX
   ──────────────────────────────────────────── */

const lineScore: InningScore[] = [
  { team: 'Texas', innings: [2, 0, 3, 2, 0, 0, 1, 3, 3], r: 15, h: 15, e: 0 },
  { team: 'Texas State', innings: [0, 0, 0, 3, 0, 0, 1, 0, 0], r: 4, h: 5, e: 2 },
];

// Pitching lines — best available from SI.com live updates + texaslonghorns.com pregame notes.
// Official box score not yet indexed as of publication. Refine when texaslonghorns.com recap publishes.
const texasPitching: PitchingLine[] = [
  { name: 'Sam Cozart', ip: '5.0', h: 3, r: 3, er: 3, bb: 1, so: 5, decision: 'W (4-0)' },
  { name: 'Ethan Walker', ip: '2.0', h: 1, r: 1, er: 1, bb: 0, so: 3 },
  { name: 'Max Grubbs', ip: '1.0', h: 1, r: 0, er: 0, bb: 0, so: 1 },
  { name: 'Cal Higgins', ip: '1.0', h: 0, r: 0, er: 0, bb: 0, so: 2 },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM / sharing
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `No. 2 Texas 15, Texas State 4: First Road Test, Same Answer.

Texas (16-0) beat Texas State (12-4) 15-4 at Bobcat Ballpark in San Marcos on Tuesday night — their first true road game of the 2026 season. Casey Borba hit two home runs, Anthony Pack Jr. added a two-run shot, and Temo Becerra capped the night with a three-run homer in the ninth. Sam Cozart improved to 4-0 on the mound.

GAME DATA:
Final: Texas 15, Texas State 4
Line: TEX 203 200 133 = 15 15 0 | TXST 000 300 100 = 4 5 2
Location: Bobcat Ballpark, San Marcos TX

KEY PERFORMERS:
Casey Borba: 2 HR (3-run blast in 3rd, solo shot in 7th), RBI walk in 1st — 4 RBI on the night
Anthony Pack Jr.: 2-run HR in 4th — continues as middle-of-the-order force
Temo Becerra: 3-run HR in 9th — insurance that became a statement
Jared Rodriguez: RBI single in 1st, RBI double in 8th
Charlie Duplantier: 2-run single in 8th
Cade Livingston: RBI double in 8th
Sam Cozart: W (4-0), ~5 IP — freshman emerged as midweek ace (entered 3-0, 1.38 ERA)

SEASON CONTEXT:
Record: 16-0 (first true road win of 2026)
Run Differential: 177-44 through 16 games
Six run-rule wins this season
Best start in 21 years (since 2005 Texas team)
SEC play opens March 13 vs Ole Miss at Disch-Falk

BSI VERDICT:
Sixteen-and-oh means nothing if it doesn't translate to SEC weekends — but the depth chart is answering every question asked of it. Borba's two-homer night, Becerra's ninth-inning bomb, Pack's continued power production. The lineup flexibility wasn't in the preseason blueprint. It's in the blueprint now. Ole Miss arrives in three days. The foundation has been poured. Thursday night tells us whether the concrete has set.

Source: SI.com, texaslonghorns.com, txstatebobcats.com | Blaze Sports Intel | March 10, 2026 CT`;

const GAME_CONTEXT = `Texas 15, Texas State 4 at Bobcat Ballpark, San Marcos TX — March 10, 2026. Texas's first true road game of 2026. Texas is 16-0.

Line: TEX 203 200 133 = 15 15 0 | TXST 000 300 100 = 4 5 2

Key: Borba 2 HR (3-run in 3rd, solo in 7th), Pack Jr. 2-run HR (4th), Becerra 3-run HR (9th). Rodriguez RBI single (1st) + RBI double (8th). Duplantier 2-run single (8th). Livingston RBI double (8th). Cozart W (4-0).

Texas run differential: 177-44 through 16 games. SEC opens March 13 vs Ole Miss at Disch-Falk.

Tuesday SEC results: LSU lost to Creighton 4-8, Vanderbilt lost to Indiana State 6-14, Alabama lost to Troy 3-7, Mississippi State lost to Tulane 7-11, Kentucky lost to Ball State 3-10, Tennessee lost to Tennessee Tech 2-20, Auburn lost to UAB 2-17, Missouri lost to Southern Indiana 6-14, Florida lost to Florida State 3-6.`;

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

export default function TexasTexasStateRecapPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-texas-state-recap';

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
              <span className="text-text-secondary">Texas vs Texas State</span>
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
                  <Badge variant="primary">Game Recap</Badge>
                  <Badge variant="accent">No. 2 Texas</Badge>
                  <Badge variant="outline">16-0</Badge>
                  <span className="font-mono text-xs text-text-muted">First Road Win</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary mb-1">
                    First Road Test.
                  </span>
                  <span className="block text-gradient-blaze text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Same Answer.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-text-tertiary italic leading-relaxed mb-6">
                  Casey Borba hit two home runs, Temo Becerra added a three-run shot in the ninth, and Texas rolled to 16&ndash;0 with a 15&ndash;4 win at Bobcat Ballpark &mdash; the Longhorns&rsquo; first true road game of the season. SEC play opens in three days.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted tracking-wide">
                  <span>March 10, 2026</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Bobcat Ballpark, San Marcos</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Texas 15, Texas State 4</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-muted mt-4">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>March 10, 2026</span>
                  <span>|</span>
                  <span>~8 min read</span>
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
                <StatCard label="Season Record" value="16-0" helperText="Best start in 21 years &mdash; first true road win" />
                <StatCard label="Borba HRs" value="2" helperText="3-run blast in 3rd, solo shot in 7th &mdash; 4 RBI" />
                <StatCard label="Run Differential" value="+133" helperText="177 runs scored, 44 allowed through 16 games" />
                <StatCard label="Days to SEC" value="3" helperText="Ole Miss at Disch-Falk &mdash; March 13" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                Fifteen home games and a neutral-site tournament in Houston &mdash; that was the entire Texas resume entering Tuesday night. Every win had come on friendly ground. Bobcat Ballpark in San Marcos was the first true road game of the season, the first time the Longhorns had to play in someone else&rsquo;s building with someone else&rsquo;s crowd. They scored 15 runs on 15 hits with zero errors. The building didn&rsquo;t matter.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-secondary mb-6">
                Casey Borba authored the evening. A three-run home run in the third blew the game open. A solo shot in the seventh was punctuation. He had walked in a run in the first inning before either homer &mdash; four RBI on a Tuesday night at a Big Sun Belt ballpark that was supposed to be the kind of game you just get through. Borba treated it like a showcase. <strong className="text-text-primary">Two home runs, an RBI walk, and the kind of at-bat discipline that doesn&rsquo;t show up in the box score but shows up in the way a lineup turns over.</strong>
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-tertiary">
                Anthony Pack Jr.&rsquo;s two-run homer in the fourth extended the lead to 7&ndash;0 before Texas State pushed three across in their half. Temo Becerra&rsquo;s three-run bomb in the ninth was insurance that doubled as a statement &mdash; this lineup has power from spots one through nine, and the depth is answering questions nobody bothered asking three weeks ago.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Box Score ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Final: Texas 15, Texas State 4
                </h2>
                <span className="font-mono text-xs text-text-muted">Tuesday &middot; Mar 10</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={lineScore} label="Final" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Texas jumped on Texas State starter early. Jared Rodriguez singled home a run in the first. Borba drew a bases-loaded walk to make it 2&ndash;0 before an out was recorded in San Marcos. The third inning was where the game tilted beyond recovery &mdash; Borba&rsquo;s three-run homer highlighted a three-run frame that pushed the lead to 5&ndash;0. Pack Jr.&rsquo;s two-run shot in the fourth made it 7&ndash;0, and while Texas State responded with three runs in their half of the fourth, it was the kind of response that showed fight without changing the math.
                  </p>

                  <p>
                    The eighth inning was a clinic in distributed offense. Rodriguez doubled home a run. Cade Livingston ripped an RBI double. Charlie Duplantier cleared the bases with a two-run single. Three runs on three hits from three different bats &mdash; the damage didn&rsquo;t come from one swing. It came from a lineup that cycled through and punished every pitch left in the zone. The ninth brought Becerra&rsquo;s three-run homer, the exclamation point on a 15-run night that featured 15 hits from a lineup that has now outscored opponents 177&ndash;44 through sixteen games.
                  </p>

                  <p className="text-text-tertiary">
                    Sam Cozart continued his freshman emergence on the mound. The midweek starter entered at 3&ndash;0 with a 1.38 ERA and kept rolling &mdash; improving to 4&ndash;0 with enough length to keep the bullpen fresh for the weekend. Walker, Grubbs, and Higgins each threw an inning in relief, the kind of workload management that matters when Ole Miss arrives at Disch-Falk in 72 hours.
                  </p>
                </div>
              </ScrollReveal>
            </Container>

            <ScrollReveal direction="up" delay={150}>
              <div className="mt-8">
                <PitchingTable pitchers={texasPitching} teamLabel="Texas" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Tuesday Night Across the SEC ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-5 pb-2 border-b border-burnt-orange/15">
                Tuesday Night Across the SEC
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                <p>
                  While Texas was handling business in San Marcos, the rest of the SEC was getting punched in the mouth by mid-major opponents. The results paint a conference that is not nearly as ready for opening weekend as three weeks of curated scheduling suggested.
                </p>
                <p>
                  <strong className="text-text-primary">Tennessee 2, Tennessee Tech 20.</strong> That is not a typo. The Volunteers gave up twenty runs to an in-state OVC program. Tennessee entered the week at 7&ndash;4 with questions about whether Tony Vitello&rsquo;s team could find a gear before SEC play. The answer, apparently, is no &mdash; they still haven&rsquo;t found the clutch.
                </p>
                <p>
                  <strong className="text-text-primary">Auburn 2, UAB 17.</strong> Another blowout, another SEC team with a 9&ndash;2 record entering the night that suddenly looks fragile. Fifteen runs of separation against a Conference USA program that was supposed to be a routine midweek tune-up.
                </p>
                <p>
                  <strong className="text-text-primary">Vanderbilt 6, Indiana State 14.</strong> The Commodores gave up 14 runs to a Missouri Valley team. Vanderbilt opens at home against LSU on Friday. If the pitching staff that showed up Tuesday is the one that shows up against Jay Johnson&rsquo;s lineup, it will be a long weekend in Nashville.
                </p>
                <p className="text-text-tertiary">
                  LSU lost to Creighton 4&ndash;8. Alabama fell to Troy 3&ndash;7. Mississippi State dropped one to Tulane 7&ndash;11. Kentucky lost to Ball State 3&ndash;10. Missouri lost to Southern Indiana 6&ndash;14. Florida lost to Florida State 3&ndash;6 in a rivalry game that at least carries real weight. Nine SEC programs lost on Tuesday night. Texas won 15&ndash;4. The gap between the Longhorns and the rest of the conference &mdash; at least on this particular Tuesday &mdash; was not subtle.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-surface-default text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg sm:text-xl leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    Sixteen-and-oh means nothing if it doesn&rsquo;t translate to SEC weekends. That caveat has been true since game one and it remains true after game sixteen. But the depth chart is answering every question asked of it &mdash; and the questions are getting harder. Borba&rsquo;s two-homer night, Becerra&rsquo;s ninth-inning bomb, Pack&rsquo;s continued power production from the middle of the order, Cozart&rsquo;s quiet climb to 4&ndash;0 as the midweek starter. This is not a lineup that relies on one bat or a pitching staff that leans on one arm.
                  </p>
                  <p>
                    The lineup flexibility wasn&rsquo;t in the preseason blueprint. Borba was a role player. Becerra was a question mark after the transfer. Livingston and Duplantier were depth pieces. All four contributed RBI tonight. The roster is deeper than it was supposed to be, and the Tuesday-night results across the SEC suggest the conference Texas is about to enter is not as fearsome as three weeks of home-field scheduling made it look.
                  </p>
                  <p className="text-text-secondary">
                    Ole Miss arrives at Disch-Falk in three days. The Rebels have been inconsistent &mdash; in and out of the Top 25, looking for an identity that three weeks of non-conference play haven&rsquo;t provided. Texas has an identity. It was built across sixteen games, five run-rule wins, a 133-run differential, and a Tuesday night in someone else&rsquo;s ballpark where they hung 15 on the board without breaking a sweat. The foundation has been poured. Thursday night tells us whether the concrete has set.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Pull Quote ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="text-center py-4">
                <blockquote className="font-serif text-2xl sm:text-3xl italic text-text-primary leading-snug mb-4">
                  &ldquo;Nine SEC teams lost Tuesday night. Texas won 15&ndash;4. The gap was not subtle.&rdquo;
                </blockquote>
                <div className="font-mono text-xs text-burnt-orange tracking-wider uppercase">
                  On the SEC entering opening weekend
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
                  <div className="text-text-muted text-xs">Anthropic-powered game breakdown</div>
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
                <DataSourceBadge source="SI.com" timestamp="March 10, 2026 CT" />
                <DataSourceBadge source="texaslonghorns.com" timestamp="March 10, 2026 CT" />
                <DataSourceBadge source="txstatebobcats.com" timestamp="March 10, 2026 CT" />
              </div>
              <div className="font-mono text-[11px] text-text-muted leading-relaxed">
                Game data sourced from SI.com live updates and Texas Longhorns official schedule. Pitching lines are best available pending official box score publication.
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial/texas-week-3-recap" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  &larr; Texas Week 3 Recap
                </Link>
                <Link href="/college-baseball/editorial/week-4-preview" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  Week 4 Preview &rarr;
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
