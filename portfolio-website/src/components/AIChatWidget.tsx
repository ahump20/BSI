import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AI_CHAT_FALLBACK_RESPONSES,
  AI_CHAT_GREETING,
  AI_CHAT_SUGGESTED_PROMPTS,
} from '../content/concierge';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

let msgId = 0;

function sanitizeAssistantText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of AI_CHAT_FALLBACK_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return 'I can help with Austin’s background, Blaze Sports Intel, the Texas soil story, the tech stack, major projects, philosophy, or the fastest way to reach him directly.';
}

function shouldUseFallbackConcierge() {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: ++msgId,
      role: 'assistant',
      text: AI_CHAT_GREETING,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasUserMessage = messages.some((m) => m.role === 'user');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    });
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const send = useCallback(
    async (overrideText?: string) => {
      const trimmed = (overrideText ?? input).trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { id: ++msgId, role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setStreamingText('');

      try {
        if (shouldUseFallbackConcierge()) {
          throw new Error('Preview fallback');
        }

        const history = [...messages, userMsg].slice(-6).map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok) throw new Error('API error');

        const contentType = res.headers.get('Content-Type') || '';

        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let completed = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const parsed = JSON.parse(line.slice(6)) as {
                  text?: string;
                  done?: boolean;
                };
                if (parsed.text) {
                  accumulated += parsed.text;
                  setStreamingText(accumulated);
                }
                if (parsed.done && !completed) {
                  completed = true;
                  const finalText = sanitizeAssistantText(
                    accumulated || "Sorry, I couldn't generate a response."
                  );
                  setMessages((prev) => [
                    ...prev,
                    { id: ++msgId, role: 'assistant', text: finalText },
                  ]);
                  setStreamingText('');
                }
              } catch {
                // Skip malformed SSE
              }
            }
          }

          if (!completed && accumulated) {
            setMessages((prev) => [
              ...prev,
              {
                id: ++msgId,
                role: 'assistant',
                text: sanitizeAssistantText(accumulated),
              },
            ]);
            setStreamingText('');
          }
        } else {
          const data = (await res.json()) as { text: string };
          setMessages((prev) => [
            ...prev,
            {
              id: ++msgId,
              role: 'assistant',
              text: sanitizeAssistantText(data.text),
            },
          ]);
        }
      } catch {
        const fallback = getFallbackResponse(trimmed);
        setMessages((prev) => [
          ...prev,
          { id: ++msgId, role: 'assistant', text: fallback },
        ]);
      } finally {
        setLoading(false);
        setStreamingText('');
      }
    },
    [input, loading, messages]
  );

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => {
          if (!open) window.posthog?.capture('chat_opened');
          setOpen(!open);
        }}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border px-3 py-2.5 backdrop-blur-md transition-all duration-300 cursor-pointer group ${
          open
            ? 'border-burnt-orange/40 bg-burnt-orange text-white shadow-lg shadow-burnt-orange/20'
            : 'border-bone/10 bg-charcoal/80 text-bone/85 hover:border-burnt-orange/30 hover:text-burnt-orange fab-idle-glow'
        }`}
        aria-label={open ? 'Close concierge' : 'Open concierge'}
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
          >
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em]">
          {open ? 'Close' : '// Austin'}
        </span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Austin concierge"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
            className="fixed z-50 flex flex-col overflow-hidden border border-bone/10 bg-charcoal shadow-[0_20px_60px_rgba(0,0,0,0.5)] chat-panel-border
              inset-x-0 bottom-0 w-full rounded-t-sm max-h-[70vh]
              sm:inset-auto sm:bottom-20 sm:right-5 sm:w-[min(24rem,calc(100vw-2.5rem))] sm:max-h-[28rem] sm:rounded-sm"
          >
            {/* Header */}
            <div className="border-b border-bone/5 bg-midnight px-4 py-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-burnt-orange font-medium">
                // Concierge
              </p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-bone/68">
                Ask about Austin, BSI, the build, the origin story, or how to
                reach him directly.
              </p>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-bone ml-8 text-right bg-bone/[0.04] rounded-sm px-3 py-2 border border-bone/5'
                      : 'text-warm-gray mr-8'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <span className="text-burnt-orange font-mono text-xs mr-1">
                      {'>'}
                    </span>
                  )}
                  {msg.text}
                </div>
              ))}

              {/* Suggested prompt chips — visible only before first user message */}
              {!hasUserMessage && !loading && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {AI_CHAT_SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => send(prompt)}
                      className="font-mono text-[0.6rem] rounded-sm border border-bone/10 px-3 py-2 text-bone/60 hover:border-burnt-orange/30 hover:text-burnt-orange hover:bg-burnt-orange/5 transition-all duration-200 cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Streaming text */}
              {streamingText && (
                <div className="text-sm leading-relaxed text-warm-gray mr-8">
                  <span className="text-burnt-orange font-mono text-xs mr-1">
                    {'>'}
                  </span>
                  {streamingText}
                  <span className="inline-block w-1 h-3.5 bg-burnt-orange/60 ml-0.5 animate-pulse" />
                </div>
              )}

              {/* Typing indicator */}
              {loading && !streamingText && (
                <div className="text-sm text-warm-gray mr-8 flex items-center gap-1">
                  <span className="text-burnt-orange font-mono text-xs mr-1">
                    {'>'}
                  </span>
                  <span className="inline-flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-burnt-orange/60 rounded-full animate-bounce bounce-delay-0"
                    />
                    <span
                      className="w-1.5 h-1.5 bg-burnt-orange/60 rounded-full animate-bounce bounce-delay-1"
                    />
                    <span
                      className="w-1.5 h-1.5 bg-burnt-orange/60 rounded-full animate-bounce bounce-delay-2"
                    />
                  </span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-bone/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ask about the work, the origin, or the contact path..."
                  aria-label="Ask a question about Austin"
                  disabled={loading}
                  className="flex-1 bg-midnight border border-bone/10 rounded-sm px-3 py-2 text-sm text-bone placeholder-warm-gray/70 focus:outline-none focus:border-burnt-orange/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={loading}
                  className="bg-burnt-orange text-white px-3 py-2 rounded-sm text-xs font-sans uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
