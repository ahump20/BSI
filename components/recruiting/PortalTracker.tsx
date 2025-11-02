/**
 * Transfer Portal Intelligence Tracker
 * Track college baseball player movements with NIL valuations
 *
 * Features:
 * - Real-time portal activity feed
 * - NIL valuation estimates for transfers
 * - School-to-school movement analysis
 * - Position demand visualization
 * - Conference strength impact
 * - Interactive filters and search
 *
 * Integration Points:
 * - NILCalculator for valuations
 * - API endpoint /api/recruiting/portal-activity
 * - WebSocket for real-time updates
 * - D3.js for Portal Heatmap (separate component)
 *
 * Data Sources: 247Sports, On3, Perfect Game, D1Baseball
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NILCalculator, type PlayerMetrics, type NILValuation } from '../../lib/analytics/baseball/nil-calculator';

// ============================================================================
// Type Definitions
// ============================================================================

interface PortalEntry {
  id: string;
  playerName: string;
  position: string;
  previousSchool: string;
  previousConference: string;
  newSchool?: string;
  newConference?: string;
  status: 'entered' | 'committed' | 'withdrawn';
  entryDate: string;
  commitDate?: string;
  metrics: PlayerMetrics;
  nilValuation?: NILValuation;
  graduateTransfer: boolean;
  yearsRemaining: number;
}

interface PortalStats {
  totalEntries: number;
  totalCommitments: number;
  averageNILValue: number;
  topPosition: string;
  topConference: string;
  medianDaysToCommit: number;
}

interface ConferenceFlow {
  from: string;
  to: string;
  count: number;
  avgNILDelta: number;
}

// ============================================================================
// Portal Tracker Component
// ============================================================================

export function PortalTracker() {
  // State
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<PortalEntry[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [conferenceFlows, setConferenceFlows] = useState<ConferenceFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [conferenceFilter, setConferenceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minNILValue, setMinNILValue] = useState<number>(0);
  const [graduateOnly, setGraduateOnly] = useState(false);

  // UI State
  const [selectedEntry, setSelectedEntry] = useState<PortalEntry | null>(null);
  const [showNILDetails, setShowNILDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'nil' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  useEffect(() => {
    fetchPortalData();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchPortalData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/recruiting/portal-activity');
      if (!response.ok) throw new Error('Failed to fetch portal data');

      const data = await response.json();
      setEntries(data.entries);
      setStats(data.stats);
      setConferenceFlows(data.conferenceFlows);

      // Calculate NIL valuations for entries missing them
      const entriesWithNIL = data.entries.map((entry: PortalEntry) => {
        if (!entry.nilValuation) {
          entry.nilValuation = NILCalculator.calculateValuation(entry.metrics);
        }
        return entry;
      });

      setEntries(entriesWithNIL);
    } catch (err) {
      console.error('Portal data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('/ws/portal-updates');

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Portal WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          if (update.type === 'portal_entry') {
            handleNewEntry(update.data);
          } else if (update.type === 'portal_commitment') {
            handleCommitment(update.data);
          }
        } catch (error) {
          console.error('Failed to parse portal update:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect portal WebSocket:', error);
    }
  };

  const handleNewEntry = (entry: PortalEntry) => {
    // Calculate NIL valuation
    if (!entry.nilValuation) {
      entry.nilValuation = NILCalculator.calculateValuation(entry.metrics);
    }

    setEntries(prev => [entry, ...prev]);

    // Update stats
    setStats(prev => prev ? {
      ...prev,
      totalEntries: prev.totalEntries + 1
    } : null);

    // Show notification
    showNotification(`${entry.playerName} entered the portal`, 'info');
  };

  const handleCommitment = (update: { id: string; newSchool: string; newConference: string }) => {
    setEntries(prev => prev.map(entry =>
      entry.id === update.id
        ? {
            ...entry,
            status: 'committed',
            newSchool: update.newSchool,
            newConference: update.newConference,
            commitDate: new Date().toISOString()
          }
        : entry
    ));

    // Update stats
    setStats(prev => prev ? {
      ...prev,
      totalCommitments: prev.totalCommitments + 1
    } : null);
  };

  // ============================================================================
  // Filtering and Sorting
  // ============================================================================

  useEffect(() => {
    let filtered = [...entries];

    // Apply filters
    if (positionFilter !== 'all') {
      filtered = filtered.filter(e => e.position === positionFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (conferenceFilter !== 'all') {
      filtered = filtered.filter(e =>
        e.previousConference === conferenceFilter ||
        e.newConference === conferenceFilter
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.playerName.toLowerCase().includes(query) ||
        e.previousSchool.toLowerCase().includes(query) ||
        e.newSchool?.toLowerCase().includes(query)
      );
    }

    if (minNILValue > 0) {
      filtered = filtered.filter(e =>
        e.nilValuation && e.nilValuation.estimatedValue >= minNILValue
      );
    }

    if (graduateOnly) {
      filtered = filtered.filter(e => e.graduateTransfer);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      } else if (sortBy === 'nil') {
        const aValue = a.nilValuation?.estimatedValue || 0;
        const bValue = b.nilValuation?.estimatedValue || 0;
        comparison = aValue - bValue;
      } else if (sortBy === 'name') {
        comparison = a.playerName.localeCompare(b.playerName);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredEntries(filtered);
  }, [entries, positionFilter, statusFilter, conferenceFilter, searchQuery, minNILValue, graduateOnly, sortBy, sortOrder]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'entered': return '#fbbf24'; // Yellow
      case 'committed': return '#10b981'; // Green
      case 'withdrawn': return '#6b7280'; // Gray
      default: return '#9ca3af';
    }
  };

  const showNotification = (message: string, type: 'info' | 'success' | 'error') => {
    // In production, integrate with toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const getPositionColor = (position: string): string => {
    const colors: Record<string, string> = {
      'SP': '#3b82f6',
      'RP': '#8b5cf6',
      'CL': '#ec4899',
      'C': '#f59e0b',
      '1B': '#10b981',
      '2B': '#14b8a6',
      '3B': '#06b6d4',
      'SS': '#0ea5e9',
      'OF': '#6366f1',
      'DH': '#a855f7'
    };
    return colors[position] || '#9ca3af';
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading portal activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>Failed to Load Portal Data</h3>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={fetchPortalData} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Transfer Portal Intelligence</h1>
          <p style={styles.subtitle}>
            Live tracking • NIL valuations • Conference movement analysis
          </p>
        </div>
        <div style={styles.connectionStatus}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: isConnected ? '#10b981' : '#ef4444'
          }} />
          <span style={styles.statusText}>
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalEntries}</div>
            <div style={styles.statLabel}>Portal Entries</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalCommitments}</div>
            <div style={styles.statLabel}>Commitments</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formatCurrency(stats.averageNILValue)}</div>
            <div style={styles.statLabel}>Avg NIL Value</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.medianDaysToCommit}</div>
            <div style={styles.statLabel}>Days to Commit</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.filterRow}>
          <input
            type="text"
            placeholder="Search players or schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Positions</option>
            <option value="SP">Starting Pitcher</option>
            <option value="RP">Relief Pitcher</option>
            <option value="C">Catcher</option>
            <option value="1B">First Base</option>
            <option value="2B">Second Base</option>
            <option value="3B">Third Base</option>
            <option value="SS">Shortstop</option>
            <option value="OF">Outfield</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="entered">Entered Portal</option>
            <option value="committed">Committed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <select
            value={conferenceFilter}
            onChange={(e) => setConferenceFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Conferences</option>
            <option value="SEC">SEC</option>
            <option value="ACC">ACC</option>
            <option value="Big 12">Big 12</option>
            <option value="Pac-12">Pac-12</option>
            <option value="Big Ten">Big Ten</option>
          </select>
        </div>

        <div style={styles.filterRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={graduateOnly}
              onChange={(e) => setGraduateOnly(e.target.checked)}
              style={styles.checkbox}
            />
            Graduate Transfers Only
          </label>

          <div style={styles.nilFilterContainer}>
            <label style={styles.nilFilterLabel}>Min NIL Value:</label>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={minNILValue}
              onChange={(e) => setMinNILValue(Number(e.target.value))}
              style={styles.rangeInput}
            />
            <span style={styles.nilFilterValue}>{formatCurrency(minNILValue)}</span>
          </div>
        </div>

        <div style={styles.sortControls}>
          <span style={styles.sortLabel}>Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            style={{
              ...styles.sortButton,
              ...(sortBy === 'date' ? styles.sortButtonActive : {})
            }}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('nil')}
            style={{
              ...styles.sortButton,
              ...(sortBy === 'nil' ? styles.sortButtonActive : {})
            }}
          >
            NIL Value
          </button>
          <button
            onClick={() => setSortBy('name')}
            style={{
              ...styles.sortButton,
              ...(sortBy === 'name' ? styles.sortButtonActive : {})
            }}
          >
            Name
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={styles.sortOrderButton}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={styles.resultsContainer}>
        <div style={styles.resultsHeader}>
          <span style={styles.resultsCount}>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No portal entries match your filters</p>
          </div>
        ) : (
          <div style={styles.entriesList}>
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                style={styles.entryCard}
                onClick={() => setSelectedEntry(entry)}
              >
                <div style={styles.entryHeader}>
                  <div style={styles.playerInfo}>
                    <h3 style={styles.playerName}>{entry.playerName}</h3>
                    <div style={styles.playerMeta}>
                      <span
                        style={{
                          ...styles.positionBadge,
                          backgroundColor: getPositionColor(entry.position)
                        }}
                      >
                        {entry.position}
                      </span>
                      {entry.graduateTransfer && (
                        <span style={styles.gradBadge}>GRAD</span>
                      )}
                      <span style={styles.yearsRemaining}>
                        {entry.yearsRemaining} yr{entry.yearsRemaining !== 1 ? 's' : ''} remaining
                      </span>
                    </div>
                  </div>

                  <div style={styles.statusBadge}>
                    <div
                      style={{
                        ...styles.statusDot,
                        backgroundColor: getStatusColor(entry.status)
                      }}
                    />
                    <span style={styles.statusText}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div style={styles.schoolFlow}>
                  <div style={styles.schoolBox}>
                    <div style={styles.schoolName}>{entry.previousSchool}</div>
                    <div style={styles.conferenceName}>{entry.previousConference}</div>
                  </div>

                  <div style={styles.arrow}>→</div>

                  <div style={styles.schoolBox}>
                    {entry.newSchool ? (
                      <>
                        <div style={styles.schoolName}>{entry.newSchool}</div>
                        <div style={styles.conferenceName}>{entry.newConference}</div>
                      </>
                    ) : (
                      <div style={styles.uncommitted}>Uncommitted</div>
                    )}
                  </div>
                </div>

                {entry.nilValuation && (
                  <div style={styles.nilSection}>
                    <div style={styles.nilValue}>
                      <span style={styles.nilLabel}>Est. NIL Value:</span>
                      <span style={styles.nilAmount}>
                        {formatCurrency(entry.nilValuation.estimatedValue)}
                      </span>
                      <span style={styles.nilConfidence}>
                        ({entry.nilValuation.confidence}% confidence)
                      </span>
                    </div>
                    <div style={styles.nilTier}>
                      {NILCalculator.getValueTier(entry.nilValuation.estimatedValue)}
                    </div>
                  </div>
                )}

                <div style={styles.entryFooter}>
                  <span style={styles.entryDate}>
                    Entered: {formatDate(entry.entryDate)}
                  </span>
                  {entry.commitDate && (
                    <span style={styles.commitDate}>
                      Committed: {formatDate(entry.commitDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NIL Details Modal */}
      {selectedEntry && selectedEntry.nilValuation && (
        <div
          style={styles.modal}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>NIL Breakdown: {selectedEntry.playerName}</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.valuationBreakdown}>
                <h3 style={styles.breakdownTitle}>Value Breakdown</h3>
                <div style={styles.breakdownItem}>
                  <span>Performance:</span>
                  <span>{formatCurrency(selectedEntry.nilValuation.breakdown.performance)}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Social Media:</span>
                  <span>{formatCurrency(selectedEntry.nilValuation.breakdown.socialMedia)}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>School Brand:</span>
                  <span>{formatCurrency(selectedEntry.nilValuation.breakdown.schoolBrand)}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Position Value:</span>
                  <span>{formatCurrency(selectedEntry.nilValuation.breakdown.position)}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Draft Projection:</span>
                  <span>{formatCurrency(selectedEntry.nilValuation.breakdown.draft)}</span>
                </div>
              </div>

              <div style={styles.opportunities}>
                <h3 style={styles.opportunitiesTitle}>NIL Opportunities</h3>
                <ul style={styles.opportunitiesList}>
                  {selectedEntry.nilValuation.opportunities.map((opp, idx) => (
                    <li key={idx} style={styles.opportunityItem}>{opp}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.comparables}>
                <h3 style={styles.comparablesTitle}>Comparable Players</h3>
                {selectedEntry.nilValuation.comparables.map((comp, idx) => (
                  <div key={idx} style={styles.comparableItem}>
                    <span style={styles.comparableName}>{comp.playerName}</span>
                    <span style={styles.comparableSchool}>{comp.school}</span>
                    <span style={styles.comparableValue}>{formatCurrency(comp.estimatedValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '2px solid rgba(255, 107, 0, 0.2)'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: 0
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff'
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 107, 0, 0.05))',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ff6b00',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },

  // Filters
  filtersContainer: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    backdropFilter: 'blur(10px)'
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const
  },
  searchInput: {
    flex: '2',
    minWidth: '250px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none'
  },
  filterSelect: {
    flex: '1',
    minWidth: '150px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#9ca3af',
    fontSize: '14px',
    cursor: 'pointer'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  nilFilterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: '1'
  },
  nilFilterLabel: {
    color: '#9ca3af',
    fontSize: '14px',
    whiteSpace: 'nowrap' as const
  },
  rangeInput: {
    flex: '1',
    minWidth: '200px'
  },
  nilFilterValue: {
    color: '#ff6b00',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '60px',
    textAlign: 'right' as const
  },

  // Sort Controls
  sortControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  sortLabel: {
    color: '#9ca3af',
    fontSize: '14px',
    marginRight: '8px'
  },
  sortButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#9ca3af',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  sortButtonActive: {
    background: 'rgba(255, 107, 0, 0.2)',
    borderColor: '#ff6b00',
    color: '#ff6b00'
  },
  sortOrderButton: {
    padding: '8px 16px',
    background: 'rgba(255, 107, 0, 0.1)',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    borderRadius: '6px',
    color: '#ff6b00',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },

  // Results
  resultsContainer: {
    marginBottom: '24px'
  },
  resultsHeader: {
    marginBottom: '16px'
  },
  resultsCount: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  entriesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },

  // Entry Card
  entryCard: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
    }
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  playerInfo: {
    flex: '1'
  },
  playerName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  playerMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  },
  positionBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const
  },
  gradBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#a78bfa',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  yearsRemaining: {
    color: '#9ca3af',
    fontSize: '12px'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px'
  },

  // School Flow
  schoolFlow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px'
  },
  schoolBox: {
    flex: '1',
    textAlign: 'center' as const
  },
  schoolName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '4px'
  },
  conferenceName: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  arrow: {
    fontSize: '24px',
    color: '#ff6b00',
    fontWeight: 'bold'
  },
  uncommitted: {
    fontSize: '16px',
    color: '#6b7280',
    fontStyle: 'italic' as const
  },

  // NIL Section
  nilSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 107, 0, 0.05))',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  nilValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  nilLabel: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  nilAmount: {
    color: '#ff6b00',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  nilConfidence: {
    color: '#6b7280',
    fontSize: '12px'
  },
  nilTier: {
    padding: '6px 12px',
    background: 'rgba(255, 107, 0, 0.2)',
    border: '1px solid rgba(255, 107, 0, 0.3)',
    borderRadius: '6px',
    color: '#ff6b00',
    fontSize: '12px',
    fontWeight: 'bold'
  },

  // Entry Footer
  entryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#6b7280',
    fontSize: '12px'
  },
  entryDate: {},
  commitDate: {},

  // Modal
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)',
    border: '1px solid rgba(255, 107, 0, 0.3)',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid rgba(255, 107, 0, 0.2)'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  modalBody: {
    padding: '24px'
  },

  // Valuation Breakdown
  valuationBreakdown: {
    marginBottom: '32px'
  },
  breakdownTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ff6b00',
    marginBottom: '16px'
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    marginBottom: '8px',
    color: '#ffffff',
    fontSize: '14px'
  },

  // Opportunities
  opportunities: {
    marginBottom: '32px'
  },
  opportunitiesTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ff6b00',
    marginBottom: '16px'
  },
  opportunitiesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  opportunityItem: {
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    marginBottom: '8px',
    color: '#10b981',
    fontSize: '14px'
  },

  // Comparables
  comparables: {
    marginBottom: '24px'
  },
  comparablesTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ff6b00',
    marginBottom: '16px'
  },
  comparableItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  comparableName: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: '1'
  },
  comparableSchool: {
    color: '#9ca3af',
    fontSize: '12px',
    flex: '1',
    textAlign: 'center' as const
  },
  comparableValue: {
    color: '#ff6b00',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'right' as const
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    minHeight: '400px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255, 107, 0, 0.1)',
    borderTopColor: '#ff6b00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#9ca3af',
    fontSize: '14px'
  },

  // Error
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    minHeight: '400px'
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '8px'
  },
  errorMessage: {
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '24px',
    textAlign: 'center' as const
  },
  retryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #ff6b00, #ff8800)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },

  // Empty State
  emptyState: {
    padding: '64px',
    textAlign: 'center' as const
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '16px'
  }
};
