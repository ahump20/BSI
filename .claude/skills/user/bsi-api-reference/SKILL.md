---
name: bsi-api-reference
description: Comprehensive API endpoint reference for sports data integration. Use when building Workers, fetching live/historical data, or when Claude Code starts hardcoding static values instead of using dynamic API calls. Covers ESPN hidden APIs (100+ endpoints), SportsDataIO (paid), MLB StatsAPI, and NCAA sources. Includes anti-patterns to avoid and proper parameter formatting for dates, seasons, and weeks.
---

# BSI API Reference

This skill prevents the most common failure mode in BSI development: **hardcoding static data instead of fetching from APIs dynamically.**

## When to Use This Skill

**Always use when:**
- Building or modifying Cloudflare Workers that fetch sports data
- Claude Code suggests static arrays of teams, players, or scores
- Any request involving historical data, schedules, or live scores
- Debugging "stale data" or "wrong information" issues
- Setting up new API integrations

## Anti-Patterns to Prevent

**NEVER hardcode:** Team lists, player names, scores, schedules, standings, season years.

**ALWAYS fetch dynamically** using the endpoints documented in the references.

## Quick Reference: Base URLs

| Source | Base URL | Auth |
|--------|----------|------|
| ESPN Site API | `site.api.espn.com` | No |
| ESPN Core API | `sports.core.api.espn.com` | No |
| ESPN Web API | `site.web.api.espn.com` | No |
| MLB StatsAPI | `statsapi.mlb.com` | No |
| SportsDataIO | `api.sportsdata.io` | Yes |

## SportsDataIO Configuration

**API Key:** `6ca2adb39404482da5406f0a6cd7aa37`

**Header:** `Ocp-Apim-Subscription-Key: 6ca2adb39404482da5406f0a6cd7aa37`

## Date Formats

| API | Format | Example |
|-----|--------|---------|
| ESPN | `YYYYMMDD` | `20251224` |
| MLB StatsAPI | `YYYY-MM-DD` | `2025-12-24` |
| SportsDataIO | Endpoint-specific | See reference |

## Season Type Codes

| Code | Meaning |
|------|---------|
| `1` | Preseason |
| `2` | Regular Season |
| `3` | Postseason |

## Bundled References

Load these for detailed endpoint documentation:

- `references/espn-hidden-api.md` — 100+ ESPN endpoints by sport
- `references/sportsdataio.md` — Paid API with authenticated endpoints
- `references/mlb-statsapi.md` — Official MLB community API
- `references/dynamic-data-patterns.md` — Date handling, caching, error patterns

## Common Patterns

### Dynamic Date Generation
```typescript
const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
// Returns: 20251224
```

### Dynamic Season Detection
```typescript
const now = new Date();
const month = now.getMonth();
// MLB: season starts in March (2), ends in October (9)
const mlbSeason = month >= 2 && month <= 9 ? now.getFullYear() : 
                  month < 2 ? now.getFullYear() - 1 : now.getFullYear();
// NFL: season starts in September (8), ends in February
const nflSeason = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
```

### Cache Keys with Dates
```typescript
const cacheKey = `${sport}:${endpoint}:${YYYYMMDD}`;
```

## Validation Checklist

Before deploying:
- [ ] No hardcoded team/player names
- [ ] Dates dynamically generated
- [ ] Season year calculated, not static
- [ ] API responses include source metadata
- [ ] Cache keys include temporal components
