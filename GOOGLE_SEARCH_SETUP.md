# Google Search API Setup Guide

## Overview

The alternative website scraper supports Google Custom Search API for finding institution websites. This is optional - the scraper will work without it using pattern matching and direct domain checking.

## Setup Instructions

### 1. Get Google Custom Search API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Custom Search API"
4. Create credentials (API Key)
5. Create a Custom Search Engine at [Google Custom Search](https://cse.google.com/cse/)
6. Get your Search Engine ID (CX)

### 2. Add Environment Variables

Add these to your `.env` file:

```bash
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_CX=your_search_engine_id_here
```

### 3. Usage

The scraper will automatically use Google Search API if credentials are provided. If not, it will fall back to pattern matching and direct domain checking.

## Alternative Methods (No API Required)

The scraper uses these methods even without Google Search API:

1. **Pattern Matching**: Tries common domain patterns (.edu.ng, .com, etc.)
2. **Direct Domain Check**: Validates if domains exist
3. **Abbreviation Matching**: Matches common abbreviations (e.g., "unilag" for "University of Lagos")

## Rate Limits

- Google Search API: 100 free queries per day
- Pattern/Direct Check: No limits, but slower

## Cost

- Google Custom Search API: Free tier includes 100 queries/day
- Pattern/Direct Check: Free (no API required)

