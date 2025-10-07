#!/bin/bash

echo "🔄 Running database migrations..."
cd /app/backend && alembic upgrade head

echo "✅ Migrations completed!"
echo "🚀 Starting FastAPI server..."

cd /app
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
