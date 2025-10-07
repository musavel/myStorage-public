#!/bin/bash

# Database migration script
# Usage: bash scripts/migrate.sh

echo "🔄 Running database migrations..."

# Run migrations in Docker container
docker-compose exec backend bash -c "cd /app/backend && alembic upgrade head"

echo "✅ Migrations completed!"
