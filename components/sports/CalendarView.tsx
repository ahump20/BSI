'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CalendarGame {
  id: string;
  date: string;
  time: string;
  homeTeam: string | { name: string; shortName?: string; score?: number | null };
  awayTeam: string | { name: string; shortName?: string; score?: number | null };
  status: string;
  score?: string;
}

function teamName(t: CalendarGame['homeTeam']): string {
  if (typeof t === 'string') return t;
  return t.shortName || t.name || '?';
}

function teamScore(t: CalendarGame['homeTeam']): number | null {
  if (typeof t === 'string') return null;
  return t.score ?? null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split('T')[0];
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface CalendarViewProps {
  initialDate?: string;
}

export function CalendarView({ initialDate }: CalendarViewProps) {
  // Use a stable build-safe default (2026-02-11) for SSR; update to real date on mount
  const [currentDate, setCurrentDate] = useState(initialDate || '2026-02-11');
  const [games, setGames] = useState<CalendarGame[]>([]);
  const [loading, setLoading] = useState(true);
  const weekDates = getWeekDates(currentDate);

  useEffect(() => {
    if (!initialDate) setCurrentDate(new Date().toISOString().split('T')[0]);
  }, [initialDate]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/college-baseball/schedule?date=${currentDate}&range=week`)
      .then((r) => r.json())
      .then((data: { data?: CalendarGame[]; games?: CalendarGame[] }) => setGames(data.data ?? data.games ?? []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [currentDate]);

  const shiftWeek = (direction: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const gamesByDate = weekDates.reduce<Record<string, CalendarGame[]>>((acc, date) => {
    acc[date] = games.filter((g) => g.date?.startsWith(date));
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shiftWeek(-1)} className="px-3 py-1.5 rounded-lg bg-charcoal text-text-secondary hover:text-text-primary transition-colors" aria-label="Previous week">&larr; Prev</button>
        <span className="text-text-primary font-medium">{formatDate(weekDates[0])} &ndash; {formatDate(weekDates[6])}</span>
        <button onClick={() => shiftWeek(1)} className="px-3 py-1.5 rounded-lg bg-charcoal text-text-secondary hover:text-text-primary transition-colors" aria-label="Next week">Next &rarr;</button>
      </div>
      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((d) => (
            <div key={d} className="animate-pulse">
              <div className="text-center text-xs text-text-tertiary mb-1">{d}</div>
              <div className="h-24 bg-charcoal rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dayGames = gamesByDate[date] || [];
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date}>
                <div className={`text-center text-xs mb-1 ${isToday ? 'text-burnt-orange font-bold' : 'text-text-tertiary'}`}>
                  {DAYS[i]}
                  <div className="text-[10px]">{formatDate(date)}</div>
                </div>
                <div className={`min-h-[6rem] rounded-lg border p-1.5 space-y-1 ${isToday ? 'border-burnt-orange/40 bg-burnt-orange/5' : 'border-border-subtle bg-charcoal/30'}`}>
                  {dayGames.length === 0 ? (
                    <p className="text-text-tertiary text-[10px] text-center mt-4">No games</p>
                  ) : (
                    dayGames.slice(0, 3).map((g) => {
                      const away = teamName(g.awayTeam);
                      const home = teamName(g.homeTeam);
                      const aScore = teamScore(g.awayTeam);
                      const hScore = teamScore(g.homeTeam);
                      const scoreStr = aScore !== null && hScore !== null ? `${aScore}-${hScore}` : g.time;
                      return (
                        <Link key={g.id} href={`/college-baseball/game/${g.id}`} className="block p-1 rounded bg-charcoal/60 hover:bg-slate/60 transition-colors">
                          <div className="text-[10px] text-text-primary truncate">{away} @ {home}</div>
                          <div className="text-[9px] text-text-tertiary">{g.score || scoreStr}</div>
                        </Link>
                      );
                    })
                  )}
                  {dayGames.length > 3 && <p className="text-[9px] text-burnt-orange text-center">+{dayGames.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
