import { DurableObject } from 'cloudflare:workers';
import type { AgentEnv } from './types';

/**
 * BaseballChatAgent — Durable Object stub.
 *
 * Minimal DO that satisfies the wrangler.toml binding (new_sqlite_classes).
 * Full AI chat functionality via Agents SDK to be added in a future session.
 */
export class BaseballChatAgent extends DurableObject<AgentEnv> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({
        service: 'bsi-baseball-agent-do',
        status: 'ok',
        mode: 'stub',
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json(
      {
        message: 'BSI Baseball Agent is under construction. Check back soon.',
        status: 'stub',
      },
      { status: 503 },
    );
  }
}
