#!/bin/sh
set -e

echo "Running database migrations..."

# Change to app directory
cd /app

# Set npm cache to writable location
export NPM_CONFIG_CACHE=/home/nextjs/.npm

# Use local Prisma installation if available, otherwise use npx with latest
PRISMA_CMD=""
if [ -d "./node_modules/prisma" ]; then
  echo "Using local Prisma installation..."
  PRISMA_CMD="node ./node_modules/prisma/build/index.js"
else
  echo "Local Prisma not found, using npx with latest..."
  PRISMA_CMD="npx --yes prisma@latest"
fi

# Check for failed migrations and resolve them
echo "Checking migration status..."
FAILED_MIGRATIONS=$($PRISMA_CMD migrate status 2>&1 | grep -i "failed" | grep -oE '[0-9]{14}_[a-z_]+' || true)

if [ -n "$FAILED_MIGRATIONS" ]; then
  echo "Found failed migrations, resolving..."
  for migration in $FAILED_MIGRATIONS; do
    echo "Resolving failed migration: $migration"
    $PRISMA_CMD migrate resolve --rolled-back "$migration" || true
  done
fi

# Deploy migrations
echo "Deploying migrations..."
$PRISMA_CMD migrate deploy || {
  echo "Migration deploy failed. Attempting to resolve and retry..."
  # If deploy fails, try to resolve any failed migrations and retry once
  FAILED=$($PRISMA_CMD migrate status 2>&1 | grep -i "failed" | grep -oE '[0-9]{14}_[a-z_]+' || true)
  if [ -n "$FAILED" ]; then
    for migration in $FAILED; do
      $PRISMA_CMD migrate resolve --rolled-back "$migration" || true
    done
    $PRISMA_CMD migrate deploy || echo "WARNING: Some migrations may have failed. Continuing anyway..."
  fi
}

echo "Migrations completed"
echo "Starting application..."
exec "$@"