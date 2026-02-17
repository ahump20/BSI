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
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as { analysis: string };
      setResponse(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-[#0D0D0D] border-l border-white/10 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D0D0D] border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-wider text-white">AI Game Analysis</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Model toggle */}
        <div className="p-4 border-b border-white/5">
          <div className="flex bg-[#1A1A1A] rounded overflow-hidden">
            {(['claude', 'gemini'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                  selectedModel === m
                    ? 'bg-[#BF5700] text-white'
                    : 'text-white/40 hover:text-white/60'
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
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedPrompt === prompt.id
                    ? 'border-[#BF5700]/40 bg-[#BF5700]/5'
                    : 'border-white/5 hover:border-white/10 bg-[#1A1A1A]'
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className="font-mono text-xs uppercase tracking-wider text-[#BF5700] mb-1">
                  {prompt.label}
                </div>
                <div className="text-white/40 text-xs">{prompt.description}</div>
              </button>
              {prompt.id === 'custom' && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="What do you want to know about this game?"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded p-3 text-sm text-white/80 placeholder:text-white/20 resize-none h-20 focus:outline-none focus:border-[#BF5700]/30"
                  />
                  <button
                    onClick={() => handleAnalyze('custom')}
                    disabled={loading || !customQuestion.trim()}
                    className="w-full py-2 bg-[#BF5700] hover:bg-[#FF6B35] disabled:opacity-40 text-white text-xs font-mono uppercase tracking-wider rounded transition-colors"
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
          <div className="p-4 border-t border-white/5">
            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#BF5700]/10 rounded animate-pulse" style={{ width: `${80 - i * 15}%` }} />
                ))}
              </div>
            )}
            {error && (
              <div className="text-center space-y-3">
                <p className="text-red-400/80 text-sm">{error}</p>
                <button
                  onClick={() => selectedPrompt && handleAnalyze(selectedPrompt)}
                  className="text-xs font-mono uppercase tracking-wider text-[#BF5700] hover:text-[#FF6B35] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            {response && (
              <div className="space-y-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{response}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-white/40 hover:text-[#BF5700] border border-white/10 rounded transition-colors"
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
