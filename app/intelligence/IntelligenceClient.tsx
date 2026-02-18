'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StreamOutput, FRESH_WINDOW } from '@/components/intelligence/StreamOutput';

// ─── Preset library ────────────────────────────────────────────────────────────

type SportFilter = 'ALL' | 'BASEBALL' | 'MLB' | 'FOOTBALL' | 'CFB' | 'HOOPS';

interface Preset {
  label: string;
  description: string;
  question: string;
  sport: SportFilter;
}

const PRESETS: Preset[] = [
  // College Baseball
  {
    sport: 'BASEBALL',
    label: 'Transfer Portal',
    description: 'Strategic vs. crutch programs',
    question: 'Analyze the strategic dynamics of the college baseball transfer portal. What separates programs that use it as a competitive advantage from those that use it as a crutch? Name specific program archetypes.',
  },
  {
    sport: 'BASEBALL',
    label: 'Pitching Development',
    description: 'Who builds arms vs. buys them',
    question: 'Which college baseball programs consistently develop pitching from within, and which ones are almost entirely portal-dependent for their rotation? What does that say about each program\'s infrastructure and long-term ceiling?',
  },
  {
    sport: 'BASEBALL',
    label: 'SEC vs. Big 12 Recruiting',
    description: 'Geography shift post-expansion',
    question: 'How has the Big 12 expansion changed recruiting geography for college baseball? Where are the SEC and Big 12 competing for the same players, and which conference is winning that battle in the key states?',
  },
  {
    sport: 'BASEBALL',
    label: 'Exit Velo → Draft',
    description: 'D1 to MLB projection benchmarks',
    question: 'What exit velocity benchmarks should scouts use when projecting a D1 hitter\'s MLB draft ceiling? Walk through how those thresholds shift by position and what gets overweighted at the college level.',
  },
  {
    sport: 'BASEBALL',
    label: 'Mid-Major Punch',
    description: 'Programs above their ranking',
    question: 'Which mid-major college baseball programs consistently perform above their resources and recruiting rankings? What structural or coaching factors explain their over-performance?',
  },
  {
    sport: 'BASEBALL',
    label: 'Cape Cod League',
    description: 'Why it matters for draft positioning',
    question: 'How much does Cape Cod League performance actually move the needle for MLB draft positioning? Which stats from the Cape translate most reliably and which ones scouts discount?',
  },
  {
    sport: 'BASEBALL',
    label: 'Conference Tournaments',
    description: 'Structure and seeding effects',
    question: 'How does conference tournament structure affect NCAA tournament seeding for college baseball programs? Which conferences have formats that help or hurt their teams\' national seed positioning?',
  },
  {
    sport: 'BASEBALL',
    label: 'Augie\'s Coaching Tree',
    description: 'Garrido influence on modern CBB',
    question: 'Trace Augie Garrido\'s influence on modern college baseball coaching. Which active coaches came through his program, and how much of his philosophy still shapes the top programs today?',
  },

  // MLB
  {
    sport: 'MLB',
    label: 'Prospect Projection',
    description: 'Exit velo vs. barrel rate vs. xwOBA',
    question: 'How should scouts weight exit velocity versus barrel rate versus xwOBA when projecting a high school hitter\'s major league ceiling? Walk through the tension between tools and production.',
  },
  {
    sport: 'MLB',
    label: 'Opener Strategy',
    description: 'Markets still resistant to it',
    question: 'The opener/bulk strategy has been around long enough to evaluate. Which MLB markets and front offices are still analytically resistant to it, and what\'s the actual cost of that resistance in run prevention?',
  },
  {
    sport: 'MLB',
    label: 'Front Office Aging Curves',
    description: 'Contract projection failures',
    question: 'Where do MLB front offices consistently misapply aging curves when projecting player contracts? Which positions and skill sets decay fastest and which ones hold value longer than the market prices?',
  },
  {
    sport: 'MLB',
    label: 'International Bonus Pools',
    description: 'Arbitrage strategies by market',
    question: 'How do the most aggressive international bonus pool arbitrage strategies work in MLB? Which organizations are winning the international market and what infrastructure gives them the edge?',
  },
  {
    sport: 'MLB',
    label: 'Defensive Metrics',
    description: 'Where the league gets it wrong',
    question: 'Which defensive metrics are the MLB market still consistently getting wrong? Where is OAA or DRS misleading front offices, and what\'s the consequence in player valuation and roster construction?',
  },
  {
    sport: 'MLB',
    label: 'Minor League Rule Changes',
    description: 'Development pipeline effects',
    question: 'How have the recent minor league rule changes — pitch clock, larger bases, shift restrictions — affected player development pipelines? Which organizations adapted best and which ones are still catching up?',
  },
  {
    sport: 'MLB',
    label: 'Bullpen vs. Starter Conversion',
    description: 'True cost comparison',
    question: 'What is the actual cost comparison between building a bullpen arm from a starter conversion versus acquiring a proven reliever? Which organizations execute starter-to-reliever transitions most effectively and why?',
  },

  // NFL
  {
    sport: 'FOOTBALL',
    label: 'Combine Metrics',
    description: 'Testing vs. production by position',
    question: 'Which NFL combine metrics have the strongest correlation to on-field production by position, and where does the league consistently overweight athleticism over football IQ? Be specific by position.',
  },
  {
    sport: 'FOOTBALL',
    label: 'Scheme Translation',
    description: 'College to pro adjustment timeline',
    question: 'How long does it actually take for players from spread college offenses to translate to pro-style systems? Which positions have the longest adjustment curves and what college scheme backgrounds produce the fastest NFL translators?',
  },
  {
    sport: 'FOOTBALL',
    label: 'Analytics-Resistant GMs',
    description: 'Decisions still driving behavior',
    question: 'Which analytics-resistant decisions are still driving NFL GM behavior despite the data? Fourth-down, draft capital usage, QB evaluation — where is the gap between what the numbers say and what front offices do?',
  },
  {
    sport: 'FOOTBALL',
    label: 'Pass Rush Pricing',
    description: 'Rush vs. coverage market value',
    question: 'How does the NFL currently price elite pass rush versus elite coverage? Is the market correctly valuing each, and which teams are finding inefficiencies in how they construct the defensive side of the roster?',
  },
  {
    sport: 'FOOTBALL',
    label: 'Fourth-Down Decisions',
    description: 'Decision-making across 32 franchises',
    question: 'Rank the NFL\'s 32 franchises by fourth-down decision-making quality over the last three seasons. Which teams are leaving the most value on the field, and which coaches have actually internalized the math?',
  },
  {
    sport: 'FOOTBALL',
    label: 'Draft Capital Efficiency',
    description: 'Which teams win the value game',
    question: 'Which NFL teams have been most efficient with draft capital over the last five years when you normalize for pick position and compare to player output? Who\'s winning the value game and how?',
  },
  {
    sport: 'FOOTBALL',
    label: 'QB Draft Failures',
    description: 'What the market keeps missing',
    question: 'What does the NFL keep getting wrong in QB draft projection? Which measurables, college production metrics, and system factors consistently mislead scouts, and is there a pattern to the busts?',
  },

  // CFB
  {
    sport: 'CFB',
    label: 'NIL Market Structure',
    description: 'Effect on transfer behavior',
    question: 'How has NIL market structure changed the calculus for college football transfer decisions? Which programs have built the most sustainable NIL infrastructure versus which ones are just spending reactively?',
  },
  {
    sport: 'CFB',
    label: 'Conference Realignment Revenue',
    description: 'Long-term distribution math',
    question: 'Break down the long-term revenue distribution math from conference realignment. Which programs actually benefit from the Big Ten and SEC expansion and which ones are positioned worse than they were five years ago?',
  },
  {
    sport: 'CFB',
    label: 'Recruiting Geography Post-Expansion',
    description: 'Shifts in key markets',
    question: 'How has conference realignment shifted recruiting geography for college football? Which states are now more contested, and which programs lost recruiting leverage they used to have through conference affiliation?',
  },
  {
    sport: 'CFB',
    label: 'CFP Stakes',
    description: 'Regular season consequence structure',
    question: 'Has the 12-team CFP expansion increased or decreased the stakes of regular season games for top programs? Walk through how the consequence structure has shifted for both the power conferences and non-power programs.',
  },
  {
    sport: 'CFB',
    label: 'Spring Ball Analysis',
    description: 'Overhaul vs. refinement signals',
    question: 'What signals from spring ball actually predict a program\'s trajectory — and which ones are noise? How do you differentiate between a team genuinely overhauling its scheme versus one just running better-looking drills?',
  },
  {
    sport: 'CFB',
    label: 'Non-Power Path to Playoff',
    description: 'Structural routes to legitimacy',
    question: 'What is the realistic structural path for a non-power conference program to reach and win in the CFP under the current format? Which programs are best positioned and what would it actually take?',
  },
  {
    sport: 'CFB',
    label: 'DC Carousel',
    description: 'Scheme continuity consequences',
    question: 'What is the actual cost to a program when a defensive coordinator leaves mid-cycle? Analyze how scheme continuity — or the lack of it — affects recruiting, player development, and on-field results over a 3-year window.',
  },

  // NBA
  {
    sport: 'HOOPS',
    label: 'Three-Point Rate Pendulum',
    description: 'Where the shot selection is swinging',
    question: 'The NBA maximized three-point rate and is now seeing mid-range rehabilitation. Where is the shot selection pendulum actually landing, which teams are finding real efficiency gains from mid-range, and which teams are just retreating from sound analytics?',
  },
  {
    sport: 'HOOPS',
    label: 'Defensive Rating Inflation',
    description: 'How to adjust for modern context',
    question: 'How much has NBA defensive rating inflated over the last decade due to pace, officiating changes, and rule enforcement? How should analysts adjust for modern context when comparing defensive efficiency across eras?',
  },
  {
    sport: 'HOOPS',
    label: 'Max Player Market Efficiency',
    description: 'Contract structure and player value',
    question: 'Is the NBA max contract market efficient? Walk through where the max player structure creates the most value destruction and which teams have navigated it best by building around non-max contributors.',
  },
  {
    sport: 'HOOPS',
    label: 'G League vs. College Path',
    description: 'Development outcomes by route',
    question: 'How do development outcomes compare for players who took the G League Ignite path versus staying in college? Which player profiles benefit most from each route and what does the data say after several years of sample?',
  },
  {
    sport: 'HOOPS',
    label: 'Lottery Reform Math',
    description: 'How it changed tanking calculus',
    question: 'How did the 2019 NBA draft lottery reform change the tanking calculus? Which teams adapted their rebuild strategies and which ones are still operating on the old odds-based assumptions?',
  },
  {
    sport: 'HOOPS',
    label: 'Role Player Shooting Tiers',
    description: 'Efficiency by contributor type',
    question: 'How should teams tier role player shooting efficiency when building a roster around a star? Walk through the minimum thresholds by role type (spacer, pick-and-roll operator, movement shooter) that actually move the needle.',
  },

  // CBB
  {
    sport: 'HOOPS',
    label: 'Big 12 Hoops Race',
    description: 'What mainstream media misses',
    question: 'Break down the Big 12 basketball title race. What metrics actually predict late-season performance in this conference, and which storylines is mainstream media getting wrong?',
  },
  {
    sport: 'HOOPS',
    label: 'Mid-Major Scheduling Gaps',
    description: 'Seeding consequence analysis',
    question: 'How do mid-major scheduling gaps actually affect NCAA tournament seeding, and is the committee\'s stated methodology consistent with how seeds are actually assigned? Which programs are getting punished most by the current system?',
  },
  {
    sport: 'HOOPS',
    label: 'Portal: One-and-Done vs. Grad Transfer',
    description: 'Value comparison by program type',
    question: 'For a program trying to win now, compare the value of a one-and-done portal addition versus a grad transfer. Which programs have used each type most effectively and what does that say about their roster-building philosophy?',
  },
  {
    sport: 'HOOPS',
    label: 'Defensive Efficiency Leaders',
    description: 'Tournament correlation analysis',
    question: 'Which college basketball defensive efficiency metrics correlate most strongly with NCAA tournament success, and which defensive stats are misleading because of schedule strength? Name the programs leading the real metrics.',
  },
  {
    sport: 'HOOPS',
    label: 'Analytics Adoption Curve',
    description: 'Conference-by-conference breakdown',
    question: 'Where does each major college basketball conference sit on the analytics adoption curve? Which conferences and programs are meaningfully ahead, which ones are still playing 2010 basketball, and what\'s the competitive consequence?',
  },
];

const SPORT_FILTERS: { key: SportFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'BASEBALL', label: 'College Baseball' },
  { key: 'MLB', label: 'MLB' },
  { key: 'FOOTBALL', label: 'NFL' },
  { key: 'CFB', label: 'CFB' },
  { key: 'HOOPS', label: 'Hoops' },
];

// ─── Metrics ───────────────────────────────────────────────────────────────────

interface Metrics {
  timeToFirstToken: number | null;
  charsPerSec: number | null;
  totalChars: number;
  elapsed: number | null;
  dataFetchMs: number | null;
  contextAsOf: string | null;
}

const EMPTY_METRICS: Metrics = {
  timeToFirstToken: null,
  charsPerSec: null,
  totalChars: 0,
  elapsed: null,
  dataFetchMs: null,
  contextAsOf: null,
};

// ─── Stream hook (shared logic) ────────────────────────────────────────────────

function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stableText, setStableText] = useState('');
  const [freshChars, setFreshChars] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | null>(null);

  const fullTextRef = useRef('');
  const startTimeRef = useRef(0);
  const firstTokenTimeRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    fullTextRef.current = '';
    firstTokenTimeRef.current = null;
    setStableText('');
    setFreshChars([]);
    setError(null);
    setMetrics(EMPTY_METRICS);
    setCacheStatus(null);
  }, []);

  const appendText = useCallback((chunk: string) => {
    if (firstTokenTimeRef.current === null) {
      firstTokenTimeRef.current = performance.now() - startTimeRef.current;
    }
    const full = (fullTextRef.current += chunk);
    if (full.length <= FRESH_WINDOW) {
      setStableText('');
      setFreshChars(full.split(''));
    } else {
      setStableText(full.slice(0, -FRESH_WINDOW));
      setFreshChars(full.slice(-FRESH_WINDOW).split(''));
    }
  }, []);

  const snapshotMetrics = useCallback((extra?: Partial<Metrics>) => {
    const elapsed = performance.now() - startTimeRef.current;
    const total = fullTextRef.current.length;
    setMetrics((prev) => ({
      ...prev,
      timeToFirstToken: firstTokenTimeRef.current,
      charsPerSec: elapsed > 0 ? Math.round((total / elapsed) * 1000) : 0,
      totalChars: total,
      elapsed: Math.round(elapsed),
      ...(extra ?? {}),
    }));
  }, []);

  const readSSEStream = useCallback(
    async (
      response: Response,
      extra?: Partial<Metrics>
    ) => {
      setCacheStatus((response.headers.get('X-BSI-Cache') as 'HIT' | 'MISS') ?? null);

      const dataFetchMs = response.headers.get('X-BSI-Data-Fetch-Ms')
        ? Number(response.headers.get('X-BSI-Data-Fetch-Ms'))
        : null;
      const contextAsOf = response.headers.get('X-BSI-Context-As-Of') ?? null;

      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { text?: string; done?: boolean };
            if (parsed.text) appendText(parsed.text);
          } catch {
            // malformed chunk — skip
          }
        }
      }

      if (dataFetchMs !== null || contextAsOf) {
        snapshotMetrics({ dataFetchMs, contextAsOf, ...extra });
      }
    },
    [appendText, snapshotMetrics]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const cleanup = useCallback(() => {
    if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    snapshotMetrics();
    setIsStreaming(false);
    abortRef.current = null;
  }, [snapshotMetrics]);

  const startStreaming = useCallback(
    async (fetchFn: (signal: AbortSignal) => Promise<Response>) => {
      reset();
      setIsStreaming(true);
      const abort = new AbortController();
      abortRef.current = abort;
      startTimeRef.current = performance.now();
      metricsIntervalRef.current = setInterval(() => snapshotMetrics(), 120);

      try {
        const response = await fetchFn(abort.signal);

        if (response.status === 429) throw new Error('Rate limited — try again in 60s');
        if (response.status === 403) {
          const json = (await response.json()) as { error?: string };
          if (json.error === 'subscription_required') {
            throw new Error('subscription_required');
          }
          throw new Error(`Auth error ${response.status}`);
        }
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`API error ${response.status}: ${text}`);
        }

        await readSSEStream(response);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        cleanup();
      }
    },
    [reset, snapshotMetrics, readSSEStream, cleanup]
  );

  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
  }, []);

  return {
    isStreaming,
    stableText,
    freshChars,
    metrics,
    error,
    cacheStatus,
    stop,
    startStreaming,
    setError,
  };
}

// ─── Session check ─────────────────────────────────────────────────────────────

function hasBsiSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('bsi-session=');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IntelligenceClient() {
  const [sportFilter, setSportFilter] = useState<SportFilter>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Subscriber panel state
  const [subSport, setSubSport] = useState<RequestBody['sport']>('college-baseball');
  const [subQuestion, setSubQuestion] = useState('');
  const MAX_CHARS = 500;

  const preset = useStream();
  const subscriber = useStream();

  useEffect(() => {
    setMounted(true);
    setIsSubscriber(hasBsiSession());
  }, []);

  const filteredPresets = sportFilter === 'ALL'
    ? PRESETS
    : PRESETS.filter((p) => p.sport === sportFilter);

  // Keep selectedIndex in bounds when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [sportFilter]);

  const activePreset = filteredPresets[selectedIndex] ?? PRESETS[0];

  const runPreset = useCallback(() => {
    if (preset.isStreaming) {
      preset.stop();
      return;
    }
    preset.startStreaming((signal) =>
      fetch('/api/intelligence/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: activePreset.question, analysisType: 'general' }),
        signal,
      })
    );
  }, [preset, activePreset]);

  const runSubscriber = useCallback(() => {
    if (subscriber.isStreaming) {
      subscriber.stop();
      return;
    }
    if (!subQuestion.trim()) return;
    subscriber.startStreaming((signal) =>
      fetch('/api/intelligence/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: subSport, question: subQuestion.trim() }),
        signal,
      })
    );
  }, [subscriber, subSport, subQuestion]);

  const hasPresetOutput = preset.stableText.length > 0 || preset.freshChars.length > 0;
  const hasSubOutput = subscriber.stableText.length > 0 || subscriber.freshChars.length > 0;
  const hasPresetMetrics = preset.metrics.totalChars > 0 || preset.isStreaming;
  const hasSubMetrics = subscriber.metrics.totalChars > 0 || subscriber.isStreaming;

  return (
    <>
      <style>{`
        @keyframes stagger-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .preset-btn { animation: stagger-fade-up 0.35s ease both; }
      `}</style>

      <main className="min-h-screen px-4 py-12 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-10">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-3"
              style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
            >
              BSI Intelligence · Claude Sonnet 4.6
            </p>
            <h1
              className="text-4xl md:text-5xl uppercase mb-4 text-white"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}
            >
              Streaming Analysis
            </h1>
            <p
              className="text-sm text-gray-400 leading-relaxed max-w-xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Claude Sonnet 4.6 generating sports analysis in real time via BSI&apos;s
              Cloudflare edge network. Select a topic, watch the analysis build.
            </p>
          </div>

          <div
            className="mb-8 h-px"
            style={{
              background: 'linear-gradient(90deg, #BF5700, transparent)',
              boxShadow: '0 0 8px #BF570040',
            }}
          />

          {/* ── Sport filter ── */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SPORT_FILTERS.map(({ key, label }) => {
              const active = sportFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setSportFilter(key)}
                  className="px-3 py-1.5 text-[11px] uppercase tracking-widest border transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    borderColor: active ? '#BF5700' : '#2a2a2a',
                    backgroundColor: active ? '#BF570015' : 'transparent',
                    color: active ? '#FF6B35' : '#666',
                  }}
                >
                  {label}
                </button>
              );
            })}
            <span
              className="ml-auto text-[10px] self-center"
              style={{ color: '#333', fontFamily: 'var(--font-mono)' }}
            >
              {filteredPresets.length} topics
            </span>
          </div>

          {/* ── Preset grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {filteredPresets.map((p, i) => {
              const active = selectedIndex === i;
              return (
                <button
                  key={`${p.sport}-${p.label}`}
                  onClick={() => setSelectedIndex(i)}
                  disabled={preset.isStreaming}
                  className="preset-btn text-left px-3 py-3 border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    animationDelay: mounted ? `${Math.min(i, 15) * 40}ms` : '0ms',
                    fontFamily: 'var(--font-mono)',
                    borderColor: active ? '#BF5700' : '#2a2a2a',
                    backgroundColor: active ? '#BF570015' : 'transparent',
                  }}
                >
                  <div
                    className="font-semibold mb-0.5 text-[11px]"
                    style={{ color: active ? '#FF6B35' : '#ccc' }}
                  >
                    {p.label}
                  </div>
                  <div className="text-[10px] leading-tight" style={{ color: active ? '#BF5700' : '#555' }}>
                    {p.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Stream button ── */}
          <button
            onClick={runPreset}
            className="w-full py-3 mb-8 text-sm uppercase tracking-widest font-semibold transition-all"
            style={{
              fontFamily: 'var(--font-oswald)',
              letterSpacing: '0.2em',
              backgroundColor: preset.isStreaming ? 'transparent' : '#BF5700',
              color: preset.isStreaming ? '#BF5700' : '#fff',
              border: preset.isStreaming ? '1px solid #BF5700' : '1px solid transparent',
            }}
          >
            {preset.isStreaming ? '◼  STOP' : '▶  ANALYZE'}
          </button>

          {/* ── Preset metrics ── */}
          {hasPresetMetrics && (
            <MetricsPanel metrics={preset.metrics} cacheStatus={preset.cacheStatus} isStreaming={preset.isStreaming} />
          )}

          {/* ── Preset error ── */}
          {preset.error && preset.error !== 'subscription_required' && (
            <ErrorBox message={preset.error} />
          )}

          {/* ── Preset output ── */}
          {(hasPresetOutput || preset.isStreaming) && (
            <StreamOutput
              stableText={preset.stableText}
              freshChars={preset.freshChars}
              isStreaming={preset.isStreaming}
            />
          )}

          {/* ── Empty state ── */}
          {!hasPresetOutput && !preset.isStreaming && !preset.error && (
            <div
              className="text-center py-16 text-xs uppercase tracking-widest"
              style={{ color: '#333', fontFamily: 'var(--font-mono)' }}
            >
              Select a topic · press analyze
            </div>
          )}

          {/* ──────────────────────────────────────────── */}
          {/* ── Subscriber zone ── */}
          {/* ──────────────────────────────────────────── */}
          <div className="mt-16 mb-4">
            <div
              className="h-px mb-8"
              style={{
                background: 'linear-gradient(90deg, transparent, #BF5700, transparent)',
                boxShadow: '0 0 8px #BF570040',
              }}
            />
            <p
              className="text-xs tracking-[0.25em] uppercase mb-2"
              style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
            >
              Analyst · Subscriber Access
            </p>
            <h2
              className="text-2xl md:text-3xl uppercase mb-2 text-white"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}
            >
              Ask BSI Anything
            </h2>
            <p
              className="text-sm text-gray-500 leading-relaxed max-w-xl mb-8"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Custom analysis with live BSI data injected — standings, transfer portal,
              news, and team stats — delivered in real time.
            </p>
          </div>

          {mounted && !isSubscriber ? (
            <LockedSubscriberPanel />
          ) : mounted && isSubscriber ? (
            <SubscriberPanel
              subSport={subSport}
              setSubSport={setSubSport}
              subQuestion={subQuestion}
              setSubQuestion={setSubQuestion}
              maxChars={MAX_CHARS}
              isStreaming={subscriber.isStreaming}
              onSubmit={runSubscriber}
              metrics={subscriber.metrics}
              cacheStatus={subscriber.cacheStatus}
              error={subscriber.error}
              stableText={subscriber.stableText}
              freshChars={subscriber.freshChars}
              hasOutput={hasSubOutput}
              hasMetrics={hasSubMetrics}
            />
          ) : null}

          {/* ── Footer ── */}
          <p
            className="mt-16 text-center text-[10px]"
            style={{ color: '#2a2a2a', fontFamily: 'var(--font-mono)' }}
          >
            Claude Sonnet 4.6 · Cloudflare Edge · BSI Intelligence
          </p>
        </div>
      </main>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface RequestBody {
  sport: 'college-baseball' | 'mlb' | 'nfl' | 'cfb' | 'nba' | 'cbb';
  question: string;
}

const SUB_SPORTS: { key: RequestBody['sport']; label: string }[] = [
  { key: 'college-baseball', label: 'College Baseball' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nfl', label: 'NFL' },
  { key: 'cfb', label: 'CFB' },
  { key: 'nba', label: 'NBA' },
  { key: 'cbb', label: 'CBB' },
];

function MetricsPanel({
  metrics,
  cacheStatus,
  isStreaming,
}: {
  metrics: Metrics;
  cacheStatus: 'HIT' | 'MISS' | null;
  isStreaming: boolean;
}) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 border"
      style={{ borderColor: '#1a1a1a' }}
    >
      <MetricCell label="First Token" value={metrics.timeToFirstToken !== null ? `${metrics.timeToFirstToken.toFixed(0)}ms` : '—'} />
      <MetricCell label="Chars / Sec" value={metrics.charsPerSec?.toString() ?? '—'} />
      <MetricCell label="Total Chars" value={metrics.totalChars > 0 ? String(metrics.totalChars) : '—'} />
      <MetricCell
        label="Cache"
        value={cacheStatus ?? (isStreaming ? '…' : '—')}
        color={cacheStatus === 'HIT' ? '#22c55e' : cacheStatus === 'MISS' ? '#BF5700' : '#444'}
      />
      {(metrics.dataFetchMs !== null || metrics.contextAsOf) && (
        <>
          <MetricCell label="Data Fetch" value={metrics.dataFetchMs !== null ? `${metrics.dataFetchMs}ms` : '—'} />
          <div className="col-span-3">
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#555', fontFamily: 'var(--font-mono)' }}>
              Context As Of
            </div>
            <div className="text-xs font-semibold" style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}>
              {metrics.contextAsOf
                ? new Date(metrics.contextAsOf).toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour12: true }) + ' CT'
                : '—'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCell({ label, value, color = '#BF5700' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#555', fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
      <div className="text-xl font-semibold" style={{ color, fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="mb-6 p-3 border text-xs"
      style={{ borderColor: '#7f1d1d', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}
    >
      ✗ {message}
    </div>
  );
}

function LockedSubscriberPanel() {
  return (
    <div
      className="relative border p-8 overflow-hidden"
      style={{ borderColor: '#2a2a2a', backgroundColor: '#080808' }}
    >
      {/* Blurred mock content */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        <div className="h-3 w-2/3 rounded mb-3" style={{ backgroundColor: '#1a1a1a' }} />
        <div className="h-3 w-full rounded mb-3" style={{ backgroundColor: '#1a1a1a' }} />
        <div className="h-3 w-4/5 rounded mb-3" style={{ backgroundColor: '#1a1a1a' }} />
        <div className="h-10 w-full rounded mb-4" style={{ backgroundColor: '#1a1a1a' }} />
        <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#1a1a1a' }} />
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <div
          className="text-2xl mb-3"
          style={{ color: '#BF5700' }}
        >
          ⊘
        </div>
        <p
          className="text-sm mb-4"
          style={{ color: '#888', fontFamily: 'var(--font-playfair)' }}
        >
          Custom analysis with live data is subscriber-only.
        </p>
        <a
          href="/pricing"
          className="px-6 py-2 text-xs uppercase tracking-widest transition-all"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: '#BF5700',
            color: '#fff',
          }}
        >
          Subscribe to Unlock
        </a>
        <p
          className="mt-3 text-[10px]"
          style={{ color: '#444', fontFamily: 'var(--font-mono)' }}
        >
          Already subscribed?{' '}
          <a href="/auth/login" style={{ color: '#BF5700' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

function SubscriberPanel({
  subSport,
  setSubSport,
  subQuestion,
  setSubQuestion,
  maxChars,
  isStreaming,
  onSubmit,
  metrics,
  cacheStatus,
  error,
  stableText,
  freshChars,
  hasOutput,
  hasMetrics,
}: {
  subSport: RequestBody['sport'];
  setSubSport: (s: RequestBody['sport']) => void;
  subQuestion: string;
  setSubQuestion: (q: string) => void;
  maxChars: number;
  isStreaming: boolean;
  onSubmit: () => void;
  metrics: Metrics;
  cacheStatus: 'HIT' | 'MISS' | null;
  error: string | null;
  stableText: string;
  freshChars: string[];
  hasOutput: boolean;
  hasMetrics: boolean;
}) {
  const remaining = maxChars - subQuestion.length;

  return (
    <div>
      {/* Sport selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUB_SPORTS.map(({ key, label }) => {
          const active = subSport === key;
          return (
            <button
              key={key}
              onClick={() => setSubSport(key)}
              disabled={isStreaming}
              className="px-3 py-1.5 text-[11px] uppercase tracking-widest border transition-colors disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: active ? '#BF5700' : '#2a2a2a',
                backgroundColor: active ? '#BF570015' : 'transparent',
                color: active ? '#FF6B35' : '#666',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Question input */}
      <div className="relative mb-4">
        <textarea
          value={subQuestion}
          onChange={(e) => setSubQuestion(e.target.value.slice(0, maxChars))}
          disabled={isStreaming}
          placeholder="Ask BSI anything about this sport..."
          rows={4}
          className="w-full px-4 py-3 text-sm resize-none border outline-none transition-colors disabled:opacity-40"
          style={{
            fontFamily: 'var(--font-playfair)',
            backgroundColor: '#080808',
            borderColor: '#2a2a2a',
            color: '#d4d4d4',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#BF5700'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
        />
        <span
          className="absolute bottom-2 right-3 text-[10px]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: remaining < 50 ? '#BF5700' : '#444',
          }}
        >
          {remaining}
        </span>
      </div>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!subQuestion.trim() && !isStreaming}
        className="w-full py-3 mb-8 text-sm uppercase tracking-widest font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          fontFamily: 'var(--font-oswald)',
          letterSpacing: '0.2em',
          backgroundColor: isStreaming ? 'transparent' : '#BF5700',
          color: isStreaming ? '#BF5700' : '#fff',
          border: isStreaming ? '1px solid #BF5700' : '1px solid transparent',
        }}
      >
        {isStreaming ? '◼  STOP' : '▶  ANALYZE'}
      </button>

      {/* Metrics */}
      {hasMetrics && (
        <MetricsPanel metrics={metrics} cacheStatus={cacheStatus} isStreaming={isStreaming} />
      )}

      {/* Error */}
      {error && error !== 'subscription_required' && <ErrorBox message={error} />}
      {error === 'subscription_required' && (
        <div
          className="mb-6 p-3 border text-xs"
          style={{ borderColor: '#7f1d1d', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}
        >
          ✗ Session expired.{' '}
          <a href="/auth/login" style={{ color: '#BF5700' }}>
            Sign in again
          </a>{' '}
          to continue.
        </div>
      )}

      {/* Output */}
      {(hasOutput || isStreaming) && (
        <StreamOutput
          stableText={stableText}
          freshChars={freshChars}
          isStreaming={isStreaming}
          fontSize="0.95rem"
        />
      )}

      {!hasOutput && !isStreaming && !error && (
        <div
          className="text-center py-12 text-xs uppercase tracking-widest"
          style={{ color: '#333', fontFamily: 'var(--font-mono)' }}
        >
          Choose a sport context · ask your question
        </div>
      )}
    </div>
  );
}
