import { describe, expect, it } from 'vitest';

import {
  extractClaudeText,
  extractGeminiText,
  handleGameAnalysis,
  parseJsonResponse,
} from '../../workers/handlers/ai';

describe('worker game analysis helpers', () => {
  it('extracts the first Claude text block', () => {
    const text = extractClaudeText({
      content: [
        { type: 'thinking', text: 'hidden' },
        { type: 'text', text: 'College baseball insight' },
      ],
    });

    expect(text).toBe('College baseball insight');
  });

  it('throws when Claude returns no text block', () => {
    expect(() =>
      extractClaudeText({
        content: [{ type: 'tool_use', text: '' }],
      }),
    ).toThrow('Claude API returned no text blocks');
  });

  it('extracts the first Gemini text part', () => {
    const text = extractGeminiText({
      candidates: [
        {
          content: {
            parts: [{ text: 'Gemini analysis' }],
          },
        },
      ],
    });

    expect(text).toBe('Gemini analysis');
  });

  it('throws when Gemini returns no text part', () => {
    expect(() =>
      extractGeminiText({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      }),
    ).toThrow('Gemini API returned no text parts');
  });

  it('surfaces invalid upstream JSON cleanly', async () => {
    const response = new Response('not-json', {
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseJsonResponse(response, 'Claude')).rejects.toThrow(
      'Claude API returned invalid JSON',
    );
  });

  it('surfaces empty upstream responses cleanly', async () => {
    const response = new Response('', {
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseJsonResponse(response, 'Gemini')).rejects.toThrow(
      'Gemini API returned an empty response body',
    );
  });
});

describe('POST /api/ai/game-analysis', () => {
  it('returns 503 when Claude is not configured on the Worker', async () => {
    const response = await handleGameAnalysis(
      new Request('https://blazesportsintel.com/api/ai/game-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude',
          prompt: 'Break down the game',
          gameContext: 'Texas 5, LSU 4 in the 8th.',
        }),
      }),
      { KV: {} } as any,
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Claude API not configured — set ANTHROPIC_API_KEY in Worker secrets',
    });
  });
});
