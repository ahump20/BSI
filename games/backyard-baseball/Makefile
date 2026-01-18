.PHONY: help build test deploy clean

ENVIRONMENT ?= staging

help:
	@echo "Backyard Baseball - Build Commands"
	@echo ""
	@echo "  make build-unity      Build Unity WebGL (requires Unity Editor)"
	@echo "  make build-unreal     Build Unreal package (requires UE5)"
	@echo "  make serve            Run local development server"
	@echo "  make test             Run asset validation"
	@echo "  make deploy-staging   Deploy to staging environment"
	@echo "  make deploy-prod      Deploy to production (requires confirmation)"
	@echo "  make deploy-worker    Deploy telemetry worker"
	@echo "  make clean            Clean build artifacts"
	@echo ""

# Development
serve:
	@echo "Starting local server at http://localhost:8000"
	cd tools && python3 local-server.py

# Unity Build
build-unity:
	@echo "Building Unity WebGL..."
	cd unity && ./unity-build.sh

# Unreal Build
build-unreal:
	@echo "Unreal builds require the Editor. Opening project..."
	@if [ -d "/Applications/Epic Games" ]; then \
		open "unreal/BackyardBaseball.uproject"; \
	else \
		echo "Unreal Engine not found. Install from Epic Games Launcher."; \
	fi

# Asset Validation
test:
	@echo "Validating assets..."
	cd tools && python3 validate-assets.py

lint:
	@echo "Checking TypeScript..."
	cd infra/cloudflare && npm run typecheck 2>/dev/null || npx tsc --noEmit

# Worker Deployment
deploy-worker:
	@echo "Deploying telemetry worker..."
	cd infra/cloudflare && npm install && npx wrangler deploy

deploy-worker-staging:
	@echo "Deploying telemetry worker to staging..."
	cd infra/cloudflare && npm install && npx wrangler deploy --env staging

# Pages Deployment
deploy-staging: build-unity
	@echo "Deploying to staging..."
	cp -r web/public/* web/
	cp web/_headers web/
	npx wrangler pages deploy web --project-name=backyard-baseball-staging

deploy-prod: confirm-prod build-unity
	@echo "Deploying to PRODUCTION..."
	cp -r web/public/* web/
	cp web/_headers web/
	npx wrangler pages deploy web --project-name=backyard-baseball --branch=main

confirm-prod:
	@echo ""
	@echo "=========================================="
	@echo "  WARNING: Production Deployment"
	@echo "=========================================="
	@echo ""
	@read -p "Type 'production' to confirm: " confirm && [ "$$confirm" = "production" ]

# Database
db-migrate:
	@echo "Running D1 migrations..."
	cd infra/cloudflare && npx wrangler d1 migrations apply bsi-game-telemetry --remote

db-migrate-staging:
	@echo "Running D1 migrations (staging)..."
	cd infra/cloudflare && npx wrangler d1 migrations apply bsi-game-telemetry-staging --remote

# Cleanup
clean: confirm-clean
	@echo "Cleaning build artifacts..."
	rm -rf web/Build/*
	rm -rf unity/Logs/*
	rm -rf unity/Library/
	@echo "Clean complete."

confirm-clean:
	@read -p "Delete all build artifacts? [y/N]: " confirm && [ "$$confirm" = "y" ]

# Rollback
rollback:
	@echo "Recent deployments:"
	@npx wrangler pages deployment list --project-name=backyard-baseball-$(ENVIRONMENT) 2>/dev/null || echo "Run: npx wrangler pages deployment list"
	@echo ""
	@read -p "Enter deployment ID to rollback to: " id && \
		npx wrangler pages deployment rollback --project-name=backyard-baseball-$(ENVIRONMENT) --deployment-id="$$id"
