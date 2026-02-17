import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sandlot Sluggers | Arcade | BSI',
  description: 'Time your swing to crush pitches. Streak multipliers and home run bonuses.',
};

export default function SandlotSluggersPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10">
        <h1 className="font-display text-lg text-white uppercase tracking-wide">Sandlot Sluggers</h1>
        <a
          href="/games/sandlot-sluggers/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-burnt-orange hover:underline"
        >
          Play Fullscreen
        </a>
      </div>
      <iframe
        src="/games/sandlot-sluggers/"
        title="Sandlot Sluggers"
        className="flex-1 w-full border-0"
        allow="autoplay"
      />
    </div>
  );
}
