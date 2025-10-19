# Perfect Game Integration Guide

## Overview
Our Perfect Game integration powers recruiting, player development, and NIL workflows across the Blaze Sports Intel stack. This document outlines how to manage credentials safely and how to respect upstream rate limits.

## Credential Management
- **Environment Variables**: Configure the following variables for each environment (local, staging, production):
  - `PERFECT_GAME_API_BASE_URL`
  - `PERFECT_GAME_API_KEY`
  - `PERFECT_GAME_CLIENT_ID`
  - `PERFECT_GAME_CLIENT_SECRET`
  - `PERFECT_GAME_PARTNER_CODE`
- **Storage**: Store secrets in Vercel project settings for the web/API tier and in Cloudflare Workers secrets for scheduled ingest jobs. Never commit credentials to the repository.
- **Rotation Cadence**:
  1. Request a new key pair from Perfect Game support. Keys usually expire every 90 days.
  2. Add the new key/secret to staging secrets and deploy.
  3. Validate ingest and pipeline endpoints against staging logs.
  4. Promote the new credentials to production during a low-traffic window (preferably before 08:00 CT).
  5. Remove the retired key from all environments once monitoring confirms stability for 24 hours.
- **Automation**: Use the internal `credential-rotation` GitHub Action to remind the team 14 days before expiry. Update `docs/security/rotation-log.md` after every rotation.

## Rate Limit Expectations
- **Defaults**: Perfect Game typically enforces a burst limit of 60 requests per minute and a daily cap negotiated per partner.
- **Client Behavior**:
  - Automatic exponential backoff with jitter for 429/5xx responses.
  - Circuit-breaker style guardrails should be configured at the API gateway (AWS or Cloudflare) to fail fast when limits are exhausted.
  - Capture the `x-ratelimit-*` headers for monitoring; the client surfaces them in the response metadata.
- **Operational Playbook**:
  1. Track consumption in Grafana using the `perfect_game_rate_limit` dashboard.
  2. When remaining quota drops below 10%, queue non-critical sync jobs until the next reset.
  3. Alert the integrations on-call channel if backoff periods exceed 5 minutes.

## Support Contacts
- Perfect Game Partner Success: `partners@perfectgame.org`
- Blaze Integrations On-Call: `#integrations-alerts` (Slack)
- Escalation (24/7): `512-555-0426`
