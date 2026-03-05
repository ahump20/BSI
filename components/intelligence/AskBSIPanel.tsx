'use client';

import React, { useState, useRef, useCallback } from 'react';
import { StreamOutput, FRESH_WINDOW, renderMarkdown } from '@/components/intelligence/StreamOutput';
import type { CollegeGameData } from '@/app/college-baseball/game/[gameId]/GameLayoutClient';

// ─── Game context helpers ─────────────────────────────────────────────────────

function buildGameQuestion(game: CollegeGameData): string {
  const away = game.teams.away;
  const home = game.teams.home;
  const awayStr = away.ranking ? `#${away.ranking} ${away.name}` : away.name;
  const homeStr = home.ranking ? `#${home.ranking} ${home.name}` : home.name;

  if (game.status.isLive) {
    return `Analyze this live college baseball game: ${awayStr} vs ${homeStr} (${away.score}–${home.score}, ${game.status.inningState} ${game.status.inning}). What does the current score and game flow tell you about how this one finishes?`;
  }
  if (game.status.isFinal) {
    const winner = away.isWinner ? away : home;
    const loser = away.isWinner ? home : away;
    const winScore = Math.max(away.score, home.score);
    const lossScore = Math.min(away.score, home.score);
    return `Break down the final result: ${winner.name} def. ${loser.name} ${winScore}–${lossScore}. What won this game and what does it reveal about where each program is right now?`;
  }
  return `Preview ${awayStr} at ${homeStr}. What are the key matchup factors and which program has the structural advantage coming in?`;
}

function getAnalysisType(game: CollegeGameData): string {
  if (game.status.isLive) return 'live';
  if (game.status.isFinal) return 'postgame';
  return 'pregame';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AskBSIPanelProps {
  game: CollegeGameData;
}

export function AskBSIPanel({ game }: AskBSIPanelProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stableText, setStableText] = useState('');
  const [freshChars, setFreshChars] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ttft, setTtft] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const fullTextRef = useRef('');
  const startTimeRef = useRef(0);
  const firstTokenTimeRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const question = buildGameQuestion(game);
  const analysisType = getAnalysisType(game);

  const appendText = useCallback((chunk: string) => {
    if (firstTokenTimeRef.current === null) {
      firstTokenTimeRef.current = performance.now() - startTimeRef.current;
      setTtft(Math.round(firstTokenTimeRef.current));
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

  const analyze = useCallback(async () => {
    if (isStreaming) {
      abortRef.current?.abort();
      return;
    }

    fullTextRef.current = '';
    firstTokenTimeRef.current = null;
    setStableText('');
    setFreshChars([]);
    setError(null);
    setTtft(null);
    setDone(false);
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;
    startTimeRef.current = performance.now();

    try {
      const response = await fetch('/api/intelligence/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, analysisType }),
        signal: abort.signal,
      });

      if (response.status === 429) throw new Error('Rate limited — try again in 60s');
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;

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
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      setDone(true);
      abortRef.current = null;
    }
  }, [isStreaming, question, analysisType, appendText]);

  const hasOutput = stableText.length > 0 || freshChars.length > 0;

  return (
    <div
      className="border rounded-none"
      style={{ borderColor: '#BF570030', backgroundColor: '#080808' }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#BF570020' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] tracking-[0.25em] uppercase font-semibold"
            style={{ color: '#BF5700', fontFamily: 'var(--font-mono)' }}
          >
            BSI Intelligence
          </span>
          {ttft !== null && (
            <span
              className="text-[9px] tracking-widest"
              style={{ color: '#444', fontFamily: 'var(--font-mono)' }}
            >
              · {ttft}ms
            </span>
          )}
        </div>
        <button
          onClick={analyze}
          className="text-[10px] uppercase tracking-widest px-3 py-1 transition-all"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: isStreaming ? 'transparent' : '#BF5700',
            color: isStreaming ? '#BF5700' : '#fff',
            border: isStreaming ? '1px solid #BF5700' : '1px solid transparent',
          }}
        >
          {isStreaming ? '◼ Stop' : done ? '↺ Re-analyze' : '▶ Analyze'}
        </button>
      </div>

      {/* Question preview */}
      {!hasOutput && !isStreaming && !error && (
        <div className="px-4 py-3">
          <p
            className="text-xs leading-relaxed italic"
            style={{ color: '#444', fontFamily: 'var(--font-playfair)' }}
          >
            &ldquo;{question}&rdquo;
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 text-xs"
          style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)' }}
        >
          ✗ {error}
        </div>
      )}

      {/* Streaming output — uses shared StreamOutput for consistent rendering + italic support */}
      {(hasOutput || isStreaming) && !error && (
        <div className="px-4 py-4">
          <p
            className="leading-relaxed"
            style={{ fontFamily: 'var(--font-playfair)', color: '#d4d4d4', fontSize: '0.95rem' }}
          >
            {renderMarkdown(stableText)}
            {freshChars.map((char, i) => {
              const ratio = i / Math.max(FRESH_WINDOW - 1, 1);
              const h = Math.round(ratio * 22);
              const s = Math.round(ratio * 90);
              const l = Math.round(83 - ratio * 25);
              return (
                <span
                  key={stableText.length + i}
                  className="bsi-fresh-char"
                  style={{ color: `hsl(${h}, ${s}%, ${l}%)` }}
                >
                  {char}
                </span>
              );
            })}
            {isStreaming && (
              <span
                className="bsi-cursor inline-block w-0.5 h-[0.9em] align-text-bottom ml-px"
                style={{ backgroundColor: '#BF5700' }}
              />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
