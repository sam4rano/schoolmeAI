#!/bin/bash
# Script to enhance institutions with websites from NUC and other sources

set -e

echo "Starting website enhancement process..."

# Check if Python virtual environment exists
if [ ! -d "scrapers/venv" ]; then
    echo "Creating Python virtual environment..."
    cd scrapers
    python3 -m venv venv
    source venv/bin/activate
    pip install -q beautifulsoup4 requests lxml
    cd ..
fi

# Activate virtual environment and run enhancer
cd scrapers
source venv/bin/activate

# Install dependencies if needed
pip install -q beautifulsoup4 requests lxml 2>&1 | grep -v "already satisfied" || true

# Run the website enhancer
echo "Running website enhancer..."
PYTHONPATH=/Users/mac/Desktop/schoolme:$PYTHONPATH python enhance_institutions.py http://localhost:3000

echo "Website enhancement completed!"

