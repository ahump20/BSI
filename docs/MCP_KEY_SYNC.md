# MCP Key Synchronization

Use the `API_KEYS_MASTER.js` source to populate local configuration without committing secrets.

## Prerequisites

- Place `API_KEYS_MASTER.js` at the repository root. The file must export an object that contains your secrets.

## Generate local configuration

```bash
npm run mcp:sync
```

The command:

1. Scans `API_KEYS_MASTER.js` for supported keys (MCP, database, Redis, email, sports APIs).
2. Writes a `config/mcp.env` file containing environment variables (gitignored).
3. Generates `wrangler-championship.local.toml` with the right MCP values for Cloudflare (gitignored).

If required keys are missing, the script exits with an error so you can fix the source file before deploying.

> ⚠️ **Security**: The generated files stay on disk only and are ignored by Git. Do not check them into source control.
