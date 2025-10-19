import type { FC } from 'react';

interface InningTabDescriptor {
  inning: number;
  half: 'Top' | 'Bottom';
  targetId: string;
  isCurrent?: boolean;
}

interface InningTabsProps {
  innings: InningTabDescriptor[];
}

export const InningTabs: FC<InningTabsProps> = ({ innings }) => (
  <nav aria-label="Inning navigation" className="w-full overflow-x-auto">
    <ul
      className="flex min-w-full items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2"
      role="tablist"
    >
      {innings.map((inning) => (
          <li key={`${inning.inning}-${inning.half}`} className="shrink-0">
            <a
              aria-controls={inning.targetId}
              aria-selected={inning.isCurrent ?? false}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                inning.isCurrent
                  ? 'bg-amber-500/20 text-amber-200 shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-amber-100'
              }`}
              href={`#${inning.targetId}`}
              role="tab"
              tabIndex={inning.isCurrent ? 0 : -1}
            >
              <span className="text-xs uppercase tracking-wide text-amber-300/80">{inning.half}</span>
              <span className="text-base leading-none text-slate-100">{inning.inning}</span>
            </a>
          </li>
      ))}
    </ul>
  </nav>
);
