import { Metadata } from 'next';

interface PlayerPageProps {
  params: {
    playerId: string;
  };
}

interface PlayerBio {
  mlbam_id: number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  height?: string;
  weight?: number;
  position?: string;
  bat_side?: string;
  throw_arm?: string;
  team_name?: string;
  team_id?: number;
  headshot_url?: string;
}

interface PlayerStats {
  player_id: number;
  player_name: string;
  season: number;
  team?: string;
  games: number;
  stats: Record<string, any>;
}

interface PlayerProfile {
  bio: PlayerBio;
  season_stats?: PlayerStats;
  advanced_metrics?: Record<string, any>;
  splits?: Record<string, any>;
}

async function getPlayerProfile(playerId: string, season: number = new Date().getFullYear()): Promise<PlayerProfile | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/mlb/players/${playerId}?season=${season}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const profile = await getPlayerProfile(params.playerId);

  return {
    title: profile ? `${profile.bio.full_name} - MLB Player Profile | Blaze Sports Intel` : 'Player Profile | Blaze Sports Intel',
    description: profile ? `View comprehensive stats, advanced metrics, and Statcast data for ${profile.bio.full_name}` : 'MLB Player Profile',
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const currentSeason = new Date().getFullYear();
  const profile = await getPlayerProfile(params.playerId, currentSeason);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Player Not Found</h1>
          <p className="text-gray-400">The requested player could not be found.</p>
        </div>
      </div>
    );
  }

  const { bio, season_stats, advanced_metrics, splits } = profile;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Player Header */}
        <div className="bg-gray-900 rounded-lg p-8 mb-6">
          <div className="flex items-start gap-8">
            {/* Player Headshot */}
            <div className="w-48 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
              {bio.headshot_url ? (
                <img src={bio.headshot_url} alt={bio.full_name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-6xl text-gray-600">👤</div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{bio.full_name}</h1>
              <div className="text-xl text-orange-500 mb-4">
                {bio.position} • {bio.team_name || 'Free Agent'}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {bio.bat_side && (
                  <div>
                    <div className="text-gray-400 text-sm">Bats</div>
                    <div className="text-lg font-semibold">{bio.bat_side}</div>
                  </div>
                )}
                {bio.throw_arm && (
                  <div>
                    <div className="text-gray-400 text-sm">Throws</div>
                    <div className="text-lg font-semibold">{bio.throw_arm}</div>
                  </div>
                )}
                {bio.height && (
                  <div>
                    <div className="text-gray-400 text-sm">Height</div>
                    <div className="text-lg font-semibold">{bio.height}</div>
                  </div>
                )}
                {bio.weight && (
                  <div>
                    <div className="text-gray-400 text-sm">Weight</div>
                    <div className="text-lg font-semibold">{bio.weight} lbs</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Season Stats */}
        {season_stats && (
          <div className="bg-gray-900 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">{currentSeason} Season Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(season_stats.stats).slice(0, 12).map(([key, value]) => (
                <div key={key} className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">{key}</div>
                  <div className="text-2xl font-bold text-orange-500">
                    {typeof value === 'number' ? value.toFixed(3).replace(/^0\./, '.') : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Metrics */}
        {advanced_metrics && Object.keys(advanced_metrics).length > 0 && (
          <div className="bg-gray-900 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">Advanced Metrics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(advanced_metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">{key}</div>
                  <div className="text-2xl font-bold text-orange-500">
                    {typeof value === 'number' ? value.toFixed(3).replace(/^0\./, '.') : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Splits */}
        {splits && Object.keys(splits).length > 0 && (
          <div className="bg-gray-900 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">Splits</h2>

            <div className="space-y-4">
              {Object.entries(splits).map(([splitType, splitData]) => (
                <div key={splitType} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-orange-500">{splitType}</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                    {typeof splitData === 'object' && splitData !== null && Object.entries(splitData).slice(0, 6).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-gray-400">{key}</div>
                        <div className="font-semibold">
                          {typeof value === 'number' ? value.toFixed(3).replace(/^0\./, '.') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">More Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href={`/baseball/mlb/players/${params.playerId}/statcast`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Statcast Data
            </a>
            <a href={`/baseball/mlb/players/${params.playerId}/splits`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Detailed Splits
            </a>
            <a href={`/baseball/mlb/players/${params.playerId}/gamelog`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Game Log
            </a>
            <a href={`/baseball/mlb/players/${params.playerId}/scouting`}
               className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
              Scouting Report
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
