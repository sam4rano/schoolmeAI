# Scraper Guide - MySchoolGist Institution Scraper

## Overview

This scraper collects institution data from [MySchoolGist.com](https://myschoolgist.com), including:

- **Private Universities** (159+ institutions)
- **Federal Universities** (50+ institutions)
- **State Universities** (50+ institutions)
- **Polytechnics** (100+ institutions)
- **Colleges of Education** (100+ institutions)
- **Schools of Nursing** (100+ institutions)
- **Teaching Hospitals** (50+ institutions)

## Setup

### 1. Install Python Dependencies

```bash
cd scrapers
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Scraper

#### Option 1: Using the script (recommended)

```bash
# From project root
npm run scrape:import

# Or with custom API URL
./scripts/scrape-and-import.sh http://localhost:3000
```

#### Option 2: Manual execution

```bash
cd scrapers
source venv/bin/activate
python import_to_db.py
```

## How It Works

### 1. Scraping Process

The scraper:
1. Fetches institution lists from MySchoolGist URLs
2. Parses HTML tables and lists
3. Extracts institution data (name, location, type, etc.)
4. Normalizes data to canonical format
5. Saves to JSON file as backup
6. Imports to database via API

### 2. Data Sources

The scraper targets these MySchoolGist pages:

- Private Universities: `/ng/private-universities-in-nigeria/`
- Federal Universities: `/ng/federal-universities-in-nigeria/`
- State Universities: `/ng/state-universities-in-nigeria/`
- Polytechnics: `/ng/list-of-accredited-polytechnics-in-nigeria/`
- Colleges of Education: `/ng/list-of-accredited-colleges-of-education-in-nigeria/`
- Schools of Nursing: `/ng/list-of-schools-of-nursing-in-nigeria/`
- Teaching Hospitals: `/ng/list-of-teaching-hospitals-in-nigeria/`

### 3. Data Structure

Each institution includes:

```json
{
  "name": "University Name",
  "type": "university|polytechnic|college|nursing|military",
  "ownership": "federal|state|private",
  "state": "Lagos",
  "city": "Ikeja",
  "website": "https://example.com",
  "contact": {
    "email": "info@example.com",
    "phone": "+234...",
    "address": "..."
  },
  "accreditationStatus": "accredited",
  "year_established": 2000,
  "courses_url": "https://myschoolgist.com/...",
  "source_url": "https://myschoolgist.com/...",
  "license": "CC-BY-NC-SA"
}
```

## API Endpoint

The scraper uses the `/api/scrape/import` endpoint:

**POST** `/api/scrape/import`

**Request Body:**
```json
{
  "institutions": [...],
  "source": "myschoolgist"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "created": 150,
    "updated": 10,
    "errors": []
  },
  "message": "Imported 150 new institutions, updated 10 existing institutions"
}
```

## Features

### Rate Limiting
- 2-second delay between requests
- Respects robots.txt
- User-Agent header for identification

### Error Handling
- Continues on individual errors
- Logs all errors for review
- Saves backup JSON file

### Data Quality
- Calculates quality scores (0-100)
- Identifies missing fields
- Normalizes institution types and ownership

### Deduplication
- Checks for existing institutions by name and state
- Updates existing records instead of creating duplicates

## Output Files

- `scraped_institutions.json` - Backup of all scraped data
- Console logs with progress and statistics

## Troubleshooting

### Scraper fails to fetch pages
- Check internet connection
- Verify MySchoolGist is accessible
- Check robots.txt compliance

### Import fails
- Ensure Next.js server is running
- Check API endpoint is accessible
- Verify database connection
- Check logs for specific errors

### Missing data
- Some institutions may have incomplete data
- Check `missingFields` in database
- Manually verify and update critical institutions

## Next Steps

1. **Run scraper** to populate initial data
2. **Verify data** in database using Prisma Studio
3. **Generate embeddings** for AI assistant:
   ```bash
   npm run ai:generate-embeddings
   ```
4. **Test search** and filtering functionality

## License

Scraped data follows MySchoolGist's license (CC-BY-NC-SA). Always respect website terms of service and robots.txt.

