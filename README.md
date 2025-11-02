# Blaze Biomechanics Vision System

**Real-time 3D pose tracking + biomechanical analysis for elite athletic performance prediction**

## Mission
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

## Mobile Performance Budgets

- Largest Contentful Paint ≤ **2.5s** on cellular-first devices.
- Cumulative Layout Shift ≤ **0.10** across every route.
- Interaction to Next Paint must stay in the "good" band (<200 ms) for hero interactions.
- Lighthouse CI enforces these budgets automatically in GitHub Actions via `lighthouserc.json`.

Run locally before opening a PR:

```bash
pnpm install
pnpm run build:games
pnpm --filter @bsi/web build
npx @lhci/cli autorun --config=lighthouserc.json
```

## Backyard Blaze Ball Build Steps

```bash
pnpm run build:games   # builds Phaser bundle + copies to public/games/bbp-web
pnpm --filter @bsi/web dev  # start Next.js with game assets in place
```

- Static bundle lives at `public/games/bbp-web` and deploys with Cloudflare Pages caches from `_headers`.
- Use `pnpm run ci:check-ip` to ensure no restricted sandlot character names land in source.
- Read `docs/GAME_README.md` for deeper instructions plus native Godot track.

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
