import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blaze Blitz | Arcade | BSI',
  description: 'Call plays and drive downfield in this fast-paced football strategy game.',
};

export default function BlitzPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10">
        <h1 className="font-display text-lg text-white uppercase tracking-wide">Blaze Blitz</h1>
        <a
          href="/games/blitz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-burnt-orange hover:underline"
        >
          Play Fullscreen
        </a>
      </div>
      <iframe
        src="/games/blitz/"
        title="Blaze Blitz"
        className="flex-1 w-full border-0"
        allow="autoplay"
      />
    </div>
  );
}
