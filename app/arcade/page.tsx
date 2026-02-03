'use client';

import { useRouter } from 'next/navigation';
import { HeroVideo } from '@/components/hero/HeroVideo';
import Link from 'next/link';

export default function ArcadePage() {
  const router = useRouter();

  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-24 md:pt-28">
      {/* BlazeCraft Gateway Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Ambient video background */}
        <HeroVideo />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(13,13,18,0.9) 0%, rgba(13,13,18,0.5) 50%, rgba(13,13,18,0.95) 100%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span
            className="inline-block mb-4 px-3 py-1 rounded text-xs font-display uppercase tracking-widest"
            style={{ background: 'rgba(253, 185, 19, 0.15)', color: '#FDB913' }}
          >
            BlazeCraft
          </span>
          <h1 className="text-5xl md:text-7xl font-display text-white uppercase tracking-tight mb-6">
            Command Center
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Your BSI ops command center, gamified. Manage live data agents, monitor game pipelines,
            and deploy intelligence — all from a Warcraft III-inspired war room.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://blazecraft.app?source=bsi-arcade"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-10 py-4 text-lg rounded-lg"
              style={{ background: '#FDB913', color: '#0D0D12' }}
            >
              Launch BlazeCraft
            </a>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary px-10 py-4 text-lg rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Mini games hub */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide">
                Arcade Mini Games
              </h2>
              <p className="text-white/60 mt-3 max-w-2xl">
                Jump into Blaze mini games built for quick competitive sessions, optimized for any
                device.
              </p>
            </div>
            <Link
              href="/arcade/games"
              className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
              style={{ background: '#FF6B35', color: '#0D0D12' }}
            >
              View All Games
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Blaze Blitz Football',
                description: 'Arcade football with explosive drives and highlight plays.',
                href: '/arcade/games/blitz',
              },
              {
                title: 'Hotdog Dash',
                description: 'Sprint, dodge, and out-run the pack in a quick arcade dash.',
                href: '/arcade/games/hotdog-dash',
              },
              {
                title: 'Sandlot Sluggers',
                description: 'Step into the batter’s box for a quick-fire baseball showdown.',
                href: '/arcade/games/sandlot-sluggers',
              },
            ].map((game) => (
              <div
                key={game.title}
                className="glass-elevated rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-display text-white mb-2">{game.title}</h3>
                  <p className="text-white/60">{game.description}</p>
                </div>
                <Link
                  href={game.href}
                  className="mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                >
                  Enter Game
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview iframe */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-display text-white uppercase tracking-wide text-center mb-8">
            Preview
          </h2>
          <div className="glass-elevated overflow-hidden rounded-xl aspect-video">
            <iframe
              src="https://blazecraft.app?embed=true&source=bsi-arcade"
              className="w-full h-full border-0"
              loading="lazy"
              title="BlazeCraft Command Center preview"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
