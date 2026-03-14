'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AINarrationProps {
  narrationText: string | null;
  onSeekToFrame?: (frame: number) => void;
}

/**
 * Displays the initial AI-generated walkthrough of a swing analysis.
 * Renders with a typewriter-style reveal and clickable frame references.
 */
export function AINarration({ narrationText, onSeekToFrame }: AINarrationProps) {
  const [revealedLength, setRevealedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!narrationText) return;

    // Typewriter reveal — fast enough to not annoy, slow enough to feel like AI typing
    const charsPerTick = 3;
    const tickMs = 12;

    intervalRef.current = setInterval(() => {
      setRevealedLength((prev) => {
        const next = prev + charsPerTick;
        if (next >= narrationText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsComplete(true);
          return narrationText.length;
        }
        return next;
      });
    }, tickMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [narrationText]);

  const skipReveal = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRevealedLength(narrationText?.length ?? 0);
    setIsComplete(true);
  };

  if (!narrationText) return null;

  const visibleText = narrationText.slice(0, revealedLength);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-dugout border border-burnt-orange/20 p-5 relative"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 14l3-1 9-9-2-2-9 9zM11 2l2 2" />
          </svg>
        </div>
        <span className="heritage-stamp text-[10px]">AI Walkthrough</span>
        {!isComplete && (
          <button
            onClick={skipReveal}
            className="ml-auto text-[10px] text-text-muted hover:text-bsi-dust transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      <div className="text-sm text-bsi-dust leading-relaxed whitespace-pre-wrap">
        {renderWithFrameLinks(visibleText, onSeekToFrame)}
        {!isComplete && (
          <motion.span
            className="inline-block w-0.5 h-4 bg-burnt-orange ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}

/** Parse "frame XX" references and make them clickable — mirrors SwingChat.renderMessage */
function renderWithFrameLinks(
  content: string,
  onSeekToFrame?: (frame: number) => void,
): (string | React.ReactElement)[] {
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
}
