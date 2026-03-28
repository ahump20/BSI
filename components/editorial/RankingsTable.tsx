import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import type { RankingEntry } from './types';
import { movementClass } from './types';

interface RankingsTableProps {
  title: string;
  subtitle?: string;
  rankings: RankingEntry[];
  footnote?: string;
  movement?: string;
}

export function RankingsTable({ title, subtitle, rankings, footnote, movement }: RankingsTableProps) {
  return (
    <Section padding="lg">
      <Container>
        <ScrollReveal>
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-[var(--bsi-primary)] mb-4 border-b border-[var(--bsi-primary)]/15 pb-3">
              {title}
            </h2>
            {subtitle && (
              <p className="font-serif text-base text-[rgba(196,184,165,0.5)] mb-6">{subtitle}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-[var(--bsi-primary)] bg-[var(--surface-dugout)] px-3 py-3 text-left border-b-2 border-[var(--bsi-primary)] w-10">Rk</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-[var(--bsi-primary)] bg-[var(--surface-dugout)] px-3 py-3 text-left border-b-2 border-[var(--bsi-primary)]">Team</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-[var(--bsi-primary)] bg-[var(--surface-dugout)] px-3 py-3 text-center border-b-2 border-[var(--bsi-primary)]">Record</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-[var(--bsi-primary)] bg-[var(--surface-dugout)] px-3 py-3 text-center border-b-2 border-[var(--bsi-primary)] w-16">&Delta;</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-[var(--bsi-primary)] bg-[var(--surface-dugout)] px-3 py-3 text-left border-b-2 border-[var(--bsi-primary)] hidden sm:table-cell">Weekend</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.rank} className="hover:bg-[var(--bsi-primary)]/5 transition-colors">
                      <td className="font-display font-bold text-[var(--bsi-bone)] text-center px-3 py-2.5 border-b border-[var(--border-vintage)]">{r.rank}</td>
                      <td className="font-serif font-semibold text-[var(--bsi-bone)] px-3 py-2.5 border-b border-[var(--border-vintage)]">{r.team}</td>
                      <td className="font-mono text-xs tracking-wide text-[rgba(196,184,165,0.5)] text-center px-3 py-2.5 border-b border-[var(--border-vintage)]">{r.record}</td>
                      <td className={`font-display text-xs text-center px-3 py-2.5 border-b border-[var(--border-vintage)] ${movementClass(r.change)}`}>
                        {r.change}
                      </td>
                      <td className="font-serif italic text-[rgba(196,184,165,0.5)] text-[13px] px-3 py-2.5 border-b border-[var(--border-vintage)] hidden sm:table-cell">{r.headline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {footnote && (
              <p className="font-serif text-sm text-[rgba(196,184,165,0.5)] mt-4 leading-relaxed">{footnote}</p>
            )}
            {movement && (
              <p className="font-mono text-[10px] tracking-wider uppercase text-[rgba(196,184,165,0.35)] mt-2">{movement}</p>
            )}
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
