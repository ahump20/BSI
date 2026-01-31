'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout-ds/Footer';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { PositionIconContainer, type Sport } from '@/components/portal/PositionIcon';
import { StarRating } from '@/components/portal/StarRating';
import { cn } from '@/lib/utils';
import type { PortalEntry } from '@/lib/portal/types';
import {
  BASEBALL_STATS,
  getStatQuality,
  getQualityColor,
  getQualityLabel,
} from '@/lib/stat-definitions';

interface ChangeEvent {
  id: string;
  portal_entry_id: string;
  change_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  event_timestamp: string;
}

interface PlayerResponse {
  data: PortalEntry;
  changes: ChangeEvent[];
}

const CHANGE_ICONS: Record<string, { icon: string; color: string }> = {
  entered: { icon: '\u2192', color: 'text-warning' },
  committed: { icon: '\u2713', color: 'text-success-light' },
  signed: { icon: '\u270E', color: 'text-burnt-orange' },
  withdrawn: { icon: '\u2190', color: 'text-text-muted' },
  updated: { icon: '\u21BB', color: 'text-sky-400' },
};

function StatBlock({
  label,
  value,
  numericValue,
}: {
  label: string;
  value: string | number;
  numericValue?: number;
}) {
  const def = BASEBALL_STATS[label];
  const quality = numericValue !== undefined && def ? getStatQuality(label, numericValue) : null;

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-charcoal-900/60 border border-border-subtle">
      <span className="text-text-muted text-xs uppercase tracking-wide">{label}</span>
      <span className="text-text-primary text-xl font-mono font-semibold mt-1">{value}</span>
      {quality && (
        <span
          className={cn('text-[10px] font-semibold uppercase mt-0.5', getQualityColor(quality))}
        >
          {getQualityLabel(quality)}
        </span>
      )}
    </div>
  );
}

function TimelineItem({ event }: { event: ChangeEvent }) {
  const config = CHANGE_ICONS[event.change_type] || CHANGE_ICONS.updated;
  const date = new Date(event.event_timestamp);

  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            'bg-charcoal-800 border border-border-subtle',
            config.color
          )}
        >
          {config.icon}
        </span>
        <div className="w-px flex-1 bg-border-subtle mt-1" />
      </div>
      <div className="pb-6">
        <p className="text-text-primary text-sm font-medium">{event.description}</p>
        <p className="text-text-muted text-xs mt-1">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' at '}
          {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        {event.old_value && event.new_value && (
          <p className="text-text-tertiary text-xs mt-1">
            <span className="line-through">{event.old_value}</span>
            {' \u2192 '}
            <span className="text-text-secondary">{event.new_value}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function teamSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function PlayerDetailClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // Support both /transfer-portal/player?id=X and /transfer-portal/X (via 200 rewrite)
  const pathSegment = pathname.split('/').filter(Boolean).pop();
  const playerId =
    searchParams.get('id') || (pathSegment !== 'player' ? pathSegment : null) || null;

  const [player, setPlayer] = useState<PortalEntry | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      setError('No player ID provided');
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/portal/player/${playerId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(res.status === 404 ? 'Player not found' : `Error ${res.status}`);
        return res.json() as Promise<PlayerResponse>;
      })
      .then(({ data, changes: ch }) => {
        setPlayer(data);
        setChanges(ch);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading player...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-midnight">
        <Container className="py-16">
          <Link
            href="/transfer-portal"
            className="text-burnt-orange text-sm hover:underline mb-6 inline-block"
          >
            &larr; Back to Portal
          </Link>
          <div className="text-center py-20">
            <p className="text-text-muted text-lg">{error || 'Player not found'}</p>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  const sport = player.sport as Sport;
  const isPitcher =
    player.position.includes('P') || player.position === 'LHP' || player.position === 'RHP';

  return (
    <div className="min-h-screen bg-midnight">
      <Container className="py-8 md:py-12">
        <Link
          href="/transfer-portal"
          className="text-burnt-orange text-sm hover:underline mb-6 inline-block"
        >
          &larr; Back to Portal
        </Link>

        {/* Player Header */}
        <div className="rounded-xl bg-gradient-to-br from-charcoal-800/50 to-charcoal-900/50 border border-border-subtle p-6 md:p-8 mb-6">
          <div className="flex items-start gap-5">
            <PositionIconContainer position={player.position} sport={sport} size="lg" />
            <div className="flex-grow min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                    {player.player_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-text-secondary text-sm">
                      {player.position} &middot; {player.class_year} &middot; {player.conference}
                    </span>
                    {player.stars && sport === 'football' && (
                      <StarRating stars={player.stars} size="sm" />
                    )}
                    {player.blaze_index != null && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-ember/15 text-ember"
                        title="Blaze Index: Composite score (0-100)"
                      >
                        {player.blaze_index}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  status={player.status}
                  size="lg"
                  variant={player.status === 'in_portal' ? 'glow' : 'default'}
                />
              </div>

              {/* Transfer path */}
              <div className="flex items-center gap-3 mt-4 text-base">
                <Link
                  href={`/transfer-portal/team/${teamSlug(player.school_from)}`}
                  className="text-text-secondary hover:text-burnt-orange transition-colors"
                >
                  {player.school_from}
                </Link>
                <svg
                  className="w-5 h-5 text-burnt-orange"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                </svg>
                {player.school_to ? (
                  <Link
                    href={`/transfer-portal/team/${teamSlug(player.school_to)}`}
                    className="text-success-light font-medium hover:underline"
                  >
                    {player.school_to}
                  </Link>
                ) : (
                  <span className="text-dust italic">TBD</span>
                )}
              </div>

              {/* Key dates */}
              <div className="flex gap-6 mt-4 text-xs text-text-muted">
                <span>
                  Entered:{' '}
                  {new Date(player.portal_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {player.commitment_date && (
                  <span>
                    Committed:{' '}
                    {new Date(player.commitment_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Stats + Source */}
          <div className="lg:col-span-2 space-y-6">
            {sport === 'baseball' && player.baseball_stats && (
              <div className="rounded-xl bg-charcoal-900/40 border border-border-subtle p-5">
                <h2 className="text-text-primary font-semibold mb-4">
                  {isPitcher ? 'Pitching Stats' : 'Hitting Stats'}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {isPitcher ? (
                    <>
                      {player.baseball_stats.era !== undefined && (
                        <StatBlock
                          label="ERA"
                          value={player.baseball_stats.era.toFixed(2)}
                          numericValue={player.baseball_stats.era}
                        />
                      )}
                      {player.baseball_stats.wins !== undefined &&
                        player.baseball_stats.losses !== undefined && (
                          <StatBlock
                            label="W-L"
                            value={`${player.baseball_stats.wins}-${player.baseball_stats.losses}`}
                          />
                        )}
                      {player.baseball_stats.strikeouts !== undefined && (
                        <StatBlock label="K" value={player.baseball_stats.strikeouts} />
                      )}
                      {player.baseball_stats.innings !== undefined && (
                        <StatBlock label="IP" value={player.baseball_stats.innings} />
                      )}
                      {player.baseball_stats.whip !== undefined && (
                        <StatBlock
                          label="WHIP"
                          value={player.baseball_stats.whip.toFixed(2)}
                          numericValue={player.baseball_stats.whip}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {player.baseball_stats.avg !== undefined && (
                        <StatBlock
                          label="AVG"
                          value={player.baseball_stats.avg.toFixed(3)}
                          numericValue={player.baseball_stats.avg}
                        />
                      )}
                      {player.baseball_stats.hr !== undefined && (
                        <StatBlock
                          label="HR"
                          value={player.baseball_stats.hr}
                          numericValue={player.baseball_stats.hr}
                        />
                      )}
                      {player.baseball_stats.rbi !== undefined && (
                        <StatBlock
                          label="RBI"
                          value={player.baseball_stats.rbi}
                          numericValue={player.baseball_stats.rbi}
                        />
                      )}
                      {player.baseball_stats.sb !== undefined && (
                        <StatBlock label="SB" value={player.baseball_stats.sb} />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {sport === 'football' && player.football_stats && (
              <div className="rounded-xl bg-charcoal-900/40 border border-border-subtle p-5">
                <h2 className="text-text-primary font-semibold mb-4">Stats</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {player.football_stats.pass_yards !== undefined && (
                    <StatBlock
                      label="PASS"
                      value={`${player.football_stats.pass_yards.toLocaleString()}`}
                    />
                  )}
                  {player.football_stats.pass_td !== undefined && (
                    <StatBlock label="P-TD" value={player.football_stats.pass_td} />
                  )}
                  {player.football_stats.rush_yards !== undefined && (
                    <StatBlock
                      label="RUSH"
                      value={`${player.football_stats.rush_yards.toLocaleString()}`}
                    />
                  )}
                  {player.football_stats.rush_td !== undefined && (
                    <StatBlock label="R-TD" value={player.football_stats.rush_td} />
                  )}
                  {player.football_stats.rec_yards !== undefined && (
                    <StatBlock
                      label="REC"
                      value={`${player.football_stats.rec_yards.toLocaleString()}`}
                    />
                  )}
                  {player.football_stats.rec_td !== undefined && (
                    <StatBlock label="R-TD" value={player.football_stats.rec_td} />
                  )}
                  {player.football_stats.tackles !== undefined && (
                    <StatBlock label="TKL" value={player.football_stats.tackles} />
                  )}
                  {player.football_stats.sacks !== undefined && (
                    <StatBlock label="SACK" value={player.football_stats.sacks} />
                  )}
                  {player.football_stats.interceptions !== undefined && (
                    <StatBlock label="INT" value={player.football_stats.interceptions} />
                  )}
                </div>
              </div>
            )}

            {/* Source attribution */}
            <div className="rounded-xl bg-charcoal-900/40 border border-border-subtle p-5">
              <h2 className="text-text-primary font-semibold mb-3">Source</h2>
              <div className="space-y-2 text-sm">
                {player.source && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Provider</span>
                    <span className="text-text-secondary">{player.source}</span>
                  </div>
                )}
                {player.source_url && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Link</span>
                    <a
                      href={player.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-burnt-orange hover:underline truncate ml-4"
                    >
                      {(() => {
                        try {
                          return new URL(player.source_url).hostname;
                        } catch {
                          return player.source_url;
                        }
                      })()}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Confidence</span>
                  <span className="text-text-secondary">
                    {Math.round(player.source_confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Verified</span>
                  <span className={player.verified ? 'text-success-light' : 'text-text-muted'}>
                    {player.verified ? 'Yes' : 'No'}
                  </span>
                </div>
                {player.last_verified_at && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Last checked</span>
                    <span className="text-text-tertiary">
                      {new Date(player.last_verified_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Timeline */}
          <div>
            <div className="rounded-xl bg-charcoal-900/40 border border-border-subtle p-5">
              <h2 className="text-text-primary font-semibold mb-4">Timeline</h2>
              {changes.length > 0 ? (
                <div>
                  {changes.map((ev) => (
                    <TimelineItem key={ev.id} event={ev} />
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">No timeline events yet.</p>
              )}
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
}
