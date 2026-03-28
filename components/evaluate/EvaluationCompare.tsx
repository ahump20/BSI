'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EvaluationCard } from './EvaluationCard';
import { PlayerSearch, type SearchResult } from './PlayerSearch';
import { useSportData } from '@/lib/hooks/useSportData';
import type { EvaluationProfile } from '@/lib/evaluate/metrics';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EvaluationCompareProps {
  /** Pre-selected player 1 (optional) */
  initialPlayer1?: { sport: string; id: string };
  className?: string;
}

function CompareSlot({
  label,
  selectedUrl,
  onSelect,
}: {
  label: string;
  selectedUrl: string | null;
  onSelect: (result: SearchResult) => void;
}) {
  const { data, loading } = useSportData<EvaluationProfile>(selectedUrl);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[rgba(196,184,165,0.35)] mb-2">
        {label}
      </p>
      <PlayerSearch onSelect={onSelect} placeholder={`Search ${label.toLowerCase()}\u2026`} />

      <AnimatePresence mode="wait">
        {loading && selectedUrl && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex justify-center py-12"
          >
            <div className="w-8 h-8 border-3 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin" />
          </motion.div>
        )}

        {data && (
          <motion.div
            key={`${data.player.sport}-${data.player.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <EvaluationCard profile={data} compact />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EvaluationCompare({ initialPlayer1, className = '' }: EvaluationCompareProps) {
  const [player1Url, setPlayer1Url] = useState<string | null>(
    initialPlayer1
      ? `/api/evaluate/player/${initialPlayer1.sport}/${initialPlayer1.id}`
      : null
  );
  const [player2Url, setPlayer2Url] = useState<string | null>(null);

  return (
    <div className={`${className}`}>
      <div className="flex flex-col lg:flex-row gap-6">
        <CompareSlot
          label="Player 1"
          selectedUrl={player1Url}
          onSelect={(r) => setPlayer1Url(`/api/evaluate/player/${r.sport}/${r.id}`)}
        />

        {/* VS divider */}
        <div className="hidden lg:flex items-center justify-center px-2">
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-16 bg-border-subtle" />
            <span className="font-display text-lg text-[var(--bsi-primary)] font-bold">VS</span>
            <div className="w-px h-16 bg-border-subtle" />
          </div>
        </div>
        <div className="lg:hidden flex items-center justify-center py-2">
          <span className="font-display text-lg text-[var(--bsi-primary)] font-bold">VS</span>
        </div>

        <CompareSlot
          label="Player 2"
          selectedUrl={player2Url}
          onSelect={(r) => setPlayer2Url(`/api/evaluate/player/${r.sport}/${r.id}`)}
        />
      </div>
    </div>
  );
}
