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
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange mb-4 border-b border-burnt-orange/15 pb-3">
              {title}
            </h2>
            {subtitle && (
              <p className="font-serif text-base text-text-tertiary mb-6">{subtitle}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange w-10">Rk</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange">Team</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-center border-b-2 border-burnt-orange">Record</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-center border-b-2 border-burnt-orange w-16">&Delta;</th>
                    <th className="font-display text-[11px] tracking-[0.15em] uppercase text-burnt-orange bg-charcoal px-3 py-3 text-left border-b-2 border-burnt-orange hidden sm:table-cell">Weekend</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.rank} className="hover:bg-burnt-orange/5 transition-colors">
                      <td className="font-display font-bold text-text-primary text-center px-3 py-2.5 border-b border-border-subtle">{r.rank}</td>
                      <td className="font-serif font-semibold text-text-primary px-3 py-2.5 border-b border-border-subtle">{r.team}</td>
                      <td className="font-mono text-xs tracking-wide text-text-tertiary text-center px-3 py-2.5 border-b border-border-subtle">{r.record}</td>
                      <td className={`font-display text-xs text-center px-3 py-2.5 border-b border-border-subtle ${movementClass(r.change)}`}>
                        {r.change}
                      </td>
                      <td className="font-serif italic text-text-tertiary text-[13px] px-3 py-2.5 border-b border-border-subtle hidden sm:table-cell">{r.headline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {footnote && (
              <p className="font-serif text-sm text-text-tertiary mt-4 leading-relaxed">{footnote}</p>
            )}
            {movement && (
              <p className="font-mono text-[10px] tracking-wider uppercase text-text-muted mt-2">{movement}</p>
            )}
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
