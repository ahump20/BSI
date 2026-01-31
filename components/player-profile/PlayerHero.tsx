'use client';

import Image from 'next/image';

export interface PlayerHeroProps {
  player: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    position: string;
    number: string;
    team: {
      name: string;
      abbreviation: string;
      logo?: string;
      primaryColor?: string;
    };
    status?: 'active' | 'injured' | 'rookie' | 'veteran';
    headshot?: string;
  };
  seasonStats?: {
    label: string;
    value: string | number;
  }[];
  onFollow?: () => void;
  isFollowing?: boolean;
}

export function PlayerHero({ player, seasonStats, onFollow, isFollowing }: PlayerHeroProps) {
  const teamColor = player.team.primaryColor || '#BF5700';

  return (
    <header
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}80 50%, #003840 100%)`,
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 40%),
                             radial-gradient(circle at 70% 30%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-end">
          {/* Player Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-bg-tertiary to-bg-secondary border-2 border-white/15 shadow-2xl overflow-hidden">
              {player.headshot ? (
                <Image
                  src={player.headshot}
                  alt={player.name}
                  width={208}
                  height={208}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                  <svg
                    className="w-20 h-20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            {/* Status Badge */}
            {player.status && player.status !== 'active' && (
              <div
                className={`absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  player.status === 'rookie'
                    ? 'bg-gold text-bg-primary'
                    : player.status === 'injured'
                      ? 'bg-error text-white'
                      : player.status === 'veteran'
                        ? 'bg-burnt-orange text-white'
                        : 'bg-success text-white'
                }`}
              >
                {player.status}
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                {player.team.name}
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              {player.name}
            </h1>

            <p className="text-xl text-white/90 mb-2">
              {player.position} &middot; #{player.number}
            </p>

            {/* Quick Stats */}
            {seasonStats && seasonStats.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                {seasonStats.slice(0, 4).map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-colors"
                  >
                    <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/70 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onFollow}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                isFollowing ? 'bg-success text-white' : 'bg-white/90 text-bg-primary hover:bg-white'
              }`}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isFollowing ? <polyline points="20 6 9 17 4 12" /> : <path d="M12 5v14M5 12h14" />}
              </svg>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
              </svg>
              Compare
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
