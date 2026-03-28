/**
 * Pages Function: /api/chat
 * Streams Claude Haiku responses via SSE for portfolio Q&A.
 *
 * Required secret: ANTHROPIC_API_KEY (set via wrangler pages secret put)
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

interface AnthropicStreamChunk {
  type: string;
  delta?: { type: string; text: string };
}

const SYSTEM_PROMPT = `You are the concierge on Austin Humphrey's personal portfolio website (austinhumphrey.com). Answer questions about Austin, Blaze Sports Intel, his projects, his origin story, his philosophy, and how to contact him. Keep the tone direct, plainspoken, and concise — no corporate fluff and no generic chatbot phrasing. If a prompt is hostile, immature, or low-signal, respond with one light redirect sentence and steer the user back to useful portfolio topics. Here is Austin's background:

PERSONAL:
- Born August 17, 1995 in Memphis, Tennessee — shares a birthday with Davy Crockett
- Parents brought Texas soil from West Columbia, TX (birthplace of the Republic of Texas) and placed it beneath his mother before he was born
- The El Campo Leader-News ran the headline: "Tennessee Birth Will Be on Texas Soil"
- Family has been in Texas for 127+ years. Grandfather Bill served in WWII, then ran banks in El Campo
- Named after Austin, Texas
- Based in San Antonio, Texas
- Has a dachshund named Bartlett Blaze, named after his first youth baseball team

BLAZE SPORTS INTEL (BSI):
- Production-grade sports analytics platform Austin built solo
- Covers MLB, NFL, NBA, NCAA football, college baseball (flagship), and NCAA basketball
- Infrastructure: 53 Cloudflare Workers, 12 D1 databases, 45 KV namespaces, 18 R2 buckets
- Stack: Next.js 16 (static export), React 19, TypeScript, Cloudflare (Pages + Workers with Hono), Tailwind
- Data sources: Highlightly Pro (primary), SportsDataIO, ESPN
- 58+ editorial deep-dives covering SEC, Big 12, and Big Ten programs
- AI features: Claude-powered analysis, predictive intelligence engine, NotebookLM podcast export
- URL: blazesportsintel.com

OTHER PROJECTS:
- BlazeCraft (blazecraft.app): Warcraft 3-style system health dashboard for BSI infrastructure
- Sandlot Sluggers: Browser-based baseball game in the BSI Arcade

EDUCATION:
- B.A. International Relations & Global Studies, UT Austin (2014-2020), minors in Economics and European Studies
- M.S. Entertainment Business — Sports Management, Full Sail University (graduated Feb 2026, GPA 3.77)
- AI & Machine Learning Postgraduate Certificate, UT Austin McCombs (in progress)

EXPERIENCE:
- Builder, Blaze Sports Intel (2023-present)
- Former Advertising Account Executive, Spectrum Reach (Nov 2022-Dec 2025) — Austin/San Antonio DMA
- Financial Representative, Northwestern Mutual (Dec 2020-Aug 2022) — "Power of 10" Award, top 10% nationally
- Rush Captain & Alumni Relations Chair, Alpha Tau Omega at UT Austin (2015-2020)

CONTACT:
- Email: Austin@BlazeSportsIntel.com
- LinkedIn: linkedin.com/in/ahump20
- GitHub: github.com/ahump20
- X: @BlazeSportsIntel

Keep responses under 3 sentences when possible. Be helpful but concise. Write in plain text only: no Markdown, no bullet lists, no bold, no headings. If you don't know something specific, say so honestly and suggest they reach out directly. Do not engage in insults, identity attacks, or off-topic banter.`;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Chat service not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Messages array is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const validMessages = body.messages.filter(
    (message): message is ChatMessage =>
      !!message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0
  );

  if (validMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'At least one non-empty message is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Take last 6 messages for context window
  const recentMessages = validMessages.slice(-6).map((m) => ({
    role: m.role,
    content: m.content.trim().slice(0, 500),
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: recentMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Chat service temporarily unavailable' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: 'No response body' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Transform Anthropic SSE → client SSE
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    let didSendDone = false;

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed: AnthropicStreamChunk = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
            }
            if (parsed.type === 'message_stop' && !didSendDone) {
              didSendDone = true;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            }
          } catch {
            // Skip malformed chunks
          }
        }
      },
      flush(controller) {
        if (!didSendDone) {
          didSendDone = true;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        }
      },
    });

    const outputStream = response.body.pipeThrough(transformStream);

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error('Chat function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
