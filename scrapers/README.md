# Scrapers Infrastructure

This directory contains Python-based scrapers for ingesting data from various sources.

## Structure

```
scrapers/
├── nuc/              # National Universities Commission scraper
├── myschool/         # Myschool portal scraper
├── myschoolgist/     # MySchoolGist scraper
├── shared/           # Shared utilities and base classes
├── requirements.txt  # Python dependencies
└── docker-compose.yml # Scraper services configuration
```

## Setup

1. Install Python dependencies:
```bash
cd scrapers
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database and storage credentials
```

3. Run scrapers:
```bash
# Run all scrapers
python -m scrapers.run_all

# Run specific scraper
python -m scrapers.nuc.scraper
python -m scrapers.myschool.scraper
python -m scrapers.myschoolgist.scraper
```

## Docker Setup

```bash
docker-compose -f scrapers/docker-compose.yml up -d
```

## Data Flow

1. **Scraper** → Fetches data from source
2. **Parser** → Extracts structured data
3. **Validator** → Validates data quality
4. **Raw Store** → Saves to S3/object storage
5. **ETL** → Transforms and normalizes
6. **Database** → Loads into PostgreSQL via API

## Rate Limiting

All scrapers respect:
- `robots.txt` rules
- Rate limiting (configurable delays)
- Respectful crawling practices

## Error Handling

- Failed scrapes are logged
- Retry logic with exponential backoff
- Dead letter queue for failed items


