/**
 * Social Card Generator
 * Generates Heritage-styled stat cards as SVG → stores in R2 → returns shareable URL.
 *
 * POST /api/social-cards/generate — create a new card
 * GET  /api/social-cards/:id — serve a stored card from R2
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';

interface SocialCardPayload {
  statLabel: string;
  statValue: string;
  playerName?: string;
  teamName?: string;
  sport?: string;
}

function generateCardSVG(payload: SocialCardPayload): string {
  const { statLabel, statValue, playerName, teamName } = payload;
  const isTexas = teamName?.toLowerCase().includes('texas') || teamName?.toLowerCase().includes('longhorn');

  // Heritage Design System colors
  const bg = '#0D0D0D'; // midnight
  const accent = '#BF5700'; // burnt-orange
  const text = '#F5F2EB'; // bsi-bone
  const muted = '#C4B8A5'; // bsi-dust
  const surface = '#161616'; // dugout

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${bg}" />
  <rect x="40" y="40" width="1000" height="1000" rx="16" fill="${surface}" stroke="${accent}" stroke-width="2" opacity="0.6" />

  <!-- Corner marks -->
  <line x1="60" y1="80" x2="100" y2="80" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="60" y1="80" x2="60" y2="120" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="1020" y1="80" x2="980" y2="80" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="1020" y1="80" x2="1020" y2="120" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="60" y1="1000" x2="100" y2="1000" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="60" y1="1000" x2="60" y2="960" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="1020" y1="1000" x2="980" y2="1000" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
  <line x1="1020" y1="1000" x2="1020" y2="960" stroke="${accent}" stroke-width="1.5" opacity="0.4" />

  <!-- Stat label -->
  <text x="540" y="340" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="600" fill="${muted}" letter-spacing="4" text-transform="uppercase">
    ${escapeXml(statLabel.toUpperCase())}
  </text>

  <!-- Stat value -->
  <text x="540" y="520" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="160" font-weight="800" fill="${accent}">
    ${escapeXml(statValue)}
  </text>

  <!-- Player name -->
  ${playerName ? `<text x="540" y="640" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="600" fill="${text}">
    ${escapeXml(playerName)}
  </text>` : ''}

  <!-- Team name -->
  ${teamName ? `<text x="540" y="690" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="${muted}">
    ${escapeXml(teamName)}
  </text>` : ''}

  <!-- Top accent line -->
  <rect x="440" y="260" width="200" height="3" rx="1.5" fill="${accent}" opacity="0.6" />

  <!-- BSI branding -->
  <text x="540" y="920" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="${muted}" letter-spacing="3" opacity="0.7">
    ${isTexas ? 'BSI TEXAS INTELLIGENCE' : 'BSI'}
  </text>
  <text x="540" y="950" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${muted}" opacity="0.5">
    blazesportsintel.com
  </text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function handleSocialCardGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const payload = (await request.json()) as SocialCardPayload;

    if (!payload.statLabel || !payload.statValue) {
      return json({ error: 'statLabel and statValue are required' }, 400);
    }

    if (payload.statLabel.length > 100 || payload.statValue.length > 50) {
      return json({ error: 'Field too long' }, 400);
    }

    const cardId = crypto.randomUUID().slice(0, 12);
    const svg = generateCardSVG(payload);

    // Store in R2
    const r2Key = `social-cards/${cardId}.svg`;
    if (env.ASSETS_BUCKET) {
      await env.ASSETS_BUCKET.put(r2Key, svg, {
        httpMetadata: { contentType: 'image/svg+xml' },
        customMetadata: {
          statLabel: payload.statLabel,
          statValue: payload.statValue,
          playerName: payload.playerName || '',
          teamName: payload.teamName || '',
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Also cache the metadata in KV for quick lookup
    if (env.KV) {
      await env.KV.put(
        `social-card:${cardId}`,
        JSON.stringify({
          ...payload,
          cardId,
          r2Key,
          createdAt: new Date().toISOString(),
        }),
        { expirationTtl: 86400 * 30 }, // 30 days
      );
    }

    const cardUrl = `https://blazesportsintel.com/api/social-cards/${cardId}`;

    return json({
      success: true,
      cardId,
      url: cardUrl,
      meta: {
        source: 'BSI Social Cards',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (err) {
    console.error('[social-cards/generate] error:', err instanceof Error ? err.message : err);
    return json({ error: 'Failed to generate social card' }, 500);
  }
}

export async function handleSocialCardGet(cardId: string, env: Env): Promise<Response> {
  try {
    // Try R2 first
    if (env.ASSETS_BUCKET) {
      const object = await env.ASSETS_BUCKET.get(`social-cards/${cardId}.svg`);
      if (object) {
        return new Response(object.body, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    return json({ error: 'Card not found' }, 404);
  } catch (err) {
    console.error('[social-cards/get] error:', err instanceof Error ? err.message : err);
    return json({ error: 'Failed to retrieve card' }, 500);
  }
}
