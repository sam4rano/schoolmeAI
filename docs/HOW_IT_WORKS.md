# How EduRepo-NG-AI Works

This document explains the core functionality and architecture of the application.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Frontend (Next.js App Router)       │
│   - Pages (Home, Calculator, Recommendations)│
│   - Components (UI, Forms, Cards)           │
│   - Client-side State Management            │
└──────────────┬──────────────────────────────┘
               │ HTTP Requests
┌──────────────┴──────────────────────────────┐
│         API Routes (Next.js API)            │
│   - /api/recommendations                    │
│   - /api/ai/chat                           │
│   - /api/calculate/eligibility             │
│   - /api/institutions, /api/programs        │
└──────────────┬──────────────────────────────┘
               │ Prisma ORM
┌──────────────┴──────────────────────────────┐
│      PostgreSQL Database                     │
│   - Institutions (1,135 records)             │
│   - Programs (3,050 records)                │
│   - PGVector (embeddings for AI)            │
└──────────────────────────────────────────────┘
```

---

## 🧩 Core Components

### 1. **Recommendations System** (`/api/recommendations`)

**Purpose:** Generate personalized program recommendations based on student scores.

**How it works:**

1. **Input Processing:**
   - Receives UTME score (0-400), O-level grades, optional Post-UTME score
   - Validates input using Zod schema

2. **Score Calculation:**
   ```typescript
   // Convert O-level grades to points (A1=6, B2=5, ..., F9=0)
   olevelPoints = convertGradesToPoints(olevels)
   
   // Normalize UTME (0-400) to (0-100) scale
   utmeNormalized = (utme / 400) * 100
   
   // Calculate composite score
   compositeScore = 0.6 × utmeNormalized + 0.4 × olevelPoints
   ```

3. **Program Fetching:**
   - Fetches active programs from database (up to 200)
   - Filters out denied programs
   - Includes institution data for accreditation fallback

4. **Eligibility Calculation:**
   For each program:
   - Extracts cutoff history (historical admission cutoffs)
   - Uses logistic regression to estimate admission probability:
     ```
     P(admission) = 1 / (1 + e^(-(score - cutoff) / scale))
     ```
   - Categorizes as:
     - **Safe** (≥70%): High probability
     - **Target** (40-70%): Moderate probability
     - **Reach** (30-40%): Lower probability

5. **Accreditation Scoring:**
   - **Full Accreditation:** +10 points (highest priority)
   - **Interim Accreditation:** +5 points (with warning)
   - **Denied:** -100 points (filtered out)
   - **Expiring Soon:** -2 to -5 points (with warning)
   - Falls back to institution-level accreditation for COE/polytechnics

6. **Ranking:**
   Programs are sorted by:
   1. Accreditation score (descending)
   2. Admission probability (descending)
   3. Category (safe > target > reach)

7. **Output:**
   Returns top N programs with:
   - Eligibility probability
   - Category (safe/target/reach)
   - Accreditation status and warnings
   - Confidence intervals

**Key Files:**
- `app/api/recommendations/route.ts` - API endpoint
- `lib/eligibility.ts` - Score calculation utilities
- `lib/probability-model.ts` - Probability estimation models

---

### 2. **AI Chat Assistant** (`/api/ai/chat`)

**Purpose:** Provide AI-powered answers about institutions and programs using RAG (Retrieval-Augmented Generation).

**How it works:**

1. **Query Processing:**
   - Receives user question (e.g., "What universities offer Medicine in Lagos?")
   - Optional: User context (UTME score, O-levels, state of origin)
   - Optional: Conversation history

2. **RAG Pipeline:**
   ```
   User Question
        ↓
   Generate Query Embedding (vector representation)
        ↓
   Search Similar Content (cosine similarity in PostgreSQL)
        ↓
   Retrieve Top 5 Relevant Sources (institutions/programs)
        ↓
   Generate AI Answer (using Gemini/OpenAI with context)
        ↓
   Return Answer + Sources + Context Links
   ```

3. **Embedding Generation:**
   - Converts query to vector embedding using OpenAI `text-embedding-ada-002`
   - Falls back to hash-based embedding if API key not set
   - Stores embeddings in PostgreSQL with PGVector extension

4. **Context Retrieval:**
   - Searches embeddings table for similar content
   - Uses cosine similarity to find top matches
   - Filters by minimum similarity threshold (0.3)
   - Returns top 5 most relevant sources

5. **Answer Generation:**
   - Builds context from retrieved sources
   - Includes user context (scores, preferences)
   - Includes conversation history for context awareness
   - Sends to Gemini API (or OpenAI) with prompt:
     ```
     You are an AI assistant helping Nigerian students with admission guidance.
     
     Context from database:
     [Retrieved sources with citations]
     
     User Context:
     - UTME Score: [score]
     - O-Level Results: [available]
     - State of Origin: [state]
     
     Conversation History:
     [Previous messages]
     
     Question: [user question]
     
     Provide a helpful, accurate answer based on the context.
     ```

6. **Output:**
   Returns:
   - AI-generated answer
   - Source citations [1], [2], etc.
   - Clickable links to institutions/programs
   - Context metadata

**Key Files:**
- `app/api/ai/chat/route.ts` - API endpoint
- `lib/ai/rag.ts` - RAG pipeline implementation
- `lib/ai/embeddings.ts` - Embedding generation

---

### 3. **Eligibility Calculator** (`/api/calculate/eligibility`)

**Purpose:** Calculate admission probability for a specific program.

**How it works:**

1. **Input:**
   - UTME score
   - O-level grades
   - Program ID

2. **Calculation:**
   - Converts O-level grades to points
   - Calculates composite score
   - Retrieves program cutoff history
   - Estimates probability using logistic regression

3. **Output:**
   - Admission probability (0-1)
   - Category (safe/target/reach)
   - Confidence interval
   - Rationale explanation
   - Data quality metadata

**Key Files:**
- `app/api/calculate/eligibility/route.ts` - API endpoint
- `lib/eligibility.ts` - Calculation utilities
- `lib/probability-model.ts` - Probability models

---

### 4. **Database Schema**

**Institution Model:**
```prisma
model Institution {
  id                  String          @id
  name                String
  type                InstitutionType  // university, polytechnic, college, nursing
  ownership           Ownership        // federal, state, private
  state               String
  city                String
  website             String?
  accreditationStatus String?          // accredited, not_accredited
  programs            Program[]       // One-to-many relationship
}
```

**Program Model:**
```prisma
model Program {
  id                    String    @id
  institutionId         String
  name                  String
  faculty               String?
  degreeType            String?   // BSc, ND, OND, etc.
  utmeSubjects          String[]  // Required UTME subjects
  olevelSubjects        String[]  // Required O-level subjects
  cutoffHistory         Json?     // [{year, cutoff, source_url}]
  accreditationStatus   String?   // Full, Interim, Denied
  accreditationMaturityDate Int?  // Year when accreditation expires
  isActive              Boolean   @default(true)
  institution           Institution @relation(...)
}
```

**Key Relationships:**
- Institution → Programs (One-to-Many)
- Program → Institution (Many-to-One)

---

## 🔄 Data Flow

### Recommendation Flow

```
User Input (UTME, O-levels)
    ↓
POST /api/recommendations
    ↓
Calculate Composite Score
    ↓
Fetch Programs from Database
    ↓
For Each Program:
  - Calculate Probability (logistic regression)
  - Check Accreditation Status
  - Calculate Accreditation Score
    ↓
Filter & Rank Programs
    ↓
Return Top N Recommendations
```

### AI Chat Flow

```
User Question
    ↓
POST /api/ai/chat
    ↓
Generate Query Embedding
    ↓
Search Embeddings Table (PGVector)
    ↓
Retrieve Top 5 Similar Sources
    ↓
Build Context (sources + user context + history)
    ↓
Generate Answer (Gemini/OpenAI)
    ↓
Return Answer + Sources + Links
```

### Calculator Flow

```
User Input (UTME, O-levels, Program)
    ↓
POST /api/calculate/eligibility
    ↓
Calculate Composite Score
    ↓
Fetch Program Cutoff History
    ↓
Estimate Probability (logistic regression)
    ↓
Return Eligibility Result
```

---

## 📊 Probability Model

### Logistic Regression

The core probability estimation uses logistic regression:

```
P(admission) = 1 / (1 + e^(-(score - cutoff) / scale))
```

Where:
- `score` = Composite score (0-100)
- `cutoff` = Latest cutoff from history (normalized to 0-100)
- `scale` = 10 (controls curve steepness)

### Trend Analysis

Calculates trend from historical cutoffs:
- **Increasing:** Cutoffs rising over time
- **Decreasing:** Cutoffs falling over time
- **Stable:** Cutoffs relatively constant

### Confidence Intervals

- **Logistic Model:** ±15% margin
- **Rule-based:** ±20% margin

---

## 🎯 Ranking Algorithm

Programs are ranked using a multi-factor scoring system:

1. **Accreditation Score** (Primary)
   - Full: +10
   - Interim: +5
   - Denied: -100 (filtered out)
   - Expiring: -2 to -5

2. **Admission Probability** (Secondary)
   - Higher probability = higher rank

3. **Category** (Tertiary)
   - Safe > Target > Reach

**Sorting Logic:**
```typescript
.sort((a, b) => {
  // 1. Accreditation score (descending)
  if (b.accreditationScore !== a.accreditationScore) {
    return b.accreditationScore - a.accreditationScore
  }
  // 2. Probability (descending)
  if (b.probability !== a.probability) {
    return b.probability - a.probability
  }
  // 3. Category (safe > target > reach)
  const categoryOrder = { safe: 3, target: 2, reach: 1 }
  return categoryOrder[b.category] - categoryOrder[a.category]
})
```

---

## 🔍 Search & Filtering

### Program Filtering

Programs are filtered by:
- **Active Status:** Only `isActive: true`
- **Accreditation:** Excludes "Denied" programs
- **Probability:** Minimum 30% probability
- **User Filters:** State, institution type, category, minimum probability

### Database Queries

Uses Prisma ORM for type-safe database queries:
```typescript
const programs = await prisma.program.findMany({
  where: {
    isActive: true,
    OR: [
      { accreditationStatus: null },
      { accreditationStatus: { not: "Denied" } },
    ],
  },
  include: {
    institution: {
      select: {
        name: true,
        type: true,
        accreditationStatus: true,
      },
    },
  },
  take: 200,
})
```

---

## 🛡️ Data Quality

### Accreditation Status

- **Universities:** Program-level (from NUC CSV)
- **COE/Polytechnics:** Institution-level (from NCCE/NBTE)
- **Nursing Schools:** Institution-level (from NMCN PDF)

### Fallback Logic

For COE and polytechnics:
- If program-level accreditation not available
- Use institution-level accreditation
- Propagate to all programs in that institution

### Data Validation

- Input validation using Zod schemas
- Database constraints (unique, required fields)
- Data quality scoring (0-100)
- Missing fields tracking

---

## 🚀 Performance Optimizations

1. **Database Indexing:**
   - Indexed on `state`, `type`, `ownership`
   - Composite indexes for common queries

2. **Query Optimization:**
   - Limits results (take: 200)
   - Selects only needed fields
   - Uses includes for relations

3. **Caching:**
   - Vercel KV for API responses
   - Redis for development
   - Client-side caching with React Query

4. **Embedding Search:**
   - PGVector for fast similarity search
   - Cosine similarity for relevance

---

## 📝 Key Algorithms

### Composite Score Calculation
```typescript
compositeScore = 0.6 × utmeNormalized + 0.4 × olevelPoints
```

### O-level Points Conversion
```typescript
A1 = 6, B2 = 5, B3 = 4, C4 = 3, C5 = 2, C6 = 1, D7 = 0, E8 = 0, F9 = 0
averagePoints = sum(points) / subjectCount
scaledPoints = (averagePoints / 6) × 100
```

### Probability Estimation
```typescript
difference = compositeScore - latestCutoff
probability = 1 / (1 + e^(-difference / 10))
```

---

## 🔗 Integration Points

1. **Frontend → API:**
   - React Query hooks for data fetching
   - Form validation and submission
   - Real-time updates

2. **API → Database:**
   - Prisma ORM for type-safe queries
   - Transaction support
   - Error handling

3. **AI → External Services:**
   - Gemini API for answer generation
   - OpenAI for embeddings
   - Fallback mechanisms

---

## 📚 See Also

- [README.md](../README.md) - Project overview
- [docs/ACCREDITATION.md](./ACCREDITATION.md) - Accreditation system
- [docs/FINAL_DATA_AUDIT.md](./FINAL_DATA_AUDIT.md) - Data audit report

