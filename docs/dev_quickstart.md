# BSI Developer Quickstart

**Zero to Championship Analytics in 5 Minutes**

## Prerequisites

Minimal requirements to get started:

- **macOS/Linux/Windows with WSL2**
- **Docker Desktop** installed and running
- **Git** for version control
- **VS Code** with Dev Containers extension (recommended)

Optional but recommended:

- Python 3.11+
- Node.js 20+
- Cloudflare account (free tier works)

## 🚀 One-Command Setup

Clone and start developing immediately:

```bash
# Clone the repository
git clone https://github.com/ahump20/BSI.git
cd BSI

# One-command setup
make setup

# Start development environment
make dev
```

That's it! BSI is now running at:

- **Main App**: http://localhost:8000
- **Cloudflare Dev**: http://localhost:8787
- **API Docs**: http://localhost:8000/docs

## 🎯 Quick Development Workflow

### VS Code Dev Container (Recommended)

1. Open VS Code
2. Install "Dev Containers" extension
3. Open BSI folder
4. Click "Reopen in Container" when prompted
5. Everything is pre-configured and ready!

### Local Development

```bash
# Start all services with hot reload
make dev

# In separate terminal, run tests
make test

# Format code before committing
make format
```

## 📁 Project Structure

```
BSI/
├── .devcontainer/       # Dev container configuration
│   ├── devcontainer.json
│   ├── docker-compose.yml
│   └── Dockerfile
├── api/                 # FastAPI backend
├── processor/          # Biomechanics processing
├── frontend/           # React dashboard
├── monitoring/         # Grafana/Prometheus configs
├── scripts/           # Utility scripts
├── tests/             # Test suites
├── main.py            # Python entry point
├── pose.py            # Pose detection
├── monte_carlo.py     # Monte Carlo simulations
├── index.html         # Main web interface
├── wrangler.toml      # Cloudflare config
├── Makefile           # Automation commands
└── docker-compose.yml # Service orchestration
```

## 🛠 Common Development Tasks

### Running Specific Services

```bash
# Start only the API
docker-compose up api

# Start only the frontend
docker-compose up frontend

# Start background services
docker-compose up -d redis postgres minio
```

### Working with the Database

```bash
# Run migrations
make db-migrate

# Seed sample data
make seed

# Access database shell
make shell-db

# Create backup
make backup
```

### Testing & Quality

```bash
# Run all tests
make test

# Run Python tests only
make test-python

# Run with coverage
make coverage

# Run linters
make lint

# Security scan
make security
```

### Monitoring & Debugging

```bash
# View logs
make logs

# Monitor resource usage
docker stats

# Access Grafana dashboard
open http://localhost:3001
# Login: admin/blazeintel

# Access MinIO console
open http://localhost:9001
# Login: minioadmin/minioadmin
```

## 🚢 Deployment

### Deploy to Cloudflare Pages

```bash
# Deploy to production
make deploy

# Deploy preview
make deploy-preview

# Deploy staging
make deploy-staging
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `SPORTSDATAIO_API_KEY` - Sports data API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

## 🔧 Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different ports
python3 -m http.server 8001
```

### Docker Issues

```bash
# Reset Docker environment
make docker-down
make clean
make docker-rebuild

# Complete reset
make reset
make setup
```

### Module Import Errors

```bash
# Reinstall Python dependencies
pip3 install -r requirements.txt --force-reinstall

# Clear Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +
```

### Cloudflare Deployment Issues

```bash
# Validate configuration
wrangler pages validate

# Check account ID
wrangler whoami

# Deploy with verbose output
wrangler pages deploy . --verbose
```

## 🏗 Architecture Overview

### Technology Stack

**Backend:**

- Python 3.11 with FastAPI
- PostgreSQL for data persistence
- Redis for caching and queues
- MinIO for object storage

**Frontend:**

- Vanilla JavaScript with Three.js
- Cloudflare Pages for hosting
- WebGL for 3D visualizations

**Computer Vision:**

- MediaPipe for pose detection
- OpenCV for image processing
- PyTorch for ML models

**Infrastructure:**

- Docker for containerization
- Cloudflare Workers for edge computing
- GitHub Actions for CI/CD

### Data Flow

1. **Video Input** → MediaPipe processing
2. **Pose Extraction** → Biomechanics analysis
3. **Data Storage** → PostgreSQL + MinIO
4. **Real-time Updates** → Redis + WebSockets
5. **Visualization** → Three.js + Dashboard

## 📚 Additional Resources

### Documentation

- [API Documentation](http://localhost:8000/docs)
- [Cloudflare Docs](https://developers.cloudflare.com/pages)
- [MediaPipe Guide](https://mediapipe.dev)

### Getting Help

- GitHub Issues: [github.com/ahump20/BSI/issues](https://github.com/ahump20/BSI/issues)
- Email: austin@blazesportsintel.com
- Website: [blazesportsintel.com](https://blazesportsintel.com)

## 🎓 Best Practices

### Code Style

- Python: Black formatter, 100 char line length
- JavaScript: Prettier, 2-space indentation
- Commit messages: Conventional commits

### Testing

- Write tests for new features
- Maintain >80% code coverage
- Run tests before committing

### Security

- Never commit secrets
- Use environment variables
- Run security scans regularly

### Performance

- Profile before optimizing
- Use caching strategically
- Monitor resource usage

## 🚀 Next Steps

1. **Explore the codebase** - Start with `main.py`
2. **Run the examples** - Check `tests/` directory
3. **Customize configuration** - Edit `wrangler.toml`
4. **Add your features** - Create a new branch
5. **Deploy your changes** - Push to production

---

**Welcome to BSI - Let's Build Championship Intelligence Together!** 🏆
