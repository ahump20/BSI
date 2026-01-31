// BSI Auth + Stripe Webhook Handler
// Deploy to Cloudflare Workers
// Bindings required: D1 database (BSI_DB), KV namespace (BSI_SESSIONS), Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// JWT utilities
async function signJWT(payload, secret, expiresIn = '7d') {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const exp = Math.floor(Date.now() / 1000) + (expiresIn === '7d' ? 604800 : 3600);
  const tokenPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(`${header}.${payload}`)
    );
    
    if (!valid) return null;
    
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    
    return decoded;
  } catch {
    return null;
  }
}

// Password hashing
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, storedHash] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

// Stripe utilities
async function createStripeCustomer(email, name, env) {
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ email, name }),
  });
  return response.json();
}

async function verifyStripeWebhook(payload, signature, secret) {
  const encoder = new TextEncoder();
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  
  const signedPayload = `${timestamp}.${payload}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const computedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedSig === expectedSig;
}

// Main handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    try {
      // Auth routes
      if (path === '/api/auth/signup' && request.method === 'POST') {
        return handleSignup(request, env);
      }
      
      if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env);
      }
      
      if (path === '/api/auth/logout' && request.method === 'POST') {
        return handleLogout(request, env);
      }
      
      if (path === '/api/auth/me' && request.method === 'GET') {
        return handleGetUser(request, env);
      }
      
      if (path === '/api/auth/google' && request.method === 'GET') {
        return handleGoogleAuth(request, env);
      }
      
      if (path === '/api/auth/google/callback' && request.method === 'GET') {
        return handleGoogleCallback(request, env);
      }
      
      // Stripe routes
      if (path === '/api/stripe/webhook' && request.method === 'POST') {
        return handleStripeWebhook(request, env);
      }
      
      if (path === '/api/stripe/create-checkout' && request.method === 'POST') {
        return handleCreateCheckout(request, env);
      }
      
      if (path === '/api/stripe/create-portal' && request.method === 'POST') {
        return handleCreatePortal(request, env);
      }
      
      if (path === '/api/subscription/status' && request.method === 'GET') {
        return handleSubscriptionStatus(request, env);
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};

// Auth handlers
async function handleSignup(request, env) {
  const { email, password, firstName, lastName } = await request.json();
  
  if (!email || !password || !firstName || !lastName) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  // Check if user exists
  const existing = await env.BSI_DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();
  
  if (existing) {
    return new Response(JSON.stringify({ error: 'Email already registered' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  // Create Stripe customer
  const stripeCustomer = await createStripeCustomer(email, `${firstName} ${lastName}`, env);
  
  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  
  await env.BSI_DB.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, stripe_customer_id, tier, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'free', datetime('now'))
  `).bind(userId, email.toLowerCase(), passwordHash, firstName, lastName, stripeCustomer.id).run();
  
  // Generate JWT
  const token = await signJWT({ userId, email: email.toLowerCase(), tier: 'free' }, env.JWT_SECRET);
  
  return new Response(JSON.stringify({
    success: true,
    user: { id: userId, email: email.toLowerCase(), firstName, lastName, tier: 'free' },
    token,
  }), {
    status: 201,
    headers: { 
      'Content-Type': 'application/json',
      'Set-Cookie': `bsi_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
      ...CORS_HEADERS,
    },
  });
}

async function handleLogin(request, env) {
  const { email, password } = await request.json();
  
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Missing email or password' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const user = await env.BSI_DB.prepare(
    'SELECT id, email, password_hash, first_name, last_name, tier FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();
  
  if (!user || !await verifyPassword(password, user.password_hash)) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const token = await signJWT({ userId: user.id, email: user.email, tier: user.tier }, env.JWT_SECRET);
  
  return new Response(JSON.stringify({
    success: true,
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, tier: user.tier },
    token,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `bsi_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
      ...CORS_HEADERS,
    },
  });
}

async function handleLogout(request, env) {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'bsi_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      ...CORS_HEADERS,
    },
  });
}

async function handleGetUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  
  let token;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    token = cookies.bsi_token;
  }
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const user = await env.BSI_DB.prepare(
    'SELECT id, email, first_name, last_name, tier, stripe_customer_id FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  return new Response(JSON.stringify({
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, tier: user.tier },
  }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Google OAuth handlers
async function handleGoogleAuth(request, env) {
  const state = crypto.randomUUID();
  await env.BSI_SESSIONS.put(`oauth_state:${state}`, 'valid', { expirationTtl: 600 });
  
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: 'https://blazesportsintel.com/api/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  // Verify state
  const validState = await env.BSI_SESSIONS.get(`oauth_state:${state}`);
  if (!validState) {
    return Response.redirect('https://blazesportsintel.com/login?error=invalid_state', 302);
  }
  await env.BSI_SESSIONS.delete(`oauth_state:${state}`);
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://blazesportsintel.com/api/auth/google/callback',
      grant_type: 'authorization_code',
    }),
  });
  
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) {
    return Response.redirect('https://blazesportsintel.com/login?error=token_exchange_failed', 302);
  }
  
  // Get user info
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser = await userInfoResponse.json();
  
  // Check if user exists
  let user = await env.BSI_DB.prepare(
    'SELECT id, email, first_name, last_name, tier FROM users WHERE email = ?'
  ).bind(googleUser.email.toLowerCase()).first();
  
  if (!user) {
    // Create new user
    const stripeCustomer = await createStripeCustomer(googleUser.email, googleUser.name, env);
    const userId = crypto.randomUUID();
    
    await env.BSI_DB.prepare(`
      INSERT INTO users (id, email, first_name, last_name, stripe_customer_id, tier, google_id, created_at)
      VALUES (?, ?, ?, ?, ?, 'free', ?, datetime('now'))
    `).bind(userId, googleUser.email.toLowerCase(), googleUser.given_name || '', googleUser.family_name || '', stripeCustomer.id, googleUser.id).run();
    
    user = { id: userId, email: googleUser.email.toLowerCase(), first_name: googleUser.given_name, last_name: googleUser.family_name, tier: 'free' };
  }
  
  const token = await signJWT({ userId: user.id, email: user.email, tier: user.tier }, env.JWT_SECRET);
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: 'https://blazesportsintel.com/dashboard',
      'Set-Cookie': `bsi_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    },
  });
}

// Stripe handlers
async function handleStripeWebhook(request, env) {
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();
  
  const isValid = await verifyStripeWebhook(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      // Determine tier from price
      const subscription = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      }).then(r => r.json());
      
      const priceId = subscription.items.data[0].price.id;
      let tier = 'free';
      if (priceId === 'price_1SXBctLvpRBk20R2RhbpkJwo') tier = 'pro';
      if (priceId === 'price_1SXBemLvpRBk20R2n81pZ7T5') tier = 'enterprise';
      
      await env.BSI_DB.prepare(
        'UPDATE users SET tier = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?'
      ).bind(tier, subscriptionId, customerId).run();
      
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;
      
      if (status === 'active') {
        const priceId = subscription.items.data[0].price.id;
        let tier = 'free';
        if (priceId === 'price_1SXBctLvpRBk20R2RhbpkJwo') tier = 'pro';
        if (priceId === 'price_1SXBemLvpRBk20R2n81pZ7T5') tier = 'enterprise';
        
        await env.BSI_DB.prepare(
          'UPDATE users SET tier = ? WHERE stripe_customer_id = ?'
        ).bind(tier, customerId).run();
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      await env.BSI_DB.prepare(
        'UPDATE users SET tier = ?, stripe_subscription_id = NULL WHERE stripe_customer_id = ?'
      ).bind('free', customerId).run();
      
      break;
    }
    
    case 'invoice.paid': {
      // Subscription renewal successful - no action needed, subscription remains active
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      
      // Could send email notification here or update user status
      console.log(`Payment failed for customer ${customerId}`);
      break;
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCreateCheckout(request, env) {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  
  let token;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    token = cookies.bsi_token;
  }
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const user = await env.BSI_DB.prepare(
    'SELECT stripe_customer_id FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  const { priceId } = await request.json();
  
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: user.stripe_customer_id,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: 'https://blazesportsintel.com/dashboard?checkout=success',
      cancel_url: 'https://blazesportsintel.com/pricing?checkout=cancelled',
    }),
  });
  
  const session = await response.json();
  
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function handleCreatePortal(request, env) {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  
  let token;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    token = cookies.bsi_token;
  }
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const user = await env.BSI_DB.prepare(
    'SELECT stripe_customer_id FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: user.stripe_customer_id,
      return_url: 'https://blazesportsintel.com/dashboard',
    }),
  });
  
  const session = await response.json();
  
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function handleSubscriptionStatus(request, env) {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  
  let token;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    token = cookies.bsi_token;
  }
  
  if (!token) {
    return new Response(JSON.stringify({ tier: 'free', authenticated: false }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return new Response(JSON.stringify({ tier: 'free', authenticated: false }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  const user = await env.BSI_DB.prepare(
    'SELECT tier FROM users WHERE id = ?'
  ).bind(payload.userId).first();
  
  return new Response(JSON.stringify({ tier: user?.tier || 'free', authenticated: true }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
