import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sandlot Sluggers | Arcade | BSI',
  description: 'Time your swing to crush pitches. Streak multipliers and home run bonuses.',
};

export default function SandlotSluggersPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-background-primary border-b border-border">
        <h1 className="font-display text-lg text-text-primary uppercase tracking-wide">Sandlot Sluggers</h1>
        <a
          href="/Sandlot-Sluggers/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-burnt-orange hover:underline"
        >
          Play Fullscreen
        </a>
      </div>
      <iframe
        src="/Sandlot-Sluggers/"
        title="Sandlot Sluggers"
        className="flex-1 w-full border-0"
        allow="autoplay"
      />
    </div>
  );
}
