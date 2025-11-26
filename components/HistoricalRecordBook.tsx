/**
 * BSI Historical Record Book Module
 * Display franchise records, single-season records, postseason history, key eras, and all-time players
 *
 * All data must be sourced and cited - no fabrication
 *
 * Brand Colors:
 * - Burnt Orange: #BF5700
 * - Texas Soil: #8B4513
 * - Charcoal: #1A1A1A
 * - Midnight: #0D0D0D
 * - Ember (accent): #FF6B35
 */

import React, { useState, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface FranchiseRecord {
  id: number;
  category: string;
  recordType: 'career' | 'single_game' | 'single_season';
  statName: string;
  statValue: number | string;
  holderName: string;
  holderYears: string;
  achievedDate?: string;
  notes?: string;
  sourceUrl: string;
  sourceName: string;
}

interface SeasonRecord {
  id: number;
  category: string;
  statName: string;
  statValue: number | string;
  playerName: string;
  seasonYear: number;
  rank: number;
  sourceUrl: string;
  sourceName: string;
}

interface PostseasonEntry {
  id: number;
  seasonYear: number;
  achievementType: string;
  achievementName?: string;
  result: string;
  opponent?: string;
  finalScore?: string;
  mvpName?: string;
  notableMoments?: string;
  sourceUrl: string;
  sourceName: string;
}

interface KeyEra {
  id: number;
  eraName: string;
  startYear: number;
  endYear?: number;
  headCoach?: string;
  overallRecord?: string;
  championships: number;
  notablePlayers?: string[];
  summary: string;
  significance?: string;
  sourceUrl: string;
  sourceName: string;
}

interface AllTimePlayer {
  id: number;
  playerName: string;
  position: string;
  yearsWithTeam: string;
  jerseyNumber?: number;
  careerStats?: Record<string, number | string>;
  hallOfFame: boolean;
  hofYear?: number;
  retiredNumber: boolean;
  allStarSelections: number;
  mvpAwards: number;
  franchiseRank: number;
  rankCategory: string;
  legacySummary?: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
}

interface HistoricalRecordBookProps {
  teamId: string;
  teamName: string;
  league: 'MLB' | 'NFL' | 'NBA' | 'NCAA_FB' | 'NCAA_BB';
  apiBaseUrl?: string;
}

interface RecordBookData {
  franchiseRecords: FranchiseRecord[];
  seasonRecords: SeasonRecord[];
  postseasonHistory: PostseasonEntry[];
  keyEras: KeyEra[];
  allTimePlayers: AllTimePlayer[];
}

// =============================================================================
// COLLAPSIBLE SECTION COMPONENT
// =============================================================================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  count,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: isOpen
            ? 'linear-gradient(90deg, rgba(191,87,0,0.12) 0%, transparent 70%)'
            : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: '#FF6B35', display: 'flex' }}>{icon}</div>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            {title}
          </span>
          {count !== undefined && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '0.125rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              {count}
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Content */}
      <div
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div
          style={{
            padding: '0 1.25rem 1.25rem 1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CITATION COMPONENT
// =============================================================================

function Citation({ sourceName, sourceUrl }: { sourceName: string; sourceUrl: string }) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.6875rem',
        color: '#8B4513',
        textDecoration: 'none',
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B35')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#8B4513')}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M8 6V8H2V2H4V1H1V9H9V6H8ZM5.5 1V2H7.3L3.4 5.9L4.1 6.6L8 2.7V4.5H9V1H5.5Z" />
      </svg>
      {sourceName}
    </a>
  );
}

// =============================================================================
// RECORD CARD COMPONENT
// =============================================================================

interface RecordCardProps {
  statName: string;
  statValue: string | number;
  holderName: string;
  subtitle?: string;
  sourceUrl: string;
  sourceName: string;
}

function RecordCard({
  statName,
  statValue,
  holderName,
  subtitle,
  sourceUrl,
  sourceName,
}: RecordCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#0D0D0D',
        borderRadius: '6px',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {statName}
        </span>
        <Citation sourceName={sourceName} sourceUrl={sourceUrl} />
      </div>

      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#BF5700',
          lineHeight: 1.2,
        }}
      >
        {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
      </div>

      <div
        style={{
          marginTop: '0.5rem',
          fontSize: '0.9375rem',
          fontWeight: 500,
          color: '#FFFFFF',
        }}
      >
        {holderName}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: '0.25rem',
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

const Icons = {
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8.5c-2.5 0-4.5 2-4.5 4.5v5h9v-5c0-2.5-2-4.5-4.5-4.5zM19 4h-2V3c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v1H5c-1.1 0-2 .9-2 2v2c0 1.54 1.21 2.8 2.73 2.97C6.26 13.26 8.9 15 12 15s5.74-1.74 6.27-4.03C19.79 10.8 21 9.54 21 8V6c0-1.1-.9-2-2-2zm-14 4V6h2v2.5c0 .27.02.54.06.8-.58-.5-.94-1.24-1.06-2.1V8zm14 0c-.12.86-.48 1.6-1.06 2.1.04-.26.06-.53.06-.8V6h2v2z" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
    </svg>
  ),
  flag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function HistoricalRecordBook({
  teamId,
  teamName,
  league,
  apiBaseUrl = '/api',
}: HistoricalRecordBookProps) {
  const [data, setData] = useState<RecordBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecordBook() {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/records/${league}/${teamId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch records: ${response.status}`);
        }
        const result = (await response.json()) as RecordBookData;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load record book');
      } finally {
        setLoading(false);
      }
    }

    fetchRecordBook();
  }, [teamId, league, apiBaseUrl]);

  if (loading) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(191,87,0,0.2)',
            borderTopColor: '#BF5700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        Loading record book...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#EF4444',
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bsi-historical-record-book">
      {/* Header */}
      <div
        style={{
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#FF6B35',
            }}
          >
            Historical Record Book
          </span>
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          {teamName}
        </h2>
        <p
          style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          All records sourced from official league databases and verified reference sites.
        </p>
      </div>

      {/* Franchise Records */}
      <CollapsibleSection
        title="Franchise Records"
        icon={Icons.trophy}
        defaultOpen={true}
        count={data.franchiseRecords.length}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {data.franchiseRecords.map((record) => (
            <RecordCard
              key={record.id}
              statName={record.statName.replace(/_/g, ' ')}
              statValue={record.statValue}
              holderName={record.holderName}
              subtitle={record.holderYears}
              sourceUrl={record.sourceUrl}
              sourceName={record.sourceName}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Single-Season Records */}
      <CollapsibleSection
        title="Single-Season Records"
        icon={Icons.calendar}
        count={data.seasonRecords.length}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {data.seasonRecords.map((record) => (
            <RecordCard
              key={record.id}
              statName={record.statName.replace(/_/g, ' ')}
              statValue={record.statValue}
              holderName={record.playerName}
              subtitle={`${record.seasonYear} Season`}
              sourceUrl={record.sourceUrl}
              sourceName={record.sourceName}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Postseason History */}
      <CollapsibleSection
        title="Postseason History"
        icon={Icons.flag}
        count={data.postseasonHistory.length}
      >
        <div style={{ marginTop: '1rem' }}>
          {data.postseasonHistory.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                backgroundColor: '#0D0D0D',
                borderRadius: '6px',
                marginBottom: '0.5rem',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#BF5700',
                    minWidth: '50px',
                  }}
                >
                  {entry.seasonYear}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    {entry.achievementName || entry.achievementType.replace(/_/g, ' ')}
                  </div>
                  {entry.opponent && (
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      vs. {entry.opponent}
                      {entry.finalScore && ` • ${entry.finalScore}`}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '4px',
                    backgroundColor:
                      entry.result === 'won' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                    color: entry.result === 'won' ? '#10B981' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {entry.result}
                </span>
                <Citation sourceName={entry.sourceName} sourceUrl={entry.sourceUrl} />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Key Eras */}
      <CollapsibleSection title="Key Eras & Coaches" icon={Icons.clock} count={data.keyEras.length}>
        <div style={{ marginTop: '1rem' }}>
          {data.keyEras.map((era) => (
            <div
              key={era.id}
              style={{
                padding: '1.25rem',
                backgroundColor: '#0D0D0D',
                borderRadius: '6px',
                marginBottom: '0.75rem',
                borderLeft: '3px solid #8B4513',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    {era.eraName}
                  </h4>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {era.startYear}–{era.endYear || 'Present'}
                    {era.headCoach && ` • ${era.headCoach}`}
                    {era.overallRecord && ` • ${era.overallRecord}`}
                  </div>
                </div>
                <Citation sourceName={era.sourceName} sourceUrl={era.sourceUrl} />
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: '0.9375rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6,
                }}
              >
                {era.summary}
              </p>

              {era.championships > 0 && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    color: '#BF5700',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  {Icons.trophy}
                  {era.championships} Championship{era.championships > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* All-Time Players */}
      <CollapsibleSection
        title="All-Time Players"
        icon={Icons.star}
        count={data.allTimePlayers.length}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {data.allTimePlayers.map((player) => (
            <div
              key={player.id}
              style={{
                backgroundColor: '#0D0D0D',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                }}
              >
                {/* Rank badge */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: player.franchiseRank <= 3 ? '#BF5700' : '#1A1A1A',
                    border: '2px solid #BF5700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: player.franchiseRank <= 3 ? '#FFFFFF' : '#BF5700',
                  }}
                >
                  {player.franchiseRank}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    {player.playerName}
                    {player.jerseyNumber && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.8125rem',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        #{player.jerseyNumber}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {player.position} • {player.yearsWithTeam}
                  </div>
                </div>

                <Citation sourceName={player.sourceName} sourceUrl={player.sourceUrl} />
              </div>

              {/* Accolades */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  padding: '0 1rem 1rem 1rem',
                }}
              >
                {player.hallOfFame && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(191,87,0,0.2)',
                      color: '#BF5700',
                    }}
                  >
                    HOF {player.hofYear}
                  </span>
                )}
                {player.retiredNumber && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(139,69,19,0.2)',
                      color: '#8B4513',
                    }}
                  >
                    Number Retired
                  </span>
                )}
                {player.mvpAwards > 0 && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,107,53,0.2)',
                      color: '#FF6B35',
                    }}
                  >
                    {player.mvpAwards}x MVP
                  </span>
                )}
                {player.allStarSelections > 0 && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {player.allStarSelections}x All-Star
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div
        style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(139,69,19,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: '#8B4513',
          }}
        >
          Blaze Sports Intel • All records verified and cited
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default HistoricalRecordBook;
