'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ClutchLeaderboard.module.css';
import ClutchMomentCard from './ClutchMomentCard';

interface LeaderboardEntry {
  play_id: string;
  description: string;
  players: string[];
  sport: 'baseball' | 'football';
  playoff_round: string;
  season: number;
  lei: number;
  components: {
    wpa: number;
    championship_weight: number;
    scarcity: number;
  };
  context: string;
}

interface ClutchLeaderboardProps {
  data: LeaderboardEntry[];
  title?: string;
  animated?: boolean;
  viewMode?: 'table' | 'cards' | 'compact';
  sortBy?: 'lei' | 'wpa' | 'scarcity';
}

/**
 * Interactive Clutch Moment Leaderboard
 * Features:
 * - Animated rank transitions
 * - Multiple view modes (table/cards/compact)
 * - Sortable columns with animations
 * - Holographic table design
 * - Real-time filtering and search
 * - Smooth scroll reveal animations
 */
export default function ClutchLeaderboard({
  data,
  title = 'CLUTCH MOMENTS LEADERBOARD',
  animated = true,
  viewMode = 'table',
  sortBy = 'lei',
}: ClutchLeaderboardProps) {
  const [sortedData, setSortedData] = useState<LeaderboardEntry[]>([]);
  const [currentSort, setCurrentSort] = useState<'lei' | 'wpa' | 'scarcity'>(sortBy);
  const [filterSport, setFilterSport] = useState<'all' | 'baseball' | 'football'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModeState, setViewModeState] = useState(viewMode);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sort data
  useEffect(() => {
    let filtered = [...data];

    // Filter by sport
    if (filterSport !== 'all') {
      filtered = filtered.filter((item) => item.sport === filterSport);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.players.some((p) => p.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (currentSort) {
        case 'lei':
          return b.lei - a.lei;
        case 'wpa':
          return b.components.wpa - a.components.wpa;
        case 'scarcity':
          return b.components.scarcity - a.components.scarcity;
        default:
          return 0;
      }
    });

    setSortedData(filtered);
  }, [data, currentSort, filterSport, searchQuery]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    if (!animated) {
      setVisibleItems(new Set(sortedData.map((_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.1 }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [sortedData, animated]);

  const handleSort = (column: 'lei' | 'wpa' | 'scarcity') => {
    setCurrentSort(column);
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'; // Gold
    if (rank === 2) return 'linear-gradient(135deg, #C0C0C0 0%, #999999 100%)'; // Silver
    if (rank === 3) return 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)'; // Bronze
    return 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)';
  };

  const getSportIcon = (sport: string): string => {
    return sport === 'baseball' ? '⚾' : '🏈';
  };

  return (
    <div className={styles.leaderboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleText}>{title}</span>
          <span className={styles.titleGlow}>{title}</span>
        </h2>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Search */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search players or moments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Sport filter */}
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterButton} ${
                filterSport === 'all' ? styles.active : ''
              }`}
              onClick={() => setFilterSport('all')}
            >
              ALL
            </button>
            <button
              className={`${styles.filterButton} ${
                filterSport === 'baseball' ? styles.active : ''
              }`}
              onClick={() => setFilterSport('baseball')}
            >
              ⚾ BASEBALL
            </button>
            <button
              className={`${styles.filterButton} ${
                filterSport === 'football' ? styles.active : ''
              }`}
              onClick={() => setFilterSport('football')}
            >
              🏈 FOOTBALL
            </button>
          </div>

          {/* View mode toggle */}
          <div className={styles.viewModeToggle}>
            <button
              className={`${styles.viewButton} ${
                viewModeState === 'table' ? styles.active : ''
              }`}
              onClick={() => setViewModeState('table')}
              title="Table View"
            >
              ☰
            </button>
            <button
              className={`${styles.viewButton} ${
                viewModeState === 'cards' ? styles.active : ''
              }`}
              onClick={() => setViewModeState('cards')}
              title="Cards View"
            >
              ▦
            </button>
            <button
              className={`${styles.viewButton} ${
                viewModeState === 'compact' ? styles.active : ''
              }`}
              onClick={() => setViewModeState('compact')}
              title="Compact View"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewModeState === 'table' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>RANK</th>
                <th className={styles.playHeader}>MOMENT</th>
                <th className={styles.sportHeader}>SPORT</th>
                <th
                  className={`${styles.sortableHeader} ${
                    currentSort === 'lei' ? styles.active : ''
                  }`}
                  onClick={() => handleSort('lei')}
                >
                  LEI {currentSort === 'lei' && '▼'}
                </th>
                <th
                  className={`${styles.sortableHeader} ${
                    currentSort === 'wpa' ? styles.active : ''
                  }`}
                  onClick={() => handleSort('wpa')}
                >
                  WPA {currentSort === 'wpa' && '▼'}
                </th>
                <th
                  className={`${styles.sortableHeader} ${
                    currentSort === 'scarcity' ? styles.active : ''
                  }`}
                  onClick={() => handleSort('scarcity')}
                >
                  SCARCITY {currentSort === 'scarcity' && '▼'}
                </th>
                <th className={styles.weightHeader}>WEIGHT</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((entry, index) => (
                <tr
                  key={entry.play_id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  data-index={index}
                  className={`${styles.tableRow} ${
                    visibleItems.has(index) ? styles.visible : ''
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className={styles.rankCell}>
                    <div
                      className={styles.rankBadge}
                      style={{ background: getRankBadgeColor(index + 1) }}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className={styles.playCell}>
                    <div className={styles.playInfo}>
                      <div className={styles.playDescription}>{entry.description}</div>
                      <div className={styles.playPlayers}>
                        {entry.players.slice(0, 2).join(', ')}
                      </div>
                      <div className={styles.playMeta}>
                        {entry.season} • {entry.playoff_round.toUpperCase()}
                      </div>
                    </div>
                  </td>
                  <td className={styles.sportCell}>
                    <span className={styles.sportIcon}>{getSportIcon(entry.sport)}</span>
                  </td>
                  <td className={styles.leiCell}>
                    <div className={styles.leiValue}>{Math.round(entry.lei)}</div>
                    <div className={styles.leiBar}>
                      <div
                        className={styles.leiBarFill}
                        style={{ width: `${entry.lei}%` }}
                      />
                    </div>
                  </td>
                  <td className={styles.wpaCell}>
                    {(entry.components.wpa * 100).toFixed(1)}%
                  </td>
                  <td className={styles.scarcityCell}>
                    {(entry.components.scarcity * 100).toFixed(0)}%
                  </td>
                  <td className={styles.weightCell}>
                    {entry.components.championship_weight}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards View */}
      {viewModeState === 'cards' && (
        <div className={styles.cardsGrid}>
          {sortedData.map((entry, index) => (
            <div
              key={entry.play_id}
              ref={(el) => (itemRefs.current[index] = el)}
              data-index={index}
              className={`${styles.cardWrapper} ${
                visibleItems.has(index) ? styles.visible : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ClutchMomentCard play={entry} rank={index + 1} variant="3d" />
            </div>
          ))}
        </div>
      )}

      {/* Compact View */}
      {viewModeState === 'compact' && (
        <div className={styles.compactList}>
          {sortedData.map((entry, index) => (
            <div
              key={entry.play_id}
              ref={(el) => (itemRefs.current[index] = el)}
              data-index={index}
              className={`${styles.compactItem} ${
                visibleItems.has(index) ? styles.visible : ''
              }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className={styles.compactRank} style={{ background: getRankBadgeColor(index + 1) }}>
                {index + 1}
              </div>
              <div className={styles.compactInfo}>
                <div className={styles.compactDescription}>{entry.description}</div>
                <div className={styles.compactMeta}>
                  {getSportIcon(entry.sport)} {entry.season} • {entry.playoff_round.toUpperCase()}
                </div>
              </div>
              <div className={styles.compactStats}>
                <div className={styles.compactLei}>{Math.round(entry.lei)}</div>
                <div className={styles.compactLabel}>LEI</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sortedData.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyText}>No clutch moments found</div>
          <div className={styles.emptyHint}>Try adjusting your filters or search query</div>
        </div>
      )}
    </div>
  );
}
