type SportKey = 'mlb' | 'nfl' | 'nba' | 'ncaa' | 'cfb';

interface SportIconProps {
  sport: SportKey;
  className?: string;
}

function BaseballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M6.3 3.8c1.5 2.3 2.2 5 2.2 8.2s-.7 5.9-2.2 8.2" />
      <path d="M17.7 3.8c-1.5 2.3-2.2 5-2.2 8.2s.7 5.9 2.2 8.2" />
    </svg>
  );
}

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
      <path d="M7.5 7.5l9 9M9 6.5l1.5 1.5M6.5 9l1.5 1.5M14.5 17.5L13 16M17.5 14.5L16 13" />
    </svg>
  );
}

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
      <path d="M5.2 5.2c2 2.5 3.1 5.7 3 9.1-.1 2.9-1 5.5-2.6 7.5" />
      <path d="M18.8 5.2c-2 2.5-3.1 5.7-3 9.1.1 2.9 1 5.5 2.6 7.5" />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M12 3L1 9l11 6 9-4.91V17" />
      <path d="M5 13.18v4L12 21l7-3.82v-4" />
    </svg>
  );
}

const ICONS: Record<SportKey, (props: { className?: string }) => JSX.Element> = {
  mlb: BaseballIcon,
  nfl: FootballIcon,
  nba: BasketballIcon,
  ncaa: GraduationCapIcon,
  cfb: FootballIcon,
};

export function SportIcon({ sport, className = 'w-6 h-6' }: SportIconProps) {
  const Icon = ICONS[sport];
  return <Icon className={className} />;
}
