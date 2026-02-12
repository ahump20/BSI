# Security Policy

## Reporting

Report security issues to `Austin@BlazeSportsIntel.com` with:

- A short reproduction path
- Affected route(s) or worker(s)
- Severity estimate and impact

We triage on receipt and prioritize active exploitation risks first.

## Runtime Security Defaults

The apex Worker (`/workers/index.ts`) applies strict response headers by default:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Presence Coach Camera/Microphone Exception

To support real-time coaching capture, camera and microphone are only enabled for Presence Coach surfaces:

- `/presence-coach`
- `/presence-coach/*`
- `/api/presence-coach/*`

These routes use:

- `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`

All other routes remain denied by default.

## Consent and Abuse Controls

Presence Coach data is designed to remain pseudonymous and consent-bound:

- `coach_users` stores pseudonymous identifiers and consent metadata.
- Capture flows must require explicit user consent before session telemetry is persisted.
- Response telemetry is scoped to session and user IDs with explicit retention metadata.
- Rate limiting remains active on `/api/*` routes to reduce automated abuse.

## Operational Notes

- Keep feature gating enabled via `NEXT_PUBLIC_ENABLE_PRESENCE_COACH` until capture flows and consent UX are fully production-ready.
- Revalidate `Permissions-Policy` headers in tests whenever new route groups are introduced.
