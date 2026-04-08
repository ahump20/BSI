import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sandlot Sluggers | Arcade | BSI',
  description: 'Time your swing to crush pitches. Streak multipliers and home run bonuses.',
  alternates: { canonical: '/arcade/games/sandlot-sluggers' },
};

const SANDLOT_GAME_PATH = '/games/sandlot-sluggers/index.html';

export default function SandlotSluggersPage() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-midnight text-text-primary">
      <div className="border-b border-border bg-background-primary/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-burnt-orange/80">Arcade</p>
            <h1 className="mt-1 font-display text-2xl uppercase tracking-wide text-text-primary">
              Sandlot Sluggers
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-tertiary">
              Fast hands, clean timing, and a little swagger. Step in, square up the barrel, and chase streak bonuses before the next pitch beats you.
            </p>
          </div>
          <a
            href={SANDLOT_GAME_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-sm border border-burnt-orange/40 bg-burnt-orange/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-burnt-orange transition-colors hover:bg-burnt-orange/15"
          >
            Play Fullscreen
          </a>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-5">
        <aside className="rounded-sm border border-border bg-background-primary/70 p-4">
          <h2 className="font-display text-sm uppercase tracking-[0.16em] text-text-primary">
            Before You Swing
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-tertiary">
            <p>Wait for the ball to enter the zone, then time your swing to stack multipliers and home run bonuses.</p>
            <p>The game plays best in fullscreen on desktop, but the wrapper now stays usable on tablets and phones with a real dynamic viewport.</p>
          </div>
          <div className="mt-5 space-y-2">
            {[
              'Square the timing window, not just the pitch.',
              'Stay in rhythm to keep the streak alive.',
              'Go fullscreen if you want the cleanest field of view.',
            ].map((tip) => (
              <div
                key={tip}
                className="rounded-sm border border-border-vintage bg-[var(--surface-dugout,#161616)]/80 px-3 py-2 text-xs leading-relaxed text-bsi-dust"
              >
                {tip}
              </div>
            ))}
          </div>
        </aside>

        <div className="overflow-hidden rounded-sm border border-border bg-black shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <iframe
            src={SANDLOT_GAME_PATH}
            title="Sandlot Sluggers"
            className="min-h-[min(78dvh,880px)] w-full border-0"
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  );
}
