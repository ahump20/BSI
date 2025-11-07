# Blaze Sports Intelligence Platform

**Comprehensive sports analytics platform combining real-time data, AI-powered insights, and biomechanical analysis**

## Mission
Bridge sports data, computer vision, and biomechanics to deliver elite athletic performance prediction and analysis. Covering MLB, NFL, NBA, and College Baseball with real-time updates, advanced analytics, and AI-powered copilot assistance.

## 📊 Project Status

**Current Version:** 1.0.0
**Last Updated:** November 6, 2025

Track our development progress on the **[Platform Enhancement Project Board](https://github.com/ahump20/BSI/projects/1)**.

### Recent Milestones

✅ **Phase 1: Foundation & SEO** (Complete)
- Site inventory and information architecture
- Legal URL canonicalization with 301 redirects
- Coverage matrix API endpoint
- SEO optimization (sitemap.xml, robots.txt)

✅ **Phase 2: Page Enhancements** (Complete)
- Dual-CTA homepage with proof elements
- Historical data coverage matrix widget
- Features comparison page (Blaze vs ESPN)

✅ **Phase 3: Technical Infrastructure** (Complete)
- Core Web Vitals monitoring with INP metric
- Accessibility quality gates (WCAG 2.2 AA)
- Design system with component library

✅ **Phase 4: Governance & Process** (In Progress - 80% Complete)
- ✅ Pre-commit hooks with Husky
- ✅ Comprehensive documentation suite
- ⏳ Visual regression testing with Percy
- ⏳ GitHub project board setup

### 📚 Documentation

Comprehensive documentation for developers, contributors, and operators:

- **[Contributing Guide](docs/CONTRIBUTING.md)** - Code standards, workflow, and PR process
- **[API Documentation](docs/API.md)** - Complete API reference with OpenAPI 3.1 spec
- **[Deployment Runbook](docs/DEPLOYMENT.md)** - Operations guide and deployment procedures
- **[Performance Guidelines](docs/PERFORMANCE.md)** - Performance budgets and optimization strategies
- **[CI/CD Pipeline](docs/CI-CD-PIPELINE.md)** - Continuous integration and deployment workflow
- **[Design System](docs/DESIGN-SYSTEM.md)** - Design tokens and component library

## Biomechanics Vision System

**Real-time 3D pose tracking + biomechanical analysis for elite athletic performance prediction**

Bridge computer vision and biomechanics to quantify the "unseen" micro-moves that predict elite upside. Integrates seamlessly with the Diamond Certainty Engine™ to deliver actionable insights from multi-camera 3D pose data.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/blazesportsintel/biomech-vision.git
cd blaze-biomech-vision

# One-command launch
make up

# Or using docker-compose directly
docker-compose up -d

# Access the system
# Dashboard: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Architecture

### Core Pipeline
```
Multi-Camera Feed → 3D Pose Extraction → Feature Computation → Certainty Mapping → Coach UX
     ↓                    ↓                     ↓                    ↓              ↓
  Raw Video         Joint Angles          Biomech Metrics     Trait Scores    Clip Reels
```

### Key Components

1. **Pose Ingestion Service**: Handles multi-format 3D skeleton data (OpenPose, MediaPipe, KinaTrax, Hawk-Eye)
2. **Feature Extraction Engine**: Computes 30+ biomechanical features in real-time
3. **Risk Assessment Module**: Identifies injury risk patterns and mechanical inefficiencies
4. **Clip Generation System**: Auto-generates video segments tied to specific metrics
5. **Diamond Certainty Integration**: Maps biomechanics to trait dimensions

## Measured Micro-Signals

### Baseball
- **Hip-Shoulder Separation**: Peak separation angle at foot contact
- **Pelvis Rotation Velocity**: Angular velocity through rotation sequence
- **Trunk Angular Momentum**: Energy transfer efficiency
- **Ground Contact Time**: Load phase duration
- **Elbow Valgus Angle**: Injury risk indicator

### Football
- **First-Step Explosiveness**: 0-400ms burst metrics
- **Center of Mass Projection**: Balance and acceleration efficiency
- **Shin Angle at Launch**: Power generation indicator
- **Hip Extension Power**: Drive phase mechanics

### Basketball
- **Lateral Step Quickness**: Change of direction efficiency
- **Jump Loading Rate**: Force development speed
- **Landing Stability Index**: ACL risk assessment
- **Deceleration Control**: Eccentric strength indicator

### Track & Field
- **Ground Contact Asymmetry**: Left/right imbalance detection
- **Flight Time Ratio**: Elastic energy utilization
- **Vertical Oscillation**: Running economy metric
- **Cadence Variability**: Fatigue indicator

## 🚀 API Documentation

### Quick Start
```bash
# Start the API server
npm run api:start

# Test health endpoint
curl http://localhost:3000/health

# View API documentation
open http://localhost:3000/api/docs
```

### Core Analysis Endpoints

#### Health & Status
```http
GET /health
```
Returns system health status and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected", 
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Teams Management
```http
GET /api/teams
```
Retrieve all teams from the database.

**Response:**
```json
{
  "success": true,
  "count": 32,
  "teams": [
    {
      "id": 1,
      "name": "Cardinals",
      "sport": "MLB",
      "division": "NL Central"
    }
  ],
  "dataSource": "PostgreSQL Database"
}
```

#### MLB Data & Analytics
```http
GET /api/mlb/:teamId?
```
Fetch real MLB team data with advanced analytics.

**Parameters:**
- `teamId` (optional): MLB team ID (defaults to 138 for Cardinals)

**Response:**
```json
{
  "success": true,
  "team": {
    "id": 138,
    "name": "St. Louis Cardinals",
    "abbreviation": "STL"
  },
  "standings": [
    {
      "team": "Cardinals",
      "wins": 82,
      "losses": 80,
      "pct": ".506"
    }
  ],
  "analytics": {
    "pythagorean": {
      "expectedWins": 79,
      "winPercentage": "0.488",
      "runsScored": 744,
      "runsAllowed": 776
    },
    "dataSource": "Calculated from real MLB Stats API data"
  },
  "cached": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### NFL Data & Analytics
```http
GET /api/nfl/:teamId?
```
Fetch real NFL team data from ESPN API.

**Parameters:**
- `teamId` (optional): NFL team ID (defaults to 10 for Titans)

**Response:**
```json
{
  "success": true,
  "team": {
    "id": 10,
    "displayName": "Tennessee Titans",
    "abbreviation": "TEN"
  },
  "dataSource": "ESPN API"
}
```

### Biomechanics & Pose Analysis

#### Pose Data Ingestion
```http
POST /api/v1/pose/ingest
Content-Type: application/json
```
Stream 3D pose data for real-time analysis.

**Request Body:**
```json
{
  "athlete_id": "athlete_001",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "pose_data": {
    "keypoints": [
      {"x": 0.5, "y": 0.3, "z": 0.1, "confidence": 0.95},
      {"x": 0.52, "y": 0.35, "z": 0.12, "confidence": 0.92}
    ],
    "sport": "baseball",
    "action": "pitch"
  }
}
```

#### Biomechanical Analysis
```http
GET /api/v1/analysis/{athlete_id}/biomech
```
Get comprehensive biomechanical analysis for an athlete.

**Response:**
```json
{
  "athlete_id": "athlete_001",
  "biomech_metrics": {
    "hip_shoulder_separation": {
      "peak_angle": 45.7,
      "percentile": 85,
      "status": "excellent"
    },
    "pelvis_rotation_velocity": {
      "peak_velocity": 687.3,
      "unit": "deg/s",
      "percentile": 72
    },
    "ground_contact_time": {
      "duration": 180,
      "unit": "ms",
      "percentile": 64
    }
  },
  "risk_assessment": {
    "injury_risk_score": 2.3,
    "risk_level": "low",
    "primary_concerns": []
  }
}
```

#### Diamond Certainty Trait Scores
```http
GET /api/v1/diamond-certainty/{athlete_id}/scores
```
Get Diamond Certainty Engine intelligence trait scores.

**Response:**
```json
{
  "athlete_id": "athlete_001",
  "diamond_certainty_scores": {
    "clutch_gene": 92.1,
    "killer_instinct": 88.4,
    "flow_state": 84.6,
    "mental_fortress": 90.2,
    "predator_mindset": 87.3,
    "champion_aura": 85.5,
    "winner_dna": 89.7,
    "beast_mode": 91.8
  },
  "overall_score": 88.9,
  "projection": "elite_upside"
}
```

#### Video Clip Generation
```http
POST /api/v1/clips/generate
Content-Type: application/json
```
Generate metric-specific video clips.

**Request Body:**
```json
{
  "athlete_id": "athlete_001",
  "metric_type": "hip_shoulder_separation",
  "time_range": {
    "start": "2024-01-01T10:00:00.000Z",
    "end": "2024-01-01T10:05:00.000Z"
  },
  "highlight_threshold": 75
}
```

### Risk Assessment

#### Injury Risk Profile
```http
GET /api/v1/risk/{athlete_id}/profile
```
Comprehensive injury risk assessment.

**Response:**
```json
{
  "athlete_id": "athlete_001",
  "risk_profile": {
    "overall_score": 2.3,
    "risk_level": "low",
    "body_regions": {
      "elbow": {
        "risk_score": 1.8,
        "primary_metrics": ["valgus_angle", "forearm_rotation"]
      },
      "shoulder": {
        "risk_score": 2.1,
        "primary_metrics": ["external_rotation", "abduction_angle"]
      },
      "lower_back": {
        "risk_score": 1.5,
        "primary_metrics": ["hip_shoulder_separation", "trunk_tilt"]
      }
    }
  }
}
```

#### Real-time Alerts
```http
GET /api/v1/risk/alerts
```
Get current mechanical red flags and alerts.

### Database Operations

#### Analytics Storage
```http
POST /api/analytics
Content-Type: application/json
```
Store analytical calculations and metrics.

#### Performance Metrics
```http
GET /api/performance/{athlete_id}
```
Retrieve performance metrics and trends.

### Authentication

All API endpoints support JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

### Rate Limits

- **Development**: 1000 requests/minute
- **Production**: 500 requests/minute per API key
- **Burst**: Up to 100 requests in 10 seconds

### Error Responses

All endpoints return consistent error formats:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### WebSocket Endpoints

Real-time data streaming via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to live pose data
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'pose_stream',
  athlete_id: 'athlete_001'
}));
```

### SDK Examples

#### Node.js
```javascript
import BlazeSDK from '@blazesportsintel/sdk';

const blaze = new BlazeSDK({
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:3000'
});

const analysis = await blaze.biomech.getAnalysis('athlete_001');
```

#### Python
```python
from blaze_sdk import BlazeClient

client = BlazeClient(api_key='your-api-key')
analysis = client.biomech.get_analysis('athlete_001')
```

## Environment Variables

```bash
# Copy example config
cp .env.example .env

# Core settings
POSTGRES_DB=blaze_biomech
REDIS_URL=redis://redis:6379
S3_BUCKET=blaze-pose-data

# External integrations
KINTRAX_API_KEY=your_key_here
HAWKEYE_ENDPOINT=https://api.hawkeye.com
ENIGMA_ENGINE_URL=https://enigma.blazesportsintel.com
```

## Development

```bash
# Run with hot reload
make dev

# Run tests
make test

# Format code
make format

# Build production images
make build-prod
```

## Performance Benchmarks

- **Pose Processing**: 30 FPS real-time for 4 camera streams
- **Feature Extraction**: <50ms per frame
- **Clip Generation**: 2-3 seconds per 10-second segment
- **API Response**: p95 < 200ms

## Sample Data

The system includes sample 3D pose streams and athlete profiles:

```bash
# Load sample data
python scripts/seed_data.py

# Sample athletes included:
# - Baseball: 5 pitchers, 5 hitters with full motion capture
# - Football: 3 QBs, 4 WRs with first-step analysis
# - Basketball: 6 players with jump/land sequences
```

## Deployment

### Production (AWS/Cloudflare)
```bash
# Deploy to Cloudflare R2 + Workers
make deploy-cloudflare

# Or traditional AWS
make deploy-aws
```

## Security Notes

- All pose data encrypted at rest (AES-256)
- API authentication via JWT with refresh tokens
- Rate limiting: 1000 requests/minute per client
- No PII stored with biomechanical data
- HIPAA-compliant data handling available

## Troubleshooting

### Common Issues

1. **Camera calibration errors**: Ensure calibration files in `sample_data/calibration/`
2. **Memory issues with video processing**: Adjust `VIDEO_BUFFER_SIZE` in `.env`
3. **Slow feature extraction**: Enable GPU support with `USE_GPU=true`

## License

MIT License - See LICENSE file for details

## Support

- Documentation: https://docs.blazesportsintel.com/biomech
- API Status: https://status.blazesportsintel.com
- Contact: biomech@blazesportsintel.com

---

## 🎮 Games Feature

### Baseball Batting Game (MVP)

An original, mobile-first baseball game built with Phaser 3 and integrated into the main site.

**Quick Start:**
```bash
# Build the game
pnpm run build:games

# Builds to apps/web/public/games/bbp-web/
```

**Features:**
- ⚾ 3-inning batting game with timing-based mechanics
- 📱 Touch-first controls (tap to swing)
- 🎯 Multiple pitch types (fastball, changeup, curveball)
- 🏆 Score tracking and CPU opponent
- 🎨 100% original content (no third-party IP)

**Routes:**
- `/games` - Games landing page
- `/games/bbp` - Baseball game (iframe embed)
- `/games/bbp/legal` - Legal compliance page

**Documentation:**
- `docs/GAME_README.md` - Development guide
- `LEGAL_COMPLIANCE.md` - IP compliance requirements
- `assets/LICENSES.md` - Asset manifest
- `docs/ai-assets/prompts-and-guidelines.md` - AI asset guidelines

**Legal Compliance:**
- All game content is 100% original
- No use of Backyard Baseball or other licensed IP
- CI blocklist check prevents prohibited terms
- See `LEGAL_COMPLIANCE.md` for full details

---

## 📊 Mobile Performance Optimizations

### Core Web Vitals Targets (Mobile)

- **LCP (Largest Contentful Paint)**: ≤ 2.5s
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **INP (Interaction to Next Paint)**: ≤ 200ms
- **TTFB (Time to First Byte)**: ≤ 600ms

### Performance Features

**1. Lazy Loading**
- Heavy components load on-demand (3D visualizations, charts, LEI)
- Uses `apps/web/components/LazyLoadWrapper.tsx`
- Skeleton loading states prevent layout shifts

**2. Font Optimization**
- System fonts on mobile (< 768px) for zero latency
- `font-display: swap` prevents FOIT
- See `apps/web/app/font-optimization.css`

**3. Image Optimization**
- Cloudflare Image Resizing enabled
- Responsive image sizes
- `stale-while-revalidate` caching

**4. Static Asset Caching**
- Game assets: 1 year immutable cache
- Next.js static: 1 year immutable
- Images: 1 day cache
- See `apps/web/public/_headers`

**5. Lighthouse CI**
- Automated performance checks on PRs
- Mobile-specific config: `lighthouserc-mobile.json`
- Desktop config: `lighthouserc.json`
- GitHub Action: `.github/workflows/lighthouse-ci.yml`

**6. Web Vitals Tracking**
- Real-time monitoring at `/performance`
- Tracks LCP, FID, CLS, FCP, TTFB, INP
- Analytics endpoint: `/api/analytics/web-vitals`

### Build Commands

```bash
# Build everything (games + site)
pnpm install
pnpm run build:games  # Build Phaser game
cd apps/web && pnpm build  # Build Next.js site

# Deploy to Cloudflare
cd apps/web
wrangler pages deploy .next --project-name blazesportsintel
```

### Performance Monitoring

**Lighthouse CI:**
```bash
# Run Lighthouse CI locally
npm install -g @lhci/cli
lhci autorun --config=lighthouserc-mobile.json
```

**Manual Testing:**
1. Open Chrome DevTools
2. Lighthouse tab
3. Select "Mobile" device
4. Check "Performance" category
5. Run audit

**Web Vitals Dashboard:**
- Visit `/performance` on the live site
- Shows real user metrics (RUM)
- Historical trends and percentiles

### Performance Best Practices

1. **Images**: Use Next.js `<Image>` component with priority for above-fold images
2. **JS Bundles**: Dynamic imports for heavy components
3. **CSS**: Tailwind with proper purge configuration
4. **Fonts**: System fonts on mobile, web fonts on desktop
5. **Caching**: Leverage Cloudflare CDN for static assets
6. **Analytics**: Respect DNT (Do Not Track) headers

### CI/CD Checks

**Automated on Pull Requests:**
- ✅ Lighthouse CI (mobile performance thresholds)
- ✅ Content blocklist (prevents IP violations)
- ✅ Build verification (games + site)
- ✅ Type checking (TypeScript)

**Performance Budget:**
- Initial JS: < 500KB gzipped
- Game bundle: < 350KB gzipped
- LCP: < 2.5s on 4G mobile
- CLS: < 0.1 globally
