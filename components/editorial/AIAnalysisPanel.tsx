'use client';

import { useState, useEffect } from 'react';

interface AIAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameContext: string;
  defaultModel?: 'claude' | 'gemini';
}

const PROMPTS = [
  { id: 'matchup', label: 'Matchup Breakdown', description: 'Pitching vs batting analysis for the series' },
  { id: 'portal', label: 'Transfer Portal Report Card', description: 'Grade each portal addition\'s debut performance' },
  { id: 'omaha', label: 'Omaha Implications', description: 'What this opener means for the CWS path' },
  { id: 'custom', label: 'Custom Question', description: 'Ask anything about this game' },
] as const;

type Model = 'claude' | 'gemini';

export function AIAnalysisPanel({ isOpen, onClose, gameContext, defaultModel = 'claude' }: AIAnalysisPanelProps) {
  const [selectedModel, setSelectedModel] = useState<Model>(defaultModel);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setSelectedModel(defaultModel);
  }, [isOpen, defaultModel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (promptId: string) => {
    setSelectedPrompt(promptId);
    setResponse('');
    setError('');
    setLoading(true);

    const promptText = promptId === 'custom'
      ? customQuestion
      : PROMPTS.find(p => p.id === promptId)?.label ?? '';

    try {
      const res = await fetch('/api/ai/game-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: promptText,
          gameContext,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as { analysis: string };
      setResponse(data.analysis);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError('Request timed out. Try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response);
    } catch {
      // Clipboard unavailable
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="ai-panel-heading">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-[480px] bg-[var(--surface-scoreboard)] border-l border-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--surface-scoreboard)] border-b border-border p-4 flex items-center justify-between">
          <h2 id="ai-panel-heading" className="font-display text-lg uppercase tracking-wider text-[var(--bsi-bone)]">AI Game Analysis</h2>
          <button onClick={onClose} aria-label="Close AI analysis panel" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Model toggle */}
        <div className="p-4 border-b border-[var(--border-vintage)]">
          <div className="flex bg-[var(--surface-dugout)] rounded-sm overflow-hidden">
            {(['claude', 'gemini'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                  selectedModel === m
                    ? 'bg-[var(--bsi-primary)] text-white'
                    : 'text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-dust)]'
                }`}
              >
                {m === 'claude' ? 'Claude' : 'Gemini'}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt cards */}
        <div className="p-4 space-y-3">
          {PROMPTS.map((prompt) => (
            <div key={prompt.id}>
              <button
                onClick={() => prompt.id !== 'custom' && handleAnalyze(prompt.id)}
                disabled={loading}
                className={`w-full text-left p-3 rounded-sm border transition-colors ${
                  selectedPrompt === prompt.id
                    ? 'border-[var(--bsi-primary)]/40 bg-[var(--bsi-primary)]/5'
                    : 'border-[var(--border-vintage)] hover:border-border bg-[var(--surface-dugout)]'
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className="font-mono text-xs uppercase tracking-wider text-[var(--bsi-primary)] mb-1">
                  {prompt.label}
                </div>
                <div className="text-[rgba(196,184,165,0.35)] text-xs">{prompt.description}</div>
              </button>
              {prompt.id === 'custom' && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="What do you want to know about this game?"
                    className="w-full bg-[var(--surface-dugout)] border border-border rounded-sm p-3 text-sm text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.35)] resize-none h-20 focus:outline-none focus:border-[var(--bsi-primary)]/30"
                  />
                  <button
                    onClick={() => handleAnalyze('custom')}
                    disabled={loading || !customQuestion.trim()}
                    className="w-full py-2 bg-[var(--bsi-primary)] hover:bg-ember disabled:opacity-40 text-white text-xs font-mono uppercase tracking-wider rounded-sm transition-colors"
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Response */}
        {(loading || response || error) && (
          <div className="p-4 border-t border-[var(--border-vintage)]">
            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-[var(--bsi-primary)]/10 rounded-sm animate-pulse" style={{ width: `${80 - i * 15}%` }} />
                ))}
              </div>
            )}
            {error && (
              <div className="text-center space-y-3">
                <p className="text-[var(--bsi-danger)]/80 text-sm">{error}</p>
                <button
                  onClick={() => selectedPrompt && handleAnalyze(selectedPrompt)}
                  className="text-xs font-mono uppercase tracking-wider text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            {response && (
              <div className="space-y-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-[var(--bsi-dust)] text-sm leading-relaxed whitespace-pre-wrap">{response}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] border border-border rounded-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
