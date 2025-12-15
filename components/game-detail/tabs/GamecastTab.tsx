'use client';

import type { GamecastTabProps } from '../GameDetailModal.types';
import { Card } from '@/components/ui/Card';
import type { BaseballGameData, FootballGameData, BasketballGameData } from '@/lib/types/adapters';

export function GamecastTab({ game, boxScore, recentPlays, loading }: GamecastTabProps) {
  const isBaseball = game.sport === 'mlb' || game.sport === 'cbb';
  const isFootball = game.sport === 'nfl' || game.sport === 'ncaaf';
  const isBasketball = ['nba', 'ncaab', 'wcbb', 'wnba'].includes(game.sport);

  return (
    <div className="p-4 space-y-4">
      {/* Live Game Situation */}
      {game.status === 'LIVE' && game.sportData && (
        <Card variant="default" className="border border-burnt-orange/30">
          <h3 className="text-sm font-semibold text-burnt-orange mb-3">Live Situation</h3>

          {isBaseball && 'inning' in game.sportData && (
            <BaseballSituation data={game.sportData as BaseballGameData} />
          )}

          {isFootball && 'quarter' in game.sportData && (
            <FootballSituation data={game.sportData as FootballGameData} />
          )}

          {isBasketball && 'period' in game.sportData && (
            <BasketballSituation data={game.sportData as BasketballGameData} />
          )}
        </Card>
      )}

      {/* Line Score */}
      {(game.status === 'LIVE' || game.status === 'FINAL') && isBaseball && game.sportData && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Line Score</h3>
          <BaseballLineScore game={game} sportData={game.sportData as BaseballGameData} />
        </Card>
      )}

      {/* Recent Plays */}
      {recentPlays.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Recent Plays</h3>
          <div className="space-y-2">
            {recentPlays.map((play) => (
              <div
                key={play.playId}
                className={`p-2 rounded text-sm ${
                  play.isScoring
                    ? 'bg-burnt-orange/10 border-l-2 border-burnt-orange'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <span>{play.gameTime}</span>
                  {play.team && (
                    <span className="font-medium text-white/70">{play.team.abbreviation}</span>
                  )}
                </div>
                <p className="text-white/90">{play.description}</p>
                {play.isScoring && (
                  <p className="text-burnt-orange text-xs mt-1">
                    Score: {play.scoreAfter.away} - {play.scoreAfter.home}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Game Leaders Preview */}
      {boxScore?.leaders && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Game Leaders</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-2">{game.awayTeam.abbreviation}</p>
              {boxScore.leaders.away.slice(0, 2).map((cat, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs text-burnt-orange">{cat.category}</p>
                  {cat.leaders[0] && (
                    <p className="text-sm text-white">
                      {cat.leaders[0].player} - {cat.leaders[0].value}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-white/50 mb-2">{game.homeTeam.abbreviation}</p>
              {boxScore.leaders.home.slice(0, 2).map((cat, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs text-burnt-orange">{cat.category}</p>
                  {cat.leaders[0] && (
                    <p className="text-sm text-white">
                      {cat.leaders[0].player} - {cat.leaders[0].value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && !boxScore && (
        <div className="space-y-3">
          <div className="skeleton w-full h-24 rounded" />
          <div className="skeleton w-full h-32 rounded" />
        </div>
      )}

      {/* Empty state for scheduled games */}
      {game.status === 'SCHEDULED' && (
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">Game has not started yet</p>
            <p className="text-white/30 text-sm mt-1">
              {new Date(game.scheduledAt).toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short',
              })}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Baseball situation component
function BaseballSituation({ data }: { data: BaseballGameData }) {
  return (
    <div className="flex items-center gap-6">
      {/* Diamond */}
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-2 border-white/30" />
        <div
          className={`absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 rotate-45 border-2 ${
            data.onThird ? 'bg-burnt-orange border-burnt-orange' : 'border-white/30'
          }`}
        />
        <div
          className={`absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3 rotate-45 border-2 ${
            data.onFirst ? 'bg-burnt-orange border-burnt-orange' : 'border-white/30'
          }`}
        />
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-2 ${
            data.onSecond ? 'bg-burnt-orange border-burnt-orange' : 'border-white/30'
          }`}
        />
      </div>

      {/* Count and Outs */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">Count:</span>
          <span className="text-white font-mono">
            {data.balls ?? 0}-{data.strikes ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">Outs:</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (data.outs ?? 0) ? 'bg-burnt-orange' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Football situation component
function FootballSituation({ data }: { data: FootballGameData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-mono text-white">Q{data.quarter}</div>
        <div className="text-lg text-white/70">{data.timeRemaining}</div>
      </div>
      {data.down !== undefined && data.distance !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-burnt-orange font-semibold">
            {data.down === 1 ? '1st' : data.down === 2 ? '2nd' : data.down === 3 ? '3rd' : '4th'}
            {' & '}
            {data.distance}
          </span>
          {data.yardLine && <span className="text-white/50">at {data.yardLine}</span>}
          {data.redZone && <span className="text-red-500 text-xs font-semibold">RED ZONE</span>}
        </div>
      )}
    </div>
  );
}

// Basketball situation component
function BasketballSituation({ data }: { data: BasketballGameData }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-2xl font-mono text-white">
        {data.period && data.period <= 4 ? `Q${data.period}` : `OT${(data.period ?? 5) - 4}`}
      </div>
      <div className="text-lg text-white/70">{data.timeRemaining}</div>
      {data.bonus && <span className="text-burnt-orange text-xs">BONUS</span>}
    </div>
  );
}

// Baseball line score component
function BaseballLineScore({
  game,
  sportData,
}: {
  game: GamecastTabProps['game'];
  sportData: BaseballGameData;
}) {
  const innings = sportData.linescore || [];
  const maxInnings = Math.max(9, innings.length);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-white/50">
            <th className="text-left py-1 pr-4 font-normal">Team</th>
            {Array.from({ length: maxInnings }, (_, i) => (
              <th key={i} className="w-6 text-center py-1 font-normal">
                {i + 1}
              </th>
            ))}
            <th className="w-8 text-center py-1 font-semibold">R</th>
            <th className="w-8 text-center py-1 font-normal">H</th>
            <th className="w-8 text-center py-1 font-normal">E</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-white">
            <td className="py-1 pr-4 font-medium">{game.awayTeam.abbreviation}</td>
            {Array.from({ length: maxInnings }, (_, i) => {
              const inningData = innings[i];
              return (
                <td key={i} className="w-6 text-center py-1 text-white/70">
                  {inningData?.away ?? (i < innings.length ? '-' : '')}
                </td>
              );
            })}
            <td className="w-8 text-center py-1 font-bold">{game.awayScore ?? '-'}</td>
            <td className="w-8 text-center py-1 text-white/70">-</td>
            <td className="w-8 text-center py-1 text-white/70">-</td>
          </tr>
          <tr className="text-white">
            <td className="py-1 pr-4 font-medium">{game.homeTeam.abbreviation}</td>
            {Array.from({ length: maxInnings }, (_, i) => {
              const inningData = innings[i];
              return (
                <td key={i} className="w-6 text-center py-1 text-white/70">
                  {inningData?.home ?? (i < innings.length ? '-' : '')}
                </td>
              );
            })}
            <td className="w-8 text-center py-1 font-bold">{game.homeScore ?? '-'}</td>
            <td className="w-8 text-center py-1 text-white/70">-</td>
            <td className="w-8 text-center py-1 text-white/70">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
