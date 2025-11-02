# Configuration Files Inventory

## Overview
This document provides a comprehensive inventory of all configuration files in the BSI repository, their purposes, and consolidation recommendations.

**Last Updated**: 2025-11-02
**Status**: Active

---

## Active Configuration Files

### 1. Root Configuration Files

#### `wrangler.toml` (Primary Pages Configuration)
- **Purpose**: Cloudflare Pages deployment for college-baseball-tracker
- **Type**: Pages Project
- **Build Output**: `dist/`
- **Bindings**:
  - D1 Database: `blazesports-historical` (612f6f42-226d-4345-bb1c-f0367292f55e)
  - KV Namespace: `CACHE` (a53c3726fc3044be82e79d2d1e371d26)
  - Durable Object: `GAME_MONITOR`
- **Status**: ✅ Active - Primary production configuration
- **Deployment**: `blazesportsintel.pages.dev` / `blazesportsintel.com`

#### `wrangler.worker.toml` (Durable Objects Worker)
- **Purpose**: Durable Objects for real-time game monitoring
- **Type**: Worker with Durable Objects
- **Entry Point**: `worker-index.ts`
- **Bindings**:
  - D1 Database: Same as Pages
  - KV Namespace: Same as Pages
  - Durable Object: `GameMonitorDO`
- **Status**: ✅ Active - Real-time game state management
- **Deployment**: `blazesports-game-monitor.workers.dev`

#### `wrangler-models.toml` (AI Model Bindings)
- **Purpose**: AI/ML model bindings for Cloudflare Workers AI
- **Type**: Worker with AI model bindings
- **Models**:
  - Llama 3.1 8B Instruct FP8
  - Llama 3.2 1B Instruct
  - Qwen 2.5 Coder 32B Instruct AWQ
- **Status**: ✅ Active - AI-powered features
- **Use Cases**: Text generation, predictions, copilot features

---

### 2. Application-Specific Configurations

#### `apps/api-worker/wrangler.toml`
- **Purpose**: Edge API worker
- **Type**: Worker
- **Entry Point**: `src/index.ts`
- **Features**:
  - Observability logs enabled
  - Head sampling rate: 20%
- **Status**: ✅ Active - Edge API endpoints
- **Deployment**: `bsi-edge.workers.dev`

#### `apps/web/package.json`
- **Purpose**: Next.js 15 web application
- **Framework**: Next.js 15 (App Router)
- **Key Dependencies**:
  - React 19
  - Babylon.js (3D graphics)
  - Datadog Browser RUM & Logs
  - Sentry (error tracking)
  - Chart.js (data visualization)
- **Status**: ✅ Active - Primary user-facing application
- **Deployment**: Vercel / Netlify / Cloudflare Pages

---

### 3. Worker Configurations

#### `workers/cfb-intelligence/wrangler.toml`
- **Purpose**: College Football intelligence and analytics
- **Status**: ✅ Active
- **Deployment**: CFB-specific endpoints

#### `workers/content/wrangler.toml`
- **Purpose**: Content management and delivery
- **Status**: ✅ Active
- **Deployment**: Content API endpoints

#### `workers/ingest/wrangler.toml`
- **Purpose**: Data ingestion pipelines
- **Status**: ✅ Active
- **Deployment**: Data ingestion workers

#### `workers/live-sim/wrangler.toml`
- **Purpose**: Live game simulation engine
- **Status**: ✅ Active
- **Deployment**: Live simulation features

#### `workers/qc/wrangler.toml`
- **Purpose**: Quality control and data validation
- **Status**: ✅ Active
- **Deployment**: QC workers

---

### 4. Library/Skill Configurations

#### `lib/skills/sports-data-qc/wrangler.toml`
- **Purpose**: Sports data quality control skill
- **Status**: ✅ Active
- **Deployment**: QC validation endpoints

---

## Archived Configuration Files

### Archive Directory: `BSI-archive/old-configs/`

#### ❌ `wrangler-pages.toml` (Archived)
- **Location**: `/BSI-archive/old-configs/wrangler-pages.toml`
- **Status**: Deprecated - Replaced by root `wrangler.toml`
- **Action**: Keep archived for reference

#### ❌ `wrangler-championship.toml` (Archived)
- **Location**: `/BSI-archive/old-configs/wrangler-championship.toml`
- **Status**: Deprecated - Championship features integrated into main app
- **Action**: Keep archived for reference

#### ❌ `wrangler-backup.toml` (Archived)
- **Location**: `/archive/2025-10-13/config/wrangler-backup.toml`
- **Status**: Backup from October 2025 refactor
- **Action**: Can be deleted after 30 days

---

## Configuration Consolidation Strategy

### ✅ Recommended Actions

1. **Keep Current Structure**
   - The current configuration structure is **well-organized**
   - Each wrangler.toml serves a distinct purpose
   - Separation of concerns is appropriate

2. **Documentation Improvements**
   - ✅ This inventory document created
   - Add comments to each wrangler.toml explaining its purpose
   - Create deployment diagram showing relationships

3. **Standardization**
   - Ensure all active configs use `compatibility_date = "2025-01-01"` or later
   - Enable observability logs across all workers
   - Use consistent naming conventions

4. **Cleanup**
   - Remove `/archive/2025-10-13/config/wrangler-backup.toml` after January 2026
   - Keep BSI-archive files for historical reference

### 🔧 Environment Variables Standardization

All configurations should use these standard environment variables:

```bash
# Core
ENVIRONMENT=production
NODE_ENV=production

# Database
DATABASE_URL=<Cloudflare D1 or external DB>
DB_ID=612f6f42-226d-4345-bb1c-f0367292f55e

# Caching
KV_NAMESPACE_ID=a53c3726fc3044be82e79d2d1e371d26

# Observability
SENTRY_DSN=<sentry-dsn>
DD_API_KEY=<datadog-api-key>
DD_CLIENT_TOKEN=<datadog-client-token>
LOG_LEVEL=info

# APIs
SPORTSDATAIO_KEY=<api-key>
MLB_API_KEY=<api-key>
NFL_API_KEY=<api-key>
```

---

## Configuration Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Account                      │
│  Account ID: dc6f9d8804f86cb3efa21c1e45a06de9             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐       ┌─────▼──────┐
   │   D1    │        │   KV    │       │  Durable   │
   │Database │        │  Cache  │       │  Objects   │
   └────┬────┘        └────┬────┘       └─────┬──────┘
        │                  │                   │
   ┌────▼──────────────────▼───────────────────▼────┐
   │         Shared Bindings (All Workers)          │
   └────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐       ┌─────▼──────┐
   │  Pages  │        │ Workers │       │ Next.js    │
   │wrangler │        │  (7x)   │       │   App      │
   │  .toml  │        │wrangler │       │ (apps/web) │
   └─────────┘        │  .toml  │       └────────────┘
                      └─────────┘
```

---

## Deployment Architecture

### Production Domains

- **Primary**: `blazesportsintel.com`
  - Deployed via: `wrangler.toml` (Cloudflare Pages)
  - Framework: Vite + Cloudflare Functions

- **Next.js App**: TBD (Vercel/Netlify recommended)
  - Config: `apps/web/package.json`
  - Framework: Next.js 15 + App Router

- **Workers**: `*.workers.dev` or custom domains
  - 7 specialized workers for different features
  - Each with dedicated wrangler.toml

---

## Security Considerations

### Secrets Management

All sensitive values must be stored as **Cloudflare Secrets**, not in wrangler.toml:

```bash
# Set secrets via Wrangler CLI
wrangler secret put SPORTSDATAIO_KEY
wrangler secret put SENTRY_DSN
wrangler secret put DD_API_KEY
```

### Access Control

- **Branch Protection**: Enabled on `main` branch
- **Environment Protection**: Staging → Production flow
- **Secret Rotation**: Quarterly rotation schedule

---

## Monitoring & Alerts

### Configuration Drift Detection

- GitHub Action: `.github/workflows/drift-monitoring.yml`
- Checks for unauthorized config changes
- Alerts on mismatched bindings

### Health Checks

All workers and pages must expose:
- `/api/health` - Health check endpoint
- `/api/metrics` - Prometheus-style metrics

---

## Next Steps

1. ✅ Configuration inventory created
2. ⏳ Add inline comments to each wrangler.toml
3. ⏳ Enable observability logs on all workers
4. ⏳ Create deployment runbook
5. ⏳ Set up automated config validation

---

## References

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)

---

**Maintainer**: Blaze Sports Intel DevOps Team
**Review Frequency**: Monthly
**Last Review**: 2025-11-02
