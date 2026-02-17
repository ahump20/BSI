'use client';

import { ARCADE_CATEGORIES, type ArcadeCategory } from '@/lib/data/arcade-games';

interface CategoryFilterProps {
  active: ArcadeCategory;
  onChange: (category: ArcadeCategory) => void;
  className?: string;
}

const LABELS: Record<ArcadeCategory, string> = {
  all: 'All Games',
  sports: 'Sports',
  strategy: 'Strategy',
  action: 'Action',
  tool: 'Tools',
};

export function CategoryFilter({ active, onChange, className = '' }: CategoryFilterProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {ARCADE_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
            active === cat
              ? 'bg-[#BF5700] text-white'
              : 'bg-white/5 text-white/40 hover:bg-white/[0.08] hover:text-white/60'
          }`}
        >
          {LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
