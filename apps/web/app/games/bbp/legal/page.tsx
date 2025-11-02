import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal & Asset Credits | Baseball Game | Blaze Sports Intel',
  description: 'Legal compliance and asset attribution for the Baseball Batting game.',
  robots: { index: true, follow: true }
};

export default function GameLegalPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/games/bbp" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Game
          </Link>
          <h1 className="text-4xl font-bold mb-2">Legal & Asset Credits</h1>
          <p className="text-gray-400">Baseball Batting Game - Original Content Declaration</p>
        </div>

        {/* IP Compliance */}
        <section className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">Intellectual Property Compliance</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              This game is an <strong className="text-white">original creation</strong> by Blaze Sports Intel.
              It does <strong className="text-white">NOT</strong> use, reference, or replicate any content from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Backyard Baseball or any Humongous Entertainment properties</li>
              <li>Any MLB, NCAA, or professional baseball organization trademarks</li>
              <li>Licensed baseball video games (MLB The Show, R.B.I. Baseball, etc.)</li>
              <li>Real player names, likenesses, or statistics</li>
              <li>Copyrighted music, fonts, or distinctive character designs</li>
            </ul>
            <div className="bg-blue-900/30 border border-blue-700 rounded p-4 mt-4">
              <p className="text-blue-200">
                <strong>Legal Guarantee:</strong> All game mechanics, visual assets, code, and audio are either:
                (a) created in-house by Blaze Sports Intel, or (b) generated using AI tools with appropriate commercial licenses.
              </p>
            </div>
          </div>
        </section>

        {/* Asset Attribution */}
        <section className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Asset Attribution</h2>

          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Visual Assets</h3>
              <p className="mb-2">Current version uses geometric shapes and simple graphics:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Player sprites: Simple colored rectangles (original)</li>
                <li>Ball: Circle primitive (original)</li>
                <li>Field: Gradient backgrounds and shapes (original)</li>
                <li>UI elements: System fonts and CSS styling (original)</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                Future updates may include AI-generated sprites. See{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">docs/ai-assets/prompts-and-guidelines.md</code>{' '}
                for asset generation guidelines.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Audio Assets</h3>
              <p>Current version has <strong>no audio</strong> (placeholder system only).</p>
              <p className="text-sm text-gray-400 mt-2">
                Future sound effects will be either (a) original recordings, or (b) royalty-free with proper attribution.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Game Engine</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Phaser 3:</strong> Open-source game framework (MIT License)</li>
                <li><strong>Vite:</strong> Build tool (MIT License)</li>
                <li><strong>TypeScript:</strong> Programming language (Apache 2.0 License)</li>
              </ul>
              <p className="text-sm text-gray-400 mt-2">
                See{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">apps/games/phaser-bbp-web/package.json</code>{' '}
                for complete dependency list.
              </p>
            </div>
          </div>
        </section>

        {/* License Info */}
        <section className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Game License</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">License:</strong> UNLICENSED - Proprietary to Blaze Sports Intel
            </p>
            <p>
              <strong className="text-white">Usage Rights:</strong> This game is provided free-of-charge for personal,
              non-commercial use. Redistribution, modification, or commercial use is prohibited without express
              written permission from Blaze Sports Intel.
            </p>
            <p className="text-sm text-gray-400">
              For licensing inquiries, contact: legal@blazesportsintel.com (placeholder)
            </p>
          </div>
        </section>

        {/* Asset Addition Process */}
        <section className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Asset Addition Process</h2>
          <div className="space-y-4 text-gray-300">
            <p>When adding new assets to this game, developers must:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Verify asset provenance (original creation or properly licensed)</li>
              <li>Document source and license in <code className="bg-gray-700 px-2 py-1 rounded">assets/LICENSES.md</code></li>
              <li>Run CI blocklist check to ensure no disallowed IP terms</li>
              <li>Update this legal page with new attributions</li>
              <li>Obtain review from legal team (if applicable)</li>
            </ol>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded p-4 mt-4">
              <p className="text-yellow-200">
                <strong>Important:</strong> Never use real-person likenesses, trademarked logos, or content from
                existing baseball games without explicit permission and proper licensing.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Privacy & Data Collection</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              This game collects <strong className="text-white">minimal analytics</strong> to improve user experience:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Session start time</li>
              <li>Session duration</li>
              <li>Game completion (win/loss/quit)</li>
            </ul>
            <p>
              We <strong className="text-white">do NOT collect</strong>: personal information, scores, or detailed gameplay data.
            </p>
            <p className="text-sm text-gray-400">
              Analytics respect Do-Not-Track browser settings. See our main{' '}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</Link>.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Questions or Concerns?</h2>
          <p className="text-gray-300 mb-4">
            If you believe any content in this game infringes on intellectual property rights,
            or if you have questions about our legal compliance:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dmca"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
            >
              File DMCA Notice
            </Link>
            <Link
              href="/about"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors text-center"
            >
              Contact Us
            </Link>
          </div>
        </section>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link href="/games" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Games
          </Link>
        </div>
      </div>
    </div>
  );
}
