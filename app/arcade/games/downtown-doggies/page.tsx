import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Downtown Doggies | Arcade | BSI',
  description: '3-point contest. 5 racks, 25 shots. Hit the green zone to drain threes.',
};

export default function DowntownDoggiesPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10">
        <h1 className="font-display text-lg text-white uppercase tracking-wide">Downtown Doggies</h1>
        <a
          href="/games/downtown-doggies/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-burnt-orange hover:underline"
        >
          Play Fullscreen
        </a>
      </div>
      <iframe
        src="/games/downtown-doggies/"
        title="Downtown Doggies"
        className="flex-1 w-full border-0"
        allow="autoplay"
      />
    </div>
  );
}
