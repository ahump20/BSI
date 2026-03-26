#!/usr/bin/env node
/**
 * Automated MCP OAuth Flow with Playwright
 * Handles the browser interaction automatically.
 */

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const serverUrl = process.argv[2];
const callbackPort = parseInt(process.argv[3] || '19876', 10);

if (!serverUrl) {
  console.error('Usage: node mcp-oauth-auto.mjs <server-url> [callback-port]');
  process.exit(1);
}

const url = new URL(serverUrl);
const baseUrl = `${url.protocol}//${url.host}`;

async function main() {
  console.log(`\n--- Automated MCP OAuth Flow for ${baseUrl} ---\n`);

  // Step 1: Discover
  const discoveryRes = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
  const discovery = await discoveryRes.json();

  // Step 2: Register client
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
  console.log(`Client ID: ${client.client_id}`);

  // Step 3: PKCE
  const codeVerifier = crypto.randomBytes(32).toString('base64url').slice(0, 43);
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  // Step 4: Auth URL
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

  // Step 5: Start callback server
  const tokenPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Timed out'));
    }, 300000);

    const server = http.createServer(async (req, res) => {
      const reqUrl = new URL(req.url, `http://localhost:${callbackPort}`);
      if (reqUrl.pathname === '/oauth/callback') {
        const code = reqUrl.searchParams.get('code');
        const error = reqUrl.searchParams.get('error');
        if (error) {
          res.writeHead(200); res.end('Error: ' + error);
          clearTimeout(timeout); server.close();
          reject(new Error(error));
          return;
        }
        try {
          const tokenRes = await fetch(discovery.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: client.client_id,
              code, redirect_uri: redirectUri,
              code_verifier: codeVerifier
            })
          });
          const tokens = await tokenRes.json();
          if (!tokenRes.ok) throw new Error(JSON.stringify(tokens));
          res.writeHead(200); res.end('Success!');
          clearTimeout(timeout); server.close();
          resolve({ tokens, client, codeVerifier });
        } catch (e) {
          res.writeHead(500); res.end(e.message);
          clearTimeout(timeout); server.close();
          reject(e);
        }
      }
    });
    server.listen(callbackPort, () => {
      console.log(`Callback on port ${callbackPort}, auth URL ready`);
      // Output the URL for the parent process
      console.log(`AUTH_URL=${authUrl}`);
    });
  });

  const { tokens, client: ci, codeVerifier: cv } = await tokenPromise;
  console.log(`Token type: ${tokens.token_type}, expires: ${tokens.expires_in}s`);

  // Save tokens
  const urlHash = crypto.createHash('md5').update(serverUrl).digest('hex');
  for (const ver of ['mcp-remote-0.1.37', 'mcp-remote-0.1.38']) {
    const dir = path.join(process.env.HOME, '.mcp-auth', ver);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${urlHash}_client_info.json`), JSON.stringify({
      redirect_uris: [redirectUri], token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
      client_name: 'MCP CLI Proxy', client_id: ci.client_id,
      client_id_issued_at: ci.client_id_issued_at
    }, null, 2));
    fs.writeFileSync(path.join(dir, `${urlHash}_code_verifier.txt`), cv);
    fs.writeFileSync(path.join(dir, `${urlHash}_tokens.json`), JSON.stringify(tokens, null, 2));
  }
  console.log(`Saved tokens with hash ${urlHash}`);
  console.log('DONE');
}

main().catch(e => { console.error(e.message); process.exit(1); });
