'use client';

import { Calendar, Search, AlertCircle, Pause, WifiOff } from 'lucide-react';

type EmptyStateType = 'no-games' | 'no-results' | 'error' | 'offseason' | 'source-unavailable';

interface EmptyStateProps {
  type: EmptyStateType;
  sport?: string;
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

export function EmptyState({ type, sport: _sport, onRetry }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.Icon;

  const showRetry = onRetry && (type === 'error' || type === 'source-unavailable');

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="w-16 h-16 text-text-muted mb-4" />
      <h3 className="text-xl md:text-2xl font-semibold text-text-primary mb-2">
        {config.title}
      </h3>
      <p className="text-text-secondary text-center max-w-sm mb-6">
        {config.message}
      </p>
      {showRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-burnt-orange hover:bg-burnt-orange-700 text-white font-semibold rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
