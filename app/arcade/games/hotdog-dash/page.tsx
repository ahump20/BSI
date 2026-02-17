import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blaze Hot Dog | Arcade | BSI',
  description: 'Guide your dachshund through the stadium. Dodge obstacles, collect hot dogs.',
};

export default function HotdogDashPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10">
        <h1 className="font-display text-lg text-white uppercase tracking-wide">Blaze Hot Dog</h1>
        <a
          href="/games/hotdog-dash/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-burnt-orange hover:underline"
        >
          Play Fullscreen
        </a>
      </div>
      <iframe
        src="/games/hotdog-dash/"
        title="Blaze Hot Dog"
        className="flex-1 w-full border-0"
        allow="autoplay"
      />
    </div>
  );
}
