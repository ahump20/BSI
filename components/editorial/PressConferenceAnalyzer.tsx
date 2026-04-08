'use client';

import { useState } from 'react';

interface LineupSignal {
  signal: string;
  implication: string;
}

interface HealthIndicator {
  player: string;
  status: string;
  readBetweenLines: string;
}

interface RotationInsight {
  observation: string;
  implication: string;
}

interface SaidVsImplied {
  quote: string;
  subtext: string;
  confidence: 'high' | 'medium' | 'low';
}

interface SignalInsight {
  signal: string;
  implication: string;
}

interface AnalysisResult {
  lineupSignals?: LineupSignal[];
  healthIndicators?: HealthIndicator[];
  rotationPhilosophy?: RotationInsight[];
  midweekRotationSignals?: SignalInsight[];
  closerAndHighLeverage?: SignalInsight[];
  dhPlatoonSignals?: SignalInsight[];
  portalAndRecruitingHints?: SignalInsight[];
  notableOmissions?: string[];
  saidVsImplied?: SaidVsImplied[];
  keyTakeaways?: string[];
  confidenceLevel?: string;
  rawAnalysis?: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-[var(--bsi-success)]',
  medium: 'text-[var(--bsi-warning)]',
  low: 'text-[var(--bsi-danger)]',
};

export default function PressConferenceAnalyzer() {
  const [transcript, setTranscript] = useState('');
  const [coach, setCoach] = useState('');
  const [team, setTeam] = useState('');
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (transcript.trim().length < 50) {
      setError('Paste at least a few sentences from the press conference.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const res = await fetch('/api/ai/press-conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          coach: coach.trim() || undefined,
          team: team.trim() || undefined,
          context: context.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as { analysis: AnalysisResult };
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-scoreboard">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6 font-mono">
          <a href="/college-baseball" className="hover:text-burnt-orange transition-colors">College Baseball</a>
          <span>/</span>
          <a href="/college-baseball/texas-intelligence" className="hover:text-burnt-orange transition-colors">Texas Intel</a>
          <span>/</span>
          <span className="text-bsi-dust">Press Conference</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <span className="heritage-stamp text-xs mb-3 inline-block">Texas Intelligence</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide text-bsi-bone mb-2">
            Press Conference Analyzer
          </h1>
          <p className="text-sm text-bsi-dust max-w-2xl">
            Paste a coach transcript and get structured intelligence — lineup signals, health indicators,
            rotation philosophy, and what was said versus what was implied.
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="Coach name (optional)"
              className="px-4 py-2.5 bg-surface-dugout border border-border-vintage rounded-sm text-bsi-bone placeholder-text-muted text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
            />
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Team (optional)"
              className="px-4 py-2.5 bg-surface-dugout border border-border-vintage rounded-sm text-bsi-bone placeholder-text-muted text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
            />
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Context, e.g. 'post-game Friday'"
              className="px-4 py-2.5 bg-surface-dugout border border-border-vintage rounded-sm text-bsi-bone placeholder-text-muted text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
            />
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the press conference transcript here..."
            className="w-full h-48 px-4 py-3 bg-surface-dugout border border-border-vintage rounded-sm text-bsi-bone placeholder-text-muted text-sm focus:outline-none focus:border-burnt-orange/50 transition-all resize-y font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-mono">
              {transcript.length.toLocaleString()} / 15,000 characters
            </span>
            <button
              onClick={handleAnalyze}
              disabled={loading || transcript.trim().length < 50}
              className="btn-heritage-fill px-6 py-2.5 text-sm disabled:opacity-40"
            >
              {loading ? 'Analyzing...' : 'Analyze Transcript'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-sm bg-[var(--bsi-danger)]/10 border border-[var(--bsi-danger)]/20 text-[var(--bsi-danger)] text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-surface-dugout rounded-sm animate-pulse" />
            ))}
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-6">
            {/* Confidence badge */}
            {analysis.confidenceLevel && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Analysis Confidence:</span>
                <span className={`text-xs font-bold uppercase ${CONFIDENCE_COLORS[analysis.confidenceLevel] || 'text-bsi-dust'}`}>
                  {analysis.confidenceLevel}
                </span>
              </div>
            )}

            {/* Key Takeaways */}
            {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Key Takeaways</h2>
                <ul className="space-y-2">
                  {analysis.keyTakeaways.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-bsi-bone">
                      <span className="text-burnt-orange mt-0.5 shrink-0">&#9670;</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Lineup Signals */}
            {analysis.lineupSignals && analysis.lineupSignals.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Lineup Signals</h2>
                <div className="space-y-3">
                  {analysis.lineupSignals.map((s, i) => (
                    <div key={i} className="border-l-2 border-burnt-orange/40 pl-4">
                      <p className="text-sm text-bsi-bone">{s.signal}</p>
                      <p className="text-xs text-bsi-dust mt-1">{s.implication}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Health Indicators */}
            {analysis.healthIndicators && analysis.healthIndicators.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Health Indicators</h2>
                <div className="space-y-3">
                  {analysis.healthIndicators.map((h, i) => (
                    <div key={i} className="border-l-2 border-[var(--bsi-warning)]/40 pl-4">
                      <p className="text-sm font-semibold text-bsi-bone">{h.player}</p>
                      <p className="text-xs text-bsi-dust">{h.status}</p>
                      <p className="text-xs text-burnt-orange/80 italic mt-1">{h.readBetweenLines}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rotation Philosophy */}
            {analysis.rotationPhilosophy && analysis.rotationPhilosophy.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Rotation Philosophy</h2>
                <div className="space-y-3">
                  {analysis.rotationPhilosophy.map((r, i) => (
                    <div key={i} className="border-l-2 border-heritage-columbia-blue/40 pl-4">
                      <p className="text-sm text-bsi-bone">{r.observation}</p>
                      <p className="text-xs text-bsi-dust mt-1">{r.implication}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Midweek Rotation */}
            {analysis.midweekRotationSignals && analysis.midweekRotationSignals.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Midweek Rotation Signals</h2>
                <div className="space-y-3">
                  {analysis.midweekRotationSignals.map((s, i) => (
                    <div key={i} className="border-l-2 border-burnt-orange/40 pl-4">
                      <p className="text-sm text-bsi-bone">{s.signal}</p>
                      <p className="text-xs text-bsi-dust mt-1">{s.implication}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Closer / High Leverage */}
            {analysis.closerAndHighLeverage && analysis.closerAndHighLeverage.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Closer &amp; High Leverage</h2>
                <div className="space-y-3">
                  {analysis.closerAndHighLeverage.map((s, i) => (
                    <div key={i} className="border-l-2 border-[var(--bsi-danger)]/40 pl-4">
                      <p className="text-sm text-bsi-bone">{s.signal}</p>
                      <p className="text-xs text-bsi-dust mt-1">{s.implication}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DH Platoon */}
            {analysis.dhPlatoonSignals && analysis.dhPlatoonSignals.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">DH &amp; Platoon Signals</h2>
                <div className="space-y-3">
                  {analysis.dhPlatoonSignals.map((s, i) => (
                    <div key={i} className="border-l-2 border-burnt-orange/40 pl-4">
                      <p className="text-sm text-bsi-bone">{s.signal}</p>
                      <p className="text-xs text-bsi-dust mt-1">{s.implication}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Portal & Recruiting Hints */}
            {analysis.portalAndRecruitingHints && analysis.portalAndRecruitingHints.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Portal &amp; Recruiting Hints</h2>
                <div className="space-y-3">
                  {analysis.portalAndRecruitingHints.map((s, i) => (
                    <div key={i} className="border-l-2 border-heritage-columbia-blue/40 pl-4">
                      <p className="text-sm text-bsi-bone">{s.signal}</p>
                      <p className="text-xs text-bsi-dust mt-1">{s.implication}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notable Omissions */}
            {analysis.notableOmissions && analysis.notableOmissions.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Notable Omissions</h2>
                <ul className="space-y-2">
                  {analysis.notableOmissions.map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm text-bsi-bone">
                      <span className="text-[var(--bsi-danger)] mt-0.5 shrink-0">&#9888;</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Said vs Implied */}
            {analysis.saidVsImplied && analysis.saidVsImplied.length > 0 && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Said vs. Implied</h2>
                <div className="space-y-4">
                  {analysis.saidVsImplied.map((s, i) => (
                    <div key={i} className="bg-[var(--surface-scoreboard,#0A0A0A)]/50 rounded-sm p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs text-text-muted font-mono uppercase shrink-0 mt-0.5">Said:</span>
                        <p className="text-sm text-bsi-bone italic">&ldquo;{s.quote}&rdquo;</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-burnt-orange font-mono uppercase shrink-0 mt-0.5">Implied:</span>
                        <p className="text-sm text-bsi-dust">{s.subtext}</p>
                      </div>
                      <span className={`text-[10px] font-mono uppercase mt-2 inline-block ${CONFIDENCE_COLORS[s.confidence] || ''}`}>
                        {s.confidence} confidence
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Raw analysis fallback */}
            {analysis.rawAnalysis && (
              <section className="heritage-card p-5">
                <h2 className="heritage-stamp text-xs mb-4">Analysis</h2>
                <div className="text-sm text-bsi-bone whitespace-pre-wrap leading-relaxed">
                  {analysis.rawAnalysis}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
