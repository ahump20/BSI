import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const knowledge: { keywords: string[]; response: string }[] = [
  {
    keywords: ['bsi', 'blaze', 'sports intel', 'platform'],
    response:
      'Blaze Sports Intel is a production-grade sports analytics platform covering MLB, NFL, NBA, NCAA football, and college baseball. It runs on 14 Cloudflare Workers, 5 D1 databases, 9 KV namespaces, and 18 R2 buckets — all built and maintained by Austin.',
  },
  {
    keywords: ['college baseball', 'flagship'],
    response:
      'College baseball is BSI\'s flagship coverage area. The platform provides real-time scores, standings, rankings, and 58+ editorial deep-dives for programs outside the usual media spotlight — covering SEC, Big 12, and Big Ten conferences.',
  },
  {
    keywords: ['cloudflare', 'worker', 'infrastructure', 'architecture', 'stack', 'tech'],
    response:
      'BSI\'s entire stack runs on Cloudflare: Pages for the frontend, Workers (Hono framework) for all backend logic, D1 for SQL, KV for caching, and R2 for storage. 14 Workers, 5 D1 databases, 9 KV namespaces, 18 R2 buckets. No AWS, no Vercel, no external databases.',
  },
  {
    keywords: ['texas', 'soil', 'origin', 'born', 'memphis'],
    response:
      'Austin was born August 17, 1995 in Memphis, Tennessee. His parents brought Texas soil from West Columbia (birthplace of the Republic of Texas) and placed it beneath his mother before he was born. The El Campo Leader-News ran the headline: "Tennessee Birth Will Be on Texas Soil."',
  },
  {
    keywords: ['education', 'degree', 'school', 'university', 'full sail', 'mccombs', 'ut'],
    response:
      'Austin holds a B.A. in International Relations from UT Austin (2014-2020), an M.S. in Entertainment Business — Sports Management from Full Sail University (graduated Feb 2026, GPA 3.56), and is currently pursuing an AI & ML Postgraduate Certificate from UT Austin McCombs.',
  },
  {
    keywords: ['ai', 'claude', 'machine learning', 'predict'],
    response:
      'BSI uses Claude AI for editorial generation and deep analysis, plus machine learning models for predictive intelligence — grounded in historical data, matchup dynamics, and contextual factors rather than hype cycles.',
  },
  {
    keywords: ['editorial', 'writing', 'article', 'content'],
    response:
      'BSI has published 58+ editorial deep-dives covering SEC, Big 12, and Big Ten college baseball programs. Conference previews, weekly recaps, and scouting analysis — all written with the same analytical depth that prestige platforms give only to the top 10 programs.',
  },
  {
    keywords: ['project', 'blazecraft', 'sandlot', 'game', 'arcade'],
    response:
      'Beyond BSI, Austin built BlazeCraft (blazecraft.app) — a Warcraft 3–style system health dashboard — and Sandlot Sluggers, a browser-based baseball game in the BSI Arcade. All deployed on Cloudflare.',
  },
  {
    keywords: ['contact', 'email', 'hire', 'reach'],
    response:
      'You can reach Austin at Austin@BlazeSportsIntel.com, on LinkedIn at linkedin.com/in/ahump20, or on X at @BlazeSportsIntel. He\'s based in San Antonio, Texas.',
  },
  {
    keywords: ['experience', 'work', 'spectrum', 'northwestern', 'job'],
    response:
      'Austin\'s career spans: Founder of BSI (2023-present), Advertising Account Executive at Spectrum Reach (2022-2025), Financial Representative at Northwestern Mutual (2020-2022) where he earned the "Power of 10" Award for top 10% nationally.',
  },
  {
    keywords: ['resume', 'cv', 'download'],
    response:
      'You can download Austin\'s resume from the contact section of this site, or directly at austinhumphrey.com/Austin_Humphrey_Resume.pdf.',
  },
];

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of knowledge) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return 'I can answer questions about Austin\'s background, Blaze Sports Intel, his projects, editorial work, tech stack, education, experience, or how to get in touch. What would you like to know?';
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hey! Ask me anything about Austin or Blaze Sports Intel.' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Message = { role: 'user', text: trimmed };
    const assistantMsg: Message = { role: 'assistant', text: getResponse(trimmed) };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-burnt-orange rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all duration-300 cursor-pointer"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <span className="text-white text-xl">{open ? '✕' : '💬'}</span>
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
            <div className="px-4 py-3 border-b border-bone/5 bg-midnight">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-burnt-orange font-medium">
                Ask About Austin
              </p>
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
                  className="flex-1 bg-midnight border border-bone/10 rounded px-3 py-2 text-sm text-bone placeholder-warm-gray/50 focus:outline-none focus:border-burnt-orange/50"
                />
                <button
                  onClick={send}
                  className="bg-burnt-orange text-white px-3 py-2 rounded text-xs font-sans uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
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
