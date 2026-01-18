# BSI: Inferno Sprint - Security

## Overview

This document outlines security measures for the Inferno Sprint game, focusing on anti-cheat mechanisms and data protection.

## Threat Model

### Primary Threats

1. **Score Manipulation**: Submitting fake/modified scores
2. **Replay Attacks**: Resubmitting valid old scores
3. **Bot Submissions**: Automated score farming
4. **Data Exfiltration**: Leaking player data

### Attack Vectors

| Vector            | Mitigation                |
| ----------------- | ------------------------- |
| Modified client   | Server-side validation    |
| Direct API calls  | Hash verification         |
| Time manipulation | Timestamp bounds checking |
| Memory editing    | Deterministic validation  |

## Anti-Cheat Measures

### 1. Time Bounds Validation

```typescript
const MIN_VALID_TIME = 15; // Physical minimum
const MAX_VALID_TIME = 300; // 5 minute maximum
```

Any score outside these bounds is rejected. The minimum is based on theoretical optimal pathing.

### 2. Soul Count Verification

Scores must report exactly 13 souls collected. Partial completions are not accepted.

### 3. Timestamp Validation

```typescript
if (submission.timestamp > Date.now() + 60000) {
  // Reject future timestamps
}
```

### 4. Score Hashing

Each score includes a hash computed from:

- Time (to 2 decimal places)
- Soul count
- Run seed
- Server secret

```typescript
hash = SHA-256(time:souls:seed:secret)
```

The hash is partially returned to clients for verification.

### 5. Rate Limiting

Cloudflare's built-in rate limiting prevents:

- Brute force submissions
- Leaderboard flooding
- API abuse

### 6. Deterministic Runs (Future)

Future versions will implement seeded runs:

- Server issues a seed at game start
- Client submits actions/timing
- Server can replay to verify

## Data Protection

### Player Data

| Data        | Storage    | Retention  |
| ----------- | ---------- | ---------- |
| Player name | KV         | Indefinite |
| Score time  | KV         | Indefinite |
| Timestamp   | KV         | Indefinite |
| IP address  | Not stored | N/A        |

### Personal Best

Stored client-side in localStorage:

```javascript
localStorage.setItem('BSI-InfernoSprint-PB', time);
```

No personal data is transmitted to servers.

## API Security

### CORS Policy

```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

Open CORS is acceptable as:

- No authentication required
- No sensitive data exposed
- All data is public (leaderboard)

### Input Validation

All API inputs are validated:

- Type checking
- Range validation
- Sanitization

### Error Handling

Errors return generic messages to prevent information leakage:

```typescript
return Response.json({ error: 'Internal server error' }, { status: 500 });
```

## Secrets Management

### Required Secrets

| Secret       | Purpose      | Set via               |
| ------------ | ------------ | --------------------- |
| SCORE_SECRET | Hash signing | `wrangler secret put` |

### Rotation

Secrets should be rotated:

- Immediately if compromised
- Quarterly as best practice
- During major version updates

## Incident Response

### Suspected Cheating

1. Review score patterns in KV
2. Check for impossible times
3. Analyze submission timestamps
4. Consider IP patterns (via Cloudflare logs)

### Leaderboard Cleanup

```bash
# Manual cleanup via wrangler
wrangler kv:key put --binding=LEADERBOARD_KV "leaderboard" '[cleaned data]'
```

## Future Enhancements

### Planned

- [ ] Seeded deterministic runs
- [ ] Action replay verification
- [ ] Device fingerprinting
- [ ] Optional account system

### Considered

- Browser integrity checks
- WebAssembly game logic
- Server-authoritative state

## Compliance

### GDPR

- No personal data collected without consent
- Anonymous by default
- No cookies required
- Player names are user-provided

### CCPA

- No sale of personal information
- Data deletion available via leaderboard cleanup

## Contact

Security issues: security@blazesportsintel.com
