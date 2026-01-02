'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Search,
  BarChart3,
  X,
  Download,
  RefreshCw,
  Grid,
  List,
  Moon,
  Sun,
  AlertTriangle,
  Database,
  Wifi,
  Command,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

import {
  fetchMLBPlayers,
  fetchNFLPlayers,
  fetchCollegeBaseballPlayers,
  fetchCollegeFootballPlayers,
  type Player,
} from '../lib/sports-data/api-client';
import { exportToCSV, exportToJSON, debounce } from '../lib/sports-data/utils';
import { SPORTS_CONFIG, CHART_COLORS, VIEW_MODES, THEMES } from '../lib/sports-data/config';

// Type definitions for config values
type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];
type Theme = (typeof THEMES)[keyof typeof THEMES];

// New 2025 Features
import CommandPalette from './CommandPalette';
import { ToastProvider, useToastHelpers } from './ToastNotification';
import { useKeyboardShortcuts, DASHBOARD_SHORTCUTS } from '../lib/hooks/useKeyboardShortcuts';
import { AnimatedCard } from './ScrollAnimations';
import PlayerHeadshot from './PlayerHeadshot';
import ExternalLinksPanel, { ExternalLinksInline } from './ExternalLinksPanel';

/**
 * BLAZE SPORTS INTEL | Enterprise Command Center v11.0
 *
 * Production-grade dashboard with REAL data from Cloudflare Workers
 * - MLB data from MLB StatsAPI (free, official)
 * - NFL data from ESPN API (free)
 * - All stats cited with America/Chicago timestamps
 * - No fake AI predictions, no placeholder data
 * - Mobile-responsive, WCAG 2.1 AA compliant
 *
 * NEW IN v11.0:
 * - Command Palette (Cmd+K) with fuzzy search
 * - Global keyboard shortcuts
 * - Scroll-triggered animations
 * - Toast notifications
 * - Live data pulse indicators
 */

// Inner component that uses toast
function BlazeSportsCommandCenterInner() {
  const toast = useToastHelpers();

  // ==================== STATE ====================
  const [selectedSport, setSelectedSport] = useState<keyof typeof SPORTS_CONFIG>('baseball');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.GRID);
  const [theme, setTheme] = useState<Theme>(THEMES.DARK);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparisonPlayers, setComparisonPlayers] = useState<Player[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [dataSource, setDataSource] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ==================== KEYBOARD SHORTCUTS ====================

  useKeyboardShortcuts([
    {
      ...DASHBOARD_SHORTCUTS.COMMAND_PALETTE,
      action: () => setCommandPaletteOpen(true),
    },
    {
      ...DASHBOARD_SHORTCUTS.SEARCH,
      action: () => searchInputRef.current?.focus(),
    },
    {
      ...DASHBOARD_SHORTCUTS.REFRESH,
      action: () => loadPlayersWithToast(),
    },
    {
      ...DASHBOARD_SHORTCUTS.TOGGLE_THEME,
      action: () => setTheme((t) => (t === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)),
    },
    {
      ...DASHBOARD_SHORTCUTS.EXPORT_CSV,
      action: () => handleExportCSV(),
    },
    {
      ...DASHBOARD_SHORTCUTS.CLOSE_MODAL,
      action: () => {
        setSelectedPlayer(null);
        setShowComparison(false);
        setCommandPaletteOpen(false);
      },
    },
    {
      ...DASHBOARD_SHORTCUTS.GRID_VIEW,
      action: () => setViewMode(VIEW_MODES.GRID),
    },
    {
      ...DASHBOARD_SHORTCUTS.LIST_VIEW,
      action: () => setViewMode(VIEW_MODES.LIST),
    },
    {
      ...DASHBOARD_SHORTCUTS.GO_MLB,
      action: () => setSelectedSport('baseball'),
    },
    {
      ...DASHBOARD_SHORTCUTS.GO_NFL,
      action: () => setSelectedSport('football'),
    },
    {
      ...DASHBOARD_SHORTCUTS.GO_COLLEGE_BASEBALL,
      action: () => setSelectedSport('collegeBaseball'),
    },
    {
      ...DASHBOARD_SHORTCUTS.GO_COLLEGE_FOOTBALL,
      action: () => setSelectedSport('collegeFootball'),
    },
  ]);

  // ==================== DATA FETCHING ====================

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (selectedSport === 'baseball') {
        // Fetch 500 players for comprehensive MLB coverage
        response = await fetchMLBPlayers({ limit: 500 });

        if (response.success && response.data) {
          setPlayers(response.data);
          setDataSource(response.source);
          setLastUpdated(response.timestamp);
        } else {
          setError(response.error || 'Failed to load player data');
        }
      } else if (selectedSport === 'football') {
        response = await fetchNFLPlayers();

        if (response.success && response.data) {
          setPlayers(response.data);
          setDataSource(response.source);
          setLastUpdated(response.timestamp);
        } else {
          setError(response.error || 'Failed to load NFL player data');
        }
      } else if (selectedSport === 'collegeBaseball') {
        response = await fetchCollegeBaseballPlayers();

        if (response.success && response.data) {
          setPlayers(response.data);
          setDataSource(response.source);
          setLastUpdated(response.timestamp);
        } else {
          setError(response.error || 'Failed to load college baseball player data');
        }
      } else if (selectedSport === 'collegeFootball') {
        response = await fetchCollegeFootballPlayers();

        if (response.success && response.data) {
          setPlayers(response.data);
          setDataSource(response.source);
          setLastUpdated(response.timestamp);
        } else {
          setError(response.error || 'Failed to load college football player data');
        }
      } else {
        setError('Sport not yet supported. Coming soon!');
        setPlayers([]);
        setLoading(false);
        return;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  // Load with toast notification
  const loadPlayersWithToast = useCallback(async () => {
    const loadPromise = loadPlayers();
    await toast.promise(loadPromise, {
      loading: 'Refreshing player data...',
      success: 'Data refreshed successfully!',
      error: 'Failed to refresh data',
    });
  }, [loadPlayers, toast]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // ==================== SEARCH & FILTER ====================

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;

    const term = searchTerm.toLowerCase();
    return players.filter(
      (player) =>
        player.name.toLowerCase().includes(term) ||
        player.team.toLowerCase().includes(term) ||
        player.position.toLowerCase().includes(term)
    );
  }, [players, searchTerm]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce creates stable function, setSearchTerm is stable setter
  const debouncedSearch = useCallback(
    debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // ==================== EXPORT FUNCTIONS ====================

  const handleExportCSV = () => {
    const exportData = filteredPlayers.map((p) => ({
      Name: p.name,
      Team: p.team,
      Position: p.position,
      ...p.stats,
      Source: p.dataSource,
      Updated: p.dataStamp,
    }));
    exportToCSV(exportData, `blaze-${selectedSport}-players`);
    toast.success('Export Complete', `${filteredPlayers.length} players exported to CSV`);
  };

  const handleExportJSON = () => {
    exportToJSON(filteredPlayers, `blaze-${selectedSport}-players`);
    toast.success('Export Complete', `${filteredPlayers.length} players exported to JSON`);
  };

  // ==================== RENDER: HEADER ====================

  const renderHeader = () => (
    <div className="blaze-card blaze-card-elevated mb-6">
      <div className="gradient-stadium-lights p-6 -m-6 mb-6 rounded-t-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Flame
              className="w-12 h-12"
              style={{
                color: 'var(--color-brand-primary)',
                filter: 'drop-shadow(0 0 12px rgba(191, 87, 0, 0.8))',
              }}
            />
            <div>
              <h1
                className="text-4xl font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                BLAZE SPORTS INTEL
              </h1>
              <p
                className="text-sm mt-1 font-semibold tracking-wide"
                style={{ color: 'var(--blaze-burnt-orange-200)' }}
              >
                Real-time sports analytics • Enterprise Command Center v10.0
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadPlayers}
              className="blaze-btn blaze-btn-secondary flex items-center gap-2"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={() => setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
              className="blaze-btn blaze-btn-secondary"
              title="Toggle theme"
            >
              {theme === THEMES.DARK ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER: SPORT SELECTOR ====================

  const renderSportSelector = () => (
    <div className="flex gap-3 p-4 blaze-card overflow-x-auto">
      {Object.entries(SPORTS_CONFIG).map(([key, config]) => (
        <button
          key={key}
          onClick={() => setSelectedSport(key as keyof typeof SPORTS_CONFIG)}
          className={`blaze-btn whitespace-nowrap ${
            selectedSport === key ? 'blaze-btn-primary' : 'blaze-btn-ghost'
          }`}
          style={selectedSport === key ? { backgroundColor: 'var(--color-brand-primary)' } : {}}
        >
          <span className="mr-2">{config.icon}</span>
          {config.name}
        </button>
      ))}
    </div>
  );

  // ==================== RENDER: SEARCH & CONTROLS ====================

  const renderControls = () => (
    <div className="p-4 blaze-card">
      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 w-5 h-5"
              style={{ color: 'var(--color-brand-primary)' }}
            />
            <input
              type="text"
              placeholder="Search players, teams, positions..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg"
              style={{
                background: 'var(--color-surface-primary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--color-charcoal-50)',
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(VIEW_MODES.GRID)}
            className={`blaze-btn ${viewMode === VIEW_MODES.GRID ? 'blaze-btn-primary' : 'blaze-btn-ghost'}`}
          >
            <Grid className="w-5 h-5" />
          </button>

          <button
            onClick={() => setViewMode(VIEW_MODES.LIST)}
            className={`blaze-btn ${viewMode === VIEW_MODES.LIST ? 'blaze-btn-primary' : 'blaze-btn-ghost'}`}
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={handleExportCSV}
            className="blaze-btn blaze-btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Data Source Attribution */}
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Database className="w-4 h-4" />
        <span>
          Data source: <strong>{dataSource}</strong> • Last updated: <strong>{lastUpdated}</strong>
        </span>
        {!loading && (
          <span className="flex items-center gap-1 text-emerald-500">
            <Wifi className="w-4 h-4" />
            Live
          </span>
        )}
      </div>
    </div>
  );

  // ==================== COMPARISON MODE ====================

  const toggleComparison = (player: Player) => {
    if (comparisonPlayers.find((p) => p.id === player.id)) {
      setComparisonPlayers(comparisonPlayers.filter((p) => p.id !== player.id));
    } else if (comparisonPlayers.length < 4) {
      setComparisonPlayers([...comparisonPlayers, player]);
    }
  };

  const renderComparison = () => {
    if (comparisonPlayers.length === 0) return null;

    // Get all unique stat keys from comparison players
    const allStats = Array.from(new Set(comparisonPlayers.flatMap((p) => Object.keys(p.stats))));

    // Prepare radar chart data
    const radarData = allStats.map((stat) => {
      const dataPoint: any = { stat };
      comparisonPlayers.forEach((player) => {
        dataPoint[player.name] = player.stats[stat] || 0;
      });
      return dataPoint;
    });

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Player Comparison ({comparisonPlayers.length}/4)
            </h2>
            <button
              onClick={() => setShowComparison(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Radar Chart Comparison */}
            {comparisonPlayers.length >= 2 && (
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Skills Comparison
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis
                      dataKey="stat"
                      tick={{ fill: theme === THEMES.DARK ? '#9CA3AF' : '#4B5563', fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                    {comparisonPlayers.map((player, idx) => (
                      <Radar
                        key={player.id}
                        name={player.name}
                        dataKey={player.name}
                        stroke={Object.values(CHART_COLORS)[idx]}
                        fill={Object.values(CHART_COLORS)[idx]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stats Table */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Detailed Stats Comparison
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-3 text-gray-600 dark:text-gray-400 font-semibold">
                      Stat
                    </th>
                    {comparisonPlayers.map((player) => (
                      <th
                        key={player.id}
                        className="text-right p-3 text-gray-900 dark:text-white font-semibold"
                      >
                        {player.name}
                        <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                          {player.team}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allStats.map((stat) => (
                    <tr
                      key={stat}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <td className="p-3 font-medium text-gray-700 dark:text-gray-300">{stat}</td>
                      {comparisonPlayers.map((player) => {
                        const value = player.stats[stat];
                        const isLeader = comparisonPlayers.every(
                          (p) => (p.stats[stat] || 0) <= (value || 0)
                        );
                        return (
                          <td
                            key={player.id}
                            className={`p-3 text-right font-mono ${
                              isLeader
                                ? 'text-emerald-500 font-bold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {typeof value === 'number'
                              ? value.toFixed(value < 10 ? 3 : 0)
                              : value || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clear Comparison */}
            <button
              onClick={() => {
                setComparisonPlayers([]);
                setShowComparison(false);
              }}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              Clear Comparison
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== PLAYER DETAIL PANEL ====================

  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;

    // Prepare trend data for charts
    const statKeys = Object.keys(selectedPlayer.stats);
    const chartData = statKeys.map((key) => ({
      name: key,
      value: selectedPlayer.stats[key],
    }));

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-6">
              {/* Large Headshot */}
              <PlayerHeadshot
                src={selectedPlayer.headshotUrl}
                playerName={selectedPlayer.name}
                size="xl"
                fallback="silhouette"
                className="flex-shrink-0 ring-4 ring-gray-200 dark:ring-gray-700"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedPlayer.name}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                      {selectedPlayer.team} • {selectedPlayer.position}
                      {selectedPlayer.number && ` #${selectedPlayer.number}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* All Stats Grid */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Complete Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl"
                  >
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      {key}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {typeof value === 'number' ? value.toFixed(value < 10 ? 3 : 0) : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Stats Visualization
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: theme === THEMES.DARK ? '#9CA3AF' : '#4B5563', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: theme === THEMES.DARK ? '#9CA3AF' : '#4B5563' }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme === THEMES.DARK ? '#1F2937' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      color: theme === THEMES.DARK ? '#F3F4F6' : '#111827',
                    }}
                  />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* External Links */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              <ExternalLinksPanel
                sport={selectedPlayer.sport === 'baseball' ? 'baseball' : 'football'}
                playerName={selectedPlayer.name}
                mlbamId={selectedPlayer.mlbamId}
                teamAbbrev={selectedPlayer.team}
                variant="full"
              />
            </div>

            {/* Data Source */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Data Source</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {selectedPlayer.dataSource} • {selectedPlayer.dataStamp}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toggleComparison(selectedPlayer);
                  setSelectedPlayer(null);
                  setShowComparison(true);
                }}
                className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Add to Comparison
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER: PLAYER CARDS ====================

  const renderPlayerCard = (player: Player) => {
    const isInComparison = comparisonPlayers.find((p) => p.id === player.id);

    return (
      <div
        key={player.id}
        className={`blaze-card blaze-card-interactive ${isInComparison ? 'ring-4 ring-orange-500' : ''}`}
        onClick={() => setSelectedPlayer(player)}
      >
        {/* Card Header with Burnt Orange Gradient + Headshot */}
        <div className="gradient-burnt-orange p-4 -m-6 mb-4">
          <div className="flex items-center gap-4">
            {/* Player Headshot */}
            <PlayerHeadshot
              src={player.headshotUrl}
              playerName={player.name}
              size="lg"
              fallback="initials"
              className="flex-shrink-0 border-2 border-white/30"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white tracking-tight truncate">
                {player.name}
              </h3>
              <p className="text-white/90 text-sm mt-1">
                {player.team} • {player.position}
                {player.number && ` #${player.number}`}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleComparison(player);
              }}
              className={`blaze-btn blaze-btn-sm flex-shrink-0 ${
                isInComparison ? 'blaze-btn-primary' : 'blaze-btn-ghost'
              }`}
              title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(player.stats)
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key} className="stat-card">
                  <div className="stat-label text-xs uppercase tracking-wide">{key}</div>
                  <div
                    className="stat-value text-xl font-bold"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {typeof value === 'number' ? value.toFixed(value < 10 ? 3 : 0) : value}
                  </div>
                </div>
              ))}
          </div>

          {/* More Stats Indicator */}
          {Object.keys(player.stats).length > 6 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlayer(player);
              }}
              className="mt-4 w-full blaze-btn blaze-btn-ghost text-sm"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              View {Object.keys(player.stats).length - 6} more stats →
            </button>
          )}

          {/* Inline External Links */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <ExternalLinksInline
              sport={player.sport === 'baseball' ? 'baseball' : 'football'}
              playerName={player.name}
              mlbamId={player.mlbamId}
            />
          </div>
        </div>

        {/* Data Citation */}
        <div className="card-footer text-xs" style={{ opacity: 0.7 }}>
          Source: {player.dataSource} • {player.dataStamp}
        </div>
      </div>
    );
  };

  // ==================== RENDER: LOADING & ERROR ====================

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === THEMES.DARK ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto p-4">
          {renderHeader()}
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading real sports data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme === THEMES.DARK ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto p-4">
          {renderHeader()}
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Error Loading Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadPlayers}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className={`min-h-screen ${theme === THEMES.DARK ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {renderHeader()}
        {renderSportSelector()}
        {renderControls()}

        {/* Player Grid/List with Animations */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
          className={`p-4 ${
            viewMode === VIEW_MODES.GRID
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}
        >
          {filteredPlayers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No players found. Try adjusting your search.
              </p>
            </div>
          ) : (
            filteredPlayers.map((player, index) => (
              <AnimatedCard key={player.id} index={index} hoverScale={1.02}>
                {renderPlayerCard(player)}
              </AnimatedCard>
            ))
          )}
        </motion.div>

        {/* Results Count */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pb-8">
          Showing {filteredPlayers.length} of {players.length} players
        </div>

        {/* Comparison Badge with Animation */}
        <AnimatePresence>
          {comparisonPlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-6 right-6 z-40"
            >
              <button
                onClick={() => setShowComparison(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-4 rounded-full shadow-2xl transition flex items-center gap-3 brand-glow-pulse"
              >
                <BarChart3 className="w-6 h-6" />
                <span className="font-semibold">
                  Compare {comparisonPlayers.length} Player{comparisonPlayers.length > 1 ? 's' : ''}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 left-6 z-30"
        >
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg text-white/50 hover:text-white/70 text-sm transition-colors"
          >
            <Command className="w-4 h-4" />
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">⌘K</kbd>
            <span className="hidden sm:inline">for commands</span>
          </button>
        </motion.div>
      </div>

      {/* Modals */}
      {selectedPlayer && renderPlayerDetail()}
      {showComparison && renderComparison()}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          team: p.team,
          position: p.position,
        }))}
        onSelectPlayer={(id) => {
          const player = players.find((p) => p.id === id);
          if (player) setSelectedPlayer(player);
        }}
        onSelectSport={(sport) => setSelectedSport(sport as keyof typeof SPORTS_CONFIG)}
        onToggleTheme={() => setTheme((t) => (t === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK))}
        onExportCSV={handleExportCSV}
        onRefresh={loadPlayersWithToast}
        onToggleView={(view) => setViewMode(view === 'grid' ? VIEW_MODES.GRID : VIEW_MODES.LIST)}
      />
    </div>
  );
}

// Main export wrapped with ToastProvider
export default function BlazeSportsCommandCenter() {
  return (
    <ToastProvider>
      <BlazeSportsCommandCenterInner />
    </ToastProvider>
  );
}
