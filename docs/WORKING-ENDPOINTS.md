# BSI API Endpoints - Status Report

**Last Updated**: November 20, 2025
**Deployment**: https://ec0c6db6.college-baseball-tracker.pages.dev
**Refactor Status**: Phase 3 Complete (3 critical lib files refactored)

---

## Legend

- ✅ **Working** - Endpoint tested and returns valid response
- ⚠️ **Needs Verification** - Endpoint exists but not fully tested
- ❌ **Broken** - Endpoint returns error or doesn't work
- 🔄 **Needs Refactor** - Works but imports non-refactored lib files (may break when enabled)
- ❓ **Untested** - Endpoint not yet tested

---

## Core Endpoints

### Homepage & Health
| Endpoint | Status | Response | Notes |
|----------|--------|----------|-------|
| `/` | ✅ Working | HTTP 200 | Homepage serving correctly |
| `/api/health` | ✅ Working | `{"status": "healthy"}` | Health check endpoint |

### Real-Time Sports Data
| Endpoint | Status | Response | Notes | Last Verified |
|----------|--------|----------|-------|---------------|
| `/api/live-games` | ✅ Working | ESPN live data | NFL, NBA, MLB real-time games. Rate limited (200 req/min). Returns `success: true`, game array, metadata | 2025-11-20 20:10 CST |
| `/api/nba-standings` | ✅ Working | Standings data | Returns Eastern/Western conference data. May be empty off-season | 2025-11-20 20:10 CST |
| `/api/nfl?view=standings` | ✅ Working | NFL standings | Returns AFC/NFC standings with team records | 2025-11-20 20:10 CST |

---

## Untested Endpoints (Exist in Codebase)

### V1 API Predictive Models
| Endpoint | Status | Risk Level | Reason |
|----------|--------|------------|---------|
| `/api/v1/predictive/players/[id]/projection` | ❓ Untested | 🔄 Medium | May import ML libs with process.env |
| `/api/v1/predictive/players/[id]/injury-risk` | ❓ Untested | 🔄 Medium | Prediction endpoint |
| `/api/v1/predictive/games/[id]/win-prob` | ❓ Untested | 🔄 Medium | Win probability calculator |
| `/api/v1/predictions/win-probability` | ❓ Untested | 🔄 Medium | Generic win prob endpoint |
| `/api/v1/predictions/betting-lines` | ❓ Untested | 🔄 Medium | Betting integration |
| `/api/v1/predictions/injury-impact` | ❓ Untested | 🔄 Medium | Injury analysis |
| `/api/v1/predictions/stream` | ❓ Untested | 🔄 High | WebSocket/SSE endpoint? |
| `/api/v1/predictions/accuracy` | ❓ Untested | 🔄 Low | Model accuracy metrics |
| `/api/v1/predictions/testing` | ❓ Untested | 🔄 Low | Test endpoint |

### V1 API Analysis Tools
| Endpoint | Status | Risk Level | Reason |
|----------|--------|------------|---------|
| `/api/v1/patterns/analyze` | ❓ Untested | 🔄 Medium | Pattern recognition |
| `/api/v1/umpire/scorecard` | ❓ Untested | 🔄 Low | Umpire analysis |
| `/api/v1/coaching/decisions` | ❓ Untested | 🔄 Medium | Decision analysis |
| `/api/v1/dashboards/[[route]]` | ❓ Untested | 🔄 Medium | Dynamic dashboard data |

### V1 API Prediction Models
| Endpoint | Status | Risk Level | Reason |
|----------|--------|------------|---------|
| `/api/v1/predict/[[model]]` | ❓ Untested | 🔄 High | TypeScript, may use ML models |

### Sports Data Endpoints
| Endpoint | Status | Risk Level | Reason |
|----------|--------|------------|---------|
| `/api/sports-data-real` | ❓ Untested | 🔄 High | Real sports data integration |
| `/api/championship/[[route]]` | ❓ Untested | 🔄 Medium | Championship data (TypeScript) |

### Privacy & User Data
| Endpoint | Status | Risk Level | Reason |
|----------|--------|------------|---------|
| `/api/privacy/export` | ❓ Untested | 🔄 Medium | GDPR export functionality |

---

## Testing Priority Queue

### High Priority (Test Next)
1. `/api/sports-data-real` - Core data integration
2. `/api/v1/predict/[[model]]` - TypeScript prediction endpoint
3. `/api/championship/[[route]]` - TypeScript championship data

### Medium Priority
4. `/api/v1/predictive/games/[id]/win-prob` - Win probability
5. `/api/v1/patterns/analyze` - Pattern analysis
6. `/api/v1/coaching/decisions` - Decision analysis
7. `/api/v1/dashboards/[[route]]` - Dashboard data

### Low Priority (Test When Time Permits)
8. `/api/v1/predictions/accuracy` - Model metrics
9. `/api/v1/predictions/testing` - Test endpoint
10. `/api/v1/umpire/scorecard` - Umpire analysis

---

## Known Issues & Risks

### Process.env Usage
**Risk**: Many functions may use `process.env.NODE_ENV` for conditional error details:
```javascript
// Common pattern found in functions
return res.json({
  error: message,
  details: process.env.NODE_ENV === 'development' ? stack : undefined
});
```

**Impact**: Will return `undefined` in Workers (harmless but loses debugging info)

**Solution**: Refactor to use `env.NODE_ENV` parameter or remove conditional

### Lib File Dependencies
**Risk**: Untested endpoints may import non-refactored lib files:
- `lib/utils/logger.ts` - Uses process.env (HIGH PRIORITY TO REFACTOR)
- `lib/adapters/sportsdataio.ts` - Uses process.env (HIGH PRIORITY TO REFACTOR)
- `lib/adapters/whoop-v2-adapter.ts` - Uses process.env
- `lib/college-baseball/push-notifications.ts` - Uses process.env
- `lib/db/prisma.ts` - Uses process.env.NODE_ENV

**Impact**: Endpoints importing these will fail with "process is not defined" in Workers

**Mitigation**: Test endpoints incrementally. Refactor lib files as issues are discovered.

---

## Refactored & Safe Lib Files

These files are Workers-compatible and safe to import:
- ✅ `lib/security/secrets.ts` - Refactored 2025-11-20
- ✅ `lib/config/env-validator.ts` - Refactored 2025-11-20
- ✅ `lib/api/sports-data-client.ts` - Refactored 2025-11-20

---

## Testing Procedure

To test an endpoint:

1. **Basic Functionality Test**
   ```bash
   curl -s https://ec0c6db6.college-baseball-tracker.pages.dev/api/[endpoint] | jq
   ```

2. **Check for Errors**
   - Look for "process is not defined" errors
   - Check for 500 Internal Server Error
   - Verify JSON response structure

3. **Check Cloudflare Logs**
   ```bash
   wrangler pages deployment tail --project-name college-baseball-tracker
   ```

4. **Document Results**
   - Update this file with status (✅ Working, ⚠️ Warning, ❌ Broken)
   - Note any issues or warnings
   - Record timestamp of test

5. **If Broken**
   - Identify which lib file is causing the issue
   - Check if it imports non-refactored lib files
   - Add to refactor queue
   - Document workaround if possible

---

## Next Steps

1. **Phase 1 Complete** (✅ In Progress)
   - Add CI check for process.env ✅
   - Document working endpoints ✅ (this file)
   - Create rollback script (pending)
   - Add ESLint rule (pending)

2. **Phase 2 Goals**
   - Test top 10 endpoints from priority queue
   - Refactor `lib/utils/logger.ts`
   - Refactor `lib/adapters/sportsdataio.ts`
   - Update TypeScript build config

3. **Long-Term**
   - Test all 100+ endpoints
   - Complete lib file refactoring
   - Production deployment to blazesportsintel.com

---

## Monitoring & Verification

### Cloudflare Analytics
- Check error rates after enabling new endpoints
- Monitor request patterns
- Track cache hit rates

### Sentry Integration
- Monitor for runtime exceptions
- Track "process is not defined" errors
- Set up alerts for production issues

### Performance Metrics
- Response times for each endpoint
- Cache effectiveness
- Rate limiting effectiveness

---

## Contact & Support

**Deployment Logs**: Check Cloudflare dashboard or run:
```bash
wrangler pages deployment tail --project-name college-baseball-tracker
```

**Rollback Procedure**: See `scripts/rollback.sh` (to be created)

**Documentation**:
- `WORKERS-COMPATIBILITY-REFACTOR-COMPLETE.md` - Refactoring guide
- `PHASE-3-DEPLOYMENT-SUCCESS.md` - Phase 3 deployment details
- `WORKERS-COMPATIBILITY-REFACTOR-STRATEGY.md` - Original strategy

---

**Last Updated**: November 20, 2025, 8:10 PM CST
**Maintainer**: Claude Code + Austin Humphrey
**Status**: Phase 1 (Defensive Measures) - In Progress
