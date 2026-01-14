/**
 * PlayByPlayFeed Component
 * Display NFL play-by-play data with EPA/WPA metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import type { NFLPlay, PlayByPlayResponse } from '@/lib/types/nfl-playbyplay';

export interface PlayByPlayFeedProps {
  gameId: string;
}

export function PlayByPlayFeed({ gameId }: PlayByPlayFeedProps) {
  const [data, setData] = useState<PlayByPlayResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/nfl/playbyplay?gameId=${gameId}`);
        const json = await response.json();
        setData(json.playByPlay);
      } catch (error) {
        console.error('Failed to fetch play-by-play data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  if (loading) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-text-secondary">Loading play-by-play...</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-text-secondary">No play-by-play data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card variant="default" padding="lg">
        <h3 className="text-xl font-display font-bold text-white mb-4">
          {data.awayTeam} @ {data.homeTeam}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-text-tertiary text-sm">Total Plays</p>
            <p className="text-2xl font-bold text-white">{data.summary.totalPlays}</p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm">Total Yards</p>
            <p className="text-2xl font-bold text-white">{data.summary.totalYards}</p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm">Avg EPA</p>
            <p className="text-2xl font-bold text-burnt-orange">
              {data.summary.averageEPA.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm">Avg WPA</p>
            <p className="text-2xl font-bold text-burnt-orange">
              {data.summary.averageWPA.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {data.plays.map((play) => (
          <PlayItem key={play.playId} play={play} />
        ))}
      </div>
    </div>
  );
}

function PlayItem({ play }: { play: NFLPlay }) {
  const epaColor = play.epa > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Card variant="default" padding="md" className="hover:border-burnt-orange/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-text-tertiary text-sm">
              Q{play.quarter} • {play.time}
            </span>
            <span className="text-text-tertiary text-sm">
              {play.down} & {play.distance}
            </span>
            <span className="text-burnt-orange text-sm font-semibold uppercase">
              {play.playType}
            </span>
          </div>

          <p className="text-white text-sm mb-2">{play.description}</p>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-semibold ${epaColor}`}>
              EPA: {play.epa > 0 ? '+' : ''}
              {play.epa.toFixed(2)}
            </span>
            <span className="text-sm text-text-secondary">
              WPA: {play.wpa > 0 ? '+' : ''}
              {play.wpa.toFixed(2)}
            </span>
            {play.playType === 'pass' && (
              <span className="text-sm text-text-secondary">
                CPOE: {play.cpoe > 0 ? '+' : ''}
                {play.cpoe.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-white">
            {play.yardsGained > 0 ? '+' : ''}
            {play.yardsGained}
          </div>
          <div className="text-xs text-text-tertiary">yards</div>
        </div>
      </div>
    </Card>
  );
}
