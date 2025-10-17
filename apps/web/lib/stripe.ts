import Stripe from 'stripe';

type BillingInterval = 'monthly' | 'annual';

type StripeProductCache = {
  productId: string;
  monthlyPriceId: string;
  annualPriceId: string;
  updatedAt: number;
};

let stripeClient: Stripe | null = null;
let cachedProducts: StripeProductCache | null = null;

function getStripeClient() {
  if (!stripeClient) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(secret, { apiVersion: '2024-09-30' });
  }
  return stripeClient;
}

export async function ensureStripeProducts(): Promise<StripeProductCache> {
  if (cachedProducts) {
    return cachedProducts;
  }

  const stripe = getStripeClient();
  const productName = 'BSI Pro';

  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find((item) => item.name === productName);

  if (!product) {
    product = await stripe.products.create({
      name: productName,
      description: 'Diamond Pro subscription unlocking advanced scouting and recruiting analytics.',
      metadata: {
        tier: 'diamond_pro'
      }
    });
  }

  const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true });

  let monthly = prices.data.find((price) => price.recurring?.interval === 'month');
  if (!monthly) {
    monthly = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: 499,
      recurring: { interval: 'month' },
      metadata: {
        tier: 'diamond_pro',
        cadence: 'monthly'
      }
    });
  }

  let annual = prices.data.find((price) => price.recurring?.interval === 'year');
  if (!annual) {
    annual = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: 4999,
      recurring: { interval: 'year' },
      metadata: {
        tier: 'diamond_pro',
        cadence: 'annual'
      }
    });
  }

  cachedProducts = {
    productId: product.id,
    monthlyPriceId: monthly.id,
    annualPriceId: annual.id,
    updatedAt: Date.now()
  };

  return cachedProducts;
}

export async function createProCheckoutSession(options: {
  userId: string;
  email?: string;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const products = await ensureStripeProducts();
  const priceId = options.billingInterval === 'annual' ? products.annualPriceId : products.monthlyPriceId;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    allow_promotion_codes: true,
    client_reference_id: options.userId,
    customer_email: options.email,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      auth0UserId: options.userId,
      billingInterval: options.billingInterval,
      tier: 'diamond_pro'
    }
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return session;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

export function getStripeClientForWebhook() {
  return getStripeClient();
}

export type { BillingInterval };
