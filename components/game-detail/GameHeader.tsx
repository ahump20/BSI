'use client';

import Image from 'next/image';
import { TeamLogo } from '@/components/ui/TeamLogo';

export interface GameHeaderProps {
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    logo?: string;
    record?: string;
  };
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number;
    logo?: string;
    record?: string;
  };
  status: {
    state: 'pre' | 'in' | 'post';
    detail: string;
    shortDetail?: string;
    period?: number;
    clock?: string;
  };
  venue?: {
    name: string;
    city?: string;
    state?: string;
  };
  broadcast?: string;
  sport: string;
}

export function GameHeader({
  awayTeam,
  homeTeam,
  status,
  venue,
  broadcast,
  sport,
}: GameHeaderProps) {
  const isLive = status.state === 'in';
  const isComplete = status.state === 'post';
  const awayWinning = awayTeam.score > homeTeam.score;
  const homeWinning = homeTeam.score > awayTeam.score;

  return (
    <div className="bg-gradient-to-b from-bg-charcoal to-bg-primary border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-error/20 border border-error/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="text-xs font-semibold text-error uppercase tracking-wide">
                {status.shortDetail || status.detail}
              </span>
            </div>
          ) : isComplete ? (
            <div className="px-3 py-1.5 bg-bg-tertiary border border-border-subtle rounded-full">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Final
              </span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-bg-tertiary border border-border-subtle rounded-full">
              <span className="text-xs font-semibold text-gold uppercase tracking-wide">
                {status.detail}
              </span>
            </div>
          )}
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-6 md:gap-12">
          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 mb-3">
              {awayTeam.logo ? (
                <Image
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              ) : (
                <TeamLogo
                  abbreviation={awayTeam.abbreviation}
                  sport={sport as 'nfl' | 'nba' | 'mlb' | 'ncaaf' | 'ncaab'}
                  size="lg"
                />
              )}
            </div>
            <h2
              className={`font-display text-lg md:text-xl font-bold uppercase tracking-wide ${
                isComplete && !awayWinning ? 'text-text-tertiary' : 'text-white'
              }`}
            >
              {awayTeam.abbreviation}
            </h2>
            {awayTeam.record && (
              <p className="text-xs text-text-tertiary mt-0.5">{awayTeam.record}</p>
            )}
          </div>

          {/* Score */}
          <div className="flex items-baseline gap-3 md:gap-6">
            <span
              className={`text-5xl md:text-6xl font-display font-bold ${
                isComplete && awayWinning
                  ? 'text-white'
                  : isComplete
                    ? 'text-text-tertiary'
                    : 'text-white'
              }`}
            >
              {awayTeam.score}
            </span>
            <span className="text-2xl text-text-tertiary">-</span>
            <span
              className={`text-5xl md:text-6xl font-display font-bold ${
                isComplete && homeWinning
                  ? 'text-white'
                  : isComplete
                    ? 'text-text-tertiary'
                    : 'text-white'
              }`}
            >
              {homeTeam.score}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 mb-3">
              {homeTeam.logo ? (
                <Image
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              ) : (
                <TeamLogo
                  abbreviation={homeTeam.abbreviation}
                  sport={sport as 'nfl' | 'nba' | 'mlb' | 'ncaaf' | 'ncaab'}
                  size="lg"
                />
              )}
            </div>
            <h2
              className={`font-display text-lg md:text-xl font-bold uppercase tracking-wide ${
                isComplete && !homeWinning ? 'text-text-tertiary' : 'text-white'
              }`}
            >
              {homeTeam.abbreviation}
            </h2>
            {homeTeam.record && (
              <p className="text-xs text-text-tertiary mt-0.5">{homeTeam.record}</p>
            )}
          </div>
        </div>

        {/* Venue & Broadcast Info */}
        <div className="flex flex-wrap justify-center items-center gap-4 mt-6 text-sm text-text-tertiary">
          {venue && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>
                {venue.name}
                {venue.city ? `, ${venue.city}` : ''}
              </span>
            </div>
          )}
          {broadcast && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
              <span>{broadcast}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
