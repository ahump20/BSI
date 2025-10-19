'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { WatchlistEntityType, WatchlistItem, WatchlistCreateInput } from '@/app/watchlist-provider';
import { useWatchlist } from '@/app/watchlist-provider';

interface FormState {
  entityType: WatchlistEntityType;
  entityId: string;
  displayName: string;
  alertLeadChange: boolean;
  alertUpsetProbability: boolean;
}

const entityLabels: Record<WatchlistEntityType, string> = {
  TEAM: 'Team',
  GAME: 'Game'
};

function useOptionalAuth() {
  try {
    return useAuth();
  } catch {
    return { isSignedIn: false };
  }
}

export default function WatchlistPanel() {
  const { isSignedIn } = useOptionalAuth();
  const { items, loading, error, addItem, updateItem, removeItem } = useWatchlist();
  const [formState, setFormState] = useState<FormState>({
    entityType: 'TEAM',
    entityId: '',
    displayName: '',
    alertLeadChange: true,
    alertUpsetProbability: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!formState.entityId.trim()) {
      setFeedback('Enter a team or game identifier to watch.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: WatchlistCreateInput = {
        entityType: formState.entityType,
        entityId: formState.entityId.trim(),
        displayName: formState.displayName.trim() || undefined,
        alertLeadChange: formState.alertLeadChange,
        alertUpsetProbability: formState.alertUpsetProbability,
        alertGameStart: false
      };

      await addItem(payload);
      setFormState((prev) => ({
        ...prev,
        entityId: '',
        displayName: ''
      }));
      setFeedback('Watchlist entry saved.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to save watchlist entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: WatchlistItem, key: 'alertLeadChange' | 'alertUpsetProbability') => {
    try {
      await updateItem({ id: item.id, [key]: !item[key] });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to update alerts.');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeItem(id);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to remove watchlist entry.');
    }
  };

  if (!isSignedIn) {
    return (
      <article className="di-card">
        <h2>Sign in to manage your watchlist</h2>
        <p>Authenticate to pin teams or live games and wire alerts for leverage moments.</p>
      </article>
    );
  }

  return (
    <section className="di-card di-watchlist">
      <header className="di-watchlist__header">
        <div>
          <h2>Watchlist</h2>
          <p>Pin targets and tune alerts for lead changes or upset risk.</p>
        </div>
      </header>

      <form className="di-watchlist__form" onSubmit={handleSubmit}>
        <div className="di-form-row">
          <label className="di-field">
            <span>Type</span>
            <select
              value={formState.entityType}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, entityType: event.target.value as WatchlistEntityType }))
              }
            >
              {Object.entries(entityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="di-field">
            <span>{entityLabels[formState.entityType]} ID</span>
            <input
              value={formState.entityId}
              onChange={(event) => setFormState((prev) => ({ ...prev, entityId: event.target.value }))}
              placeholder={formState.entityType === 'TEAM' ? 'e.g. LSU' : 'e.g. 2025-05-20-lsu-vs-florida'}
            />
          </label>
        </div>
        <label className="di-field">
          <span>Display name (optional)</span>
          <input
            value={formState.displayName}
            onChange={(event) => setFormState((prev) => ({ ...prev, displayName: event.target.value }))}
            placeholder="Weekend rotation, Super Regional, etc."
          />
        </label>
        <div className="di-form-row di-form-row--toggles">
          <label className="di-toggle">
            <input
              type="checkbox"
              checked={formState.alertLeadChange}
              onChange={(event) => setFormState((prev) => ({ ...prev, alertLeadChange: event.target.checked }))}
            />
            <span>Lead change alerts</span>
          </label>
          <label className="di-toggle">
            <input
              type="checkbox"
              checked={formState.alertUpsetProbability}
              onChange={(event) => setFormState((prev) => ({ ...prev, alertUpsetProbability: event.target.checked }))}
            />
            <span>Upset probability spikes</span>
          </label>
        </div>
        <button type="submit" className="di-action" disabled={submitting}>
          {submitting ? 'Saving…' : 'Pin to watchlist'}
        </button>
      </form>

      {feedback && <p className="di-watchlist__feedback">{feedback}</p>}
      {error && <p className="di-watchlist__feedback di-watchlist__feedback--error">{error}</p>}

      <div className="di-watchlist__list" aria-live="polite">
        {loading ? (
          <p className="di-text-muted">Loading watchlist…</p>
        ) : items.length === 0 ? (
          <p className="di-text-muted">No teams or games pinned yet.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="di-watchlist__item">
                <div>
                  <span className="di-watchlist__label">{item.displayName ?? `${entityLabels[item.entityType]} ${item.entityId}`}</span>
                  <span className="di-watchlist__meta">{entityLabels[item.entityType]} · {item.entityId}</span>
                </div>
                <div className="di-watchlist__actions">
                  <label className="di-toggle">
                    <input
                      type="checkbox"
                      checked={item.alertLeadChange}
                      onChange={() => handleToggle(item, 'alertLeadChange')}
                    />
                    <span>Lead</span>
                  </label>
                  <label className="di-toggle">
                    <input
                      type="checkbox"
                      checked={item.alertUpsetProbability}
                      onChange={() => handleToggle(item, 'alertUpsetProbability')}
                    />
                    <span>Upset</span>
                  </label>
                  <button type="button" className="di-inline-link" onClick={() => handleRemove(item.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
