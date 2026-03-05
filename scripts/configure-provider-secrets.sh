#!/usr/bin/env bash
set -euo pipefail

# Configure third-party provider keys as Cloudflare secrets.
#
# Usage:
#   ./scripts/configure-provider-secrets.sh --target pages --env production
#   ./scripts/configure-provider-secrets.sh --target worker --env production
#
# Defaults:
#   target: worker
#   env: production

TARGET="worker"
ENVIRONMENT="production"
PAGES_PROJECT="blazesportsintel"
WORKER_CONFIG="workers/wrangler.toml"

SECRETS=(
  "SPORTRADAR_API_KEY"
  "SKILLCORNER_API_KEY"
  "BIOMECHANICS_API_KEY"
)

usage() {
  cat <<USAGE
Usage: $0 [--target pages|worker] [--env production|preview] [--pages-project NAME] [--worker-config PATH]

Examples:
  $0 --target pages --env production
  $0 --target worker --env production
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    --env)
      ENVIRONMENT="${2:-}"
      shift 2
      ;;
    --pages-project)
      PAGES_PROJECT="${2:-}"
      shift 2
      ;;
    --worker-config)
      WORKER_CONFIG="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ "$TARGET" != "pages" && "$TARGET" != "worker" ]]; then
  echo "Invalid --target: $TARGET (expected pages or worker)"
  exit 1
fi

if ! command -v wrangler >/dev/null 2>&1; then
  echo "wrangler CLI is required. Install with: npm i -g wrangler"
  exit 1
fi

if ! wrangler whoami >/dev/null 2>&1; then
  echo "Wrangler is not authenticated. Run: wrangler login"
  exit 1
fi

if [[ "$TARGET" == "worker" && ! -f "$WORKER_CONFIG" ]]; then
  echo "Worker config not found: $WORKER_CONFIG"
  echo "Use --worker-config to point at a valid wrangler.toml"
  exit 1
fi

put_secret() {
  local secret_name="$1"
  local secret_value="$2"

  if [[ "$TARGET" == "pages" ]]; then
    printf '%s' "$secret_value" | wrangler pages secret put "$secret_name" --project-name "$PAGES_PROJECT"
  else
    printf '%s' "$secret_value" | wrangler secret put "$secret_name" --config "$WORKER_CONFIG" --env "$ENVIRONMENT"
  fi
}

prompt_secret() {
  local secret_name="$1"
  echo "Configuring $secret_name for target=$TARGET env=$ENVIRONMENT..."
  read -r -s -p "Enter $secret_name: " secret_value
  echo

  if [[ -z "$secret_value" ]]; then
    echo "Skipped $secret_name (empty value)."
    return
  fi

  put_secret "$secret_name" "$secret_value"
  echo "Saved $secret_name."
}

for secret in "${SECRETS[@]}"; do
  prompt_secret "$secret"
done

echo
if [[ "$TARGET" == "pages" ]]; then
  echo "Done. Verify in Cloudflare Pages dashboard for project: $PAGES_PROJECT"
else
  echo "Done. Verify with: wrangler secret list --config $WORKER_CONFIG --env $ENVIRONMENT"
fi
