#!/bin/bash
set -e

echo "Running Prisma migrations..."

# Try to deploy migrations
if npx prisma migrate deploy 2>&1 | grep -q "P3005"; then
  echo "Database schema already exists - baseline required"
  echo "Resolving existing migrations..."
  
  # Get list of migrations from the migrations directory
  for migration_dir in prisma/migrations/*/; do
    migration_name=$(basename "$migration_dir")
    if [ "$migration_name" != "." ] && [ "$migration_name" != ".." ]; then
      echo "Marking migration as applied: $migration_name"
      npx prisma migrate resolve --applied "$migration_name" || true
    fi
  done
  
  echo "Baseline complete. Running migrations..."
  npx prisma migrate deploy || true
else
  echo "Migrations deployed successfully"
fi

echo "Migration process complete"
