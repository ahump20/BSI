/**
 * Pages Function — /api/agent-health
 *
 * Lightweight agent pulse check for Pages-only deployments.
 */

import { ok, preflight } from './_utils';

export const onRequestGet: PagesFunction = async () => {
  return ok({
    active: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
};

export const onRequestOptions: PagesFunction = async () => preflight();
