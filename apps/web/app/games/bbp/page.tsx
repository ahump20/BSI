'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function BaseballGamePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  // Track game session start
  useEffect(() => {
    const startTime = Date.now();
    setSessionStart(startTime);

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'game_session_start', {
        game_name: 'baseball_batting',
        session_id: `bbp_${startTime}`
      });
    }

    return () => {
      // Track session end and duration
      if (sessionStart && typeof window !== 'undefined' && (window as any).gtag) {
        const duration = Math.floor((Date.now() - sessionStart) / 1000);
        (window as any).gtag('event', 'game_session_end', {
          game_name: 'baseball_batting',
          session_duration: duration
        });
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/games" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Games
          </Link>
          <h1 className="text-xl font-bold">Baseball Batting</h1>
          <Link href="/games/bbp/legal" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            Legal
          </Link>
        </div>
      </header>

      {/* Game Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="text-center">
              <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-300">Loading game...</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-5xl">
          <div className="relative bg-gray-800 rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <iframe
              src="/games/bbp-web/index.html"
              className="w-full h-full border-0"
              title="Baseball Batting Game"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onLoad={handleLoad}
            />
          </div>

          {/* Game Info */}
          <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">How to Play</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Controls</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">📱</span>
                    <span><strong>Mobile:</strong> Tap anywhere to swing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">⌨️</span>
                    <span><strong>Desktop:</strong> Press SPACE to swing</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Gameplay</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">🎯</span>
                    <span>Perfect timing = Home run!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">✅</span>
                    <span>Good timing = Base hit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">❌</span>
                    <span>Poor timing = Out or foul</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">🎮</span>
                    <span>Score more runs than the CPU in 3 innings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-3xl mb-2">⚾</div>
              <h3 className="font-semibold mb-1">Multiple Pitches</h3>
              <p className="text-sm text-gray-400">Fastball, changeup, and curveball</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-semibold mb-1">Mobile-First</h3>
              <p className="text-sm text-gray-400">Optimized for touch screens</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-semibold mb-1">100% Original</h3>
              <p className="text-sm text-gray-400">All content is original</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Blaze Sports Intel • All characters and assets are original</p>
        </div>
      </footer>
    </div>
  );
}
