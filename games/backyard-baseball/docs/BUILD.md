# Build Instructions

## Prerequisites

### Unity Build
- Unity 2022.3.20f1 (LTS)
- WebGL Build Support module
- Valid Unity license

### Unreal Build
- Unreal Engine 5.3+
- Visual Studio 2022 (Windows) or Xcode (Mac)

### Web Development
- Node.js 20+
- Python 3.9+

### Deployment
- Cloudflare account with Pages access
- Wrangler CLI (`npm install -g wrangler`)

## Local Development

### First-Time Setup

```bash
# Clone repository
cd games/backyard-baseball

# Install worker dependencies
cd infra/cloudflare && npm install && cd ../..

# Verify structure
ls -la unity/ unreal/ web/ tools/
```

### Running Locally

```bash
# Start local server (serves web/ directory)
make serve

# Open http://localhost:8000
```

Note: Local testing requires a Unity WebGL build in `web/Build/`.

## Building

### Unity WebGL

**From Unity Editor:**
1. Open `unity/` as Unity project
2. File → Build Settings → WebGL
3. Build to `web/Build/`

**From Command Line:**
```bash
make build-unity
```

Requires `UNITY_PATH` environment variable pointing to Unity executable.

### Unreal Desktop

1. Open `unreal/BackyardBaseball.uproject`
2. File → Package Project → Windows/Mac
3. Output goes to `unreal/Packaged/`

## Asset Pipeline

### Blender Export

```bash
# Export for Unity
blender --background --python tools/blender-export.py -- assets/source/characters/batter_kid.blend assets/export/unity unity

# Export for Unreal
blender --background --python tools/blender-export.py -- assets/source/characters/batter_kid.blend assets/export/unreal unreal
```

### Validation

```bash
make test
```

Checks:
- Texture sizes against budgets
- Audio file formats and sizes
- Export directory structure

## Deployment

### Staging

```bash
make deploy-staging
```

Deploys to: staging-game.blazesportsintel.com

### Production

```bash
make deploy-prod
```

Requires typing "production" to confirm.

### Telemetry Worker

```bash
make deploy-worker
```

Creates/updates D1 database and deploys worker.

## CI/CD

GitHub Actions automatically:
1. Builds Unity WebGL on push to main
2. Deploys to staging
3. Deploys to production (after staging succeeds)

Required secrets:
- `UNITY_LICENSE` - Base64-encoded Unity license file
- `UNITY_EMAIL` - Unity account email
- `UNITY_PASSWORD` - Unity account password
- `CF_API_TOKEN` - Cloudflare API token
- `CF_ACCOUNT_ID` - Cloudflare account ID

## Troubleshooting

### Build Fails: "Unity not found"

Set the Unity path:
```bash
export UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.20f1/Unity.app/Contents/MacOS/Unity"
```

### Build Fails: "Library not initialized"

Clear Unity cache:
```bash
rm -rf unity/Library
```

### WebGL Errors: "SharedArrayBuffer not available"

Ensure `_headers` file includes COOP/COEP headers. Check browser console.

### Large Build Size

Run asset validation and check for:
- Uncompressed textures
- High-poly meshes
- Duplicate assets
