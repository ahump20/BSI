/**
 * Shared SVG sport icons — consistent shapes, flexible sizing via className.
 * Default size: w-8 h-8. Override with className="w-10 h-10" etc.
 */

interface IconProps {
  className?: string;
}

export function BaseballIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M5 12C5 12 8 9 12 9C16 9 19 12 19 12" />
      <path d="M5 12C5 12 8 15 12 15C16 15 19 12 19 12" />
    </svg>
  );
}

export function FootballIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.5}>
      <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
      <path d="M12 7L12 17M9 10L15 14M15 10L9 14" />
    </svg>
  );
}

export function BasketballIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2V22M2 12H22" />
      <path d="M4.5 4.5C8 8 8 16 4.5 19.5M19.5 4.5C16 8 16 16 19.5 19.5" />
    </svg>
  );
}

export function StadiumIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 21V10L12 3L21 10V21" />
      <path d="M3 14H21" />
      <rect x="8" y="14" width="8" height="7" />
    </svg>
  );
}

/** Map sport IDs to icon components */
export const SPORT_ICONS: Record<string, React.FC<IconProps>> = {
  'college-baseball': BaseballIcon,
  mlb: BaseballIcon,
  nfl: FootballIcon,
  nba: BasketballIcon,
  cfb: FootballIcon,
};
