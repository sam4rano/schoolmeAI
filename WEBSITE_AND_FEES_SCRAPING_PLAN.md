# Website and Fees Scraping Plan

## Overview
This document outlines the strategy for scraping and matching official school websites and fees data with existing institutions in the database.

## Current State

### Existing Infrastructure
1. **Website Scraper**: `scrapers/nuc/website_scraper.py` - Scrapes from NUC website
2. **Enhancement Script**: `scrapers/enhance_institutions.py` - Matches websites with institutions
3. **Manual Editing**: Admin page at `/admin/institutions/[id]` allows manual website entry
4. **Bulk Fee Entry**: Admin page at `/admin/programs/bulk-fees` for program fees
5. **Data Structure**:
   - Institution: `website` (String), `tuitionFees` (Json), `feesSchedule` (Json)
   - Program: `tuitionFees` (Json)

## Recommended Approach: Hybrid (Scraping + Manual Review)

### Why Hybrid?
- **Scraping**: Fast bulk data collection, covers 80-90% of cases
- **Manual Review**: Ensures accuracy, handles edge cases, verifies matches
- **Best of Both**: Automated efficiency + human quality control

## Phase 1: Website Scraping & Matching

### 1.1 Enhance Existing Website Scraper

**Sources to Scrape:**
- NUC (Nigerian Universities Commission) - already implemented
- JAMB (Joint Admissions and Matriculation Board)
- NBTE (National Board for Technical Education) - for polytechnics
- NCCE (National Commission for Colleges of Education)
- Individual institution websites (via search engines)

**Matching Algorithm:**
1. **Exact Match**: Name matches exactly (case-insensitive)
2. **Fuzzy Match**: Levenshtein distance < 3
3. **Word Overlap**: At least 3 common significant words
4. **Abbreviation Match**: "UNILAG" matches "University of Lagos"
5. **Location Match**: Name + State/City match

**Implementation Steps:**
1. Enhance `scrapers/nuc/website_scraper.py` to scrape from multiple sources
2. Improve `scrapers/enhance_institutions.py` matching algorithm
3. Add confidence scoring (0-100) for each match
4. Create review queue for low-confidence matches

### 1.2 Admin Review Interface

**Features:**
- List of scraped websites with confidence scores
- Side-by-side comparison: Institution name vs Scraped name
- One-click approve/reject
- Manual correction option
- Bulk approve high-confidence matches (>90%)

## Phase 2: Fees Scraping & Matching

### 2.1 Fees Data Sources

**Primary Sources:**
1. **Official Institution Websites**: Scrape fees pages directly
2. **JAMB Brochure**: Contains fee information
3. **NUC/NBTE Publications**: Official fee schedules
4. **MySchoolGist**: May have fee information
5. **News Articles**: Recent fee announcements

**Data Structure:**
```json
{
  "amount": 500000,
  "currency": "NGN",
  "per_year": true,
  "breakdown": {
    "tuition": 400000,
    "accommodation": 50000,
    "books": 30000,
    "miscellaneous": 20000
  },
  "schedule": [
    {
      "program": "Medicine and Surgery",
      "level": "100",
      "amount": 500000,
      "per_year": true
    }
  ],
  "lastUpdated": "2024-01-01",
  "source": "official_website"
}
```

### 2.2 Fees Scraper Implementation

**Approach:**
1. Use scraped websites to visit institution fee pages
2. Parse fee tables/sections from HTML
3. Extract structured fee data
4. Match with programs/institutions
5. Store with confidence score

**Challenges:**
- Fee pages vary in structure
- Fees change frequently
- Multiple fee types (tuition, accommodation, etc.)
- Different formats (per year, per semester, total)

**Solution:**
- Use AI/ML for extraction (if available)
- Multiple parsing strategies
- Manual review for complex cases
- Version history for fee changes

### 2.3 Admin Review Interface for Fees

**Features:**
- Review scraped fees with confidence scores
- Compare with existing fees
- Approve/reject/merge options
- Edit fee structure manually
- Bulk operations for similar institutions

## Phase 3: Implementation Plan

### Step 1: Enhance Website Scraper (Week 1)
- [ ] Add NBTE scraper for polytechnics
- [ ] Add NCCE scraper for colleges
- [ ] Add JAMB scraper
- [ ] Improve matching algorithm
- [ ] Add confidence scoring

### Step 2: Create Admin Review Interface (Week 1-2)
- [ ] Create `/admin/websites/review` page
- [ ] Display scraped websites with matches
- [ ] Add approve/reject functionality
- [ ] Add manual correction
- [ ] Add bulk operations

### Step 3: Implement Fees Scraper (Week 2-3)
- [ ] Create fees scraper module
- [ ] Implement website fee page parser
- [ ] Add fee matching algorithm
- [ ] Store with confidence scores

### Step 4: Create Fees Review Interface (Week 3)
- [ ] Create `/admin/fees/review` page
- [ ] Display scraped fees with matches
- [ ] Add approve/reject functionality
- [ ] Add fee structure editor
- [ ] Add bulk operations

### Step 5: Automation & Scheduling (Week 4)
- [ ] Add scheduled scraping jobs
- [ ] Email notifications for new matches
- [ ] Automated high-confidence updates
- [ ] Version history tracking

## Technical Implementation

### Website Scraping Flow
```
1. Scrape websites from multiple sources
2. Normalize institution names
3. Match with existing institutions
4. Calculate confidence scores
5. Store in review queue
6. Admin reviews and approves
7. Update database
```

### Fees Scraping Flow
```
1. Get institutions with websites
2. Visit fee pages on institution websites
3. Parse fee information
4. Extract structured data
5. Match with programs/institutions
6. Calculate confidence scores
7. Store in review queue
8. Admin reviews and approves
9. Update database
```

## Manual vs Automated Decision Matrix

| Task | Approach | Reason |
|------|----------|--------|
| Initial bulk scraping | **Automated** | Fast, covers most cases |
| High-confidence matches (>90%) | **Automated** | Low risk, high efficiency |
| Medium-confidence (70-90%) | **Manual Review** | Need verification |
| Low-confidence (<70%) | **Manual Entry** | Too risky to auto-approve |
| Edge cases | **Manual Entry** | Complex matching needed |
| Corrections | **Manual Entry** | Human judgment required |

## Recommended Tools & Libraries

### For Scraping
- **BeautifulSoup4**: HTML parsing
- **Selenium**: For JavaScript-heavy pages
- **Scrapy**: For large-scale scraping
- **fuzzywuzzy**: For fuzzy string matching
- **Levenshtein**: For string distance

### For Matching
- **RapidFuzz**: Fast fuzzy matching
- **difflib**: Python built-in string matching
- **Custom algorithms**: Institution-specific matching

## Data Quality Assurance

### Validation Rules
1. Website URLs must be valid and accessible
2. Fees must be positive numbers
3. Currency must be valid (NGN, USD, etc.)
4. Dates must be valid
5. Confidence scores must be 0-100

### Quality Metrics
- Match accuracy rate
- Manual review rate
- Update frequency
- Data completeness percentage

## Next Steps

1. **Immediate**: Run existing website enhancement script
2. **Short-term**: Enhance scraper with more sources
3. **Medium-term**: Implement fees scraper
4. **Long-term**: Full automation with review workflow

## Commands to Run

### Website Enhancement
```bash
npm run enhance:websites
# or
cd scrapers && python enhance_institutions.py http://localhost:3000
```

### Manual Review (Future)
```bash
# Access admin review page
/admin/websites/review
/admin/fees/review
```

