# Blaze Sports Intel - Complete API Endpoints Inventory

## Overview

This directory contains comprehensive documentation of **ALL 28+ API endpoints** across the Blaze Sports Intel codebase.

**Total Lines of Documentation:** 1,311 lines across 3 files
**Total Endpoints Catalogued:** 28+ unique endpoints (35+ routes with variants)
**Last Updated:** October 23, 2025

---

## Quick Navigation

### Main Documentation Files

1. **API_ENDPOINTS_INVENTORY.md** (26 KB, 870 lines)
   - Comprehensive endpoint-by-endpoint breakdown
   - Includes: file paths, line numbers, HTTP methods, parameters, validation, cache settings
   - Organized by source (Express Server, Cloudflare Pages, Next.js)
   - Complete request/response specifications
   - **Start here for detailed information**

2. **API_SUMMARY.txt** (7.6 KB, 253 lines)
   - Executive summary and key findings
   - Validation status overview
   - Data sources and dependencies
   - Performance characteristics
   - Recommendations for improvement
   - **Start here for high-level overview**

3. **API_FILES_REFERENCE.txt** (6.2 KB, 188 lines)
   - Quick lookup by file location
   - Organized by feature/functionality
   - Validation priorities (critical to low)
   - Tier classification (TIER 1-4)
   - Recommended work order
   - **Start here for quick reference**

---

## Key Statistics

### Endpoints by Source
- Express Server: 9 endpoints
- Cloudflare Pages Functions: 15+ endpoints
- Next.js Routes: 1 endpoint
- Multi-route endpoints: 3 variants

### Endpoints by Method
- GET: 19 endpoints
- POST: 8 endpoints
- OPTIONS: Multiple (CORS handlers)

### Validation Status
- Fully Validated: 2 endpoints
- Partially Validated: 8 endpoints
- **Needs Validation: 18+ endpoints** (HIGH PRIORITY)

---

## Critical Findings

### Endpoints Requiring Immediate Validation

**TIER 1 - CRITICAL (High Impact, Frequent Use)**
1. `/api/team/:sport/:teamKey/analytics` - No path parameter validation
2. `/api/team/:sport/:teamKey` - No path parameter validation
3. `/api/live-scores` - Sport parameter validation incomplete
4. `/api/copilot/games` - Multiple query parameters without validation

**TIER 2 - HIGH PRIORITY (Medium-High Impact)**
5. `/api/mlb/scores`, `/api/nfl/scores`, `/api/nba/scores` - Date validation missing
6. `/api/live/*` endpoints - Format validation incomplete
7. `/api/college-baseball/*` - Filter validation incomplete
8. `/api/copilot/search` & `/api/copilot/insight` - Partial validation

### Validation Gaps Summary

**18-20 endpoints need comprehensive validation:**
- Path parameter validation (sport, teamKey, etc.)
- Date/time format validation
- Query parameter enumeration
- Team abbreviation validation
- Conference/division validation

---

## Data Sources

### External APIs
- MLB Stats API (statsapi.mlb.com)
- ESPN APIs (site.api.espn.com)
- SportsDataIO (api.sportsdata.io)
- CollegeFootballData API
- Anthropic Claude API
- Cloudflare Workers AI

### Internal Services
- Cloudflare D1 Database
- Cloudflare Vectorize
- Cloudflare KV Storage
- Cloudflare R2 Bucket

---

## Cache Strategy

| TTL | Endpoints |
|-----|-----------|
| 30 seconds | Live game scores (MLB, NFL, NBA) |
| 1 minute | Live scores aggregation |
| 3 minutes | Copilot semantic search results |
| 5 minutes | College baseball, sports data |
| 1 hour | Team data, simulations |
| No cache | Health checks, metrics |

---

## API Organization by Feature

### Sports Data Endpoints
- `/api/mlb/*` - Baseball scores and data
- `/api/nfl/*` - Football scores and data
- `/api/nba/*` - Basketball scores and data
- `/api/live/ncaa/*` - College sports data
- `/api/college-baseball/*` - College baseball specific
- `/api/simulations/:sport` - Pre-computed simulations

### AI & Search
- `/api/copilot/search` - Semantic search
- `/api/copilot/insight` - RAG-based insights
- `/api/copilot/games` - Database query
- `/api/copilot/teams` - Team queries
- `/api/chat` - Claude chatbot

### Predictions & Analytics
- `/api/predict/game` - Game outcome prediction
- `/api/predict/player` - Player performance prediction
- `/api/team/:sport/:teamKey/analytics` - Team analytics
- `/api/team/:sport/:teamKey` - Team data
- `/api/monte-carlo` - Monte Carlo simulations

### Infrastructure
- `/health` & `/api/health` - Health checks
- `/api/copilot/health` - Copilot service health
- `/api/metrics` - Performance metrics
- `/api/docs` - API documentation

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Database queries | <500ms |
| Cache hits | <10ms |
| Embedding generation | <200ms |
| Vector search | <100ms |
| LLM inference | <1500ms |
| Total response | <2000ms |

---

## Rate Limiting

- **Global:** 100 requests per 15 minutes (Express server)
- **Per-endpoint:** Not implemented (needs implementation)

---

## Recommended Implementation Plan

### Phase 1 (Week 1) - Foundation
- Create validation schemas (Zod recommended)
- Add path parameter validation middleware
- Standardize validation error responses
- Document all validation rules

### Phase 2 (Week 2) - Enhancement
- Implement input sanitization
- Add per-endpoint rate limiting
- Create validation test suite
- Add API versioning headers

### Phase 3 (Week 3) - Documentation
- Generate OpenAPI/Swagger specs
- Create request/response examples
- Build comprehensive error catalog
- Implement request logging

---

## How to Use These Documents

### For Quick Lookup
Start with **API_FILES_REFERENCE.txt**
- Find endpoints by file location
- See validation priorities
- Understand work order

### For Implementation Details
Use **API_ENDPOINTS_INVENTORY.md**
- Get complete endpoint specifications
- See all parameters and validation
- Review response formats
- Check cache strategies

### For Strategic Planning
Reference **API_SUMMARY.txt**
- Understand overall architecture
- See validation gaps
- Review dependencies
- Plan improvements

---

## File Locations

All files are in the project root:
```
/home/user/BSI/
├── API_ENDPOINTS_INVENTORY.md (detailed spec)
├── API_SUMMARY.txt (overview)
├── API_FILES_REFERENCE.txt (quick lookup)
└── README_API_INVENTORY.md (this file)
```

---

## Source Code Locations

### Main Server
- `/home/user/BSI/api/server.js` - 9 Express endpoints

### Cloudflare Functions
- `/home/user/BSI/functions/api/` - 15+ endpoints
- `/home/user/BSI/functions/api/live/[[route]].ts` - 6 multi-route endpoints
- `/home/user/BSI/functions/api/copilot/` - 5 AI/search endpoints

### Next.js Routes
- `/home/user/BSI/apps/web/app/api/v1/baseball/games/route.ts` - 1 endpoint

---

## Next Steps

1. **Review** - Start with API_SUMMARY.txt for overview
2. **Understand** - Dive into API_ENDPOINTS_INVENTORY.md for details
3. **Plan** - Use API_FILES_REFERENCE.txt to plan work
4. **Implement** - Begin with TIER 1 critical endpoints
5. **Validate** - Create and apply schemas from Zod/Joi
6. **Test** - Build comprehensive test suite
7. **Document** - Generate OpenAPI specs

---

## Questions?

Refer to the specific endpoint in API_ENDPOINTS_INVENTORY.md for:
- Request parameters and types
- Response format and fields
- Current validation status
- Caching strategy
- Error handling
- Performance characteristics

---

**Document Version:** 1.0
**Generated:** October 23, 2025
**Codebase:** Blaze Sports Intel
**Branch:** claude/improve-production-quality-011CUPFPtdq7SYsNKy435q8A

