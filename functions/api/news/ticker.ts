/**
 * Pages Function — /api/news/ticker
 *
 * Provides lightweight ticker items when the Worker route is unavailable.
 */

import { ok, preflight } from '../_utils';

export const onRequestGet: PagesFunction = async () => {
  return ok({
    items: [
      { id: '1', text: 'College Baseball scores updated live every 30 seconds' },
      { id: '2', text: 'MLB, NFL, and NBA coverage now available' },
      { id: '3', text: 'Real-time analytics powered by official data sources' },
    ],
  });
};

export const onRequestOptions: PagesFunction = async () => preflight();
