/**
 * Swing Chat Worker Handler
 * Proxies conversational AI requests to Claude API with swing context.
 */

import type { Env } from '../../shared/types';

interface ChatRequest {
  swingId: string;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export async function handleSwingChat(
  req: Request,
  env: Env,
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = (await req.json()) as ChatRequest;
    const { systemPrompt, messages } = body;

    if (!systemPrompt || !messages?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing systemPrompt or messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[swing/chat] Claude API error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = (await response.json()) as {
      content: { type: string; text: string }[];
    };

    const reply = result.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    return new Response(
      JSON.stringify({
        reply,
        meta: {
          source: 'BSI Swing Intelligence',
          fetched_at: new Date().toISOString(),
          timezone: 'America/Chicago',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('[swing/chat] error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'Chat service failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
