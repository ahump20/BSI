'use client';

import { useState } from 'react';

const POOLS = ['A', 'B', 'C', 'D', 'Quarterfinal', 'Semifinal', 'Final'] as const;
type PoolOption = typeof POOLS[number];

const TEAMS = [
  'Japan', 'Dominican Republic', 'USA', 'Venezuela', 'Puerto Rico',
  'South Korea', 'Mexico', 'Cuba', 'Netherlands', 'Canada',
  'Australia', 'Italy', 'Colombia', 'Chinese Taipei', 'Panama',
  'Israel', 'Czech Republic', 'Nicaragua', 'China', 'Great Britain',
];

interface AnalysisInput {
  teamA: string;
  teamB: string;
  pool: PoolOption;
  date: string;
  venue: string;
  teamAStarter: string;
  teamBStarter: string;
  notes: string;
}

// Mock EdgeBot response for demonstration — real implementation streams from bsi-intelligence-stream
function buildEdgeBotPrompt(input: AnalysisInput): string {
  return `WBC 2026 PRE mode analysis request:
Team A: ${input.teamA}
Team B: ${input.teamB}
Round: ${input.pool}
Date: ${input.date}
Venue: ${input.venue}
${input.teamAStarter ? `${input.teamA} starter: ${input.teamAStarter}` : ''}
${input.teamBStarter ? `${input.teamB} starter: ${input.teamBStarter}` : ''}
${input.notes ? `Additional context: ${input.notes}` : ''}

Apply EdgeBot v3 framework. Output BSI Analytical Readout format with win probability, adjustments applied, edge vs market, and bankroll signal.`;
}

type AnalysisState = 'idle' | 'loading' | 'complete' | 'error';

export function EdgeBotPanel() {
  const [input, setInput] = useState<AnalysisInput>({
    teamA: '',
    teamB: '',
    pool: 'A',
    date: '',
    venue: '',
    teamAStarter: '',
    teamBStarter: '',
    notes: '',
  });
  const [state, setState] = useState<AnalysisState>('idle');
  const [output, setOutput] = useState('');

  const canSubmit =
    input.teamA && input.teamB && input.teamA !== input.teamB && input.date;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState('loading');
    setOutput('');

    try {
      const prompt = buildEdgeBotPrompt(input);
      const res = await fetch('/api/intelligence/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: 'wbc-edgebot-v3',
          systemPrompt: `You are EdgeBot v3, BSI's WBC 2026 analysis engine. Apply the BSI Prior Ladder (tier-based win probability starting points), run through the adjustment menu (starter quality, bullpen status, crowd, rest, venue), compare to market implied probability, and output the BSI Analytical Readout format. Include: win probabilities, adjustments applied, market comparison, bankroll signal, 3 key game factors, and risk flags. Always end with the disclaimer: "Informational analysis only. Not financial advice."`,
        }),
      });

      if (!res.ok) throw new Error('Stream request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No stream reader');

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // SSE parsing
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as { delta?: { text?: string } };
              if (parsed.delta?.text) {
                accumulated += parsed.delta.text;
                setOutput(accumulated);
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }

      setState('complete');
    } catch {
      setState('error');
      setOutput('Analysis unavailable. Check that the intelligence stream is running.');
    }
  }

  const update = (field: keyof AnalysisInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setInput((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
          EdgeBot v3 Intelligence
        </h2>
        <p className="text-text-muted text-sm mt-1">
          BSI probability model · EdgeBot v3 · Single-game analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="bg-surface-light/10 border border-border-subtle rounded-sm p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
            PRE Mode — Game Setup
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1" htmlFor="teamA">Team A</label>
                <select
                  id="teamA"
                  value={input.teamA}
                  onChange={update('teamA')}
                  className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
                >
                  <option value="">Select team</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1" htmlFor="teamB">Team B</label>
                <select
                  id="teamB"
                  value={input.teamB}
                  onChange={update('teamB')}
                  className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
                >
                  <option value="">Select team</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1" htmlFor="pool">Round</label>
                <select
                  id="pool"
                  value={input.pool}
                  onChange={update('pool')}
                  className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
                >
                  {POOLS.map((p) => (
                    <option key={p} value={p}>{p === 'A' || p === 'B' || p === 'C' || p === 'D' ? `Pool ${p}` : p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1" htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={input.date}
                  onChange={update('date')}
                  min="2026-03-05"
                  max="2026-03-17"
                  className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1" htmlFor="venue">Venue (optional)</label>
              <input
                id="venue"
                type="text"
                placeholder="e.g. Tokyo Dome"
                value={input.venue}
                onChange={update('venue')}
                className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1" htmlFor="teamAStarter">
                  {input.teamA || 'Team A'} starter
                </label>
                <input
                  id="teamAStarter"
                  type="text"
                  placeholder="Optional"
                  value={input.teamAStarter}
                  onChange={update('teamAStarter')}
                  className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1" htmlFor="teamBStarter">
                  {input.teamB || 'Team B'} starter
                </label>
                <input
                  id="teamBStarter"
                  type="text"
                  placeholder="Optional"
                  value={input.teamBStarter}
                  onChange={update('teamBStarter')}
                  className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1" htmlFor="notes">Additional context</label>
              <textarea
                id="notes"
                placeholder="e.g. Must-win game, bullpen depletion notes, market odds..."
                value={input.notes}
                onChange={update('notes')}
                rows={2}
                className="w-full bg-midnight border border-border-subtle rounded-sm px-3 py-2 text-text-primary text-sm focus:border-burnt-orange focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || state === 'loading'}
              className="w-full py-2.5 bg-burnt-orange text-white font-semibold rounded-sm text-sm hover:bg-ember transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state === 'loading' ? 'Analyzing...' : 'Run EdgeBot v3 →'}
            </button>
          </form>
        </div>

        {/* Output panel */}
        <div className="bg-midnight border border-border-subtle rounded-sm p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
            BSI Analytical Readout
          </h3>

          {state === 'idle' && (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="w-12 h-12 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <p className="text-text-muted text-sm">Select teams and game details to run analysis</p>
              </div>
            </div>
          )}

          {state === 'loading' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-text-muted text-sm">EdgeBot v3 analyzing...</p>
              </div>
            </div>
          )}

          {(state === 'complete' || state === 'error' || output) && (
            <div className="flex-1 overflow-auto">
              <pre className="text-text-secondary text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {output}
              </pre>
            </div>
          )}

          <p className="text-text-muted text-[10px] mt-4 pt-3 border-t border-border-subtle">
            Informational analysis only. Not financial advice. EdgeBot v3 · BSI probability model.
          </p>
        </div>
      </div>
    </div>
  );
}
