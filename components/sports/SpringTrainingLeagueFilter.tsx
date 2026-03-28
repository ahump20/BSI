'use client';

type LeagueFilter = 'all' | 'Cactus' | 'Grapefruit';

interface SpringTrainingLeagueFilterProps {
  value: LeagueFilter;
  onChange: (value: LeagueFilter) => void;
}

const options: { id: LeagueFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Cactus', label: 'Cactus' },
  { id: 'Grapefruit', label: 'Grapefruit' },
];

export function SpringTrainingLeagueFilter({ value, onChange }: SpringTrainingLeagueFilterProps) {
  return (
    <div className="flex gap-1 p-1 bg-[var(--surface-press-box)] rounded-sm" role="radiogroup" aria-label="Filter by league">
      {options.map((opt) => (
        <button
          key={opt.id}
          role="radio"
          aria-checked={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
            value === opt.id
              ? 'bg-[var(--bsi-primary)] text-white'
              : 'text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
