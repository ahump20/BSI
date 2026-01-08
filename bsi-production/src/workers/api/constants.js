/**
 * BSI API Constants
 * Centralized configuration for API endpoints and settings
 */

// External API base URLs
export const SPORTSDATAIO_BASE = 'https://api.sportsdata.io/v3';
export const COLLEGEFOOTBALL_BASE = 'https://api.collegefootballdata.com';
export const SPORTSRADAR_BASE = 'https://api.sportradar.com';
export const THEODDS_BASE = 'https://api.the-odds-api.com/v4';
export const STRIPE_API_BASE = 'https://api.stripe.com/v1';

// Stripe Price IDs (Production)
export const STRIPE_PRICES = {
  pro: 'price_1SX9voLvpRBk20R2pW0AjUIv',         // $29/mo
  enterprise: 'price_1SX9w7LvpRBk20R2DJkKAH3y'   // $199/mo
};

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  scores: 60,        // 1 minute for live scores
  standings: 3600,   // 1 hour for standings
  stats: 300,        // 5 minutes for player stats
  odds: 120,         // 2 minutes for odds
  cfb: 600,          // 10 minutes for college football
};

// CORS headers for API responses
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
    'Access-Control-Allow-Credentials': 'true',
  };
}
