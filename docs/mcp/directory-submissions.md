# MCP Directory Submissions — Smithery + MCP Registry

Two AI-client-facing directories to list the BSI MCP server on after Sprint 1/2 gate passes. Both accept remote HTTPS servers directly (no stdio wrapper, no GitHub repo required). Each takes under 5 minutes once authenticated. Requires Austin's credentials.

Prerequisite preparation (**already shipped**):
- Canonical server card is live at `https://sabermetrics.blazesportsintel.com/.well-known/mcp/server-card.json` (Smithery and auto-scrapers pick this up automatically).
- `workers/college-baseball-mcp/server.json` is the MCP Registry manifest, ready to hand to `mcp-publisher`.

## Smithery

Smithery lists remote MCP servers by URL. The CLI does the whole flow in one command.

```bash
# Once: log in with GitHub OAuth (opens browser)
npx -y @smithery/cli auth login

# Publish the server under the blazesportsintel namespace
npx -y @smithery/cli mcp publish \
  https://sabermetrics.blazesportsintel.com/mcp \
  --name blazesportsintel/college-baseball
```

Smithery's scanner handshakes with the server, lists the nine tools, and offers the listing for review. Edit display name, long description, tags at `smithery.ai/server/blazesportsintel/college-baseball` after publish.

Alternative (no CLI): visit `smithery.ai/new`, paste the server URL, fill the form.

## MCP Registry (official modelcontextprotocol.io)

The official registry at `registry.modelcontextprotocol.io`. Uses a `mcp-publisher` CLI + `server.json` manifest. The manifest is already at `workers/college-baseball-mcp/server.json` with namespace `com.blazesportsintel/college-baseball`.

```bash
# Install the publisher
go install github.com/modelcontextprotocol/registry/cmd/publisher@latest
# or: curl -sSL https://registry.modelcontextprotocol.io/install.sh | sh

# Authenticate — choose one:
mcp-publisher auth github                 # GitHub OAuth (simplest)
mcp-publisher auth dns blazesportsintel.com  # DNS TXT record verification
mcp-publisher auth http blazesportsintel.com  # .well-known/mcp-registry-auth HTTP challenge

# Publish from the manifest
cd workers/college-baseball-mcp
mcp-publisher publish
```

Namespace options:
- `com.blazesportsintel/college-baseball` — domain-verified (requires DNS or HTTP verification of blazesportsintel.com).
- `io.github.ahump20/bsi-college-baseball-mcp` — GitHub-verified (requires `auth github` as ahump20).

Current manifest uses `com.blazesportsintel/college-baseball`. If DNS/HTTP verification is a blocker, swap the `name` field in `server.json` to the GitHub-verified variant before running publish.

## Verification after each submit

```bash
# Smithery — the server should appear in search results
npx -y @smithery/cli mcp search "college baseball"

# MCP Registry — the listing URL resolves
curl -s https://registry.modelcontextprotocol.io/v0/servers?name=com.blazesportsintel/college-baseball \
  | jq '.'
```

## Announce checklist (after both are live)

- Blog post at `blazesportsintel.com/editorial` (author's voice).
- LinkedIn + X with the `/mcp` marketing page URL.
- Claude Desktop config snippet as a Gist for easy copy-paste into posts.
- Tag `@smithery_ai` and `@ModelContextProto` on X for reshares.

Tagline for all announcements (exact word order): **"Born to Blaze the Path Beaten Less."**
