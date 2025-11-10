#!/bin/bash

# Apply full-text search indexes to the database
# This script applies the full-text search indexes for better search performance

echo "Applying full-text search indexes..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# Apply the SQL migration
psql "$DATABASE_URL" -f prisma/migrations/add_fulltext_search.sql

if [ $? -eq 0 ]; then
  echo "✅ Full-text search indexes applied successfully"
else
  echo "❌ Failed to apply full-text search indexes"
  exit 1
fi

