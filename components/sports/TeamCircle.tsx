'use client';

/**
 * TeamCircle — renders a team logo in a circle with abbreviation fallback.
 * Use everywhere a team badge/circle appears (scoreboards, scores lists,
 * box scores, standings, team stats, recaps).
 */

interface TeamCircleProps {
  /** Logo URL (Highlightly, ESPN, etc.) */
  logo?: string | null;
  /** Team abbreviation — shown when logo is missing or fails to load */
  abbreviation: string;
  /** Circle diameter class (Tailwind). Default: 'w-16 h-16' */
  size?: string;
  /** Abbreviation text size class. Default: 'text-xl' */
  textSize?: string;
  /** Optional ranking badge number */
  ranking?: number;
  /** Extra classes on the outer div */
  className?: string;
}

export function TeamCircle({
  logo,
  abbreviation,
  size = 'w-16 h-16',
  textSize = 'text-xl',
  ranking,
  className = '',
}: TeamCircleProps) {
  return (
    <div
      className={`${size} bg-background-secondary rounded-full flex items-center justify-center font-bold text-burnt-orange overflow-hidden relative ${className}`}
    >
      {logo ? (
        <img
          src={logo}
          alt={abbreviation}
          className="w-full h-full object-contain p-1.5"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className={`${textSize} ${logo ? 'hidden' : ''}`}>{abbreviation}</span>
      {ranking != null && ranking > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center z-10">
          {ranking}
        </span>
      )}
    </div>
  );
}
