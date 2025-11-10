# Accreditation Sources

> **Note:** This file has been consolidated into [docs/ACCREDITATION.md](./docs/ACCREDITATION.md).  
> This file is kept for reference but will be removed in a future update.

## Accreditation Bodies

### 1. Universities
- **Body:** NUC (National Universities Commission)
- **Source:** `accreditation_results.csv` (NUC 2024 data)
- **Status:** ✅ Imported (2,540 programs)
- **Data:** University, Faculty, Program, Latest_Status, Maturity_Date

### 2. Colleges of Education (COE)
- **Body:** NCCE (National Commission for Colleges of Education)
- **Source:** https://ncce.gov.ng/AccreditedColleges
- **Status:** ✅ Scraped (255 colleges)
- **Data:** Institution-level accreditation (not program-level)
- **Note:** NCCE accredits institutions, not individual programs

### 3. Polytechnics
- **Body:** NBTE (National Board for Technical Education)
- **Source:** https://myschoolgist.com/ng/list-of-accredited-polytechnics-in-nigeria/
- **Status:** ✅ Scraped (179 polytechnics)
- **Data:** Institution-level accreditation (similar to NCCE)
- **Note:** NBTE accredits institutions, not individual programs

### 4. Schools of Nursing
- **Body:** NMCN (Nursing and Midwifery Council of Nigeria)
- **Source:** https://nmcn.gov.ng/wp-content/uploads/2025/07/New_List_of_Approved_Schools_2025.pdf
- **Status:** ✅ Scraped (447 schools from official PDF)
- **Data:** Institution-level accreditation (official NMCN approved list)
- **Note:** NMCN accredits institutions, not individual programs

## Solution Strategy

### Option 1: Institution-Level Accreditation (Current)
- Mark institutions as "accredited" if they appear on NCCE/NBTE/NMCN lists
- Use institution-level accreditation status
- **Pros:** Simple, works for COE, polytechnics, and nursing schools
- **Cons:** No program-level detail

### Option 2: Program-Level Accreditation (Ideal)
- Scrape program-level accreditation from NBTE
- Import program accreditation data similar to NUC
- **Pros:** Detailed, program-specific
- **Cons:** Requires NBTE scraper/CSV

### Option 3: Hybrid Approach (Recommended)
- Use institution-level accreditation for COE (NCCE), Polytechnics (NBTE), and Nursing Schools (NMCN)
- Use program-level accreditation for universities (NUC)
- Fall back to institution-level if program data unavailable
- **Pros:** Best of both worlds
- **Cons:** More complex logic

## Implementation Plan

1. ✅ **Update Accreditation Import API** to handle multiple sources
2. ✅ **Create NBTE Scraper** for polytechnic institution accreditation
3. ✅ **Create NMCN Scraper** for nursing school institution accreditation
4. ✅ **Update Institution Model** to track accreditation source
5. ✅ **Update Recommendations** to use institution-level accreditation for COE/polytechnics/nursing schools

## Current Status

- **Universities:** 2,540 programs with NUC accreditation
- **Colleges of Education:** 268 institutions with NCCE accreditation
- **Polytechnics:** 442 institutions (439 with NBTE accreditation)
- **Schools of Nursing:** 508 institutions (508 with NMCN accreditation)
