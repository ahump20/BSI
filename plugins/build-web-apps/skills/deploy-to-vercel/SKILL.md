---
name: deploy-to-vercel
description: Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment".
---

# Deploy To Vercel

Default to a preview deployment unless the user explicitly asks for production.

The goal is not just to get a one-off URL. The better outcome is a repo that is linked cleanly to the right Vercel team and can keep shipping through a stable workflow.

## Step 1: Gather project state

Check these first:

```bash
git remote get-url origin 2>/dev/null
cat .vercel/project.json 2>/dev/null || cat .vercel/repo.json 2>/dev/null
vercel whoami 2>/dev/null
vercel teams list --format json 2>/dev/null
```

If the plugin-local Vercel MCP server is connected, use it alongside the CLI for project, deployment, and log inspection.

### Team selection

- If the repo is already linked through `.vercel/project.json` or `.vercel/repo.json`, treat that linked config as the source of truth.
- If the user belongs to multiple teams and the repo is not linked yet, show the available team slugs and ask which one to use.
- Once the team is clear, keep moving. Do not ask for redundant confirmation.

Pass the chosen team via `--scope` when needed:

```bash
vercel deploy [path] -y --no-wait --scope <team-slug>
```

## Step 2: Choose the deploy path

### Linked repo + git remote

This is the preferred state.

1. Ask before committing or pushing.
2. Commit and push the current branch.
3. Use the Vercel CLI or MCP tools to retrieve the newest deployment URL and build status.

If the CLI is authenticated, `vercel ls --format json` is the fastest fallback for locating the latest deployment URL.

### Linked repo + no git remote

Deploy directly:

```bash
vercel deploy [path] -y --no-wait
```

Then inspect status:

```bash
vercel inspect <deployment-url>
```

For production only when explicitly requested:

```bash
vercel deploy [path] --prod -y --no-wait
```

### Unlinked repo + authenticated CLI

Use the moment to create the right long-term setup.

If the repo has a git remote, prefer repo-based linking:

```bash
vercel link --repo --scope <team-slug>
```

If it does not, fall back to:

```bash
vercel link --scope <team-slug>
```

After linking:

- Use git push if the repo is now connected to Vercel through git.
- Otherwise use `vercel deploy -y --no-wait` and inspect the result.

### Unlinked repo + unauthenticated or missing CLI

Install and authenticate first:

```bash
npm install -g vercel
vercel login
```

Then follow the linking flow above.

## Output

Always return the deployment URL.

- For git-driven deploys, report the latest preview URL and whether the build is still running or complete.
- For direct CLI deploys, return the URL emitted by `vercel deploy --no-wait`, then summarize the status from `vercel inspect`.
- Do not call something production unless `--prod` was used or the push targeted the production branch.
- Do not fetch the deployed URL just to prove it exists. Return the link and the build status instead.

## Troubleshooting

- Wrong team scope: resolve the Vercel team or linked `orgId` before retrying.
- Wrong project: confirm the `.vercel/` linkage and branch expectations.
- Build failure: inspect deployment logs through the Vercel CLI or MCP tools before changing code blindly.
- Missing auth: repair `vercel login` first instead of guessing.
