'use client';

import Link from 'next/link';
import { Calendar, Search, AlertCircle, Pause, WifiOff } from 'lucide-react';

type EmptyStateType = 'no-games' | 'no-results' | 'error' | 'offseason' | 'source-unavailable';

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  type: EmptyStateType;
  sport?: string;
  /** Override the default subtitle message */
  message?: string;
  /** Optional link to guide users somewhere useful */
  action?: EmptyStateAction;
  onRetry?: () => void;
}

const emptyStateConfig = {
  'no-games': {
    Icon: Calendar,
    title: 'No Games Found',
    message: 'There are no games scheduled for this time period.',
  },
  'no-results': {
    Icon: Search,
    title: 'No Results',
    message: 'Your search did not return any results. Try adjusting your filters.',
  },
  error: {
    Icon: AlertCircle,
    title: 'Something Went Wrong',
    message: 'An error occurred while loading data. Please try again.',
  },
  offseason: {
    Icon: Pause,
    title: 'Offseason',
    message: 'The season is currently in its offseason period.',
  },
  'source-unavailable': {
    Icon: WifiOff,
    title: 'Data Source Unavailable',
    message: "Our data provider isn't responding right now. Scores will appear when the connection is restored.",
  },
};

export function EmptyState({ type, sport: _sport, message, action, onRetry }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.Icon;

  const showRetry = onRetry && (type === 'error' || type === 'source-unavailable');

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="w-16 h-16 mb-4" style={{ color: 'var(--bsi-dust, #C4B8A5)' }} />
      <h3
        className="text-xl md:text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone, #F5F2EB)' }}
      >
        {config.title}
      </h3>
      <p
        className="text-center max-w-sm mb-6 italic"
        style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-dust, #C4B8A5)' }}
      >
        {message || config.message}
      </p>
      {showRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-burnt-orange hover:bg-burnt-orange-700 text-white font-semibold rounded-sm transition-colors"
        >
          Try Again
        </button>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-2 text-burnt-orange hover:text-ember text-sm font-semibold transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
