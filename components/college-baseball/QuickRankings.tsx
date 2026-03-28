'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import type { RankedTeam } from '@/lib/utils/rankings';

interface QuickRankingsProps {
  rankings: RankedTeam[];
  loading: boolean;
}

/**
 * QuickRankings — compact inline Top 10 strip.
 * Receives rankings data from parent (no independent fetch).
 */
export function QuickRankings({ rankings, loading }: QuickRankingsProps) {
  const top10 = rankings.slice(0, 10);

  if (loading && top10.length === 0) {
    return (
      <Section padding="sm" className="py-4">
        <Container>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[var(--bsi-bone)] uppercase tracking-wide">
              Top 10
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-12 bg-[var(--surface-press-box)] border border-border rounded-sm animate-pulse" />
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (top10.length === 0) return null;

  return (
    <Section padding="sm" className="py-4">
      <Container>
        <ScrollReveal>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[var(--bsi-bone)] uppercase tracking-wide">
              Top 10
            </h2>
            <Link
              href="/college-baseball?tab=rankings"
              className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
            >
              Full Rankings →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {top10.map((entry) => {
              const meta = entry.slug ? teamMetadata[entry.slug] : null;
              const inner = (
                <div className="flex items-center gap-2.5 bg-[var(--surface-press-box)] border border-border rounded-sm px-3 py-2.5 hover:border-[var(--bsi-primary)]/30 transition-all group">
                  <span className="text-[var(--bsi-primary)] font-mono text-xs font-bold w-5 text-right shrink-0">
                    {entry.rank}
                  </span>
                  {meta ? (
                    <img
                      src={getLogoUrl(meta.espnId, meta.logoId)}
                      alt={`${entry.team} logo`}
                      className="w-5 h-5 object-contain shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-[var(--bsi-primary)]/15 rounded-full shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--bsi-bone)] truncate group-hover:text-[var(--bsi-primary)] transition-colors">
                      {meta?.shortName || entry.team}
                    </div>
                    {entry.record && (
                      <div className="text-[10px] text-[rgba(196,184,165,0.35)]">{entry.record}</div>
                    )}
                  </div>
                </div>
              );

              return entry.slug ? (
                <Link key={entry.rank} href={`/college-baseball/teams/${entry.slug}`}>
                  {inner}
                </Link>
              ) : (
                <div key={entry.rank}>{inner}</div>
              );
            })}
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
