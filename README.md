# BSI - Blaze Sports Intel 🔥

**Premium sports data intelligence platform** providing real-time scores, rankings, standings, and analytics across college and professional sports.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production-green.svg)](https://blazesportsintel.com)

## 🎯 Overview

Blaze Sports Intel (BSI) is a comprehensive sports analytics platform delivering:

- **Real-time Sports Data**: Live scores, game tracking, and updates
- **Transfer Portal Intelligence**: NCAA D1 transfer tracking for college baseball and football
- **Multi-Sport Coverage**: MLB, NFL, NBA, NCAA (Baseball, Football, Basketball)
- **Advanced Analytics**: Rankings, standings, player statistics, and team metrics
- **Smart Data Aggregation**: Multi-source API integration with automatic failover

## 🏗️ Architecture

BSI is built on a modern, serverless architecture leveraging Cloudflare's edge platform:

### Tech Stack

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: Cloudflare Workers (edge compute)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Storage**: 
  - R2 for static assets and data snapshots
  - KV for caching and session management
- **Analytics**: Cloudflare Analytics Engine
- **Deployment**: Cloudflare Pages

### Key Technologies

- **TypeScript/JavaScript**: Type-safe development
- **React**: Component-based UI
- **Cloudflare Workers Runtime**: Edge compute
- **Wrangler**: Cloudflare development and deployment tool

## 📁 Project Structure

```
BSI/
├── app/                          # Next.js application pages
│   ├── dashboard/                # Command center dashboard
│   ├── transfer-portal/          # Transfer portal tracking hub
│   ├── college-baseball/         # College baseball pages
│   └── cfb/                      # College football pages
│
├── components/                   # React components
│   ├── portal/                   # Transfer portal components
│   ├── arcade/                   # Interactive game components
│   └── three/                    # 3D visualization components
│
├── lib/                          # Shared libraries and utilities
│   ├── api-clients/              # API client implementations
│   │   ├── ncaa-api.ts          # NCAA API client
│   │   ├── espn-api.ts          # ESPN API client
│   │   └── highlightly-api.ts   # Highlightly API client
│   ├── data-aggregator/          # Multi-source data aggregation
│   ├── portal/                   # Transfer portal logic
│   └── semantic-validation/      # Data validation layer
│
├── workers/                      # Cloudflare Workers
│   └── college-data-sync/        # Automated data pipeline worker
│
└── bsi-production/               # Production deployment configs
    ├── wrangler.toml            # Cloudflare Workers configuration
    ├── college-baseball/        # College baseball worker
    ├── college-football/        # College football worker
    └── src/                     # Worker source code
```

## ✨ Features

### 🎯 Command Center Dashboard

Real-time sports command center with:
- Live game scores across all sports
- Interactive standings tables
- Sport-specific tabs (MLB, NFL, NBA, NCAA)
- Auto-refreshing data (60-second intervals)
- Data visualization charts
- Cross-sport analytics

### 🔄 Transfer Portal Intelligence

**THE flagship feature** - Premium transfer portal tracking:

- **Real-time NCAA D1 Transfer Tracking**
  - College Baseball
  - College Football
- **Smart Filtering**
  - Position, conference, status
  - Search by player name or school
- **Trending Players** with engagement scores
- **Recent Commitments** tracking
- **Portal Window Status** indicators
- Player stats and profiles

### 📊 Multi-Source Data Integration

**v3.1 Multi-Source API Integration** with automatic failover:

#### Priority Matrix
1. **NCAA API** (henrygd/ncaa-api) - Free, primary source
2. **Highlightly API** (RapidAPI) - Paid, production-grade with SLA
3. **ESPN API** - Unofficial, backup source

#### Data Sources
- **NCAA Official Portal**
- **D1Baseball.com**
- **ESPN API**
- **Baseball-Reference**
- **Pro-Football-Reference**
- **247Sports**
- **On3**

### 🛡️ Semantic Validation Layer (v3.0)

Built-in data quality assurance:

- **Density Thresholds**
  - CFB Rankings: 25 teams minimum
  - CFB Standings: 100 teams minimum
  - CBB Rankings: 25 teams minimum  
  - CBB Standings: 200 teams minimum
- **Schema Validation**: Required fields enforcement
- **Invalid Data Protection**: Blocks corrupted data from storage
- **Fallback Recovery**: R2 snapshots for data recovery
- **Read-Path Validation**: Re-validates on serving

## 🔌 API Endpoints

### College Data Sync Worker

**Health & Monitoring**
```
GET  /health               # Service health with staleness detection
GET  /status               # Detailed sync status
GET  /alerts               # Active alerts and health score
GET  /semantic-health      # Data density vs thresholds
GET  /truth                # Alias for /semantic-health
```

**Data Synchronization (Legacy ESPN)**
```
POST /sync/all                      # Sync all rankings and standings
POST /sync/college-baseball         # Sync baseball rankings
POST /sync/college-football         # Sync football rankings
POST /sync/standings/baseball       # Sync baseball standings
POST /sync/standings/football       # Sync football standings
```

**Data Retrieval**
```
GET  /rankings/baseball             # Current baseball rankings
GET  /rankings/football             # Current football rankings
GET  /standings/baseball            # Baseball standings (optional ?conference=SEC)
GET  /standings/football            # Football standings (optional ?conference=SEC)
```

**V2 Multi-Source Endpoints**
```
POST /v2/sync/games                 # Sync live games (multi-source)
POST /v2/sync/rankings              # Sync rankings (multi-source)
POST /v2/sync/standings             # Sync standings (multi-source)
GET  /v2/games/live                 # Live games with auto-failover
GET  /v2/games/today                # Today's games
GET  /v2/games?date=YYYY-MM-DD      # Games by date
GET  /v2/games?team=xxx             # Games by team
GET  /v2/teams                      # Teams from D1 database
GET  /v2/source-health              # Multi-source health check
```

## 🚀 Workers & Automation

### `bsi-college-data-sync`

Automated data pipeline running every 6 hours:

**Features:**
- Multi-source API integration
- Semantic validation (v3.0)
- Consecutive failure tracking
- Analytics Engine integration
- Staleness detection
- Health monitoring with alerts
- R2 snapshot storage

**Supported Sports:**
- College Baseball (Rankings & Standings)
- College Football (AP Top 25, CFP, Coaches Poll & Standings)

**Monitoring Thresholds:**
- Healthy: < 12 hours since last sync
- Stale: 12-24 hours
- Critical: > 24 hours

## 🗄️ Database Schema

### Cloudflare D1 Databases

**BSI_GAME_DB**
- User accounts and sessions
- Game data and statistics
- Subscription management

**BSI_CONTENT_DB**
- Content management
- Editorial data

### Key Tables

**Rankings Tables:**
- `college_baseball_rankings`
- `college_football_rankings`

**Standings Tables:**
- `college_baseball_standings`
- `college_football_standings`

**Audit:**
- `ingestion_log` - Data sync audit trail

## 🎨 UI Components

### Design System

- **Dark, cinematic theme** - Midnight backgrounds
- **Burnt orange accents** - Brand color (#BF5700)
- **Data-dense layouts** - Maximum information density
- **Responsive design** - Mobile-first approach
- **Smooth animations** - ScrollReveal, transitions
- **Lazy-loaded charts** - Code-split for performance

### Key Components

- `PortalCard` - Transfer portal player cards
- `LiveScoresPanel` - Real-time game scores
- `StandingsTable` - Interactive standings
- `SportTabs` - Multi-sport navigation
- `DashboardCharts` - Data visualizations

## ⚙️ Configuration

### Environment Variables

```bash
# API Keys
HIGHLIGHTLY_API_KEY=          # Highlightly API (optional, paid)
NCAA_API_URL=                 # NCAA API endpoint (optional)

# Cloudflare Bindings (set via wrangler.toml)
BSI_DB                        # D1 Database
BSI_CACHE                     # KV Namespace for caching
BSI_SESSIONS                  # KV Namespace for sessions
BSI_R2                        # R2 Bucket for assets
ANALYTICS                     # Analytics Engine dataset
```

### Wrangler Configuration

See `bsi-production/wrangler.toml` for:
- D1 database bindings
- KV namespace bindings
- R2 bucket configuration
- Environment-specific settings
- Cron trigger schedules

## 📈 Monitoring & Analytics

### Built-in Observability

- **Health Checks**: Service health endpoints
- **Staleness Detection**: Data freshness monitoring
- **Failure Tracking**: Consecutive failure alerts
- **Analytics Engine**: Time-series metrics
- **Semantic Health**: Data density validation
- **Alert System**: Proactive monitoring

### Health Scores

- **Truth Score**: 0-100 based on valid datasets
- **Health Score**: Overall system health (0-100)
- **Status Levels**: healthy | stale | critical

## 🔐 Security & Privacy

- Session management via KV
- Secure API key handling
- CORS configuration
- Rate limiting (planned)
- Data validation and sanitization

## 🌟 Special Features

### 3D Visualization
- Backyard Field Viewer (`components/three/`)
- Interactive baseball field rendering

### Arcade Games
- Blaze Arcade (`components/arcade/`)
- Interactive sports mini-games

### Vision AI Intelligence
- Smart analysis features
- Automated insights (planned)

## 📝 License

This project is proprietary software developed for Blaze Sports Intel.

## 🤝 Contributing

This is a private repository. For questions or collaboration inquiries, please contact the BSI team.

---

**Built with 🔥 by the Blaze Sports Intel Team**

*Last Updated: 2025-01-16*
*Version: 3.1.0*
