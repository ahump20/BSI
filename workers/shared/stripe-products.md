# BSI Stripe Products

Create these in https://dashboard.stripe.com/products

## BSI Pro Consumer
- Price: $12/month (monthly) or $99/year (annual)
- Metadata on checkout session: `tier=pro`
- Success URL: https://blazesportsintel.com/pro/success?session_id={CHECKOUT_SESSION_ID}

## BSI Data API
- Price: $199/month
- Metadata on checkout session: `tier=api`
- For B2B use: scouts, analysts, media partners

## BSI Embed License
- Price: $79/month
- Metadata on checkout session: `tier=embed`
- For publishers and fan sites embedding the live widget

## Webhook Configuration
- Endpoint: https://blazesportsintel.com/webhooks/stripe
- Events: checkout.session.completed
- After creating, set STRIPE_WEBHOOK_SECRET in Cloudflare Worker secrets:
  wrangler secret put STRIPE_WEBHOOK_SECRET --config workers/wrangler.toml
