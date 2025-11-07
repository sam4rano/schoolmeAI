# Forensic Analysis & Cleanup Report

**Date**: 2025-11-06  
**Purpose**: Identify and remove unused files from the codebase

---

## Analysis Summary

### Files Analyzed
- **Total TypeScript/TSX files**: 55
- **Total Python files**: 20+
- **Total Markdown files**: 15+
- **Total JSON data files**: 5+

---

## Unused Files Identified

### 1. Unused Documentation Files (Outdated/Not Referenced)

These documentation files are outdated summaries or not actively referenced:

- ✅ `Apps.txt` - Original specification file, content moved to README
- ✅ `CLEANUP_SUMMARY.md` - Outdated cleanup summary
- ✅ `FIXES_APPLIED.md` - Outdated fixes summary
- ✅ `FORENSIC_ANALYSIS.md` - Outdated analysis (replaced by this file)
- ✅ `IMPLEMENTATION_SUMMARY.md` - Outdated implementation summary
- ✅ `PAGES_STATUS.md` - Outdated pages status
- ✅ `PHASE2_SUMMARY.md` - Outdated phase summary
- ✅ `TEST_RESULTS.md` - Outdated test results

**Keep (Still Useful)**:
- `AI_IMPLEMENTATION.md` - AI implementation docs
- `PROGRAM_ID_EXPLANATION.md` - Useful explanation
- `START.md` - Getting started guide
- `TECH_STACK.md` - Tech stack reference
- `LEGAL.md` - Legal information
- `READme.MD` - Main README

### 2. Unused Code Files

#### Unused Store
- ✅ `lib/stores/use-institutions-store.ts` - Not imported anywhere in app/components
  - Only referenced in `TECH_STACK.md` (documentation)
  - App uses `useInstitutions` hook from `lib/hooks/use-institutions.ts` instead

#### Unused/Incomplete Scrapers
- ✅ `scrapers/myschool/scraper.py` - Has TODOs, not implemented, not imported
  - Only has placeholder code
  - Not used in `run_all.py` or any import statements
  
- ✅ `scrapers/nuc/scraper.py` - Has TODOs, not implemented
  - Only has placeholder code
  - `run_all.py` imports it but it's not functional
  - Note: `nuc/website_scraper.py` IS used and should be kept

#### Duplicate/Unused Scripts
- ✅ `scrapers/scrape_courses.py` - Duplicate functionality
  - Similar to `scrape_programs.py`
  - Uses deprecated `ProgramDetailsScraper` class
  - Not actively used (package.json has script but it's not run)

- ✅ `scripts/test-api.js` - Test script, not actively used
- ✅ `scripts/test-api.sh` - Test script, not actively used
  - Both are referenced in docs but not in CI/CD or package.json scripts

### 3. Unused Data Files (Outdated Scraped Data)

- ✅ `scraped_institutions.json` - Old scraped data, data is in database
- ✅ `scrapers/scraped_programs.json` - Old scraped data, data is in database
- ✅ `scrapers/website_matches.json` - Old matching data, likely outdated

**Note**: These JSON files are backups but not needed if data is in database.

### 4. Unused Migration Directory

- ✅ `prisma/migrations/20251106192526_add_program_fields/` - Empty migration directory
  - Migration was manually created instead

---

## Files to Keep

### Active Code Files
- All files in `app/` - All pages and API routes are used
- All files in `components/` - All UI components are used
- All files in `lib/` except `stores/use-institutions-store.ts`
- `scrapers/myschoolgist/` - Actively used
- `scrapers/nuc/website_scraper.py` - Used for website enhancement
- `scrapers/shared/base_scraper.py` - Base scraper class
- `scrapers/scrape_programs.py` - Active scraper
- `scrapers/import_to_db.py` - Active import script
- `scrapers/enhance_institutions.py` - Active enhancement script

### Active Scripts
- `scripts/scrape-and-import.sh` - Active
- `scripts/scrape-programs.sh` - Active
- `scripts/enhance-websites.sh` - Active
- `scripts/generate-embeddings.ts` - Active

### Active Documentation
- `READme.MD` - Main README
- `AI_IMPLEMENTATION.md` - AI docs
- `scrapers/README.md` - Scraper docs
- `scrapers/SCRAPER_GUIDE.md` - Scraper guide

---

## Cleanup Actions

### Files to Delete

1. **Documentation (8 files)**:
   - `Apps.txt`
   - `CLEANUP_SUMMARY.md`
   - `FIXES_APPLIED.md`
   - `FORENSIC_ANALYSIS.md`
   - `IMPLEMENTATION_SUMMARY.md`
   - `PAGES_STATUS.md`
   - `PHASE2_SUMMARY.md`
   - `TEST_RESULTS.md`

2. **Code Files (5 files)**:
   - `lib/stores/use-institutions-store.ts`
   - `scrapers/myschool/scraper.py`
   - `scrapers/nuc/scraper.py`
   - `scrapers/scrape_courses.py`
   - `scripts/test-api.js`
   - `scripts/test-api.sh`

3. **Data Files (3 files)**:
   - `scraped_institutions.json`
   - `scrapers/scraped_programs.json`
   - `scrapers/website_matches.json`

4. **Empty Directories (1)**:
   - `prisma/migrations/20251106192526_add_program_fields/`

### Package.json Cleanup

Remove unused script:
- `"scrape:courses"` - Uses deprecated `scrape_courses.py`

### Update References

- Remove reference to `useInstitutionsStore` from `TECH_STACK.md`
- Remove references to test scripts from documentation

---

## Summary

- **Total files to delete**: 17
- **Documentation files**: 8
- **Code files**: 6
- **Data files**: 3
- **Empty directories**: 1

**Estimated space saved**: ~500KB (excluding node_modules and venv)

---

## Next Steps

1. Review this analysis
2. Delete identified unused files
3. Update package.json to remove unused scripts
4. Update documentation to remove references to deleted files
5. Commit changes

