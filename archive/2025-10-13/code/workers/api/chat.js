// Cloudflare Worker function to handle chat requests with Claude Sonnet 4.5
export async function onRequest({ request, env }) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
        return new Response('Method not allowed', {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        const { message, conversationHistory = [] } = await request.json();

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // System prompt with site knowledge
        const systemPrompt = `You are the Blaze Sports Intel assistant, helping visitors navigate and use blazesportsintel.com.

**About Blaze Sports Intel:**
- Sports analytics platform covering MLB, NFL, NCAA Baseball, and Track & Field
- Focus: Measuring what matters (not just what's easy to quantify)
- Built from years of observation across Cardinals, Titans, Longhorns, and Grizzlies
- Provides real-time data, Monte Carlo simulations, and advanced analytics

**Site Structure:**
- Homepage (/) - Overview, features, hero section
- /analytics - Main analytics dashboard with live data
- /about - Founder story, why platform exists, team info
- /contact - Contact form and direct contact methods
- /privacy - Privacy policy
- /terms - Terms of service

**Key Features:**
- Monte Carlo simulations for playoff probabilities
- Live sports data integration (ESPN API, MLB Stats API, SportsDataIO)
- Multi-sport coverage with unified interface
- Advanced metrics: Pythagorean expectations, strength of schedule
- Real-time game updates

**Contact Information:**
- Email: ahump20@outlook.com
- Phone: (210) 273-5538
- Twitter/X: @BISportsIntel
- LinkedIn: Austin Humphrey

**Your Role:**
- Help visitors find pages and features
- Answer questions about analytics methodology
- Troubleshoot navigation issues
- Explain platform capabilities
- Be direct, professional, no BS (matching site tone)
- If you don't know something, say so - don't make up features

Keep responses concise (2-3 sentences max unless detailed explanation requested).`;

        // Build messages array
        const messages = [
            { role: 'user', content: systemPrompt },
            { role: 'assistant', content: 'Understood. I\'m the Blaze Sports Intel assistant. How can I help you navigate the platform or answer questions about our analytics?' },
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        // Call Anthropic API
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: messages
            })
        });

        if (!anthropicResponse.ok) {
            const error = await anthropicResponse.text();
            console.error('Anthropic API error:', error);
            throw new Error('Failed to get response from AI');
        }

        const data = await anthropicResponse.json();
        const assistantMessage = data.content[0].text;

        return new Response(JSON.stringify({
            message: assistantMessage,
            conversationId: data.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process chat message',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
