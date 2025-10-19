import { useMemo, useState, useEffect } from 'react';

type HighlightType = 'video' | 'image';

type AdvancedMedia = {
  id: string;
  type: HighlightType;
  title: string;
  description?: string;
  thumbnail: string;
  assetUrl: string;
  signedUrl?: string;
  playerIds?: string[];
  tags?: string[];
  duration?: number | null;
  expiresAt?: number;
};

type BaseMetric = {
  id: string;
  playerId: string;
  name: string;
  team: string;
  side: 'home' | 'away';
  highlightIds?: string[];
  trend?: number[];
};

type AdvancedHitterMetric = BaseMetric & {
  xBA: number;
  xSLG: number;
  hardHitRate: number;
  barrelRate: number;
  sprayDistribution?: {
    pull: number;
    center: number;
    oppo: number;
  };
};

type AdvancedPitcherMetric = BaseMetric & {
  stuffPlus: number;
  pitchQuality: number;
  whiffRate: number;
  chaseRate: number;
  avgVelo: number;
  pitchMix?: Record<string, number>;
};

type AdvancedDefenderMetric = BaseMetric & {
  position: string;
  defenderRange: number;
  outsAboveAverage: number;
  successRate: number;
  exchangeTime?: number;
  armStrength?: number;
};

export type AdvancedMetricsPayload = {
  hitters?: AdvancedHitterMetric[];
  pitchers?: AdvancedPitcherMetric[];
  defenders?: AdvancedDefenderMetric[];
  media?: AdvancedMedia[];
  updatedAt?: string;
  generatedAt?: string;
};

interface AdvancedMetricsTableProps {
  data?: AdvancedMetricsPayload | null;
}

type SectionKey = 'hitters' | 'pitchers' | 'defenders';

type SortDirection = 'asc' | 'desc';

type ColumnConfig = {
  key: string;
  label: string;
  tooltip?: string;
  width?: string;
  isSortable?: boolean;
  render?: (row: any) => JSX.Element | string;
};

const formatPercent = (value?: number | null) =>
  typeof value === 'number' ? `${Math.round(value * 100)}%` : '—';

const formatDecimal = (value?: number | null, digits = 3) =>
  typeof value === 'number' ? value.toFixed(digits) : '—';

const formatNumber = (value?: number | null, digits = 0) =>
  typeof value === 'number' ? value.toFixed(digits) : '—';

const columnDefinitions: Record<SectionKey, ColumnConfig[]> = {
  hitters: [
    { key: 'name', label: 'Hitter', tooltip: 'Player name and split' },
    { key: 'xBA', label: 'xBA', tooltip: 'Expected batting average (tracking & contact quality)' },
    { key: 'xSLG', label: 'xSLG', tooltip: 'Expected slugging based on exit velocity & launch angle' },
    { key: 'hardHitRate', label: 'Hard Hit%', tooltip: 'Percent of batted balls ≥95 mph' },
    { key: 'barrelRate', label: 'Barrel%', tooltip: 'Barrel rate (ideal EV/LA window)' },
    { key: 'trend', label: 'Trend', tooltip: 'Rolling five-game expected OPS sparkbar' },
    { key: 'sprayDistribution', label: 'Spray', tooltip: 'Pull / Center / Oppo distribution last 15 PA' },
    { key: 'highlight', label: 'Highlight', tooltip: 'Diamond Pro clip' },
  ],
  pitchers: [
    { key: 'name', label: 'Pitcher', tooltip: 'Pitcher name and split' },
    { key: 'stuffPlus', label: 'Stuff+', tooltip: 'Stuff+ index (100 = NCAA average)' },
    { key: 'pitchQuality', label: 'Pitch Qlty', tooltip: 'Pitch quality score blending tunneling and execution' },
    { key: 'whiffRate', label: 'Whiff%', tooltip: 'Swinging-strike percentage' },
    { key: 'chaseRate', label: 'Chase%', tooltip: 'Out-of-zone swing rate' },
    { key: 'avgVelo', label: 'Velo', tooltip: 'Average fastball velocity (mph)' },
    { key: 'trend', label: 'Trend', tooltip: 'Rolling Stuff+ sparkbar' },
    { key: 'highlight', label: 'Highlight', tooltip: 'Diamond Pro clip' },
  ],
  defenders: [
    { key: 'name', label: 'Defender', tooltip: 'Player name and split' },
    { key: 'defenderRange', label: 'Range', tooltip: 'Defender range score (0-100 scale)' },
    { key: 'outsAboveAverage', label: 'OAA', tooltip: 'Outs above average for the season' },
    { key: 'successRate', label: 'Success%', tooltip: 'Conversion rate on defensive opportunities' },
    { key: 'armStrength', label: 'Arm', tooltip: 'Avg. arm strength (mph) when available' },
    { key: 'trend', label: 'Trend', tooltip: 'Rolling range trend sparkbar' },
    { key: 'highlight', label: 'Highlight', tooltip: 'Diamond Pro clip' },
  ],
};

const sectionLabels: Record<SectionKey, string> = {
  hitters: 'Hitters',
  pitchers: 'Pitchers',
  defenders: 'Defense',
};

const getSparkValues = (values?: number[]) =>
  Array.isArray(values) && values.length ? values : [0];

function Sparkbar({ values, emphasize }: { values?: number[]; emphasize?: boolean }) {
  const sparkValues = getSparkValues(values);
  const max = Math.max(...sparkValues);

  return (
    <div className={`sparkbar ${emphasize ? 'sparkbar--emphasize' : ''}`} aria-hidden="true">
      {sparkValues.map((value, idx) => (
        <span
          key={idx}
          className="sparkbar-bar"
          style={{ height: `${max === 0 ? 0 : Math.max(6, (value / max) * 28)}px` }}
        />
      ))}
    </div>
  );
}

function SprayDistribution({ spray }: { spray?: { pull: number; center: number; oppo: number } }) {
  if (!spray) return <span>—</span>;
  return (
    <div className="spray-distribution" aria-label="Spray distribution">
      <span>P {Math.round(spray.pull * 100)}%</span>
      <span>C {Math.round(spray.center * 100)}%</span>
      <span>O {Math.round(spray.oppo * 100)}%</span>
    </div>
  );
}

function MediaThumbnail({
  clip,
  onClick,
}: {
  clip?: AdvancedMedia | null;
  onClick: (clip: AdvancedMedia) => void;
}) {
  if (!clip) {
    return <span className="media-thumbnail placeholder">—</span>;
  }

  return (
    <button
      type="button"
      className="media-thumbnail"
      onClick={() => onClick(clip)}
      aria-label={`Play ${clip.title}`}
    >
      <img src={clip.thumbnail} alt="" loading="lazy" />
      <span className="media-type" aria-hidden="true">
        {clip.type === 'video' ? '▶' : '🖼'}
      </span>
    </button>
  );
}

function MediaModal({ clip, onClose }: { clip: AdvancedMedia | null; onClose: () => void }) {
  useEffect(() => {
    if (!clip) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [clip, onClose]);

  if (!clip) {
    return null;
  }

  const mediaSource = clip.signedUrl || clip.assetUrl;

  return (
    <div className="media-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="media-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`media-modal-${clip.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="media-modal__header">
          <h3 id={`media-modal-${clip.id}`}>{clip.title}</h3>
          <button type="button" className="media-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="media-modal__body">
          {clip.type === 'video' ? (
            <video controls preload="metadata" src={mediaSource} poster={clip.thumbnail}>
              Sorry, your browser does not support embedded video.
            </video>
          ) : (
            <img src={mediaSource} alt={clip.title} />
          )}
          {clip.description && <p className="media-modal__description">{clip.description}</p>}
          {clip.tags && clip.tags.length > 0 && (
            <div className="media-modal__tags">
              {clip.tags.map((tag) => (
                <span key={tag} className="media-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <footer className="media-modal__footer">
          {clip.duration ? <span>{clip.duration}s clip</span> : <span>Diamond Pro asset</span>}
          {clip.expiresAt && (
            <span className="media-modal__expires">
              Expires {new Date(clip.expiresAt * 1000).toLocaleTimeString()}
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}

const defaultSorter = (key: string, direction: SortDirection) => {
  return (a: Record<string, any>, b: Record<string, any>) => {
    const aValue = a[key];
    const bValue = b[key];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  };
};

export default function AdvancedMetricsTable({ data }: AdvancedMetricsTableProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('hitters');
  const [sortKey, setSortKey] = useState<string>('xBA');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeClip, setActiveClip] = useState<AdvancedMedia | null>(null);

  const mediaLookup = useMemo(() => {
    const map = new Map<string, AdvancedMedia>();
    data?.media?.forEach((clip) => {
      map.set(clip.id, clip);
      clip.playerIds?.forEach((playerId) => {
        map.set(`${playerId}:${clip.id}`, clip);
      });
    });
    return map;
  }, [data?.media]);

  const sectionRows = useMemo(() => {
    if (!data) return [];
    const rows = data[activeSection] ?? [];
    if (!Array.isArray(rows)) return [];

    const sortableRows = [...rows];
    const sorter = defaultSorter(sortKey, sortDirection);
    sortableRows.sort(sorter);
    return sortableRows;
  }, [data, activeSection, sortKey, sortDirection]);

  useEffect(() => {
    // Reset sort when section changes
    switch (activeSection) {
      case 'hitters':
        setSortKey('xBA');
        setSortDirection('desc');
        break;
      case 'pitchers':
        setSortKey('stuffPlus');
        setSortDirection('desc');
        break;
      case 'defenders':
        setSortKey('defenderRange');
        setSortDirection('desc');
        break;
      default:
        break;
    }
  }, [activeSection]);

  if (!data) {
    return <div className="advanced-placeholder">Advanced metrics are not available for this matchup yet.</div>;
  }

  const columns = columnDefinitions[activeSection];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const resolveClip = (row: any) => {
    if (!row?.highlightIds || row.highlightIds.length === 0) {
      if (row?.playerId) {
        return data.media?.find((clip) => clip.playerIds?.includes(row.playerId)) || null;
      }
      return null;
    }
    for (const highlightId of row.highlightIds) {
      const clip = mediaLookup.get(highlightId) || mediaLookup.get(`${row.playerId}:${highlightId}`);
      if (clip) return clip;
    }
    return null;
  };

  return (
    <div className="advanced-metrics">
      <div className="advanced-metrics__tabs" role="tablist" aria-label="Advanced metrics sections">
        {(Object.keys(sectionLabels) as SectionKey[]).map((section) => (
          <button
            key={section}
            role="tab"
            type="button"
            className={`advanced-metrics__tab ${section === activeSection ? 'active' : ''}`}
            aria-selected={section === activeSection}
            onClick={() => setActiveSection(section)}
          >
            {sectionLabels[section]}
          </button>
        ))}
      </div>

      <div className="advanced-metrics__table-wrapper">
        <table className="advanced-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  title={column.tooltip}
                  onClick={() => column.key !== 'highlight' && handleSort(column.key)}
                  className={column.key === sortKey ? `sorted-${sortDirection}` : undefined}
                >
                  {column.label}
                  {column.key === sortKey && <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => {
                  if (column.key === 'name') {
                    return (
                      <td key={column.key}>
                        <div className="player-id">
                          <span className="player-name">{row.name}</span>
                          <span className="player-team">{row.team} · {row.side === 'home' ? 'Home' : 'Away'}</span>
                        </div>
                      </td>
                    );
                  }

                  if (column.key === 'trend') {
                    return (
                      <td key={column.key}>
                        <Sparkbar values={row.trend} emphasize={activeSection !== 'defenders'} />
                      </td>
                    );
                  }

                  if (column.key === 'sprayDistribution') {
                    return (
                      <td key={column.key}>
                        <SprayDistribution spray={row.sprayDistribution} />
                      </td>
                    );
                  }

                  if (column.key === 'highlight') {
                    const clip = resolveClip(row);
                    return (
                      <td key={column.key}>
                        <MediaThumbnail clip={clip} onClick={(selected) => setActiveClip(selected)} />
                      </td>
                    );
                  }

                  const value = row[column.key];

                  if (column.key === 'xBA' || column.key === 'xSLG') {
                    return <td key={column.key}>{formatDecimal(value)}</td>;
                  }

                  if (column.key === 'hardHitRate' || column.key === 'barrelRate' || column.key === 'whiffRate' || column.key === 'chaseRate' || column.key === 'successRate') {
                    return <td key={column.key}>{formatPercent(value)}</td>;
                  }

                  if (column.key === 'avgVelo' || column.key === 'armStrength') {
                    return <td key={column.key}>{formatNumber(value, 1)}</td>;
                  }

                  if (column.key === 'defenderRange' || column.key === 'stuffPlus' || column.key === 'pitchQuality' || column.key === 'outsAboveAverage') {
                    return <td key={column.key}>{formatNumber(value)}</td>;
                  }

                  return <td key={column.key}>{value ?? '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="advanced-metrics__footer">
        <span>Diamond Pro metrics refreshed {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : 'recently'}.</span>
        <span className="advanced-metrics__powered">Powered by Stripe entitlements · Highlight ingest placeholder.</span>
      </footer>

      <MediaModal clip={activeClip} onClose={() => setActiveClip(null)} />
    </div>
  );
}
