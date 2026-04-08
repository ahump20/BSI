'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Config — the agent worker runs as a separate Cloudflare Worker
// ---------------------------------------------------------------------------

const AGENT_WORKER_URL = 'https://bsi-baseball-agent.humphrey-austin20.workers.dev';
const STORAGE_KEY_SESSION = 'bsi-agent-session';
const STORAGE_KEY_MESSAGES = 'bsi-agent-messages';
const MAX_FREE_MESSAGES = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: string[];
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem(STORAGE_KEY_SESSION);
  if (!id) {
    id = `session-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    sessionStorage.setItem(STORAGE_KEY_SESSION, id);
  }
  return id;
}

function getBsiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('bsi_key') ?? '';
}

function getSavedMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages.slice(-100)));
}

// ---------------------------------------------------------------------------
// Data stream parser — Vercel AI SDK protocol
// ---------------------------------------------------------------------------

function parseDataStreamLine(line: string): { type: string; value: string } | null {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;
  return { type: line.slice(0, colonIndex), value: line.slice(colonIndex + 1) };
}

// ---------------------------------------------------------------------------
// Example prompts
// ---------------------------------------------------------------------------

const EXAMPLES = [
  "Who's #1 right now?",
  'Best hitters in the SEC by wOBA',
  'How does Texas stack up against LSU?',
  'Top 5 pitchers by FIP',
  "What's the portal looking like?",
  "Today's scores",
];

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-sm ${
          isUser
            ? 'bg-bsi-primary text-white'
            : 'heritage-card'
        }`}
      >
        {!isUser && (
          <span
            className="text-[9px] uppercase tracking-[0.15em] block mb-1 text-bsi-primary font-display"
          >
            BSI Agent
          </span>
        )}
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            fontFamily: 'var(--bsi-font-body)',
            color: isUser ? '#ffffff' : 'var(--bsi-bone)',
          }}
        >
          {message.content}
        </p>
        <span
          className="text-[9px] block mt-1 opacity-50 font-mono"
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streaming indicator
// ---------------------------------------------------------------------------

function StreamingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="heritage-card px-4 py-3 max-w-[85%]">
        <span
          className="text-[9px] uppercase tracking-[0.15em] block mb-2 text-bsi-primary font-display"
        >
          BSI Agent
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-bsi-primary animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-bsi-primary animate-pulse [animation-delay:0.2s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-bsi-primary animate-pulse [animation-delay:0.4s]" />
          <span className="text-xs ml-2 text-bsi-dust">
            Analyzing...
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main chat component
// ---------------------------------------------------------------------------

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load saved messages on mount
  useEffect(() => {
    setMessages(getSavedMessages());
  }, []);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamText]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const bsiKey = typeof window !== 'undefined' ? getBsiKey() : '';
  const atLimit = !bsiKey && userMessageCount >= MAX_FREE_MESSAGES;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      if (atLimit) {
        setError(`You've used your ${MAX_FREE_MESSAGES} free messages. Upgrade to Pro for unlimited access.`);
        return;
      }

      setError('');
      setStreamText('');

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
      setInput('');
      setStreaming(true);

      abortRef.current = new AbortController();
      const sessionId = getSessionId();

      try {
        // Build message history for the agent (Vercel AI SDK format)
        const aiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(
          `${AGENT_WORKER_URL}/agents/BaseballChatAgent/${sessionId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: aiMessages,
              body: { bsiKey: bsiKey || undefined },
            }),
            signal: abortRef.current.signal,
          },
        );

        if (!res.ok) {
          const errBody = await res.text().catch(() => 'Request failed');
          throw new Error(errBody || `Error ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            const parsed = parseDataStreamLine(line);
            if (!parsed) continue;

            if (parsed.type === '0') {
              // Text delta — value is JSON-encoded string
              try {
                const text = JSON.parse(parsed.value) as string;
                accumulated += text;
                setStreamText(accumulated);
              } catch {
                // Skip malformed chunks
              }
            }
            // Type 'd' = finish, 'e' = error — handled by stream end
          }
        }

        // Finalize: add assistant message
        if (accumulated) {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: accumulated,
            timestamp: Date.now(),
          };
          const finalMessages = [...updatedMessages, assistantMsg];
          setMessages(finalMessages);
          saveMessages(finalMessages);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Something broke — try again.');
      } finally {
        setStreaming(false);
        setStreamText('');
      }
    },
    [messages, streaming, atLimit, bsiKey],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearSession = () => {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.removeItem(STORAGE_KEY_MESSAGES);
    setMessages([]);
    setStreamText('');
    setError('');
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-56px)] bg-surface-scoreboard"
    >
      {/* Header */}
      <div
        className="shrink-0 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-vintage)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0"
            style={{
              border: '1px solid var(--border-vintage)',
              borderRadius: '2px',
              background: 'rgba(191, 87, 0, 0.08)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="var(--bsi-primary)"
              strokeWidth="1.5"
            >
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h1
              className="text-sm font-bold uppercase tracking-wide font-display text-bsi-bone"
            >
              BSI Baseball Agent
            </h1>
            <p className="text-[10px] text-bsi-dust">
              College baseball intelligence, backed by live data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearSession}
              className="text-[10px] uppercase tracking-wider px-2 py-1 transition-colors"
              style={{
                border: '1px solid var(--border-vintage)',
                borderRadius: '2px',
                color: 'var(--bsi-dust)',
                fontFamily: 'var(--bsi-font-display)',
              }}
            >
              New Chat
            </button>
          )}
          {!bsiKey && (
            <span
              className="heritage-stamp"
              style={{ padding: '1px 6px', fontSize: '8px' }}
            >
              {MAX_FREE_MESSAGES - userMessageCount} / {MAX_FREE_MESSAGES}
            </span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className="w-14 h-14 flex items-center justify-center mb-4"
              style={{
                border: '1px solid var(--border-vintage)',
                borderRadius: '2px',
                background: 'rgba(191, 87, 0, 0.06)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="var(--bsi-primary)"
                strokeWidth="1.2"
              >
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2
              className="text-lg font-bold uppercase tracking-wide mb-2 font-display text-bsi-bone"
            >
              Ask Anything About College Baseball
            </h2>
            <p
              className="text-sm mb-6 max-w-md"
              style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-dust)' }}
            >
              Live scores, conference standings, national rankings, team sabermetrics,
              player comps — all from BSI&apos;s real-time data pipeline.
            </p>

            {/* Example chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {EXAMPLES.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-[11px] px-3 py-2 transition-all hover:border-bsi-primary hover:text-bsi-bone"
                  style={{
                    borderRadius: '2px',
                    border: '1px solid var(--border-vintage)',
                    background: 'transparent',
                    color: 'var(--bsi-dust)',
                    fontFamily: 'var(--bsi-font-data)',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming response */}
        {streaming && streamText && (
          <div className="flex justify-start mb-4">
            <div className="heritage-card px-4 py-3 max-w-[85%] sm:max-w-[75%]">
              <span
                className="text-[9px] uppercase tracking-[0.15em] block mb-1 text-bsi-primary font-display"
              >
                BSI Agent
              </span>
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-bone)' }}
              >
                {streamText}
                <span className="inline-block w-1.5 h-4 bg-bsi-primary/60 ml-0.5 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {streaming && !streamText && <StreamingIndicator />}

        {error && (
          <div className="flex justify-center mb-4">
            <div
              className="heritage-card px-4 py-3 max-w-md text-center"
              style={{ borderColor: 'rgba(192, 57, 43, 0.3)' }}
            >
              <p className="text-sm" style={{ color: '#c0392b' }}>
                {error}
              </p>
              {atLimit && (
                <Link href="/pricing" className="btn-heritage-fill text-xs mt-3 inline-block">
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-4 sm:px-6 py-3"
        style={{
          borderTop: '1px solid var(--border-vintage)',
          background: 'var(--surface-dugout)',
        }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scores, standings, rankings, stats..."
            disabled={streaming || atLimit}
            rows={1}
            className="flex-1 px-4 py-2.5 text-sm resize-none transition-all disabled:opacity-50 focus:outline-none"
            style={{
              borderRadius: '2px',
              border: 'none',
              borderBottom: '1px solid var(--border-vintage)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--bsi-bone)',
              fontFamily: 'var(--bsi-font-body)',
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim() || atLimit}
            className="btn-heritage-fill shrink-0 self-end disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: '0.625rem 1.25rem', minHeight: '44px' }}
          >
            {streaming ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm">Thinking</span>
              </span>
            ) : (
              <span className="text-sm">Send</span>
            )}
          </button>
        </form>
        <p
          className="text-center text-[9px] mt-2 text-bsi-dust font-mono"
        >
          Powered by BSI data pipeline &middot; Responses may take a moment during tool calls
        </p>
      </div>
    </div>
  );
}
