'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'bsi_onboarding_complete';
const FAVORITES_KEY = 'bsi_favorites';

const SPORTS = [
  { id: 'college-baseball', label: 'College Baseball', href: '/college-baseball' },
  { id: 'mlb', label: 'MLB', href: '/mlb' },
  { id: 'nfl', label: 'NFL', href: '/nfl' },
  { id: 'nba', label: 'NBA', href: '/nba' },
  { id: 'cfb', label: 'College Football', href: '/cfb' },
];

interface Favorites {
  sports: string[];
}

/**
 * First-visit onboarding overlay.
 * Renders only when localStorage lacks bsi_onboarding_complete.
 * Step 1: Pick sports you follow.
 * Step 2: Confirmation + redirect.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  const toggleSport = useCallback((id: string) => {
    setSelectedSports((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }, []);

  const handleFinish = useCallback(() => {
    const favorites: Favorites = { sports: selectedSports };
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);

    // Navigate to the first selected sport, or scores
    if (selectedSports.length > 0) {
      const first = SPORTS.find((s) => s.id === selectedSports[0]);
      if (first) {
        router.push(first.href);
        return;
      }
    }
    router.push('/college-baseball/scores');
  }, [selectedSports, router]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-midnight/95 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-charcoal border border-border-subtle rounded-2xl p-8 relative"
        >
          {/* Step indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-burnt-orange' : 'bg-border-subtle'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-2">
                What sports do you follow?
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Pick your sports and we&apos;ll personalize your experience.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {SPORTS.map((sport) => {
                  const active = selectedSports.includes(sport.id);
                  return (
                    <button
                      key={sport.id}
                      onClick={() => toggleSport(sport.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-burnt-orange bg-burnt-orange/15 text-white'
                          : 'border-border-subtle bg-midnight/50 text-text-secondary hover:border-burnt-orange/30'
                      }`}
                    >
                      <span className="font-semibold text-sm">{sport.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handleSkip}
                  className="text-text-tertiary text-sm hover:text-text-secondary transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedSports.length === 0}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-burnt-orange text-white hover:bg-burnt-orange/90"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-2">
                You&apos;re set!
              </h2>
              <p className="text-text-secondary text-sm mb-4">
                We&apos;ll surface{' '}
                {selectedSports
                  .map((id) => SPORTS.find((s) => s.id === id)?.label)
                  .filter(Boolean)
                  .join(', ')}{' '}
                content for you.
              </p>
              <p className="text-text-tertiary text-xs mb-8">
                You can change this anytime from your dashboard.
              </p>

              <button
                onClick={handleFinish}
                className="w-full px-6 py-3 rounded-lg font-semibold text-sm bg-burnt-orange text-white hover:bg-burnt-orange/90 transition-all"
              >
                Let&apos;s Go
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
