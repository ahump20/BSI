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
   Source: texaslonghorns.com, burntorangenation.com box score reporting
   UFCU Disch-Falk Field, Austin TX — March 3, 2026
   ──────────────────────────────────────────── */

const lineScore: InningScore[] = [
  { team: 'Houston Christian', innings: [0, 0, 0, 1, 0, 2, 0], r: 3, h: 4, e: 3 },
  { team: 'Texas', innings: [1, 1, 0, 6, 4, 4, 'X'], r: 16, h: 14, e: 0 },
];

const texasPitching: PitchingLine[] = [
  { name: 'Sam Cozart', ip: '5.0', h: 1, r: 1, er: 1, bb: 0, so: 6, pitches: 73, decision: 'W (3-0)' },
  { name: 'Jason Flores', ip: '2.0', h: 3, r: 2, er: 2, bb: 0, so: 2 },
];

/* ────────────────────────────────────────────
   Article text for NotebookLM / sharing
   ──────────────────────────────────────────── */

const ARTICLE_TEXT = `Texas 16, Houston Christian 3: Still Perfect, Still Building.

No. 3 Texas beat Houston Christian 16-3 in seven innings (mercy rule) at UFCU Disch-Falk Field on Tuesday night. The Longhorns are 12-0, one of two remaining unbeaten Top 25 teams in America alongside USC (12-0).

GAME SUMMARY:
Texas 16, Houston Christian 3 — Final/7 (10-run mercy rule)
Texas: 14 H, 0 E | HCU: 4 H, 3 E

KEY PERFORMERS:
Sam Cozart: 5 IP, 1 H, 1 R, 0 BB, 6 K, 73 pitches — W (3-0). Dominant midweek start. One solo HR allowed in the 4th, otherwise untouchable.
Ethan Mendoza: 3-for-5, 2 RBI, 3 R — four straight multi-hit games.
Carson Tinney: 3-run HR (355 ft) in the 5th. 3 runs scored.
Casey Borba: 3 runs scored, productive at-bats throughout.
Aiden Robbins: 2-run single in the 6th extended the lead.
Andrew Ermis: RBI single in the 2nd.
Jason Flores: 2 IP in relief, kept HCU off the board in the 7th.

SCORING:
1st: RBI groundout (1-0 Texas)
2nd: Ermis RBI single (2-0)
4th: Six-run inning — sacrifice fly and four straight singles, three with two outs (8-1 after HCU solo HR)
5th: Three consecutive singles plus Tinney's 355-ft three-run HR (12-1)
6th: Two-out rally with walks and singles, Robbins 2-run single (16-3)

BSI VERDICT:
The preview said the score doesn't matter — what the fourth and fifth bullpen arms look like throwing it does. The blowout denied that test. Texas scored 16 runs so efficiently that Cozart pitched five and Flores mopped up two. The back-of-the-pen evaluation that midweek games exist for never materialized. Cozart was the story: 73 pitches, 6 strikeouts, one hit allowed, the most efficient Tuesday start of the season. Three games into his midweek role, he's 3-0 with complete command. The rotation depth question that matters heading into SEC play is not whether the arms are good enough — it's whether they'll get enough work before the schedule demands it.

TUESDAY NATIONALLY:
USC stayed perfect at 12-0 (beat UC Irvine 6-4). Florida shut out FAU 4-0. Georgia blasted Kennesaw State 11-1. Arkansas rolled Oral Roberts 10-2. Tennessee beat ETSU 7-1. Texas A&M mercy-ruled Incarnate Word 11-1. Mississippi State's winning streak ended at Southern Miss. Oregon fell to Oregon State. Vanderbilt was upset by Central Arkansas 4-5.

UP NEXT: USC Upstate this weekend (March 7-9). Then SEC opens March 13 vs Ole Miss at Disch-Falk. The foundation is 12-0. The load-bearing test is ten days away.

Source: texaslonghorns.com, burntorangenation.com, Highlightly, D1Baseball | Blaze Sports Intel | March 4, 2026 CT`;

const GAME_CONTEXT = `Texas beat Houston Christian 16-3 in 7 innings (mercy rule) at UFCU Disch-Falk Field, March 3 2026. Texas is 12-0, one of two remaining unbeaten Top 25 teams (USC also 12-0).

Cozart: 5 IP, 1H, 1R, 0BB, 6K, 73 pitches, W (3-0). Dominant midweek start — one solo HR in 4th, otherwise untouchable. Flores: 2 IP relief, allowed 2R in 6th, clean 7th.
Mendoza: 3-for-5, 2 RBI, 3 R. Tinney: 3-run HR (355 ft). Borba: 3 R. Ermis: RBI single. Robbins: 2-run single.
14 hits by 9 players, 4 multi-hit performances. Texas scored in the 1st, 2nd, 4th (6 runs), 5th (4 runs), 6th (4 runs).

Season: 12-0, team ERA ~1.55. Cozart 3-0 in midweek starts. Third consecutive midweek mercy-rule win. Next: USC Upstate weekend (Mar 7-9), then SEC opens Mar 13 vs Ole Miss at Disch-Falk.`;

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
                {pitchers.some(p => p.pitches) && <th className="text-center py-2 w-10">P</th>}
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
                  {pitchers.some(pp => pp.pitches) && (
                    <td className="text-center text-text-muted">{p.pitches ?? '\u2014'}</td>
                  )}
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

export default function TexasHoustonChristianRecapPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultModel, setAiDefaultModel] = useState<'claude' | 'gemini'>('claude');
  const articleUrl = 'https://blazesportsintel.com/college-baseball/editorial/texas-houston-christian-recap';

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
              <span className="text-text-secondary">Texas vs. Houston Christian Recap</span>
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
                  <Badge variant="accent">No. 3 Texas</Badge>
                  <Badge variant="outline">12-0</Badge>
                  <span className="font-mono text-xs text-text-muted">Final/7 &middot; Mercy Rule</span>
                </div>

                <h1 className="font-display font-bold uppercase tracking-wide leading-none mb-4">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary mb-1">
                    Still Perfect,
                  </span>
                  <span className="block text-gradient-blaze text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Still Building.
                  </span>
                </h1>

                <p className="font-serif text-lg sm:text-xl text-text-tertiary italic leading-relaxed mb-6">
                  Texas scored 16 runs in a mercy-rule blowout of Houston Christian. Sam Cozart struck out six in five dominant innings. The preview said the score doesn&rsquo;t matter&nbsp;&mdash;&nbsp;the depth arms do. The blowout denied the test.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted tracking-wide">
                  <span>March 3, 2026</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>UFCU Disch-Falk Field, Austin</span>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>Texas 16, HCU 3</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-muted mt-4">
                  <span>By Blaze Sports Intel</span>
                  <span>|</span>
                  <span>March 4, 2026</span>
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
                <StatCard label="Season Record" value="12-0" helperText="One of two unbeaten Top 25 teams (with USC)" />
                <StatCard label="Cozart" value="6 K" helperText="5 IP, 1 H, 0 BB, 73 pitches &mdash; W (3-0)" />
                <StatCard label="Offense" value="14 H" helperText="9 players with hits, 4 multi-hit games" />
                <StatCard label="Tinney HR" value="355 ft" helperText="Three-run blast in the 5th made it 12-1" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Editorial Lede ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <p className="font-serif text-xl sm:text-[23px] font-medium leading-relaxed text-[#FAF7F2] mb-6">
                The preview framed Tuesday night around a single question: what do the fourth and fifth bullpen arms look like throwing live innings before the schedule tilts toward conference play? Texas scored 16 runs on 14 hits, triggered the 10-run mercy rule after seven innings, and never got to the back of the pen. The blowout that was supposed to be a testing ground became a showcase instead.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-secondary mb-6">
                Sam Cozart threw five innings of one-hit ball, striking out six on 73 pitches. Jason Flores covered the final two. Two pitchers. Seven innings. That&rsquo;s it. The depth evaluation will have to wait for the weekend &mdash; or for the SEC, which arrives in ten days.
              </p>
              <p className="font-serif text-lg leading-relaxed text-text-tertiary">
                What did happen: <strong className="text-text-primary">the offense announced that the BRUCE BOLT Classic breakout was not a one-weekend event.</strong> Fourteen hits by nine players, four multi-hit performances, and a 355-foot home run from Carson Tinney. The lineup is clicking from multiple spots in the order, and the run production is getting distributed rather than dependent on any single bat.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Line Score + Pitching ── */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-burnt-orange" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange">
                  Texas 16, Houston Christian 3
                </h2>
                <span className="font-mono text-xs text-text-muted">Final/7 &middot; Mercy Rule</span>
              </div>

              <div className="mb-6">
                <LineScoreTable scores={lineScore} label="Final / 7 Innings" />
              </div>
            </ScrollReveal>

            <Container size="narrow">
              <ScrollReveal direction="up" delay={100}>
                <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                  <p>
                    Cozart set the tone immediately. He retired the side in order in the first three innings, the only baserunner a solo home run in the fourth that he left in the rearview without changing his approach. Six strikeouts in five innings, zero walks, 73 pitches. For a freshman right-hander making his third Tuesday start, the efficiency tells you more than the line: he was never in trouble, never laboring, never giving the opposition free baserunners. HCU managed one hit against him. One.
                  </p>

                  <p>
                    Meanwhile, the Texas bats went to work early and never stopped. An RBI groundout in the first. An Ermis single in the second. Then the fourth inning detonated: six runs on a sacrifice fly and four consecutive singles, three of them with two outs. The Longhorns sent eleven batters to the plate in that frame and put the game away before the fifth inning started.
                  </p>

                  <p>
                    The fifth added the exclamation point. Three straight singles loaded the bases before Carson Tinney launched a 355-foot three-run home run that made it 12&ndash;1. Tinney, the catcher, has been quietly productive all season &mdash; and that swing was loud. The sixth inning piled on four more, anchored by Robbins&rsquo; two-run single past the Houston Christian shortstop, and the mercy rule closed the game after HCU batted in the seventh.
                  </p>

                  <p className="text-text-tertiary">
                    Ethan Mendoza was the night&rsquo;s best individual performer: 3-for-5 with two RBI and three runs scored, extending his multi-hit streak to four games. Borba scored three times. The offense produced 16 runs on 14 hits against a team that committed three errors &mdash; but the damage was real, not gifted. Eleven of those 14 hits were clean singles and extra-base knocks that would have landed against any defense.
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

        {/* ── Tuesday Night Nationally ── */}
        <Section padding="lg" background="charcoal">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-5 pb-2 border-b border-burnt-orange/15">
                Tuesday Night Nationally
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4">
                <p>
                  The headline entering the night was whether USC or Texas would blink first. Neither did. <strong className="text-text-primary">USC beat UC Irvine 6&ndash;4 at Dedeaux Field to stay perfect at 12&ndash;0.</strong> Texas and USC remain the only unbeaten Top 25 teams in the country.
                </p>
                <p>
                  Elsewhere, the upsets came on the other end. Mississippi State&rsquo;s winning streak ended at Southern Miss. Vanderbilt fell at home to Central Arkansas 4&ndash;5 &mdash; a result that will sting in Nashville with conference play ten days out. Oregon lost to in-state rival Oregon State.
                </p>
                <p className="text-text-tertiary">
                  On the dominant side: Florida shut out FAU 4&ndash;0. Georgia blasted Kennesaw State 11&ndash;1. Arkansas rolled Oral Roberts 10&ndash;2. Tennessee handled ETSU 7&ndash;1. Texas A&amp;M mercy-ruled Incarnate Word 11&ndash;1 in seven. Alabama survived Jacksonville State 6&ndash;5. The SEC programs that needed Tuesday tune-ups got them &mdash; the ones that didn&rsquo;t will spend Wednesday answering questions.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── BSI Verdict ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <div className="relative bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded-sm p-8 sm:p-10">
                <div className="absolute -top-2.5 left-8 font-display text-[11px] tracking-[3px] uppercase bg-midnight text-burnt-orange px-3">
                  BSI Verdict
                </div>
                <div className="font-serif text-lg sm:text-xl leading-relaxed text-[#FAF7F2] space-y-4">
                  <p>
                    The score tells you Texas is 12&ndash;0. The box score tells you Cozart is a weapon. What it doesn&rsquo;t tell you is whether the middle relievers and depth arms are ready for SEC play &mdash; because the offense buried any chance of finding out. Three consecutive midweek mercy-rule wins is a flex, but it&rsquo;s a flex that comes with a cost: the back of the bullpen has not thrown meaningful innings since the BRUCE BOLT Classic.
                  </p>
                  <p>
                    Cozart, though, answered his question emphatically. Three starts, three wins, one hit allowed tonight, six strikeouts on 73 pitches. He is not auditioning for the midweek role anymore. He owns it. The confidence was visible &mdash; one solo home run in the fourth didn&rsquo;t change his pace, didn&rsquo;t alter his sequencing, didn&rsquo;t send him looking over his shoulder at the bullpen. He pitched through it and finished five clean innings.
                  </p>
                  <p className="text-text-secondary">
                    USC Upstate arrives this weekend. Three games at Disch-Falk, and hopefully three games where the starters don&rsquo;t pitch so deep that the pen sits idle again. Then March 13: Ole Miss at Disch-Falk for the SEC opener. That series is no longer a distant landmark &mdash; it&rsquo;s the next meaningful thing on the schedule. Everything between now and then is preparation for it. Tuesday night was a dominant result. Whether it was a useful one depends on what Schlossnagle can get out of the weekend.
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
                  &ldquo;The preview said the score doesn&rsquo;t matter. It was right. What mattered was Cozart&rsquo;s 73 pitches, and those were flawless.&rdquo;
                </blockquote>
                <div className="font-mono text-xs text-burnt-orange tracking-wider uppercase">
                  On Sam Cozart&rsquo;s Tuesday Dominance
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Looking Ahead ── */}
        <Section padding="lg">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-5 pb-2 border-b border-burnt-orange/15">
                Looking Ahead
              </h2>
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-4">
                <p>
                  USC Upstate comes to Disch-Falk for a three-game weekend series March 7&ndash;9. This is the final non-conference weekend before the schedule turns. Riojas gets Friday. Harrison or a combination gets Saturday. Volantis owns Sunday. The weekend starters are set. The question is what happens in the innings behind them.
                </p>
                <p className="text-text-tertiary">
                  Then comes March 13: Ole Miss at Disch-Falk to open SEC play. The Rebels just beat Memphis and carry the swagger of a program that expects to be in the conversation every March through June. Texas hasn&rsquo;t lost in twelve games. Ole Miss hasn&rsquo;t lost its edge. That series is where the 12&ndash;0 record meets the conference that will test whether it means something.
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
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-burnt-orange">Powered by AI</span>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-text-primary mt-2">
                  Go Deeper
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => openAI('claude')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-charcoal border border-burnt-orange/10 hover:border-burnt-orange/30 rounded-sm transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-burnt-orange mb-1">Claude Analysis</div>
                  <div className="text-text-muted text-xs">Anthropic-powered game breakdown</div>
                </button>
                <button
                  onClick={() => openAI('gemini')}
                  className="group p-5 bg-gradient-to-br from-[#2A2A2A] to-charcoal border border-burnt-orange/10 hover:border-burnt-orange/30 rounded-sm transition-colors text-left"
                >
                  <div className="font-display text-sm uppercase tracking-wider text-burnt-orange mb-1">Gemini Analysis</div>
                  <div className="text-text-muted text-xs">Google-powered scouting insights</div>
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
                <DataSourceBadge source="texaslonghorns.com" timestamp="March 3, 2026 CT" />
                <DataSourceBadge source="burntorangenation.com" timestamp="March 4, 2026 CT" />
                <DataSourceBadge source="Highlightly Scoreboard" timestamp="March 4, 2026 CT" />
              </div>
              <div className="font-mono text-[11px] text-text-muted leading-relaxed">
                Box score data from Texas Longhorns official statistics and Burnt Orange Nation game reporting. National scoreboard data from Highlightly and D1Baseball.
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <Link href="/college-baseball/editorial/texas-houston-christian-preview" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  &larr; HCU Preview
                </Link>
                <Link href="/college-baseball/editorial/texas-week-3-recap" className="font-display text-[13px] uppercase tracking-widest text-burnt-orange hover:opacity-70 transition-opacity">
                  Week 3 Recap &rarr;
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
