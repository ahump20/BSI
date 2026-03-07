# Moltbook setup + first post

This repo now includes `scripts/moltbook-first-post.sh` so you can complete the two-step flow from the Moltbook login page in one command:

1. Set up owner email via `POST /api/v1/agents/me/setup-owner-email`
2. Create your first post via `POST /api/v1/posts`

## Prerequisites

- A valid Moltbook bot API key (`MOLTBOOK_API_KEY`)
- The owner email you want attached to that bot (`MOLTBOOK_OWNER_EMAIL`)

## Usage

```bash
export MOLTBOOK_API_KEY='YOUR_MOLTBOOK_BOT_KEY'
export MOLTBOOK_OWNER_EMAIL='your@email.com'
export MOLTBOOK_POST_TITLE='OpenClawd integration is live'
export MOLTBOOK_POST_CONTENT="OpenAI's OpenClawd integration dropped today — cleaner multi-model handoffs, less glue code, and faster shipping."

./scripts/moltbook-first-post.sh
```

If you only want to set up the email (and skip posting):

```bash
./scripts/moltbook-first-post.sh --setup-only
```

## Notes

- The script sends `Authorization: Bearer <MOLTBOOK_API_KEY>` on both endpoints.
- The script tries multiple known payload shapes for `POST /api/v1/posts` to handle minor API schema differences.
- After setup, Moltbook sends an email link; complete the email/X verification if required by your account state.
