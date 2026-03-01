import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Fallback keyword responses when API is unavailable
const FALLBACK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['bsi', 'blaze', 'sports intel', 'platform'],
    response: 'Blaze Sports Intel is a production-grade sports analytics platform covering MLB, NFL, NBA, NCAA football, and college baseball. Built on 27 Cloudflare Workers with 7 D1 databases — all maintained by Austin.',
  },
  {
    keywords: ['contact', 'email', 'hire', 'reach'],
    response: 'Reach Austin at Austin@BlazeSportsIntel.com, on LinkedIn at linkedin.com/in/ahump20, or on X at @BlazeSportsIntel.',
  },
  {
    keywords: ['texas', 'soil', 'origin', 'born'],
    response: 'Austin was born August 17, 1995 in Memphis. His parents brought Texas soil from West Columbia and placed it beneath his mother before he was born. The El Campo Leader-News ran the headline: "Tennessee Birth Will Be on Texas Soil."',
  },
];

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of FALLBACK_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return 'I can answer questions about Austin, BSI, his projects, editorial work, tech stack, education, or how to get in touch. What would you like to know?';
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hey — ask me anything about Austin or Blaze Sports Intel.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send last 6 messages for context
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

      const data = await res.json() as { text: string };
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } catch {
      // Fall back to local keyword matching
      const fallback = getFallbackResponse(trimmed);
      setMessages((prev) => [...prev, { role: 'assistant', text: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-burnt-orange rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all duration-300 cursor-pointer group"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <span className="text-white text-xl group-hover:scale-110 transition-transform duration-200">
          {open ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 max-h-[28rem] bg-charcoal border border-bone/10 rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-bone/5 bg-midnight flex items-center justify-between">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-burnt-orange font-medium">
                Ask About Austin
              </p>
              <span className="font-mono text-[0.5rem] text-warm-gray/40 uppercase tracking-wider">
                AI-Powered
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-bone ml-8 text-right'
                      : 'text-warm-gray mr-8'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <span className="text-burnt-orange font-mono text-xs mr-1">{'>'}</span>
                  )}
                  {msg.text}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="text-sm text-warm-gray mr-8 flex items-center gap-1">
                  <span className="text-burnt-orange font-mono text-xs mr-1">{'>'}</span>
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-burnt-orange/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-burnt-orange/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-burnt-orange/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Ask a question..."
                  disabled={loading}
                  className="flex-1 bg-midnight border border-bone/10 rounded px-3 py-2 text-sm text-bone placeholder-warm-gray/50 focus:outline-none focus:border-burnt-orange/50 disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={loading}
                  className="bg-burnt-orange text-white px-3 py-2 rounded text-xs font-sans uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
