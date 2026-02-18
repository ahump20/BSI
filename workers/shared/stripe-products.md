# BSI Stripe Products

Create these in https://dashboard.stripe.com/products

## BSI Pro Consumer
- Monthly: $12/month → secret `STRIPE_PRICE_PRO_MONTHLY`
- Annual:  $99/year  → secret `STRIPE_PRICE_PRO_ANNUAL`
- Metadata on checkout session: `tier=pro`
- 14-day free trial included

## BSI Data API
- Price: $199/month → secret `STRIPE_PRICE_API`
- Metadata on checkout session: `tier=api`
- For B2B use: scouts, analysts, media partners

## BSI Embed License
- Price: $79/month → secret `STRIPE_PRICE_EMBED`
- Metadata on checkout session: `tier=embed`
- For publishers and fan sites embedding the live widget

## Secrets Required

Set via `wrangler secret put --env production --config workers/wrangler.toml`:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_PRO_MONTHLY
- STRIPE_PRICE_PRO_ANNUAL
- STRIPE_PRICE_API
- STRIPE_PRICE_EMBED
- RESEND_API_KEY

## Webhook Configuration
- Endpoint: https://blazesportsintel.com/webhooks/stripe
- Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- Signature verification via crypto.subtle HMAC-SHA256 (workers/shared/stripe-verify.ts)
