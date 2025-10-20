# BSI - Blaze Sports Intelligence Makefile
# Championship Development & Biomechanics Vision System

.PHONY: help setup install dev run test build deploy clean format lint security docker-up docker-down

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target
help:
	@echo "$(BLUE)BSI - Blaze Sports Intelligence$(NC)"
	@echo "$(GREEN)Championship Development Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  make setup       - One-time environment setup"
	@echo "  make dev         - Start development with hot reload"
	@echo "  make test        - Run full test suite"
	@echo "  make deploy      - Deploy to production"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make up          - Start all services in production mode"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - Show logs from all services"
	@echo "  make shell-api   - Open API container shell"
	@echo "  make watch       - Watch for file changes"
	@echo "  make jupyter     - Start Jupyter Lab"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  make format      - Auto-format all code"
	@echo "  make lint        - Run all linters"
	@echo "  make security    - Run security scans"
	@echo "  make pre-commit  - Run pre-commit hooks"
	@echo ""
	@echo "$(YELLOW)Deployment:$(NC)"
	@echo "  make build       - Build for production"
	@echo "  make deploy-cf   - Deploy to Cloudflare Pages"
	@echo "  make deploy-preview - Deploy preview environment"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@echo "  make seed        - Load sample data"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make backup      - Create database backup"
	@echo "  make restore     - Restore from backup"

# Start all services in production mode
up:
	@echo "🚀 Starting Blaze Biomechanics Vision System..."
	@if [ ! -f .env ]; then cp .env.example .env; fi
	docker-compose up -d
	@echo "✅ System running at:"
	@echo "   Dashboard: http://localhost:3000"
	@echo "   API: http://localhost:8000"
	@echo "   API Docs: http://localhost:8000/docs"
	@echo "   MinIO: http://localhost:9001"
	@echo "   Grafana: http://localhost:3001"

# Complete environment setup
setup:
        @echo "$(BLUE)Setting up BSI development environment...$(NC)"
        @if [ ! -f .env ]; then cp .env.example .env; fi
        @pip3 install -r requirements.txt || true
        @npm --prefix apps/web install || true
        @pre-commit install || true
        @echo "$(GREEN)✓ Setup complete! Run 'make dev' to start developing$(NC)"

# Start in development mode with hot reload
dev:
        @echo "🔧 Starting in development mode with hot reload..."
        @if [ ! -f .env ]; then cp .env.example .env; fi
        @trap 'make down' INT TERM EXIT; \
        python3 -m http.server 8000 & \
        npm --prefix apps/web run dev -- --hostname 0.0.0.0 & \
        python3 main.py --dev-mode & \
        wait

# Watch for file changes
watch:
	@echo "$(BLUE)Watching for file changes...$(NC)"
	@command -v watchmedo >/dev/null 2>&1 || pip3 install watchdog
	@watchmedo auto-restart \
		--patterns="*.py;*.html;*.js;*.css" \
		--ignore-patterns="*__pycache__*;*.pyc;node_modules/*" \
		--recursive \
		python3 main.py

# Start Jupyter Lab
jupyter:
	@echo "$(BLUE)Starting Jupyter Lab...$(NC)"
	jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root
	
# Stop all services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

# Run tests
test:
        @echo "🧪 Running test suite..."
        docker-compose run --rm api pytest tests/ -v --cov=api --cov-report=term-missing
        npm --prefix apps/web run test:visual || true

# Build all images
build:
	@echo "🔨 Building Docker images..."
	docker-compose build --no-cache

# Build for production
build-prod:
        @echo "📦 Building production images..."
        docker build -t blaze-biomech-api:latest -f api/Dockerfile.prod api/
        docker build -t blaze-biomech-processor:latest -f processor/Dockerfile.prod processor/

# Clean up everything
clean:
        @echo "🧹 Cleaning up..."
        docker-compose down -v
        docker system prune -f
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -type f -name "*.pyc" -delete 2>/dev/null || true
        rm -rf .pytest_cache 2>/dev/null || true
        rm -rf apps/web/node_modules 2>/dev/null || true

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-api:
	docker-compose logs -f api

logs-processor:
	docker-compose logs -f processor

logs-web:
        docker-compose logs -f web

# Load sample data
seed:
	@echo "📊 Loading sample data..."
	docker-compose run --rm api python scripts/seed_data.py

# Format code
format:
        @echo "✨ Formatting code..."
        docker-compose run --rm api black .
        docker-compose run --rm api isort .

# Lint code
lint:
        @echo "🔍 Linting code..."
        docker-compose run --rm api pylint api/
        docker-compose run --rm api mypy api/

# Database operations
db-migrate:
	@echo "📈 Running database migrations..."
	docker-compose run --rm api alembic upgrade head

db-rollback:
	@echo "📉 Rolling back last migration..."
	docker-compose run --rm api alembic downgrade -1

db-reset:
	@echo "♻️ Resetting database..."
	docker-compose down -v postgres
	docker-compose up -d postgres
	sleep 5
	$(MAKE) db-migrate
	$(MAKE) seed

# MinIO setup
minio-setup:
	@echo "🗄️ Setting up MinIO buckets..."
	docker-compose run --rm api python scripts/setup_minio.py

# Health check
health:
	@echo "🏥 Checking system health..."
	@curl -s http://localhost:8000/health | python -m json.tool

# Performance test
perf-test:
	@echo "⚡ Running performance tests..."
	docker-compose run --rm api locust -f tests/performance/locustfile.py --host=http://api:8000

# Security scan
security-scan:
	@echo "🔒 Running security scan..."
	docker-compose run --rm api bandit -r api/ -f json -o security-report.json
	docker-compose run --rm api safety check

# Deploy to production (Cloudflare Pages)
deploy: test build
        @echo "$(BLUE)Deploying to blazesportsintel.com...$(NC)"
        npm --prefix apps/web run build
        (cd apps/web && npx @cloudflare/next-on-pages)
        wrangler pages deploy apps/web/.vercel/output/static --project-name=diamond-insights-platform --env=production
        @echo "$(GREEN)✓ Deployed to https://blazesportsintel.com$(NC)"

# Deploy to Cloudflare (alias)
deploy-cf: deploy

# Deploy preview environment
deploy-preview:
        @echo "$(BLUE)Deploying preview environment...$(NC)"
        npm --prefix apps/web run build
        (cd apps/web && npx @cloudflare/next-on-pages)
        wrangler pages deploy apps/web/.vercel/output/static --project-name=diamond-insights-platform --env=preview
        @echo "$(GREEN)✓ Preview deployed to https://preview.blazesportsintel.com$(NC)"

# Deploy to staging
deploy-staging:
        @echo "$(BLUE)Deploying to staging...$(NC)"
        npm --prefix apps/web run build
        (cd apps/web && npx @cloudflare/next-on-pages)
        wrangler pages deploy apps/web/.vercel/output/static --project-name=diamond-insights-platform --env=staging
        @echo "$(GREEN)✓ Staging deployed$(NC)"

# Deploy to AWS
deploy-aws:
	@echo "☁️ Deploying to AWS..."
	./scripts/deploy_aws.sh

# Run pre-commit hooks
pre-commit:
	@echo "$(BLUE)Running pre-commit hooks...$(NC)"
	@pre-commit run --all-files || true
	@echo "$(GREEN)✓ Pre-commit checks complete$(NC)"

# Create a backup
backup:
	@echo "💾 Creating backup..."
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	docker-compose exec -T postgres pg_dump -U blaze blaze_biomech > backups/db_backup_$$TIMESTAMP.sql; \
	echo "Backup saved to backups/db_backup_$$TIMESTAMP.sql"

# Restore from backup
restore:
	@echo "♻️ Restoring from backup..."
	@read -p "Enter backup filename: " BACKUP_FILE; \
	docker-compose exec -T postgres psql -U blaze blaze_biomech < backups/$$BACKUP_FILE; \
	echo "Restored from $$BACKUP_FILE"

# Monitor resource usage
monitor:
	@echo "📊 Monitoring resource usage..."
	docker stats --no-stream

# Quick restart
restart: down up

# Development setup
setup:
	@echo "🎯 Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "Installing git hooks..."
	@cp scripts/pre-commit .git/hooks/pre-commit 2>/dev/null || true
	@chmod +x .git/hooks/pre-commit 2>/dev/null || true
	@echo "✅ Development environment ready!"

# Open interactive shells
shell-api:
	docker-compose exec api /bin/bash

shell-db:
	docker-compose exec postgres psql -U blaze blaze_biomech

shell-redis:
	docker-compose exec redis redis-cli

# Generate API documentation
docs:
	@echo "📚 Generating API documentation..."
	docker-compose run --rm api python -m mkdocs build

# Quick development cycle
quick: format lint test
	@echo "✅ Code formatted, linted, and tested!"

.DEFAULT_GOAL := help
