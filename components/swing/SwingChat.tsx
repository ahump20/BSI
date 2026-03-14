'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/lib/swing/chat-context';
import { canAskQuestion, FREE_QUESTIONS_PER_SWING } from '@/lib/swing/usage-gate';

interface SwingChatProps {
  swingId: string;
  systemPrompt: string;
  onSeekToFrame?: (frame: number) => void;
  disabled?: boolean;
  isPro?: boolean;
}

export function SwingChat({ swingId, systemPrompt, onSeekToFrame, disabled, isPro = false }: SwingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const SUGGESTED_QUESTIONS = [
    'What are the biggest issues with my swing?',
    'How can I improve my hip-shoulder separation?',
    'Where should I focus first for the most improvement?',
    'What drills would help fix my contact point?',
    'Compare my load position to an ideal swing',
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const isGated = !canAskQuestion(isPro, questionCount);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || disabled || isGated) return;

      const userMessage: ChatMessage = { role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setQuestionCount((prev) => prev + 1);

      try {
        const response = await fetch('/api/swing/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            swingId,
            systemPrompt,
            messages: [...messages, userMessage],
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = (await response.json()) as { reply: string };
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I had trouble analyzing that. Please try again.' },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [swingId, systemPrompt, messages, isLoading, disabled, isGated],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /** Parse frame references in AI responses and make them clickable */
  const renderMessage = (content: string) => {
    const frameRegex = /frame\s+(\d+)/gi;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = frameRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      const frameNum = parseInt(match[1]);
      parts.push(
        <button
          key={match.index}
          onClick={() => onSeekToFrame?.(frameNum)}
          className="text-heritage-columbia-blue hover:underline font-mono text-[11px]"
        >
          frame {frameNum}
        </button>,
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="flex flex-col rounded-sm bg-surface-dugout border border-border-subtle overflow-hidden h-[70vh] sm:h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-surface-press-box">
        <div className="w-8 h-8 rounded-sm bg-burnt-orange/15 flex items-center justify-center">
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 14l3-1 9-9-2-2-9 9zM11 2l2 2" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-bsi-bone">Swing Coach AI</h3>
          <p className="text-[10px] text-text-muted">Ask about your swing mechanics</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted text-center mb-4">
              Ask me anything about your swing. I can reference specific frames and measurements.
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={disabled}
                  className="block w-full text-left px-3 py-2 rounded-sm bg-white/[0.03] border border-border-subtle text-xs text-bsi-dust hover:bg-white/[0.06] hover:border-burnt-orange/20 transition-all disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-sm px-3 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-burnt-orange/15 text-bsi-bone'
                    : 'bg-white/[0.04] text-bsi-dust border border-border-subtle'
                }`}
              >
                {msg.role === 'assistant' ? renderMessage(msg.content) : msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/[0.04] border border-border-subtle rounded-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-burnt-orange"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Free-tier question limit overlay */}
      {isGated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-3 bg-burnt-orange/10 border-t border-burnt-orange/20"
        >
          <p className="text-xs text-bsi-bone font-semibold mb-1">
            {FREE_QUESTIONS_PER_SWING} free questions used
          </p>
          <p className="text-[10px] text-bsi-dust mb-2">
            Upgrade to BSI Pro for unlimited coaching conversations.
          </p>
          <a
            href="/pricing"
            className="inline-block text-[10px] font-mono uppercase tracking-wider text-burnt-orange hover:text-ember transition-colors"
          >
            Upgrade to Pro →
          </a>
        </motion.div>
      )}

      {/* Input */}
      <div className="border-t border-border-subtle p-3 bg-surface-press-box">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGated ? 'Upgrade to Pro for unlimited questions' : disabled ? 'Upgrade to ask follow-up questions' : 'Ask about your swing...'}
            disabled={disabled || isLoading || isGated}
            rows={1}
            className="flex-1 resize-none rounded-sm bg-surface-dugout border border-border-subtle px-3 py-2 text-sm text-bsi-bone placeholder-text-muted focus:outline-none focus:border-burnt-orange/40 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || disabled || isGated}
            className="w-8 h-8 rounded-sm bg-burnt-orange flex items-center justify-center text-white disabled:opacity-30 transition-opacity shrink-0"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 14l12-6L2 2v5l8 1-8 1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
