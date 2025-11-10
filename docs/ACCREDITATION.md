# Accreditation Data Management

This document consolidates all accreditation-related documentation.

---

## Accreditation Sources

### Universities (NUC)
- **Body:** NUC (National Universities Commission)
- **Source:** `accreditation_results.csv` (NUC 2024 data)
- **Status:** ✅ Imported (2,582 programs)
- **Data:** University, Faculty, Program, Latest_Status, Maturity_Date

### Colleges of Education (NCCE)
- **Body:** NCCE (National Commission for Colleges of Education)
- **Source:** https://ncce.gov.ng/AccreditedColleges
- **Status:** ✅ Scraped (268 colleges)
- **Data:** Institution-level accreditation (not program-level)

### Polytechnics (NBTE)
- **Body:** NBTE (National Board for Technical Education)
- **Source:** https://myschoolgist.com/ng/list-of-accredited-polytechnics-in-nigeria/
- **Status:** ✅ Scraped (198 polytechnics)
- **Data:** Institution-level accreditation

### Schools of Nursing (NMCN)
- **Body:** NMCN (Nursing and Midwifery Council of Nigeria)
- **Source:** https://nmcn.gov.ng/wp-content/uploads/2025/07/New_List_of_Approved_Schools_2025.pdf
- **Status:** ✅ Scraped (394 schools)
- **Data:** Institution-level accreditation (official NMCN approved list)

---

## Accreditation Resolution

### Problem
Accreditation data comes from different sources with different structures:
- **Universities:** Program-level accreditation (NUC)
- **COE/Polytechnics/Nursing:** Institution-level accreditation (NCCE/NBTE/NMCN)

### Solution
Hybrid approach:
- Use program-level accreditation for universities (NUC)
- Use institution-level accreditation for COE, polytechnics, and nursing schools
- Propagate institution-level accreditation to programs when needed
- Fall back to institution-level if program data unavailable

### Implementation

#### 1. Institution-Level Accreditation Propagation
**Script:** `scripts/propagate-institution-accreditation.ts`  
**API:** `/api/admin/accreditation/propagate`

Propagates institution accreditation status to all programs in that institution.

**Usage:**
```bash
npm run propagate:accreditation
```

#### 2. Recommendations System
**File:** `app/api/recommendations/route.ts`

- Uses program-level accreditation if available (universities from NUC)
- Falls back to institution-level accreditation for COE, polytechnics, and nursing schools
- Filters out denied programs
- Prioritizes fully accredited programs

#### 3. Admin Interface
**File:** `app/admin/accreditation/page.tsx`

- Upload NUC accreditation CSV (for universities)
- Propagate institution accreditation (for COE, polytechnics, nursing schools)
- View import and propagation results

---

## Data Import

### Import University Programs from CSV
```bash
npm run import:programs-accreditation
```

### Import Accreditation Data via Admin
1. Go to `/admin/accreditation`
2. Upload `accreditation_results.csv`
3. Click "Import Accreditation Data"

### Propagate Institution Accreditation
1. Go to `/admin/accreditation`
2. Click "Propagate Institution Accreditation"
3. System will propagate institution-level accreditation to all programs

---

## Current Status

- **Universities:** 2,582 programs with NUC accreditation (100%)
- **Colleges of Education:** 268 institutions with NCCE accreditation (100%)
- **Polytechnics:** 198 institutions (196 accredited - 99.0%)
- **Schools of Nursing:** 394 institutions (394 accredited - 100%)

**Total:** 1,135 institutions, 3,050 programs (100% accreditation coverage)

---

## See Also

- [FINAL_DATA_AUDIT.md](../FINAL_DATA_AUDIT.md) - Comprehensive data audit
- [scrapers/README.md](../scrapers/README.md) - Scraper documentation

