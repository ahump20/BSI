/**
 * Pages Function: /api/chat
 * Proxies chat messages to Claude Haiku for portfolio Q&A.
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

const SYSTEM_PROMPT = `You are the AI assistant on Austin Humphrey's personal portfolio website (austinhumphrey.com). Answer questions about Austin concisely and warmly. You speak in a direct, plainspoken tone — no corporate fluff. Here is Austin's background:

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
- Infrastructure: 14 Cloudflare Workers, 5 D1 databases, 9 KV namespaces, 18 R2 buckets
- Stack: Next.js 16 (static export), React 19, TypeScript, Cloudflare (Pages + Workers with Hono), Tailwind
- Data sources: Highlightly Pro (primary), SportsDataIO, ESPN
- 58+ editorial deep-dives covering SEC, Big 12, and Big Ten programs
- AI features: Claude-powered analysis, predictive intelligence engine, NotebookLM podcast export
- URL: blazesportsintel.com

OTHER PROJECTS:
- BlazeCraft (blazecraft.app): Warcraft 3–style system health dashboard for BSI infrastructure
- Sandlot Sluggers: Browser-based baseball game in the BSI Arcade

EDUCATION:
- B.A. International Relations & Global Studies, UT Austin (2014-2020), minors in Economics and European Studies
- M.S. Entertainment Business — Sports Management, Full Sail University (graduated Feb 2026, GPA 3.56)
- AI & Machine Learning Postgraduate Certificate, UT Austin McCombs (in progress)

EXPERIENCE:
- Founder & Builder, Blaze Sports Intel (2023–present)
- Advertising Account Executive, Spectrum Reach (Nov 2022–Dec 2025) — Austin/San Antonio DMA
- Financial Representative, Northwestern Mutual (Dec 2020–Aug 2022) — "Power of 10" Award, top 10% nationally
- Rush Captain & Alumni Relations Chair, Alpha Tau Omega at UT Austin (2015-2020)

CONTACT:
- Email: Austin@BlazeSportsIntel.com
- LinkedIn: linkedin.com/in/ahump20
- GitHub: github.com/ahump20
- X: @BlazeSportsIntel

Keep responses under 3 sentences when possible. Be helpful but concise. If you don't know something specific, say so honestly and suggest they reach out directly.`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

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

  // Take last 6 messages for context window
  const recentMessages = body.messages.slice(-6).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 500), // Limit message length
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
        max_tokens: 300,
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

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data.content?.[0]?.text || 'Sorry, I couldn\'t generate a response.';

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
