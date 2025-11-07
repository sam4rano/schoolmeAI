#!/bin/bash

# Script to scrape institutions and import to database

set -e

echo "🚀 Starting scraper and import process..."

# Check if Python environment is set up
if [ ! -d "scrapers/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd scrapers
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Python environment found"
    cd scrapers
    source venv/bin/activate
    cd ..
fi

# Run scraper
echo "🔍 Scraping institutions from MySchoolGist..."
cd scrapers
python import_to_db.py ${1:-http://localhost:3000}
cd ..

echo "✅ Scraping and import completed!"

