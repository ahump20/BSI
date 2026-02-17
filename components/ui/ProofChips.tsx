import Link from 'next/link';

interface ProofChip {
  label: string;
  href: string;
}

const CHIPS: ProofChip[] = [
  { label: 'Official Sources', href: '/models/data-quality' },
  { label: 'Timestamped', href: '/models/data-quality' },
  { label: '30-sec Refresh', href: '/models/data-quality' },
  { label: 'No Placeholders', href: '/models/data-quality' },
];

/**
 * ProofChips — inline trust signals that link to data quality methodology.
 * Designed for the homepage hero section, scannable above the fold.
 */
export function ProofChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
      {CHIPS.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/15 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-green-500/70" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
