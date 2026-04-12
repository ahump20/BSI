# Codex Handoff Prompts — BSI MCP Distribution

Three paste-ready Codex prompts to finish the public distribution of the Blaze Sports Intel college baseball MCP server. Each prompt is self-contained — Codex has no conversation history with this work, so everything it needs is in the prompt body.

Run them in this order:
1. **Smithery** — fastest, good canary for the server's Smithery compatibility.
2. **MCP Registry** — official modelcontextprotocol.io directory.
3. **RapidAPI** — needs a web form, so best done last with the dashboard open.

Each prompt assumes you're working in `/Users/AustinHumphrey/bsi-repo` on the `main` branch. The MCP server is already deployed and live at `https://sabermetrics.blazesportsintel.com/mcp`.

---

## Prompt 1 — Publish to Smithery

```
Publish the Blaze Sports Intel college baseball MCP server to Smithery.

Working dir: /Users/AustinHumphrey/bsi-repo

Context:
- The server is already deployed and live at https://sabermetrics.blazesportsintel.com/mcp
- Protocol: JSON-RPC 2.0 over streamable HTTP, protocol version 2024-11-05
- Nine read-only tools prefixed bsi_* (scoreboard, standings, rankings, team_sabermetrics, leaderboard, conference_power_index, player_stats, team_schedule, match_detail)
- Server card with canonical metadata is live at https://sabermetrics.blazesportsintel.com/.well-known/mcp/server-card.json — Smithery's auto-scanner will pull from here if needed
- Full submission guide: docs/mcp/directory-submissions.md

Your job:

1. Verify the server is healthy:
   curl -s https://sabermetrics.blazesportsintel.com/health | jq .
   (expect status "ok", endpoints 9, highlightly true)

2. Log in to Smithery — this opens a browser for GitHub OAuth:
   npx -y @smithery/cli auth login

   Wait for the login to complete. If the browser flow is blocked, stop and tell me so I can run it manually.

3. Publish the server:
   npx -y @smithery/cli mcp publish \
     https://sabermetrics.blazesportsintel.com/mcp \
     --name blazesportsintel/college-baseball

   Smithery will handshake with the server, pull the 9 tools, and create the listing. Follow any prompts it shows (tags, description, etc.). If it asks for a description, use:
   "Live scores, standings, rankings, schedules, and advanced sabermetric analytics (wOBA, wRC+, FIP, ERA-, BABIP, ISO) for all 330 NCAA Division I college baseball teams."

4. Verify the listing is live:
   npx -y @smithery/cli mcp search "college baseball"
   Confirm "blazesportsintel/college-baseball" appears in the results.

5. Report back:
   - The Smithery listing URL (likely https://smithery.ai/server/blazesportsintel/college-baseball)
   - Any warnings the publish command emitted
   - Confirmation that the 9 tools were detected by Smithery's scanner

Do not modify any code. This is a publish-only task.
```

---

## Prompt 2 — Publish to the Official MCP Registry

```
Publish the Blaze Sports Intel college baseball MCP server to the official MCP Registry at registry.modelcontextprotocol.io.

Working dir: /Users/AustinHumphrey/bsi-repo

Context:
- The server is live at https://sabermetrics.blazesportsintel.com/mcp
- A pre-written server.json manifest is already committed at workers/college-baseball-mcp/server.json — namespace is com.blazesportsintel/college-baseball
- The MCP Registry uses a Go-based CLI called mcp-publisher
- Full submission guide with the exact commands: docs/mcp/directory-submissions.md
- Auth options: GitHub OAuth (easiest), DNS verification of blazesportsintel.com, or HTTP verification

Your job:

1. Install mcp-publisher:
   Try: go install github.com/modelcontextprotocol/registry/cmd/publisher@latest
   If Go is not installed, fall back to: curl -sSL https://registry.modelcontextprotocol.io/install.sh | sh
   If neither works, report the blocker and stop.

2. Inspect the manifest before publishing:
   cat workers/college-baseball-mcp/server.json
   Confirm the name field is "com.blazesportsintel/college-baseball" and the remote URL is https://sabermetrics.blazesportsintel.com/mcp

3. Authenticate. The manifest uses a com.blazesportsintel/* namespace which requires domain verification. Try DNS first:
   mcp-publisher auth dns blazesportsintel.com

   It will print a TXT record to add. If you don't have Cloudflare DNS access, fall back to GitHub OAuth (which requires editing the manifest's "name" field to "io.github.ahump20/bsi-college-baseball-mcp" first — ask me before making that edit).

4. Publish from the manifest directory:
   cd workers/college-baseball-mcp
   mcp-publisher publish

5. Verify the listing is live:
   curl -s "https://registry.modelcontextprotocol.io/v0/servers?name=com.blazesportsintel/college-baseball" | jq '.'
   Expect a JSON object with the server metadata, including the remotes array.

6. Report back:
   - The public listing URL at registry.modelcontextprotocol.io
   - Which auth method you used (DNS, HTTP, or GitHub OAuth)
   - Any validation errors from mcp-publisher
   - If you had to swap the namespace to the GitHub-verified variant, tell me what it's listed under

Do not commit any code changes unless you had to edit server.json for the namespace swap (and only commit that file if you did).
```

---

## Prompt 3 — Finish the RapidAPI Hub Listing

```
Finish publishing the Blaze Sports Intel college baseball API to RapidAPI.

Working dir: /Users/AustinHumphrey/bsi-repo

Context:
- The draft hub listing already exists at:
  https://rapidapi.com/studio/api_c94c900f-57b9-480a-b622-6719276fc0ac/publish/general
- The API is live at https://sabermetrics.blazesportsintel.com
- OpenAPI 3.1 spec is served live at https://sabermetrics.blazesportsintel.com/openapi.json
- A complete paste-ready submission packet is at docs/mcp/rapidapi-submission.md including the long-description markdown, all endpoint URLs, pricing, tags, and pre-submission verification curls
- Free tier only for v1. No paid tiers at launch.

Your job (browser automation — open the RapidAPI studio URL):

1. Run the pre-submission verification curls from docs/mcp/rapidapi-submission.md under "Pre-submission verification". Confirm:
   - GET /health returns status ok with endpoints:9, highlightly:true
   - POST /mcp tools/list returns exactly 9 tools
   - GET /openapi.json parses as valid JSON with a non-empty paths object
   - GET / returns HTML (not JSON)
   - Each /v1/* endpoint returns data with a meta block

2. Open the RapidAPI studio URL in a browser (I should already be logged in):
   https://rapidapi.com/studio/api_c94c900f-57b9-480a-b622-6719276fc0ac/publish/general

3. Fill in the "General Information" section using exactly the field values from docs/mcp/rapidapi-submission.md:
   - Name: "Blaze Sports Intel — College Baseball"
   - Category: Sports
   - Short description: "Live scores, standings, rankings, and advanced sabermetric analytics for all 330 NCAA Division I college baseball teams."
   - Website: https://blazesportsintel.com
   - Terms: https://blazesportsintel.com/terms
   - Privacy: https://blazesportsintel.com/privacy

4. Paste the full Markdown long description from the "Long description" section of docs/mcp/rapidapi-submission.md into the Markdown field.

5. In the "Definitions" or "Endpoints" tab, import the OpenAPI spec directly from:
   https://sabermetrics.blazesportsintel.com/openapi.json

   RapidAPI will auto-populate endpoint definitions. Verify all 10 endpoints from the submission doc are present (health, mcp, scoreboard, standings, rankings, players, teamStats, teamSchedule, leaderboard, powerIndex, matchDetail).

6. Under pricing, set the free tier with the listed rate limits (30 req/min). Do not enable any paid tiers.

7. Add the tags from the submission doc: baseball, ncaa, college-sports, sabermetrics, sports-analytics, mcp, live-scores.

8. Add the three "Known limitations to disclose" from docs/mcp/rapidapi-submission.md into the Notes or Limitations section so subscribers know what they're getting:
   - Conference W/L splits are null
   - 138-team ESPN coverage ceiling
   - Highlightly tier throttle point at ~10 concurrent

9. Click Publish (or Save, then Publish).

10. Report back:
    - The public RapidAPI listing URL (likely https://rapidapi.com/blazesportsintel/api/blaze-sports-intel or similar)
    - Confirmation that all 10 endpoints imported correctly from the OpenAPI spec
    - Any RapidAPI review or moderation step required before it goes fully public

Do not modify any code.
```

---

## After all three

Tell me:
- The three live listing URLs (Smithery, MCP Registry, RapidAPI)
- Any listings that require a follow-up (e.g., RapidAPI moderation queue, MCP Registry approval)
- Total time spent across the three submissions

Then I'll draft the announce post on blazesportsintel.com/editorial, LinkedIn, and X — with the BSI tagline "Born to Blaze the Path Beaten Less" in the exact word order.
