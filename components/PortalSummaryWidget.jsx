import React, { useMemo } from 'react';
import useSWR from 'swr';

const fetcher = async (url) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load portal activity');
  }
  return response.json();
};

function formatNilRange(range) {
  if (!Array.isArray(range) || range.length !== 2) {
    return 'N/A';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  return `${formatter.format(range[0])}–${formatter.format(range[1])}`;
}

export default function PortalSummaryWidget() {
  const { data, error, isLoading } = useSWR('/api/v1/portal/activity?limitTopMovers=3', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000
  });

  const summary = data?.data?.summary;

  const topMovers = useMemo(() => summary?.topMovers ?? [], [summary]);

  return (
    <section className="portal-summary-widget" aria-labelledby="portal-summary-title">
      <div className="portal-summary-widget__header">
        <div>
          <span className="portal-summary-widget__kicker">Transfer Portal Heat</span>
          <h3 id="portal-summary-title">Top Movers</h3>
        </div>
        <a className="portal-summary-widget__cta" href="/baseball/ncaab/portal">
          View heatmap →
        </a>
      </div>

      {error && (
        <p className="portal-summary-widget__error" role="alert">
          Portal feed temporarily unavailable. We will refresh after the nightly sync.
        </p>
      )}

      {isLoading && !data && !error && (
        <p className="portal-summary-widget__loading">Loading portal intel…</p>
      )}

      {!isLoading && !error && (
        <div className="portal-summary-widget__body">
          <dl className="portal-summary-widget__totals">
            <div>
              <dt>Entries</dt>
              <dd>{summary?.totalEntries ?? 0}</dd>
            </div>
            <div>
              <dt>Commitments</dt>
              <dd>{summary?.totalCommitments ?? 0}</dd>
            </div>
            <div>
              <dt>Net Score</dt>
              <dd>{summary?.netMovementScore ?? 0}</dd>
            </div>
          </dl>

          <ul className="portal-summary-widget__list">
            {topMovers.map((mover) => (
              <li key={mover.athlete}>
                <div className="portal-summary-widget__name-line">
                  <span className="portal-summary-widget__name">{mover.athlete}</span>
                  <span className="portal-summary-widget__meta">{mover.position} · {mover.class}</span>
                </div>
                <div className="portal-summary-widget__details">
                  <span>{mover.fromTeam} ➝ {mover.toTeam ?? 'TBD'}</span>
                  <span>{mover.conference}</span>
                  <span>{formatNilRange(mover.nilRange)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
