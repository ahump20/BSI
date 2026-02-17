import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leadership Capital Index | Arcade | BSI',
  description: '23 intangible leadership metrics mapped to 5 academic frameworks. Quantify the It Factor.',
};

export default function LeadershipCapitalPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10">
        <h1 className="font-display text-lg text-white uppercase tracking-wide">Leadership Capital Index</h1>
        <a
          href="/games/leadership-capital/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-burnt-orange hover:underline"
        >
          Play Fullscreen
        </a>
      </div>
      <iframe
        src="/games/leadership-capital/"
        title="Leadership Capital Index"
        className="flex-1 w-full border-0"
        allow="autoplay"
      />
    </div>
  );
}
