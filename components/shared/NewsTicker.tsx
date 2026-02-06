'use client';

import { useState, useEffect, useRef } from 'react';

interface NewsItem {
  id: string;
  text: string;
  href?: string;
}

const DEFAULT_ITEMS: NewsItem[] = [
  { id: '1', text: 'College Baseball scores updated live every 30 seconds' },
  { id: '2', text: 'MLB, NFL, and NBA coverage now available' },
  { id: '3', text: 'Real-time analytics powered by official data sources' },
];

export function NewsTicker() {
  const [items] = useState<NewsItem[]>(DEFAULT_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div
      className="bg-charcoal/80 border-b border-white/5 py-1.5 px-4 text-center overflow-hidden"
      role="marquee"
      aria-live="polite"
      aria-label="News ticker"
    >
      <p className="text-xs text-white/50 truncate">
        {items[currentIndex]?.text}
      </p>
    </div>
  );
}
