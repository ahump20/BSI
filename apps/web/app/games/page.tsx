import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Games | Blaze Sports Intel',
  description: 'Play original baseball games and sports simulations. All games are mobile-friendly and feature original content.',
  robots: { index: true, follow: true }
};

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Blaze Games
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Original, mobile-friendly sports games featuring unique mechanics and competitive gameplay
          </p>
        </div>

        {/* Game Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Baseball Game Card */}
          <Link
            href="/games/bbp"
            className="group block bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 border border-gray-700 hover:border-blue-500"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center relative overflow-hidden">
              {/* Baseball icon */}
              <div className="text-8xl">⚾</div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white">Baseball Batting</h2>
                <p className="text-sm text-blue-200">Original Arcade Game</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Test your timing and reflexes in this fast-paced batting game. Face different pitch types and aim for home runs!
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900/50 rounded-full text-xs text-blue-200 border border-blue-700">
                  Touch-Friendly
                </span>
                <span className="px-3 py-1 bg-green-900/50 rounded-full text-xs text-green-200 border border-green-700">
                  Quick Play
                </span>
                <span className="px-3 py-1 bg-purple-900/50 rounded-full text-xs text-purple-200 border border-purple-700">
                  Original
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">3 innings • Single player</span>
                <div className="bg-blue-600 group-hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  Play Now
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 opacity-60">
            <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center relative">
              <div className="text-8xl">🏈</div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white">Football</h2>
                <p className="text-sm text-gray-300">Coming Soon</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-400 mb-4">
                Strategic football gameplay with play calling and real-time decisions.
              </p>
              <div className="bg-gray-700 text-gray-400 px-4 py-2 rounded-lg text-center">
                In Development
              </div>
            </div>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 opacity-60">
            <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center relative">
              <div className="text-8xl">🏀</div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white">Basketball</h2>
                <p className="text-sm text-gray-300">Coming Soon</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-400 mb-4">
                Fast-paced basketball action with shooting mechanics and team management.
              </p>
              <div className="bg-gray-700 text-gray-400 px-4 py-2 rounded-lg text-center">
                In Development
              </div>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-16 max-w-4xl mx-auto text-center">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">100% Original Content</h3>
            <p className="text-sm text-gray-300">
              All games, characters, and assets are original creations by Blaze Sports Intel.
              No third-party IP is used. See our <Link href="/games/bbp/legal" className="text-blue-400 hover:text-blue-300 underline">legal compliance page</Link> for details.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Blaze Sports Intel
          </Link>
        </div>
      </div>
    </div>
  );
}
