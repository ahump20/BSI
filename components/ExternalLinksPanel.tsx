'use client';

import React from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import {
  getPlayerExternalLinksArray,
  type ExternalLink
} from '../lib/external-links/url-builders';

/**
 * BLAZE SPORTS INTEL | External Links Panel
 *
 * Displays clickable links to authoritative external sources:
 * - MLB: Baseball-Reference, Baseball Savant/Statcast, FanGraphs, ESPN
 * - NFL: Pro-Football-Reference, ESPN, NFL.com
 * - College: 247Sports, On3, Rivals, D1Baseball, Official Team Sites
 *
 * All links open in new tabs with proper rel attributes for security.
 */

interface ExternalLinksPanelProps {
  sport: 'baseball' | 'football';
  playerName: string;
  mlbamId?: number;
  espnId?: string | number;
  teamAbbrev?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

// Icon components for each source
const SourceIcons: Record<string, React.ReactNode> = {
  espn: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.75c-5.385 0-9.75-4.365-9.75-9.75S6.615 2.25 12 2.25s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
      <text x="6" y="16" fontSize="10" fontWeight="bold">E</text>
    </svg>
  ),
  bbref: (
    <span className="text-xs font-bold">BR</span>
  ),
  savant: (
    <span className="text-xs font-bold">SC</span>
  ),
  fangraphs: (
    <span className="text-xs font-bold">FG</span>
  ),
  official: (
    <ExternalLinkIcon className="w-4 h-4" />
  ),
  pfr: (
    <span className="text-xs font-bold">PFR</span>
  ),
  nfl: (
    <span className="text-xs font-bold">NFL</span>
  ),
  '247': (
    <span className="text-xs font-bold">247</span>
  ),
  on3: (
    <span className="text-xs font-bold">ON3</span>
  ),
  rivals: (
    <span className="text-xs font-bold">RIV</span>
  ),
  d1baseball: (
    <span className="text-xs font-bold">D1</span>
  ),
  pg: (
    <span className="text-xs font-bold">PG</span>
  ),
  maxpreps: (
    <span className="text-xs font-bold">MP</span>
  ),
};

// Color schemes for categories
const CategoryColors: Record<string, string> = {
  stats: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30',
  news: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30',
  recruiting: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30',
  official: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30',
};

function ExternalLinkButton({ link }: { link: ExternalLink }) {
  const colorClass = CategoryColors[link.category] || CategoryColors.stats;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5
        rounded-md border text-xs font-medium
        transition-all duration-200
        ${colorClass}
      `}
      title={`View on ${link.name}`}
    >
      {SourceIcons[link.icon] || <ExternalLinkIcon className="w-3 h-3" />}
      <span className="hidden sm:inline">{link.name}</span>
    </a>
  );
}

export default function ExternalLinksPanel({
  sport,
  playerName,
  mlbamId,
  espnId,
  teamAbbrev,
  variant = 'compact',
  className = '',
}: ExternalLinksPanelProps) {
  const links = getPlayerExternalLinksArray(sport, playerName, {
    mlbamId,
    espnId,
    teamAbbrev,
  });

  if (links.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {links.slice(0, 4).map((link) => (
          <ExternalLinkButton key={link.name} link={link} />
        ))}
        {links.length > 4 && (
          <span className="text-xs text-gray-500 self-center">
            +{links.length - 4} more
          </span>
        )}
      </div>
    );
  }

  // Full variant with categories
  const statLinks = links.filter(l => l.category === 'stats');
  const newsLinks = links.filter(l => l.category === 'news');
  const officialLinks = links.filter(l => l.category === 'official');

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        External Sources
      </h4>

      {statLinks.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Statistics</p>
          <div className="flex flex-wrap gap-2">
            {statLinks.map((link) => (
              <ExternalLinkButton key={link.name} link={link} />
            ))}
          </div>
        </div>
      )}

      {newsLinks.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">News & Analysis</p>
          <div className="flex flex-wrap gap-2">
            {newsLinks.map((link) => (
              <ExternalLinkButton key={link.name} link={link} />
            ))}
          </div>
        </div>
      )}

      {officialLinks.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Official Sites</p>
          <div className="flex flex-wrap gap-2">
            {officialLinks.map((link) => (
              <ExternalLinkButton key={link.name} link={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline version for player cards
 */
export function ExternalLinksInline({
  sport,
  playerName,
  mlbamId,
  espnId,
  className = '',
}: Omit<ExternalLinksPanelProps, 'variant' | 'teamAbbrev'>) {
  const links = getPlayerExternalLinksArray(sport, playerName, {
    mlbamId,
    espnId,
  });

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {links.slice(0, 3).map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title={link.name}
        >
          {SourceIcons[link.icon]}
        </a>
      ))}
    </div>
  );
}
