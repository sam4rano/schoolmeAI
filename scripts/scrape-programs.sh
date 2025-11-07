#!/bin/bash
# Script to scrape programs from institutions

set -e

echo "Starting program scraping process..."

# Check if Python virtual environment exists
if [ ! -d "scrapers/venv" ]; then
    echo "Creating Python virtual environment..."
    cd scrapers
    python3 -m venv venv
    source venv/bin/activate
    pip install -q beautifulsoup4 requests lxml
    cd ..
fi

# Activate virtual environment and run scraper
cd scrapers
source venv/bin/activate

# Install dependencies if needed
pip install -q beautifulsoup4 requests lxml 2>&1 | grep -v "already satisfied" || true

# Run the program scraper
echo "Running program scraper..."
PYTHONPATH=/Users/mac/Desktop/schoolme:$PYTHONPATH python scrape_programs.py http://localhost:3000

echo "Program scraping completed!"

