#!/bin/bash
set -e

echo "🚀 Starting IdeaApp Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "${DB_HOST:-db}" -p 5432 -U "${POSTGRES_USER:-ideaapp}" > /dev/null 2>&1; do
  echo "Waiting for database connection..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
cd /app/backend
pnpm prisma migrate deploy

echo "🔧 Generating Prisma Client..."
pnpm prisma generate

# Start the application
echo "🎯 Starting application on port ${PORT:-4000}..."
exec pnpm start
