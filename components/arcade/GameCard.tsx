'use client';

import Link from 'next/link';
import type { ArcadeGame } from '@/lib/data/arcade-games';

interface GameCardProps {
  game: ArcadeGame;
}

export function GameCard({ game }: GameCardProps) {
  const isLive = game.status === 'live';

  return (
    <Link
      href={game.url}
      className={`group block bg-white/5 border rounded-xl p-5 transition-all hover:bg-white/[0.08] hover:border-white/[0.1] ${
        isLive ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{game.icon}</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isLive
              ? 'bg-green-500/10 text-green-400'
              : game.status === 'beta'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-white/5 text-white/30'
          }`}
        >
          {game.status === 'coming-soon' ? 'Coming Soon' : game.status}
        </span>
      </div>

      <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-[#BF5700] transition-colors">
        {game.title}
      </h3>
      <p className="text-xs text-white/50 mb-3 line-clamp-2">{game.description}</p>

      {game.features && game.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {game.features.map((feature) => (
            <span
              key={feature}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40"
            >
              {feature}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
