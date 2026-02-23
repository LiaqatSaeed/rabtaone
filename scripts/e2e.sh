#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"

echo "Starting Docker stack..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo "Waiting for API to be ready..."
for i in {1..30}; do
  if curl -sSf http://localhost:4000/api/v1/healthz >/dev/null 2>&1; then
    echo "API is ready"
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "API did not become ready in time"
    exit 1
  fi
done

echo "Running Prisma migrations..."
(cd "$ROOT_DIR" && pnpm prisma:migrate)

if [ -z "${JWT_SECRET:-}" ]; then
  echo "JWT_SECRET is required to run seed scripts"
  exit 1
fi

echo "Seeding merchant and generating JWT..."
MERCHANT_JWT=$(JWT_SECRET="$JWT_SECRET" node "$ROOT_DIR/backend/scripts/seed-merchant.js" | tail -n 1 | awk '{print $2}')

if [ -z "$MERCHANT_JWT" ]; then
  echo "Failed to get merchant JWT"
  exit 1
fi

echo "Seeding sample order..."
node "$ROOT_DIR/backend/scripts/seed-order.js"

echo "Starting ERP polling... (CTRL+C to stop)"
ERP_BASE_URL="http://localhost:4000" ERP_JWT_TOKEN="$MERCHANT_JWT" node "$ROOT_DIR/backend/scripts/erp-polling.js"
