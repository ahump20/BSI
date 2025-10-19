import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { formatNil } from './lib/formatNil.js';

const MAP_CENTER = [37.8, -96.9];
const MAP_ZOOM = 4;

const formatDate = (iso) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

function RosterPortalHeatmap() {
  const [filters, setFilters] = useState({
    timeframe: '30d',
    conference: 'all',
    position: 'all',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          timeframe: filters.timeframe,
          conference: filters.conference,
          position: filters.position,
        });
        const response = await fetch(`/api/v1/portal/activity?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to load portal activity');
        }
        const payload = await response.json();
        setData(payload);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Portal heatmap error:', err);
          setError('Unable to load portal activity. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, [filters.timeframe, filters.conference, filters.position]);

  const regionMetrics = data?.regions ?? [];

  const summary = useMemo(() => {
    const totalTransfers = regionMetrics.reduce(
      (sum, region) => sum + (region.metrics?.transferCommits ?? 0),
      0
    );
    const averageNil =
      regionMetrics.length > 0
        ? regionMetrics.reduce(
            (sum, region) => sum + (region.metrics?.nilEstimate ?? 0),
            0
          ) / regionMetrics.length
        : 0;

    return {
      totalTransfers,
      averageNil,
    };
  }, [regionMetrics]);

  const recentMoves = useMemo(() => {
    if (!data?.recentMoves) return [];
    return [...data.recentMoves]
      .sort((a, b) => new Date(b.commitDate) - new Date(a.commitDate))
      .slice(0, 6);
  }, [data]);

  const trendingPrograms = data?.trendingPrograms ?? [];

  const availableFilters = {
    timeframes: data?.filters?.availableTimeframes ?? ['30d'],
    conferences: ['all', ...(data?.filters?.availableConferences ?? [])],
    positions: ['all', ...(data?.filters?.availablePositions ?? [])],
  };

  return (
    <div className="portal-heatmap">
      <div className="heatmap-header">
        <div>
          <h2>Roster Portal Heatmap</h2>
          <p className="heatmap-subtitle">
            Transfer commitments, NIL momentum, and recruiting pull across college baseball geographies.
          </p>
        </div>
        <div className="heatmap-summary">
          <div>
            <span className="summary-label">Total commits</span>
            <span className="summary-value">{summary.totalTransfers}</span>
          </div>
          <div>
            <span className="summary-label">Avg NIL momentum</span>
            <span className="summary-value">{formatNil(summary.averageNil)}</span>
          </div>
        </div>
      </div>

      <div className="heatmap-controls">
        <label>
          <span>Timeframe</span>
          <select
            value={filters.timeframe}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, timeframe: event.target.value }))
            }
          >
            {availableFilters.timeframes.map((option) => (
              <option key={option} value={option}>
                {option === '7d'
                  ? 'Last 7 days'
                  : option === '30d'
                  ? 'Last 30 days'
                  : 'Last 90 days'}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Conference</span>
          <select
            value={filters.conference}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, conference: event.target.value }))
            }
          >
            {availableFilters.conferences.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All conferences' : option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Position</span>
          <select
            value={filters.position}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, position: event.target.value }))
            }
          >
            {availableFilters.positions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All positions' : option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Updating portal intelligence…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="heatmap-map-card">
            {isClient && (
              <MapContainer
                center={MAP_CENTER}
                zoom={MAP_ZOOM}
                className="heatmap-map"
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {regionMetrics.map((region) => {
                  const commits = region.metrics?.transferCommits ?? 0;
                  const nilEstimate = region.metrics?.nilEstimate ?? 0;
                  const recruitingIndex = region.metrics?.recruitingIndex ?? '—';
                  return (
                    <CircleMarker
                      key={region.id}
                      center={region.coordinates}
                      radius={Math.max(8, commits * 1.2)}
                      pathOptions={{
                        color: '#FBBF24',
                        fillColor: '#FBBF24',
                        fillOpacity: 0.35,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                        <div className="heatmap-tooltip">
                          <h3>{region.name}</h3>
                          <p>
                            <strong>{commits}</strong> commits · {formatNil(nilEstimate)} NIL · index {recruitingIndex}
                          </p>
                          <p className="heatmap-tooltip-programs">
                            {region.topPrograms.slice(0, 3).join(' • ')}
                          </p>
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </div>

          <div className="heatmap-grid">
            <section className="heatmap-panel">
              <header>
                <h3>Recent portal moves</h3>
                <span className="panel-meta">Sorted by commit date</span>
              </header>
              {recentMoves.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛈</div>
                  <p>No activity for this view yet.</p>
                </div>
              ) : (
                <table className="heatmap-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>From → To</th>
                      <th>Pos</th>
                      <th>NIL</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMoves.map((move) => (
                      <tr key={`${move.player}-${move.commitDate}`}>
                        <td>
                          <span className="player-name">{move.player}</span>
                          <span className="player-geo">{move.geography}</span>
                        </td>
                        <td>
                          <span className="team-from">{move.fromTeam}</span>
                          <span className="arrow">→</span>
                          <span className="team-to">{move.toTeam}</span>
                        </td>
                        <td>{move.position}</td>
                        <td>{formatNil(move.nilEstimate)}</td>
                        <td>{formatDate(move.commitDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="heatmap-panel">
              <header>
                <h3>Programs trending up</h3>
                <span className="panel-meta">Net gains + NIL delta</span>
              </header>
              {trendingPrograms.length === 0 ? (
                <div className="empty-state empty-state-compact">
                  <div className="empty-icon">📉</div>
                  <p>No programs match these filters yet.</p>
                </div>
              ) : (
                <div className="trending-grid">
                  {trendingPrograms.map((program) => (
                    <article key={program.program} className="trending-card">
                      <header>
                        <h4>{program.program}</h4>
                        <span className="badge">{program.conference}</span>
                      </header>
                      <p className="trending-geo">{program.geography}</p>
                      <div className="trending-metrics">
                        <div>
                          <span className="summary-label">Net transfers</span>
                          <span className="summary-value">{program.metrics.netTransfers}</span>
                        </div>
                        <div>
                          <span className="summary-label">NIL momentum</span>
                          <span className="summary-value">{formatNil(program.metrics.nilMomentum)}</span>
                        </div>
                      </div>
                      <footer>
                        <span className="panel-meta">
                          Priorities: {program.positionsNeed.join(', ')}
                        </span>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default RosterPortalHeatmap;
