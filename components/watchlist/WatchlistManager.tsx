/**
 * Watchlist Manager Component
 * Personalized team watchlist with localStorage persistence and alert configuration
 *
 * Features:
 * - Add/remove teams from watchlist
 * - localStorage persistence with sync across tabs
 * - Alert preference configuration
 * - Upcoming games display for watched teams
 * - WebSocket integration for real-time alerts
 * - Quiet hours configuration
 * - Multi-sport support (College Baseball, MLB, NFL, CFB, CBB)
 *
 * Integration Points:
 * - SmartAlertEngine (alert delivery)
 * - AlertBroadcaster Durable Object (WebSocket alerts)
 * - API endpoints for team data and game schedules
 *
 * User Experience:
 * - ESPN does NOT provide personalized watchlists for college baseball
 * - Real-time notifications for high-leverage situations
 * - Customizable alert preferences per user
 * - Cross-device synchronization via localStorage
 *
 * Data Sources: BlazeSportsIntel API, ESPN API (supplementary)
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import React, { useState, useEffect, useRef } from 'react';
import type { AlertPreferences, Alert } from '../../lib/types';
import { logger } from '../../lib/utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  sport: 'college_baseball' | 'mlb' | 'nfl' | 'cfb' | 'cbb';
  logo?: string;
  record?: string;
  ranking?: number;
}

interface UpcomingGame {
  gameId: string;
  date: string;
  time: string;
  opponent: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  venue: string;
  broadcast?: string;
  homeAway: 'home' | 'away';
}

interface WatchlistData {
  userId: string;
  teams: Team[];
  preferences: AlertPreferences;
  lastUpdated: string;
}

interface WatchlistManagerProps {
  userId: string;
  websocketUrl?: string;
  onAlertReceived?: (alert: Alert) => void;
}

// ============================================================================
// Default Alert Preferences
// ============================================================================

const DEFAULT_PREFERENCES: AlertPreferences = {
  userId: '',
  teams: [],
  alertTypes: {
    highLeverage: true,
    leadChange: true,
    closeGame: true,
    upsetAlert: true,
    walkOff: true,
    momentumShift: false, // Disabled by default (can be noisy)
    gameStart: true,
    gameEnd: true,
  },
  minLeverageThreshold: 1.8,
  upsetThreshold: 0.3,
  closeGameMargin: 0.1,
  quietHours: {
    start: '22:00',
    end: '07:00',
  },
  deliveryMethods: {
    push: true,
    email: false,
    sms: false,
    webSocket: true,
  },
};

// ============================================================================
// Main Component
// ============================================================================

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  userId,
  websocketUrl = 'wss://blazesportsintel.com',
  onAlertReceived,
}) => {
  // State
  const [watchlist, setWatchlist] = useState<Team[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences>({
    ...DEFAULT_PREFERENCES,
    userId,
  });
  const [upcomingGames, setUpcomingGames] = useState<Map<string, UpcomingGame[]>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Load watchlist from localStorage on mount, then sync with server
   */
  useEffect(() => {
    loadWatchlist();

    // Sync with server after initial local load
    loadFromServer();

    // Listen for storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `watchlist_${userId}`) {
        loadWatchlist();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup sync timeout on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadWatchlist and loadFromServer are stable, runs on userId change
  }, [userId]);

  /**
   * Connect to WebSocket alert service
   */
  useEffect(() => {
    if (watchlist.length === 0) {
      return; // Don't connect if no teams are watched
    }

    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connect/disconnect are stable, run on watchlist/preferences change
  }, [watchlist, preferences]);

  /**
   * Fetch upcoming games for watched teams
   */
  useEffect(() => {
    if (watchlist.length === 0) {
      return;
    }

    fetchUpcomingGames();

    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingGames, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUpcomingGames is stable, runs on watchlist change
  }, [watchlist]);

  /**
   * Search teams when query changes
   */
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchTeams(searchQuery);
    }, 300); // Debounce 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchTeams is stable, runs on query/sport change
  }, [searchQuery, selectedSport]);

  // ============================================================================
  // WebSocket Management
  // ============================================================================

  /**
   * Connect to WebSocket alert service
   */
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${websocketUrl}/ws/alerts/${userId}`);

      ws.onopen = () => {
        logger.debug({ component: 'WatchlistManager' }, 'WebSocket connected for alerts');
        setIsConnected(true);

        // Send preferences update
        ws.send(
          JSON.stringify({
            type: 'preferences',
            data: preferences,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'alert') {
            const alert: Alert = message.data;
            setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts

            // Show notification
            showNotification(alert);

            // Call callback if provided
            if (onAlertReceived) {
              onAlertReceived(alert);
            }
          }
        } catch (error) {
          logger.error(
            { component: 'WatchlistManager', error },
            'Failed to parse WebSocket message'
          );
        }
      };

      ws.onerror = (error) => {
        logger.error({ component: 'WatchlistManager', error }, 'WebSocket error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        logger.debug({ component: 'WatchlistManager' }, 'WebSocket disconnected');
        setIsConnected(false);

        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (watchlist.length > 0) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error({ component: 'WatchlistManager', error }, 'Failed to connect WebSocket');
    }
  };

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  };

  // ============================================================================
  // Data Management
  // ============================================================================

  /**
   * Load watchlist from localStorage
   */
  const loadWatchlist = () => {
    try {
      const stored = localStorage.getItem(`watchlist_${userId}`);
      if (stored) {
        const data: WatchlistData = JSON.parse(stored);
        setWatchlist(data.teams);
        setPreferences(data.preferences);
      }
    } catch (error) {
      logger.error({ component: 'WatchlistManager', error }, 'Failed to load watchlist');
    }
  };

  /**
   * Load watchlist from server (D1)
   */
  const loadFromServer = async () => {
    try {
      const response = await fetch(`/api/user/watchlist?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        logger.warn(
          { component: 'WatchlistManager' },
          'Server watchlist fetch failed, using local'
        );
        return;
      }

      const result = (await response.json()) as {
        success: boolean;
        data?: { teams?: Team[]; lastUpdated?: string };
      };
      if (!result.success || !result.data) {
        return;
      }

      const serverData = result.data;
      const localStored = localStorage.getItem(`watchlist_${userId}`);

      if (!localStored) {
        // No local data, use server data
        if (serverData.teams && serverData.teams.length > 0) {
          setWatchlist(serverData.teams);
          saveWatchlist(serverData.teams, preferences);
        }
        return;
      }

      const localData: WatchlistData = JSON.parse(localStored);
      const localTime = new Date(localData.lastUpdated).getTime();
      const serverTime = serverData.lastUpdated ? new Date(serverData.lastUpdated).getTime() : 0;

      // Use whichever is newer
      if (serverTime > localTime && serverData.teams) {
        setWatchlist(serverData.teams);
        saveWatchlist(serverData.teams, preferences);
        logger.debug({ component: 'WatchlistManager' }, 'Synced from server (server newer)');
      } else if (localData.teams.length > 0 && serverData.teams?.length === 0) {
        // Local has data, server empty - push to server
        syncToServer(localData.teams, localData.preferences);
        logger.debug({ component: 'WatchlistManager' }, 'Pushed local data to server');
      }
    } catch (error) {
      logger.error({ component: 'WatchlistManager', error }, 'Failed to load from server');
    }
  };

  /**
   * Sync watchlist to server (D1) with debounce
   */
  const syncToServer = async (teams: Team[], prefs: AlertPreferences) => {
    if (isSyncingRef.current) {
      return;
    }

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce by 2 seconds
    syncTimeoutRef.current = setTimeout(async () => {
      isSyncingRef.current = true;

      try {
        // Sync watchlist
        const watchlistResponse = await fetch(
          `/api/user/watchlist?userId=${encodeURIComponent(userId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teams }),
          }
        );

        if (!watchlistResponse.ok) {
          logger.warn({ component: 'WatchlistManager' }, 'Watchlist sync failed');
        }

        // Sync preferences
        const prefsResponse = await fetch(
          `/api/user/preferences?userId=${encodeURIComponent(userId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefs),
          }
        );

        if (!prefsResponse.ok) {
          logger.warn({ component: 'WatchlistManager' }, 'Preferences sync failed');
        }

        logger.debug({ component: 'WatchlistManager' }, 'Synced to server');
      } catch (error) {
        logger.error({ component: 'WatchlistManager', error }, 'Server sync error');
      } finally {
        isSyncingRef.current = false;
      }
    }, 2000);
  };

  /**
   * Save watchlist to localStorage and trigger server sync
   */
  const saveWatchlist = (teams: Team[], prefs: AlertPreferences) => {
    try {
      const data: WatchlistData = {
        userId,
        teams,
        preferences: prefs,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(`watchlist_${userId}`, JSON.stringify(data));

      // Trigger debounced server sync
      syncToServer(teams, prefs);
    } catch (error) {
      logger.error({ component: 'WatchlistManager', error }, 'Failed to save watchlist');
    }
  };

  /**
   * Add team to watchlist
   */
  const addTeam = (team: Team) => {
    const isAlreadyWatched = watchlist.some((t) => t.id === team.id);
    if (isAlreadyWatched) {
      return;
    }

    const newWatchlist = [...watchlist, team];
    const newPreferences = {
      ...preferences,
      teams: newWatchlist.map((t) => t.id),
    };

    setWatchlist(newWatchlist);
    setPreferences(newPreferences);
    saveWatchlist(newWatchlist, newPreferences);

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  /**
   * Remove team from watchlist
   */
  const removeTeam = (teamId: string) => {
    const newWatchlist = watchlist.filter((t) => t.id !== teamId);
    const newPreferences = {
      ...preferences,
      teams: newWatchlist.map((t) => t.id),
    };

    setWatchlist(newWatchlist);
    setPreferences(newPreferences);
    saveWatchlist(newWatchlist, newPreferences);

    // Remove upcoming games for this team
    setUpcomingGames((prev) => {
      const updated = new Map(prev);
      updated.delete(teamId);
      return updated;
    });
  };

  /**
   * Update alert preferences
   */
  const updatePreferences = (updates: Partial<AlertPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    saveWatchlist(watchlist, newPreferences);

    // Send preferences update via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'preferences',
          data: newPreferences,
        })
      );
    }

    // Also update via HTTP
    fetch(`${websocketUrl}/ws/alerts/${userId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPreferences),
    }).catch((error) => {
      logger.error(
        { component: 'WatchlistManager', error },
        'Failed to update preferences via HTTP'
      );
    });
  };

  /**
   * Search teams
   */
  const searchTeams = async (query: string) => {
    setIsSearching(true);

    try {
      const sportFilter = selectedSport !== 'all' ? `&sport=${selectedSport}` : '';
      const response = await fetch(
        `/api/teams/search?q=${encodeURIComponent(query)}${sportFilter}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: Team[] = await response.json();
      setSearchResults(results);
    } catch (error) {
      logger.error({ component: 'WatchlistManager', error }, 'Team search error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Fetch upcoming games for watched teams
   */
  const fetchUpcomingGames = async () => {
    const gamesByTeam = new Map<string, UpcomingGame[]>();

    await Promise.all(
      watchlist.map(async (team) => {
        try {
          const response = await fetch(
            `/api/college-baseball/teams/${team.id}/schedule?upcoming=true&limit=3`
          );

          if (!response.ok) {
            return;
          }

          const games: UpcomingGame[] = await response.json();
          gamesByTeam.set(team.id, games);
        } catch (error) {
          logger.error(
            { component: 'WatchlistManager', teamId: team.id, error },
            'Failed to fetch games for team'
          );
        }
      })
    );

    setUpcomingGames(gamesByTeam);
  };

  /**
   * Show browser notification
   */
  const showNotification = (alert: Alert) => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: alert.id,
        requireInteraction: alert.priority === 'high',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          showNotification(alert);
        }
      });
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  /**
   * Render watchlist
   */
  const renderWatchlist = () => {
    if (watchlist.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No Teams Watched</h3>
          <p>Search for teams to add to your watchlist and get real-time alerts</p>
        </div>
      );
    }

    return (
      <div className="watchlist-grid">
        {watchlist.map((team) => (
          <div key={team.id} className="team-card">
            <div className="team-header">
              {team.logo && <img src={team.logo} alt={team.name} className="team-logo" />}
              <div className="team-info">
                <h4>{team.name}</h4>
                <div className="team-meta">
                  <span className="conference">{team.conference}</span>
                  {team.record && <span className="record">{team.record}</span>}
                  {team.ranking && <span className="ranking">#{team.ranking}</span>}
                </div>
              </div>
              <button
                className="remove-button"
                onClick={() => removeTeam(team.id)}
                aria-label={`Remove ${team.name} from watchlist`}
              >
                ✕
              </button>
            </div>

            {/* Upcoming games */}
            {upcomingGames.has(team.id) && upcomingGames.get(team.id)!.length > 0 && (
              <div className="upcoming-games">
                <h5>Upcoming Games</h5>
                {upcomingGames.get(team.id)!.map((game) => (
                  <div key={game.gameId} className="game-item">
                    <div className="game-date">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="game-details">
                      <span className="opponent">
                        {game.homeAway === 'away' ? '@' : 'vs'} {game.opponent.abbreviation}
                      </span>
                      <span className="game-time">{game.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render search interface
   */
  const renderSearch = () => (
    <div className="search-section">
      <div className="search-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="sport-filter"
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
        >
          <option value="all">All Sports</option>
          <option value="college_baseball">College Baseball</option>
          <option value="mlb">MLB</option>
          <option value="nfl">NFL</option>
          <option value="cfb">College Football</option>
          <option value="cbb">College Basketball</option>
        </select>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((team) => (
            <div key={team.id} className="search-result-item">
              {team.logo && <img src={team.logo} alt={team.name} className="team-logo-small" />}
              <div className="team-info">
                <div className="team-name">{team.name}</div>
                <div className="team-conference">{team.conference}</div>
              </div>
              <button
                className="add-button"
                onClick={() => addTeam(team)}
                disabled={watchlist.some((t) => t.id === team.id)}
              >
                {watchlist.some((t) => t.id === team.id) ? '✓ Watching' : '+ Add'}
              </button>
            </div>
          ))}
        </div>
      )}

      {isSearching && <div className="search-loading">Searching...</div>}
    </div>
  );

  /**
   * Render alert preferences
   */
  const renderPreferences = () => (
    <div className="preferences-panel">
      <h3>Alert Preferences</h3>

      {/* Alert types */}
      <div className="preference-section">
        <h4>Alert Types</h4>
        {Object.entries(preferences.alertTypes).map(([key, value]) => (
          <label key={key} className="preference-item">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) =>
                updatePreferences({
                  alertTypes: {
                    ...preferences.alertTypes,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            <span className="preference-label">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </span>
          </label>
        ))}
      </div>

      {/* Thresholds */}
      <div className="preference-section">
        <h4>Thresholds</h4>

        <label className="preference-item">
          <span className="preference-label">
            Minimum Leverage Index: {preferences.minLeverageThreshold.toFixed(1)}
          </span>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={preferences.minLeverageThreshold}
            onChange={(e) =>
              updatePreferences({
                minLeverageThreshold: parseFloat(e.target.value),
              })
            }
          />
        </label>

        <label className="preference-item">
          <span className="preference-label">
            Upset Threshold: {(preferences.upsetThreshold * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min="0.10"
            max="0.50"
            step="0.05"
            value={preferences.upsetThreshold}
            onChange={(e) =>
              updatePreferences({
                upsetThreshold: parseFloat(e.target.value),
              })
            }
          />
        </label>
      </div>

      {/* Quiet hours */}
      <div className="preference-section">
        <h4>Quiet Hours</h4>
        <div className="quiet-hours">
          <label>
            <span>Start:</span>
            <input
              type="time"
              value={preferences.quietHours?.start || '22:00'}
              onChange={(e) =>
                updatePreferences({
                  quietHours: {
                    ...preferences.quietHours!,
                    start: e.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            <span>End:</span>
            <input
              type="time"
              value={preferences.quietHours?.end || '07:00'}
              onChange={(e) =>
                updatePreferences({
                  quietHours: {
                    ...preferences.quietHours!,
                    end: e.target.value,
                  },
                })
              }
            />
          </label>
        </div>
      </div>

      {/* Delivery methods */}
      <div className="preference-section">
        <h4>Delivery Methods</h4>
        {Object.entries(preferences.deliveryMethods).map(([key, value]) => (
          <label key={key} className="preference-item">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) =>
                updatePreferences({
                  deliveryMethods: {
                    ...preferences.deliveryMethods,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            <span className="preference-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </label>
        ))}
      </div>
    </div>
  );

  /**
   * Render recent alerts
   */
  const renderAlerts = () => {
    if (alerts.length === 0) {
      return (
        <div className="empty-alerts">
          <p>No alerts yet. Add teams to your watchlist to get notified!</p>
        </div>
      );
    }

    return (
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item priority-${alert.priority}`}>
            <div className="alert-header">
              <span className="alert-type">{alert.type.replace('_', ' ')}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                  timeZone: 'America/Chicago',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <h4 className="alert-title">{alert.title}</h4>
            <p className="alert-message">{alert.message}</p>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="watchlist-manager">
      {/* Header */}
      <div className="watchlist-header">
        <h2>My Watchlist</h2>
        <div className="header-actions">
          <button
            className={`preferences-button ${showPreferences ? 'active' : ''}`}
            onClick={() => setShowPreferences(!showPreferences)}
          >
            ⚙️ Preferences
          </button>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Search */}
      {renderSearch()}

      {/* Preferences panel */}
      {showPreferences && renderPreferences()}

      {/* Watchlist */}
      <div className="watchlist-content">
        <h3>Watched Teams ({watchlist.length})</h3>
        {renderWatchlist()}
      </div>

      {/* Recent alerts */}
      <div className="alerts-section">
        <h3>Recent Alerts ({alerts.length})</h3>
        {renderAlerts()}
      </div>

      {/* Styles */}
      <style jsx>{`
        .watchlist-manager {
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .watchlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .watchlist-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .preferences-button {
          background: rgba(255, 107, 0, 0.1);
          border: 1px solid rgba(255, 107, 0, 0.3);
          color: #ff6b00;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preferences-button:hover {
          background: rgba(255, 107, 0, 0.2);
          border-color: rgba(255, 107, 0, 0.5);
        }

        .preferences-button.active {
          background: rgba(255, 107, 0, 0.3);
          border-color: #ff6b00;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #666;
        }

        .status-dot.connected {
          background: #28a745;
          box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
        }

        .status-dot.disconnected {
          background: #dc3545;
        }

        /* Search */
        .search-section {
          margin-bottom: 24px;
        }

        .search-header {
          display: flex;
          gap: 12px;
        }

        .search-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #ff6b00;
          background: rgba(255, 255, 255, 0.08);
        }

        .sport-filter {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
          cursor: pointer;
        }

        .search-results {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .team-logo-small {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          object-fit: contain;
        }

        .add-button {
          margin-left: auto;
          background: rgba(255, 107, 0, 0.1);
          border: 1px solid rgba(255, 107, 0, 0.3);
          color: #ff6b00;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-button:hover {
          background: rgba(255, 107, 0, 0.2);
          border-color: rgba(255, 107, 0, 0.5);
        }

        .add-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Preferences panel */
        .preferences-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .preferences-panel h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
        }

        .preference-section {
          margin-bottom: 20px;
        }

        .preference-section:last-child {
          margin-bottom: 0;
        }

        .preference-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preference-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          cursor: pointer;
        }

        .preference-item input[type='checkbox'] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .preference-item input[type='range'] {
          flex: 1;
          margin-left: 12px;
        }

        .preference-label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .quiet-hours {
          display: flex;
          gap: 16px;
        }

        .quiet-hours label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .quiet-hours input[type='time'] {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 8px;
          color: #ffffff;
          font-size: 14px;
        }

        /* Watchlist */
        .watchlist-content h3,
        .alerts-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 16px 0;
        }

        .watchlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .team-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s;
        }

        .team-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .team-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .team-logo {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: contain;
        }

        .team-info {
          flex: 1;
        }

        .team-info h4 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .team-meta {
          display: flex;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .remove-button {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #dc3545;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-button:hover {
          background: rgba(220, 53, 69, 0.2);
          border-color: rgba(220, 53, 69, 0.5);
        }

        .upcoming-games {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 12px;
        }

        .upcoming-games h5 {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .game-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
          font-size: 13px;
        }

        .game-date {
          color: rgba(255, 255, 255, 0.6);
          min-width: 60px;
        }

        .game-details {
          display: flex;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
        }

        .game-time {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Alerts */
        .alerts-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid #0066cc;
          border-radius: 8px;
          padding: 12px;
        }

        .alert-item.priority-high {
          border-left-color: #dc3545;
        }

        .alert-item.priority-medium {
          border-left-color: #ffc107;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .alert-type {
          font-size: 11px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .alert-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .alert-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .alert-message {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.4;
        }

        /* Empty states */
        .empty-state,
        .empty-alerts {
          text-align: center;
          padding: 48px 24px;
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 8px 0;
        }

        .empty-state p,
        .empty-alerts p {
          font-size: 14px;
          margin: 0;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .watchlist-manager {
            padding: 16px;
          }

          .watchlist-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .search-header {
            flex-direction: column;
          }

          .watchlist-grid {
            grid-template-columns: 1fr;
          }

          .quiet-hours {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default WatchlistManager;
