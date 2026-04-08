# Build Web Apps

Claude-native port of the OpenAI-curated `build-web-apps` bundle.

## Coverage

- Strong frontend execution for landing pages, app shells, and polished UI
- Vercel deployment workflow guidance
- React and Next.js performance guidance
- shadcn/ui composition and CLI workflow guidance
- Stripe integration routing and implementation guardrails
- Supabase and Postgres performance guidance
- Web interface design audits against current guidelines

## Included Skills

- `deploy-to-vercel`
- `frontend-skill`
- `react-best-practices`
- `shadcn-best-practices`
- `stripe-best-practices`
- `supabase-best-practices`
- `web-design-guidelines`

## MCP Servers

This plugin ships a plugin-local `.mcp.json` that points Claude Code at:

- `https://mcp.vercel.com`
- `https://mcp.stripe.com`
- `https://mcp.supabase.com/mcp`

Those servers still need to initialize successfully in the local Claude session. Use `/mcp` to confirm they are connected after enabling or reloading the plugin.

## Representative Prompts

- `Build a polished React landing page for our product and keep the layout restrained.`
- `Review this Next.js route for bundle and waterfall problems.`
- `Add a Stripe subscription flow and choose the right API surface.`
- `Audit this Postgres query path for Supabase performance issues.`
- `Deploy this repo to Vercel as a preview deployment.`
- `Review these UI files against current web interface guidelines.`
