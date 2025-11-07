/**
 * CSRF Protection Middleware
 *
 * Prevents Cross-Site Request Forgery attacks using:
 * - Double Submit Cookie pattern
 * - Synchronizer Token pattern
 * - SameSite cookie attributes
 *
 * Features:
 * - Token generation and validation
 * - Configurable token lifetime
 * - Support for AJAX requests
 * - Integration with Cloudflare Workers
 */

import { getSecret } from './secrets';

export interface CSRFConfig {
  tokenLength?: number;
  cookieName?: string;
  headerName?: string;
  tokenLifetime?: number; // seconds
  ignoreMethods?: string[];
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'X-CSRF-Token',
  tokenLifetime: 3600, // 1 hour
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  sameSite: 'Strict',
  secure: true,
};

export interface CSRFToken {
  token: string;
  timestamp: number;
  signature: string;
}

/**
 * CSRF Protection Service
 */
export class CSRFProtection {
  private config: Required<CSRFConfig>;
  private secret: string | null = null;

  constructor(config: CSRFConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize CSRF protection (load secret)
   */
  async init(env?: any): Promise<void> {
    this.secret = (await getSecret('CSRF_SECRET', env, false)) || this.generateRandomSecret();
  }

  /**
   * Generate CSRF token
   */
  async generateToken(): Promise<string> {
    if (!this.secret) {
      throw new Error('CSRF protection not initialized. Call init() first.');
    }

    const tokenData: CSRFToken = {
      token: this.generateRandomToken(),
      timestamp: Date.now(),
      signature: '',
    };

    // Sign the token
    tokenData.signature = await this.signToken(tokenData);

    // Encode as base64
    return btoa(JSON.stringify(tokenData));
  }

  /**
   * Validate CSRF token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!this.secret) {
      throw new Error('CSRF protection not initialized. Call init() first.');
    }

    try {
      // Decode token
      const tokenData: CSRFToken = JSON.parse(atob(token));

      // Check timestamp (token lifetime)
      const age = (Date.now() - tokenData.timestamp) / 1000;
      if (age > this.config.tokenLifetime) {
        console.warn('[CSRF] Token expired:', { age, lifetime: this.config.tokenLifetime });
        return false;
      }

      // Verify signature
      const expectedSignature = await this.signToken(tokenData);
      const isValid = tokenData.signature === expectedSignature;

      if (!isValid) {
        console.warn('[CSRF] Invalid token signature');
      }

      return isValid;
    } catch (error) {
      console.error('[CSRF] Token validation error:', error);
      return false;
    }
  }

  /**
   * Validate request for CSRF
   */
  async validateRequest(request: Request): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const method = request.method.toUpperCase();

    // Skip validation for safe methods
    if (this.config.ignoreMethods.includes(method)) {
      return { valid: true };
    }

    // Get token from header
    const headerToken = request.headers.get(this.config.headerName);

    // Get token from cookie
    const cookieToken = this.getTokenFromCookie(request);

    if (!headerToken) {
      return {
        valid: false,
        error: `Missing CSRF token in ${this.config.headerName} header`,
      };
    }

    if (!cookieToken) {
      return {
        valid: false,
        error: `Missing CSRF token in ${this.config.cookieName} cookie`,
      };
    }

    // Double Submit Cookie: tokens must match
    if (headerToken !== cookieToken) {
      return {
        valid: false,
        error: 'CSRF token mismatch between header and cookie',
      };
    }

    // Validate token signature and expiration
    const isValid = await this.validateToken(headerToken);

    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid or expired CSRF token',
      };
    }

    return { valid: true };
  }

  /**
   * Create response with CSRF token cookie
   */
  async addTokenToResponse(response: Response): Promise<Response> {
    const token = await this.generateToken();

    const headers = new Headers(response.headers);

    // Set CSRF token cookie
    const cookieValue = this.createCookie(token);
    headers.append('Set-Cookie', cookieValue);

    // Also send token in response header for AJAX requests
    headers.set(this.config.headerName, token);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  /**
   * Create CSRF cookie string
   */
  private createCookie(token: string): string {
    const parts = [
      `${this.config.cookieName}=${token}`,
      `Max-Age=${this.config.tokenLifetime}`,
      `SameSite=${this.config.sameSite}`,
      'Path=/',
      'HttpOnly',
    ];

    if (this.config.secure) {
      parts.push('Secure');
    }

    return parts.join('; ');
  }

  /**
   * Get CSRF token from request cookie
   */
  private getTokenFromCookie(request: Request): string | null {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const csrfCookie = cookies.find((c) => c.startsWith(`${this.config.cookieName}=`));

    if (!csrfCookie) {
      return null;
    }

    return csrfCookie.substring(this.config.cookieName.length + 1);
  }

  /**
   * Sign token with HMAC
   */
  private async signToken(tokenData: CSRFToken): Promise<string> {
    if (!this.secret) {
      throw new Error('CSRF secret not initialized');
    }

    const data = `${tokenData.token}:${tokenData.timestamp}`;

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.secret);
      const messageData = encoder.encode(data);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    // Fallback for Node.js
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(data);
    return hmac.digest('base64');
  }

  /**
   * Generate random token
   */
  private generateRandomToken(): string {
    const bytes = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
  }

  /**
   * Generate random secret
   */
  private generateRandomSecret(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
  }
}

/**
 * CSRF Error
 */
export class CSRFError extends Error {
  statusCode = 403;

  constructor(message: string = 'CSRF validation failed') {
    super(message);
    this.name = 'CSRFError';
  }
}

/**
 * Middleware wrapper for CSRF protection
 */
export function withCSRF(
  handler: (request: Request, env: any, ctx: any) => Promise<Response>,
  config?: CSRFConfig
) {
  const csrf = new CSRFProtection(config);
  let initialized = false;

  return async (request: Request, env: any, ctx: any): Promise<Response> => {
    // Initialize CSRF protection
    if (!initialized) {
      await csrf.init(env);
      initialized = true;
    }

    // Validate CSRF token for unsafe methods
    const validation = await csrf.validateRequest(request);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: validation.error || 'CSRF validation failed',
          code: 'CSRF_VALIDATION_FAILED',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Call handler
    const response = await handler(request, env, ctx);

    // Add CSRF token to response for next request
    return csrf.addTokenToResponse(response);
  };
}

/**
 * Create CSRF error response
 */
export function createCSRFErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({
      error,
      code: 'CSRF_VALIDATION_FAILED',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Helper to extract CSRF token from response headers
 * (for use in client-side code)
 */
export function getCSRFTokenFromResponse(response: Response): string | null {
  return response.headers.get('X-CSRF-Token');
}
