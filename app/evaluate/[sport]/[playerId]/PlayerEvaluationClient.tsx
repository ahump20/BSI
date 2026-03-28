'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { EvaluationCard } from '@/components/evaluate/EvaluationCard';
import { EvaluationCompare } from '@/components/evaluate/EvaluationCompare';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { SPORT_LABELS } from '@/lib/evaluate/metrics';
import type { EvaluationProfile, EvaluationSport } from '@/lib/evaluate/metrics';

// ---------------------------------------------------------------------------
// Loading State
// ---------------------------------------------------------------------------

function EvaluationSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-surface-press-box rounded-sm w-48" />
      <div className="h-4 bg-surface-press-box rounded-sm w-32" />
      <div className="h-64 bg-surface-press-box rounded-sm" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayerEvaluationClient() {
  const params = useParams();
  const sport = params.sport as string;
  const playerId = params.playerId as string;

  // Skip fetch if this is the placeholder route
  const isPlaceholder = sport === 'placeholder' || playerId === 'placeholder';
  const { data, loading, error } = useSportData<EvaluationProfile>(
    isPlaceholder ? null : `/api/evaluate/player/${sport}/${playerId}`
  );

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-6">
              <Link href="/" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Home
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/evaluate" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Evaluate
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              {data ? (
                <span className="text-[var(--bsi-dust)]">{data.player.name}</span>
              ) : (
                <span className="text-[rgba(196,184,165,0.35)]">
                  {SPORT_LABELS[sport as EvaluationSport] || sport}
                </span>
              )}
            </nav>

            {/* Loading */}
            {loading && <EvaluationSkeleton />}

            {/* Error */}
            {error && !loading && (
              <div className="text-center py-12">
                <h2 className="font-display text-xl font-bold text-[var(--bsi-bone)] mb-2">
                  Player Not Found
                </h2>
                <p className="text-[rgba(196,184,165,0.35)] text-sm mb-4">
                  {error}
                </p>
                <Link
                  href="/evaluate"
                  className="text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors text-sm"
                >
                  Back to Evaluate
                </Link>
              </div>
            )}

            {/* Player Evaluation Card */}
            {data && (
              <div className="space-y-8">
                <EvaluationCard profile={data} />

                {/* Compare Section */}
                <div>
                  <h2 className="font-display text-lg uppercase tracking-wider text-[var(--bsi-bone)] mb-4">
                    Compare
                  </h2>
                  <EvaluationCompare
                    initialPlayer1={{ sport, id: playerId }}
                  />
                </div>
              </div>
            )}

            {/* Data Attribution */}
            {data?.meta && (
              <p className="text-[10px] text-[rgba(196,184,165,0.35)] mt-6 font-mono">
                Source: {data.meta.source} · Updated: {new Date(data.meta.fetched_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
              </p>
            )}
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
