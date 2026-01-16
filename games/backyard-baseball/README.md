# Backyard Baseball

A stylized backyard baseball game with cinematic camera cuts and satisfying bat-ball contact. Web-first delivery via Unity WebGL, with an Unreal Engine 5 reference implementation for high-end desktop.

## Quick Start

```bash
# Start local development server
make serve

# Build Unity WebGL
make build-unity

# Deploy to staging
make deploy-staging
```

## Project Structure

```
backyard-baseball/
├── unity/              # Unity 2022.3 project (primary)
├── unreal/             # Unreal Engine 5.3 project (reference)
├── web/                # Web host, embed page, telemetry
├── assets/             # Source assets (.blend, textures, audio)
├── tools/              # Build scripts, validators
├── infra/              # Cloudflare workers, D1 config
├── docs/               # Runbooks, build guides
└── .github/workflows/  # CI/CD pipelines
```

## Technology Stack

- **Game Engine**: Unity 2022.3 LTS (WebGL)
- **Reference Build**: Unreal Engine 5.3
- **Hosting**: Cloudflare Pages
- **Asset CDN**: Cloudflare R2
- **Telemetry**: Cloudflare Workers + D1
- **CI/CD**: GitHub Actions

## Core Features

- Single at-bat gameplay mode
- Cinematic camera system with 6 states
- Physics-based ball trajectory
- AI pitcher with 3 pitch types
- Real-time telemetry and analytics

## Performance Targets

| Metric | WebGL Target |
|--------|--------------|
| Initial Download | < 15 MB |
| Time to Interactive | < 8 seconds |
| Frame Rate | 60 FPS stable |
| Memory | < 512 MB |
| Draw Calls | < 100 |

## Documentation

- [Build Instructions](docs/BUILD.md)
- [Deployment Guide](docs/DEPLOY.md)
- [Operations Runbook](docs/RUNBOOK.md)

## Commands

| Command | Description |
|---------|-------------|
| `make serve` | Start local dev server |
| `make build-unity` | Build Unity WebGL |
| `make test` | Validate assets |
| `make deploy-staging` | Deploy to staging |
| `make deploy-prod` | Deploy to production |
| `make deploy-worker` | Deploy telemetry worker |

## License

Proprietary - Blaze Sports Intel
