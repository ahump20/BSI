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
  const [items, setItems] = useState<NewsItem[]>(DEFAULT_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/news/ticker`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error('Ticker fetch failed');
        return r.json();
      })
      .then((data: { items?: NewsItem[] }) => {
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      })
      .catch(() => {
        // Keep defaults on failure
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[currentIndex];

  return (
    <div
      className="bg-charcoal/80 border-b border-white/5 py-1.5 px-4 text-center overflow-hidden"
      aria-live="polite"
      aria-label="News ticker"
    >
      {current?.href ? (
        <a href={current.href} className="text-xs text-white/50 hover:text-white/70 truncate block transition-colors">
          {current.text}
        </a>
      ) : (
        <p className="text-xs text-white/50 truncate">
          {current?.text}
        </p>
      )}
    </div>
  );
}
