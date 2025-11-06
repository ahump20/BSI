import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB Analytics Platform | Blaze Sports Intel',
  description: 'Comprehensive MLB statistics, advanced metrics, Statcast data, and player analysis powered by cutting-edge analytics',
};

export default function MLBLandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-black py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
              MLB Analytics Platform
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Professional-grade baseball analytics powered by MLB Stats API, FanGraphs, and Statcast
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <a href="/baseball/mlb/dashboard"
               className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Live Dashboard</h3>
              <p className="text-gray-400 text-sm">Real-time scores and stats updated daily</p>
            </a>

            <a href="/baseball/mlb/players"
               className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold mb-2">Player Profiles</h3>
              <p className="text-gray-400 text-sm">Comprehensive stats and advanced metrics</p>
            </a>

            <a href="/baseball/mlb/leaderboards"
               className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">Leaderboards</h3>
              <p className="text-gray-400 text-sm">League leaders in all major categories</p>
            </a>

            <a href="/baseball/mlb/standings"
               className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2">Standings</h3>
              <p className="text-gray-400 text-sm">Current division and league standings</p>
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Advanced Features
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1: Advanced Metrics */}
            <div className="bg-gray-900 rounded-lg p-8">
              <div className="text-orange-500 text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4">Advanced Metrics</h3>
              <ul className="space-y-3 text-gray-400">
                <li>• wOBA (Weighted On-Base Average)</li>
                <li>• wRC+ (Weighted Runs Created Plus)</li>
                <li>• WAR (Wins Above Replacement)</li>
                <li>• FIP (Fielding Independent Pitching)</li>
                <li>• xwOBA (Expected wOBA)</li>
              </ul>
            </div>

            {/* Feature 2: Statcast Data */}
            <div className="bg-gray-900 rounded-lg p-8">
              <div className="text-orange-500 text-5xl mb-4">⚾</div>
              <h3 className="text-2xl font-bold mb-4">Statcast Deep Dives</h3>
              <ul className="space-y-3 text-gray-400">
                <li>• Exit velocity tracking</li>
                <li>• Launch angle analysis</li>
                <li>• Barrel rate and hard-hit rate</li>
                <li>• Pitch movement and spin rate</li>
                <li>• Sprint speed and fielding metrics</li>
              </ul>
            </div>

            {/* Feature 3: Player Analysis */}
            <div className="bg-gray-900 rounded-lg p-8">
              <div className="text-orange-500 text-5xl mb-4">📉</div>
              <h3 className="text-2xl font-bold mb-4">Player Analysis</h3>
              <ul className="space-y-3 text-gray-400">
                <li>• Detailed split statistics</li>
                <li>• Performance vs. RHP/LHP</li>
                <li>• Home/away splits</li>
                <li>• Situational hitting/pitching</li>
                <li>• Historical comparisons</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="py-20 px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Powered By Industry-Leading Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-gray-950 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">MLB Stats API</h3>
              <p className="text-gray-400">
                Official MLB statistics and real-time game data directly from Major League Baseball
              </p>
            </div>

            <div className="bg-gray-950 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">FanGraphs</h3>
              <p className="text-gray-400">
                Advanced sabermetrics and comprehensive player statistics trusted by analysts worldwide
              </p>
            </div>

            <div className="bg-gray-950 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">Statcast</h3>
              <p className="text-gray-400">
                MLB's revolutionary tracking technology providing unprecedented insights into player performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-20 px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built For Everyone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">Fantasy Baseball</h3>
              <p className="text-gray-400 mb-4">
                Make informed roster decisions with advanced metrics and Statcast data. Identify breakout candidates
                before your league mates.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>✓ Daily updated statistics</li>
                <li>✓ Advanced projections</li>
                <li>✓ Matchup analysis</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">Professional Scouts</h3>
              <p className="text-gray-400 mb-4">
                Access comprehensive player profiles with Statcast data, splits, and advanced metrics to inform
                scouting decisions.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>✓ Detailed scouting reports</li>
                <li>✓ Performance trends</li>
                <li>✓ Comparative analysis</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">Sports Betting</h3>
              <p className="text-gray-400 mb-4">
                Leverage advanced analytics and real-time data to make more informed betting decisions with
                data-driven insights.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>✓ Live game tracking</li>
                <li>✓ Pitcher vs. batter matchups</li>
                <li>✓ Situational statistics</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-orange-500">Baseball Fans</h3>
              <p className="text-gray-400 mb-4">
                Deepen your understanding of the game with professional-grade analytics. Follow your favorite
                players and teams like never before.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>✓ Easy-to-understand visualizations</li>
                <li>✓ Historical comparisons</li>
                <li>✓ Player profiles and bios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-8 bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Start Exploring MLB Analytics
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Access professional-grade baseball analytics and insights right now
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/baseball/mlb/players"
               className="px-8 py-4 bg-white text-orange-900 font-bold rounded-lg hover:bg-gray-100 transition">
              Search Players
            </a>
            <a href="/baseball/mlb/dashboard"
               className="px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition">
              View Live Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
