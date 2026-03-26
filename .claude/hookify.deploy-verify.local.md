# Deploy Verify Rule

**Trigger:** After any successful deploy command (wrangler deploy, npm run deploy:*, pages deploy)

**Rule:** Every deploy must be followed by a visual verification step. After deploying, automatically:
1. Fetch the root URL of the deployed property and confirm 200 status
2. If Claude-in-Chrome is available, screenshot the homepage
3. Check 1-2 deep routes for 200 + correct content
4. Report what the visitor sees now

**Rationale:** Austin asks for post-deploy verification in ~40% of deploy sessions. Making it automatic eliminates the ask.

**When to skip:** Only if Austin explicitly says "deploy only, skip verification" or the deploy itself failed.
