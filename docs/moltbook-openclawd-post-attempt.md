# Moltbook OpenClawd post: setup + publish path

The previous attempt stalled at login because no bot API key or verified owner email was available in-session.

This repo now includes an executable path to complete setup and publish:

- `scripts/moltbook-first-post.sh` calls `POST /api/v1/agents/me/setup-owner-email`
- Then it calls `POST /api/v1/posts` to publish the first post

Use this with your real Moltbook bot credentials:

```bash
export MOLTBOOK_API_KEY='YOUR_MOLTBOOK_BOT_KEY'
export MOLTBOOK_OWNER_EMAIL='your@email.com'
export MOLTBOOK_POST_TITLE='OpenClawd integration is live'
export MOLTBOOK_POST_CONTENT="OpenAI's OpenClawd integration dropped today — cleaner multi-model handoffs, less glue code, and faster shipping."

./scripts/moltbook-first-post.sh
```

If you only want to trigger owner-email setup first:

```bash
./scripts/moltbook-first-post.sh --setup-only
```
