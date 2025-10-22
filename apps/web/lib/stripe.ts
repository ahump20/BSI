import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY;

export const stripe = apiKey
  ? new Stripe(apiKey, {
      apiVersion: '2025-09-30.clover',
      appInfo: {
        name: 'Blaze Sports Intel',
        version: '1.0.0'
      }
    })
  : undefined;

export function assertStripeClient(): Stripe {
  if (!stripe) {
    throw new Error('Stripe client is not configured. Set STRIPE_SECRET_KEY via Vercel/Cloudflare secrets.');
  }
  return stripe;
}
