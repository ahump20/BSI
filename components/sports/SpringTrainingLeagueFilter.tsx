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
    <div className="flex gap-1 p-1 bg-white/5 rounded-lg" role="radiogroup" aria-label="Filter by league">
      {options.map((opt) => (
        <button
          key={opt.id}
          role="radio"
          aria-checked={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === opt.id
              ? 'bg-burnt-orange text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
