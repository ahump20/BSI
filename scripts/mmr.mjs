#!/usr/bin/env node
/**
 * BSI MMR Ledger CLI
 * Quick commands for append, proof, and verify operations
 * 
 * Usage:
 *   ./cli/mmr.mjs append --type scout_note --actor austin --data '{"player":"X"}'
 *   ./cli/mmr.mjs head
 *   ./cli/mmr.mjs leaf 1
 *   ./cli/mmr.mjs proof 1
 *   ./cli/mmr.mjs verify < proof.json
 *   ./cli/mmr.mjs list --actor austin --limit 10
 */

const BASE_URL = process.env.MMR_URL || 'http://localhost:8787';
const ADMIN_TOKEN = process.env.MMR_ADMIN_TOKEN || '';

async function request(method, path, body = null, needsAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (needsAuth) {
    if (!ADMIN_TOKEN) {
      console.error('Error: MMR_ADMIN_TOKEN environment variable required');
      process.exit(1);
    }
    headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

function formatJson(obj) {
  return JSON.stringify(obj, null, 2);
}

async function main() {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case 'health': {
      const { data } = await request('GET', '/health');
      console.log(formatJson(data));
      break;
    }

    case 'head': {
      const { data } = await request('GET', '/v1/mmr/head');
      console.log(formatJson(data));
      break;
    }

    case 'append': {
      const body = {};
      for (let i = 0; i < args.length; i += 2) {
        const key = args[i]?.replace(/^--/, '');
        const val = args[i + 1];
        if (key && val) {
          if (key === 'data' || key === 'tags') {
            try {
              body[key] = JSON.parse(val);
            } catch {
              body[key] = val;
            }
          } else {
            body[key] = val;
          }
        }
      }
      const { data } = await request('POST', '/v1/mmr/append', body, true);
      console.log(formatJson(data));
      break;
    }

    case 'leaf': {
      const index = args[0];
      if (!index) {
        console.error('Usage: mmr leaf <index>');
        process.exit(1);
      }
      const { data } = await request('GET', `/v1/mmr/leaf/${index}`);
      console.log(formatJson(data));
      break;
    }

    case 'list': {
      const params = new URLSearchParams();
      for (let i = 0; i < args.length; i += 2) {
        const key = args[i]?.replace(/^--/, '');
        const val = args[i + 1];
        if (key && val) params.set(key, val);
      }
      const query = params.toString();
      const path = '/v1/mmr/leaves' + (query ? `?${query}` : '');
      const { data } = await request('GET', path);
      console.log(formatJson(data));
      break;
    }

    case 'proof': {
      const index = args[0];
      const version = args.find((a, i) => args[i - 1] === '--version');
      if (!index) {
        console.error('Usage: mmr proof <index> [--version <n>]');
        process.exit(1);
      }
      const path = `/v1/mmr/proof/${index}${version ? `?version=${version}` : ''}`;
      const { data } = await request('GET', path);
      console.log(formatJson(data));
      break;
    }

    case 'verify': {
      // Read proof from stdin
      let input = '';
      for await (const chunk of process.stdin) {
        input += chunk;
      }
      const proof = JSON.parse(input);
      const body = proof.proof ? proof : { proof };
      const { data } = await request('POST', '/v1/mmr/verify', body);
      console.log(formatJson(data));
      break;
    }

    case 'batch': {
      // Read events from stdin
      let input = '';
      for await (const chunk of process.stdin) {
        input += chunk;
      }
      const events = JSON.parse(input);
      const body = Array.isArray(events) ? { events } : events;
      const { data } = await request('POST', '/v1/mmr/batch', body, true);
      console.log(formatJson(data));
      break;
    }

    default:
      console.log(`BSI MMR Ledger CLI

Commands:
  health                          Check service health
  head                            Get current MMR state
  append --type T --actor A ...   Append event (requires MMR_ADMIN_TOKEN)
  leaf <index>                    Get specific leaf
  list [--actor A] [--tag T] ...  List/search leaves
  proof <index> [--version N]     Get inclusion proof
  verify < proof.json             Verify proof from stdin
  batch < events.json             Batch append from stdin (requires MMR_ADMIN_TOKEN)

Environment:
  MMR_URL          Base URL (default: http://localhost:8787)
  MMR_ADMIN_TOKEN  Bearer token for admin operations

Examples:
  # Append a scout note
  ./cli/mmr.mjs append --type scout_note --actor austin --tags '["CF","instinct"]' --data '{"player":"X","note":"late barrel"}'

  # Get proof and verify
  ./cli/mmr.mjs proof 1 > proof.json
  ./cli/mmr.mjs verify < proof.json

  # Search by actor
  ./cli/mmr.mjs list --actor austin --limit 10
`);
  }
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
