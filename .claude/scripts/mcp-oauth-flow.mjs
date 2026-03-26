#!/usr/bin/env node
/**
 * MCP OAuth Flow Script
 * Performs the complete OAuth authorization code flow with PKCE
 * for MCP servers that require browser-based authentication.
 *
 * Usage: node mcp-oauth-flow.mjs <server-url> [callback-port]
 * Example: node mcp-oauth-flow.mjs https://mcp.cloudflare.com/mcp 19876
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const serverUrl = process.argv[2];
const callbackPort = parseInt(process.argv[3] || '19876', 10);

if (!serverUrl) {
  console.error('Usage: node mcp-oauth-flow.mjs <server-url> [callback-port]');
  process.exit(1);
}

// Derive the base URL from the MCP server URL
const url = new URL(serverUrl);
const baseUrl = `${url.protocol}//${url.host}`;

async function main() {
  console.log(`\n--- MCP OAuth Flow for ${baseUrl} ---\n`);

  // Step 1: Discover OAuth endpoints
  console.log('1. Discovering OAuth endpoints...');
  const discoveryUrl = `${baseUrl}/.well-known/oauth-authorization-server`;
  const discoveryRes = await fetch(discoveryUrl);
  if (!discoveryRes.ok) {
    console.error(`Failed to discover OAuth endpoints: ${discoveryRes.status}`);
    process.exit(1);
  }
  const discovery = await discoveryRes.json();
  console.log(`   Authorization: ${discovery.authorization_endpoint}`);
  console.log(`   Token: ${discovery.token_endpoint}`);
  console.log(`   Registration: ${discovery.registration_endpoint}`);

  // Step 2: Register client
  console.log('\n2. Registering OAuth client...');
  const redirectUri = `http://localhost:${callbackPort}/oauth/callback`;
  const regRes = await fetch(`${baseUrl}${discovery.registration_endpoint.replace(baseUrl, '')}`, {
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
  if (!regRes.ok) {
    console.error(`Failed to register client: ${regRes.status} ${await regRes.text()}`);
    process.exit(1);
  }
  const client = await regRes.json();
  console.log(`   Client ID: ${client.client_id}`);

  // Step 3: Generate PKCE
  console.log('\n3. Generating PKCE challenge...');
  const codeVerifier = crypto.randomBytes(32).toString('base64url').slice(0, 43);
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  console.log(`   Code verifier: ${codeVerifier.slice(0, 10)}...`);
  console.log(`   Code challenge: ${codeChallenge.slice(0, 10)}...`);

  // Step 4: Build authorization URL
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

  // Step 5: Start callback server and open browser
  console.log('\n4. Starting callback server and opening browser...');

  const tokenPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth flow timed out after 120 seconds'));
    }, 120000);

    const server = http.createServer(async (req, res) => {
      const reqUrl = new URL(req.url, `http://localhost:${callbackPort}`);

      if (reqUrl.pathname === '/oauth/callback') {
        const code = reqUrl.searchParams.get('code');
        const returnedState = reqUrl.searchParams.get('state');
        const error = reqUrl.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<html><body><h1>OAuth Error</h1><p>${error}: ${reqUrl.searchParams.get('error_description')}</p></body></html>`);
          clearTimeout(timeout);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>State mismatch</h1></body></html>');
          return;
        }

        console.log('\n5. Received authorization code, exchanging for tokens...');

        // Exchange code for tokens
        try {
          const tokenRes = await fetch(discovery.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: client.client_id,
              code: code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier
            })
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            throw new Error(`Token exchange failed: ${tokenRes.status} ${errText}`);
          }

          const tokens = await tokenRes.json();
          console.log('   Token exchange successful!');
          console.log(`   Token type: ${tokens.token_type}`);
          console.log(`   Expires in: ${tokens.expires_in}s`);
          console.log(`   Scopes: ${tokens.scope || '(default)'}`);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Authorization Successful!</h1><p>You can close this tab.</p></body></html>');

          clearTimeout(timeout);
          server.close();
          resolve({ tokens, client, codeVerifier });
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<html><body><h1>Error</h1><p>${err.message}</p></body></html>`);
          clearTimeout(timeout);
          server.close();
          reject(err);
        }
      }
    });

    server.listen(callbackPort, () => {
      console.log(`   Callback server listening on port ${callbackPort}`);
      console.log(`   Opening browser...`);

      // Open browser on macOS
      exec(`open "${authUrl}"`, (err) => {
        if (err) {
          console.log(`\n   Could not open browser automatically.`);
          console.log(`   Please open this URL manually:\n`);
          console.log(`   ${authUrl}\n`);
        }
      });
    });
  });

  try {
    const { tokens, client: clientInfo, codeVerifier: verifier } = await tokenPromise;

    // Step 6: Save tokens in mcp-remote format
    console.log('\n6. Saving tokens...');

    // Compute the hash the same way mcp-remote does (MD5 of the server URL)
    const urlHash = crypto.createHash('md5').update(serverUrl).digest('hex');

    // Save to the latest mcp-remote directory
    const authDir = path.join(process.env.HOME, '.mcp-auth', 'mcp-remote-0.1.37');

    // Ensure directory exists
    fs.mkdirSync(authDir, { recursive: true });

    // Save client info
    const clientInfoPath = path.join(authDir, `${urlHash}_client_info.json`);
    fs.writeFileSync(clientInfoPath, JSON.stringify({
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_name: 'MCP CLI Proxy',
      client_id: clientInfo.client_id,
      client_id_issued_at: clientInfo.client_id_issued_at
    }, null, 2));
    fs.chmodSync(clientInfoPath, 0o600);

    // Save code verifier
    const verifierPath = path.join(authDir, `${urlHash}_code_verifier.txt`);
    fs.writeFileSync(verifierPath, verifier);
    fs.chmodSync(verifierPath, 0o600);

    // Save tokens
    const tokensPath = path.join(authDir, `${urlHash}_tokens.json`);
    fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
    fs.chmodSync(tokensPath, 0o600);

    console.log(`   Saved to: ${authDir}`);
    console.log(`   URL hash: ${urlHash}`);
    console.log(`   Files: ${urlHash}_client_info.json, ${urlHash}_tokens.json, ${urlHash}_code_verifier.txt`);

    // Also try saving to all mcp-remote versions for compatibility
    for (const ver of ['mcp-remote-0.1.18', 'mcp-remote-0.1.31', 'mcp-remote-0.1.37', 'mcp-remote-0.1.38']) {
      const dir = path.join(process.env.HOME, '.mcp-auth', ver);
      fs.mkdirSync(dir, { recursive: true });

      const ci = path.join(dir, `${urlHash}_client_info.json`);
      if (!fs.existsSync(ci)) {
        fs.writeFileSync(ci, JSON.stringify({
          redirect_uris: [redirectUri],
          token_endpoint_auth_method: 'none',
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          client_name: 'MCP CLI Proxy',
          client_id: clientInfo.client_id,
          client_id_issued_at: clientInfo.client_id_issued_at
        }, null, 2));
        fs.chmodSync(ci, 0o600);
      }

      const cv = path.join(dir, `${urlHash}_code_verifier.txt`);
      if (!fs.existsSync(cv)) {
        fs.writeFileSync(cv, verifier);
        fs.chmodSync(cv, 0o600);
      }

      const tp = path.join(dir, `${urlHash}_tokens.json`);
      if (!fs.existsSync(tp)) {
        fs.writeFileSync(tp, JSON.stringify(tokens, null, 2));
        fs.chmodSync(tp, 0o600);
      }
    }

    console.log('\n--- OAuth flow complete! ---');
    console.log('Restart Claude Code to pick up the new tokens.\n');

  } catch (err) {
    console.error(`\nOAuth flow failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
