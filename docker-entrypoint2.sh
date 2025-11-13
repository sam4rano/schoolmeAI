#!/bin/sh
set -e

echo "Running database migrations..."

# Change to app directory
cd /app

# Try to use local Prisma installation first
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "Using local Prisma installation..."
  ./node_modules/.bin/prisma migrate deploy
else
  echo "Local Prisma not found, using npx..."
  # Set npm cache to writable location
  export NPM_CONFIG_CACHE=/home/nextjs/.npm
  npx --yes prisma@latest migrate deploy
fi

echo "Migrations completed successfully"
echo "Starting application..."
exec "$@"

