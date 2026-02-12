# Security Policy

## Reporting a Vulnerability

Report security issues privately to: `Austin@BlazeSportsIntel.com`.

Include reproduction steps, impacted endpoints, and any proof-of-concept details needed
to validate severity quickly.

## Worker Security Header Baseline

Blaze Sports Intel Worker API routes default to restrictive browser security headers,
including:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

This default applies to sports, news, and data APIs unless explicitly allowlisted.

## Presence-Coach Media Permission Exception

### Approved Endpoint Scope

Only the following endpoint is approved for camera/microphone enablement:

- `/api/v1/vision/baselines`

No wildcard or prefix-based route matching is used for this exception.

### Policy Applied

For `/api/v1/vision/baselines` only:

- `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`

All other routes continue to deny camera and microphone access.

### Rationale

The Vision/presence-coach baseline capture flow requires browser media permission checks
for same-origin requests. A route-scoped exception enables that flow without weakening
global API policy.

### Abuse and Consent Controls

- Exact-path allowlist limits scope to one endpoint.
- Same-origin-only media policy (`(self)`) blocks third-party origins from inheriting access.
- Client flow requires explicit user action and browser permission prompts before media use.
- Denied permissions fail closed; users must explicitly re-enable access in browser/device settings.
- Any future endpoint additions require security review.
- Any future endpoint additions must include matching updates to worker route tests and this `SECURITY.md` policy in the same PR.
