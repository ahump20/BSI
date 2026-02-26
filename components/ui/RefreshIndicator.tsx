'use client';

import { useState, useEffect, useRef } from 'react';

interface RefreshIndicatorProps {
  /** Whether auto-refresh is currently active */
  active: boolean;
  /** Refresh interval in seconds */
  intervalSeconds?: number;
  className?: string;
}

export function RefreshIndicator({
  active,
  intervalSeconds = 30,
  className = '',
}: RefreshIndicatorProps) {
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setSecondsLeft(intervalSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setSecondsLeft(intervalSeconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return intervalSeconds;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, intervalSeconds]);

  if (!active) return null;

  const progress = ((intervalSeconds - secondsLeft) / intervalSeconds) * 100;

  return (
    <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
      </span>
      <span>Live &middot; refreshing in {secondsLeft}s</span>
      <div className="w-12 h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-green-400/50 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
