'use client';

import { useState, useEffect } from 'react';
import { getRelativeTime } from '@/lib/utils/timezone';

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
  /** Update interval in ms. Defaults to 30000 (30s). */
  updateInterval?: number;
}

export function RelativeTime({ date, className, updateInterval = 30000 }: RelativeTimeProps) {
  const [display, setDisplay] = useState(() => getRelativeTime(date));

  useEffect(() => {
    setDisplay(getRelativeTime(date));
    const interval = setInterval(() => setDisplay(getRelativeTime(date)), updateInterval);
    return () => clearInterval(interval);
  }, [date, updateInterval]);

  return (
    <time
      dateTime={typeof date === 'string' ? date : date.toISOString()}
      className={className}
    >
      {display}
    </time>
  );
}
