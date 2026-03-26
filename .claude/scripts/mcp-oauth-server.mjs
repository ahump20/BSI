#!/usr/bin/env node
/**
 * MCP OAuth Server-only Script
 * Starts the callback server and registers the client, then waits.
 * The browser navigation is handled externally (by Playwright).
 * Outputs the AUTH_URL for the caller to navigate to.
 */

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const serverUrl = process.argv[2];
const callbackPort = parseInt(process.argv[3] || '19876', 10);

if (!serverUrl) {
  console.error('Usage: node mcp-oauth-server.mjs <server-url> [callback-port]');
  process.exit(1);
}

const url = new URL(serverUrl);
const baseUrl = `${url.protocol}//${url.host}`;

async function main() {
  // Discover
  const discoveryRes = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
  const discovery = await discoveryRes.json();

  // Register client
  const redirectUri = `http://localhost:${callbackPort}/oauth/callback`;
  const regRes = await fetch(discovery.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_name: 'MCP CLI Proxy'
    })
  });
  const client = await regRes.json();

  // PKCE
  const codeVerifier = crypto.randomBytes(32).toString('base64url').slice(0, 43);
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  // Auth URL
  const state = crypto.randomBytes(16).toString('hex');
  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });
  const authUrl = `${discovery.authorization_endpoint}?${authParams}`;

  // Start callback server
  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${callbackPort}`);
    if (reqUrl.pathname === '/oauth/callback') {
      const code = reqUrl.searchParams.get('code');
      const error = reqUrl.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Error: ' + error);
        console.log(JSON.stringify({ status: 'error', error }));
        setTimeout(() => process.exit(1), 100);
        return;
      }

      try {
        const tokenRes = await fetch(discovery.token_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: client.client_id,
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier
          })
        });
        const tokens = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(JSON.stringify(tokens));

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Success!</h1><p>You can close this tab.</p></body></html>');

        // Save tokens
        const urlHash = crypto.createHash('md5').update(serverUrl).digest('hex');
        for (const ver of ['mcp-remote-0.1.37', 'mcp-remote-0.1.38']) {
          const dir = path.join(process.env.HOME, '.mcp-auth', ver);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `${urlHash}_client_info.json`), JSON.stringify({
            redirect_uris: [redirectUri], token_endpoint_auth_method: 'none',
            grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
            client_name: 'MCP CLI Proxy', client_id: client.client_id,
            client_id_issued_at: client.client_id_issued_at
          }, null, 2), { mode: 0o600 });
          fs.writeFileSync(path.join(dir, `${urlHash}_code_verifier.txt`), codeVerifier, { mode: 0o600 });
          fs.writeFileSync(path.join(dir, `${urlHash}_tokens.json`), JSON.stringify(tokens, null, 2), { mode: 0o600 });
        }

        console.log(JSON.stringify({ status: 'success', urlHash, scopes: tokens.scope }));
        setTimeout(() => process.exit(0), 100);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(e.message);
        console.log(JSON.stringify({ status: 'error', error: e.message }));
        setTimeout(() => process.exit(1), 100);
      }
    }
  });

  server.listen(callbackPort, () => {
    // Output the auth URL as the first line, machine-readable
    console.log(JSON.stringify({ status: 'ready', authUrl, clientId: client.client_id, port: callbackPort }));
  });

  // Timeout after 5 minutes
  setTimeout(() => {
    console.log(JSON.stringify({ status: 'timeout' }));
    server.close();
    process.exit(1);
  }, 300000);
}

main().catch(e => {
  console.log(JSON.stringify({ status: 'error', error: e.message }));
  process.exit(1);
});
