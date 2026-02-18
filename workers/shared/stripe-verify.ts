/**
 * Stripe webhook signature verification for Cloudflare Workers.
 *
 * Uses crypto.subtle (Web Crypto API) instead of Node.js crypto.
 * Implements timing-safe comparison to prevent timing attacks.
 *
 * Stripe signature header format:
 *   t=<timestamp>,v1=<signature>[,v1=<signature2>]
 */

const WEBHOOK_TOLERANCE_SECONDS = 300; // 5 minutes

interface ParsedSignature {
  timestamp: string;
  signatures: string[];
}

function parseSignatureHeader(header: string): ParsedSignature | null {
  const parts = header.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=', 2);
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

/**
 * Timing-safe comparison of two hex strings.
 * XORs all bytes and checks if result is zero — takes constant time
 * regardless of where the strings differ.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify a Stripe webhook signature against the raw body.
 *
 * @param payload  Raw request body (string)
 * @param sigHeader  Value of the `stripe-signature` header
 * @param secret  Webhook signing secret (whsec_...)
 * @returns true if signature is valid and timestamp is within tolerance
 */
export async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parsed = parseSignatureHeader(sigHeader);
  if (!parsed) return false;

  // Check timestamp freshness (prevent replay attacks)
  const timestampSec = parseInt(parsed.timestamp, 10);
  if (isNaN(timestampSec)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestampSec) > WEBHOOK_TOLERANCE_SECONDS) return false;

  // Compute expected HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const signedPayload = `${parsed.timestamp}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const computedHex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Check against all v1 signatures (Stripe may include multiple)
  for (const expected of parsed.signatures) {
    if (timingSafeEqual(computedHex, expected)) return true;
  }

  return false;
}
