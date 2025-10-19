'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import type {
  NilTier,
  PortalActivityResponse,
  PortalClass
} from '../../../../lib/portal';

const PortalHeatmapMap = dynamic(() => import('./PortalHeatmapMap'), {
  ssr: false,
  loading: () => <div className="portal-heatmap__map portal-heatmap__map--loading">Preparing map…</div>
});

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load portal activity');
  }
  return (await response.json()) as PortalActivityResponse;
};

function buildQuery(base: string, conference?: string, playerClass?: PortalClass, nilTier?: NilTier) {
  const url = new URL(base, typeof window === 'undefined' ? 'https://bsi.local' : window.location.origin);
  if (conference && conference !== 'ALL') {
    url.searchParams.set('conference', conference);
  }
  if (playerClass) {
    url.searchParams.set('class', playerClass);
  }
  if (nilTier) {
    url.searchParams.set('nilTier', nilTier);
  }
  return url.toString();
}

const NIL_OPTIONS: (NilTier | 'ALL')[] = ['ALL', 'Diamond', 'Platinum', 'Gold', 'Silver'];

const CLASS_OPTIONS: (PortalClass | 'ALL')[] = ['ALL', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

export default function PortalHeatmapPage() {
  const [conference, setConference] = useState<string>('ALL');
  const [playerClass, setPlayerClass] = useState<PortalClass | 'ALL'>('ALL');
  const [nilTier, setNilTier] = useState<NilTier | 'ALL'>('ALL');

  const { data, error, isLoading } = useSWR(
    () =>
      buildQuery(
        '/api/v1/portal/activity?limitTopMovers=6',
        conference,
        playerClass === 'ALL' ? undefined : playerClass,
        nilTier === 'ALL' ? undefined : nilTier
      ),
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false
    }
  );

  const summary = data?.data.summary;
  const heatmapPoints = data?.data.heatmap ?? [];
  const availableConferences = data?.filters.available.conferences ?? [];

  const totals = useMemo(() => {
    if (!summary) {
      return { entries: 0, commitments: 0, net: 0 };
    }
    return {
      entries: summary.totalEntries,
      commitments: summary.totalCommitments,
      net: summary.netMovementScore
    };
  }, [summary]);

  return (
    <main className="di-page">
      <section className="di-section portal-heatmap">
        <span className="di-kicker">Diamond Insights · Transfer Portal</span>
        <h1 className="di-page-title">Portal Movement Heatmap</h1>
        <p className="di-page-subtitle">
          Visualize how Division I roster movement clusters across the country. Filter by conference, eligibility class, and NIL
          tier to see where collectives are winning late fall commitments.
        </p>

        <div className="portal-heatmap__filters" role="region" aria-label="Portal filters">
          <label className="portal-heatmap__filter">
            <span>Conference</span>
            <select
              value={conference}
              onChange={(event) => setConference(event.target.value)}
            >
              <option value="ALL">All</option>
              {availableConferences.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="portal-heatmap__filter">
            <span>Class</span>
            <select
              value={playerClass}
              onChange={(event) => setPlayerClass(event.target.value as PortalClass | 'ALL')}
            >
              {CLASS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="portal-heatmap__filter">
            <span>NIL Tier</span>
            <select
              value={nilTier}
              onChange={(event) => setNilTier(event.target.value as NilTier | 'ALL')}
            >
              {NIL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="portal-heatmap__error" role="alert">
            We cannot load the portal feed right now. Please refresh or check back after the next sync window.
          </div>
        )}

        {!error && (
          <div className="portal-heatmap__grid">
            <article className="di-card portal-heatmap__card">
              <h2>Movement Density</h2>
              {isLoading && !data ? (
                <div className="portal-heatmap__map portal-heatmap__map--loading">Loading heatmap…</div>
              ) : (
                <PortalHeatmapMap points={heatmapPoints} />
              )}
            </article>

            <article className="di-card portal-heatmap__card">
              <h2>Summary</h2>
              <ul className="portal-heatmap__stats">
                <li>
                  <span className="portal-heatmap__stat-label">Entries</span>
                  <span className="portal-heatmap__stat-value">{totals.entries}</span>
                </li>
                <li>
                  <span className="portal-heatmap__stat-label">Commitments</span>
                  <span className="portal-heatmap__stat-value">{totals.commitments}</span>
                </li>
                <li>
                  <span className="portal-heatmap__stat-label">Net Score</span>
                  <span className="portal-heatmap__stat-value">{totals.net}</span>
                </li>
              </ul>
              <p className="portal-heatmap__meta">
                Last refresh: {summary?.lastRefresh ? new Date(summary.lastRefresh).toLocaleString() : 'Pending nightly sync'}
              </p>
            </article>

            <article className="di-card portal-heatmap__card portal-heatmap__card--wide">
              <header className="portal-heatmap__card-header">
                <h2>Top Movers</h2>
                <Link className="di-inline-link" href="/baseball/ncaab/standings">
                  Back to standings
                </Link>
              </header>
              {isLoading && !data ? (
                <p className="portal-heatmap__placeholder">Scanning portal updates…</p>
              ) : (
                <ul className="portal-heatmap__movers">
                  {summary?.topMovers.map((mover) => (
                    <li key={mover.athlete}>
                      <div className="portal-heatmap__mover-headline">
                        <span className="portal-heatmap__mover-name">{mover.athlete}</span>
                        <span className="portal-heatmap__mover-role">{mover.position} · {mover.class}</span>
                      </div>
                      <div className="portal-heatmap__mover-meta">
                        <span>{mover.fromTeam} ➝ {mover.toTeam ?? 'TBD'}</span>
                        <span>{mover.conference}</span>
                        <span>{mover.nilTier} tier</span>
                        <span>
                          {Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                            mover.nilRange[0]
                          )}
                          
                          –
                          
                          {Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                            mover.nilRange[1]
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="di-card portal-heatmap__card portal-heatmap__card--wide">
              <h2>Conference Pulse</h2>
              {isLoading && !data ? (
                <p className="portal-heatmap__placeholder">Loading conference pulse…</p>
              ) : (
                <ul className="portal-heatmap__conferences">
                  {summary?.conferences.map((conferenceSummary) => (
                    <li key={conferenceSummary.conference}>
                      <div className="portal-heatmap__conference-name">{conferenceSummary.conference}</div>
                      <div className="portal-heatmap__conference-stats">
                        <span>{conferenceSummary.commitments} commitments</span>
                        <span>{conferenceSummary.entries} entries</span>
                        <span>
                          Net {conferenceSummary.netDelta >= 0 ? '+' : ''}
                          {conferenceSummary.netDelta}
                        </span>
                      </div>
                      <p className="portal-heatmap__conference-headline">{conferenceSummary.headline}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
