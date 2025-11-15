# 🇳🇬 edurepoAI.com

AI-powered educational repository and guidance system for Nigerian tertiary admissions — integrating **institutional metadata**, **JAMB/O-level calculators**, and **AI-driven school recommendations**.

> Built with Next.js + Prisma + Shadcn + TailwindCSS + PGVector  
> Designed for Cursor AI and local containerized development.

---

## ✨ Overview

edurepoAI.com centralizes all **Nigerian higher institutions** (universities, polytechnics, colleges, nursing schools, military academies, etc.) and provides:

- 🧠 **AI-driven guidance** for UTME candidates with explainable recommendations
- 🏫 **Canonical dataset** of accredited institutions and programs with data quality scoring
- 📊 **Admission probability estimation** based on scores + historical cutoffs with confidence intervals
- 🔎 **Smart search** (Postgres full-text search + PGVector for semantic queries)
- 🗓️ **Application timeline & notifications** with watchlist management
- 📈 **Historical analytics** with trend visualization and exportable data
- 🔒 **Privacy-first design** with encryption, audit logging, and user consent flows

---

## ⚠️ Legal Disclaimer

**Important**: Data provided on this platform is for **informational purposes only**. While we strive for accuracy through multiple sources and user feedback, we cannot guarantee the completeness or correctness of admission cutoffs, institutional policies, or eligibility calculations. 

- **Always verify** critical information with official institutional sources (JAMB, NUC, or individual institutions)
- **Do not rely solely** on AI recommendations for admission decisions
- **Use at your own risk** — we are not liable for any admission outcomes based on platform data or guidance

This platform aggregates publicly available data and provides AI-assisted guidance. For official admission requirements and decisions, consult the relevant institutions directly.

---

## 📊 Current Database Status

**Last Updated:** November 10, 2025

### Institutions
- **Total:** 1,135 institutions
- **Accredited:** 1,116 (98.3%)
- **By Type:**
  - Universities: 275 (259 accredited)
  - Polytechnics: 198 (196 accredited)
  - Colleges of Education: 268 (268 accredited)
  - Nursing Schools: 394 (394 accredited)

### Programs
- **Total:** 3,050 programs
- **Accredited:** 3,050 (100.0%)
- **Active:** 3,050 (100.0%)

### Source of Truth
- **Universities:** NUC `accreditation_results.csv` (2,582 programs)
- **Nursing Schools:** NMCN Official PDF 2025 (394 institutions)
- **Polytechnics:** NBTE (MySchoolGist) (198 institutions)
- **Colleges of Education:** NCCE Official Website (268 institutions)

**Status:** ✅ **Ready for Public Consumption**

See [docs/FINAL_DATA_AUDIT.md](./docs/FINAL_DATA_AUDIT.md) for detailed audit report.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (Next.js PWA)              │
│   Next.js 14+ App Router + Shadcn UI        │
│   TailwindCSS + TypeScript                  │
└──────────────┬──────────────────────────────┘
               │ REST API / Server Actions
┌──────────────┴──────────────────────────────┐
│        Next.js API Routes                    │
│   Auth (NextAuth.js) + API + AI Services    │
│   Rate Limiting + Caching (Vercel KV/Redis) │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────┐
│      PostgreSQL + Prisma     │
│   PGVector for embeddings    │
│   Full-text search (MVP)     │
└──────────────────────────────┘
               │
┌──────────────┴──────────────┐
│   External Scrapers (Python) │
│   Scrapy + Playwright        │
│   → Raw Store (S3) → ETL     │
└──────────────────────────────┘
```

### Key Components

- **Frontend**: Next.js App Router with Server/Client Components, Shadcn UI components, TailwindCSS styling
- **Backend**: Next.js API routes with Prisma ORM, NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma, PGVector extension for vector embeddings
- **Caching**: Vercel KV (free tier) for MVP, Docker Redis for dev, managed Redis for production
- **Search**: Postgres full-text search for MVP (Elasticsearch optional for scale)
- **AI**: RAG pipeline with PGVector, LLM (Llama/OpenAI) with cost controls
- **Scrapers**: Python microservice (Scrapy/Playwright) for data ingestion

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **PostgreSQL** ≥ 14.x (or Docker for containerized setup)
- **Docker + Docker Compose** (optional, for containerized development)
- **Git** for version control
- **Python 3.9+** (for scrapers)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/edurepoAI.git
cd edurepoAI
```

2. **Install dependencies:**
```bash
npm install
cd scrapers && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database and API keys
```

4. **Set up database:**
```bash
npx prisma generate
npx prisma db push
```

5. **Run development server:**
```bash
npm run dev
```

---

## 📚 Documentation

- **[Data Audit Report](./docs/FINAL_DATA_AUDIT.md)** - Comprehensive data audit and status
- **[Accreditation Guide](./docs/ACCREDITATION.md)** - Accreditation data sources and management
- **[Scrapers Documentation](./scrapers/README.md)** - Scraper setup and usage
- **[Legal & Privacy](./LEGAL.md)** - Legal disclaimer and data usage policy

---

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

### Data Management
- `npm run scrape:ncce` - Scrape colleges of education (NCCE)
- `npm run scrape:nbte` - Scrape polytechnics (NBTE)
- `npm run scrape:nmcn` - Scrape nursing schools (NMCN)
- `npm run export:institutions` - Export institutions to CSV
- `npm run import:programs-accreditation` - Import programs from accreditation CSV
- `npm run propagate:accreditation` - Propagate institution accreditation to programs
- `npm run reconcile:institutions` - Reconcile and clean institution data
- `npm run cleanup:data` - Clean up data quality issues

### AI
- `npm run ai:generate-embeddings` - Generate embeddings for AI assistant

---

## 🧩 Features

| Feature | Description |
|---------|-------------|
| **Institution Registry** | Centralized DB of accredited institutions with data quality scoring |
| **Eligibility Calculator** | Computes admission chance from JAMB + O-level grades |
| **AI Advisor** | LLM-based guide (RAG) suggesting suitable schools |
| **Data Scrapers** | Automated ingestion from NUC, NCCE, NBTE, NMCN with provenance tracking |
| **RAG Pipeline** | Vectorized institutional knowledge base (PGVector) for natural language queries |
| **Historical Analytics** | Trend analysis of cutoffs per program with visualizations |
| **Data Quality System** | Confidence scoring, freshness tracking, user feedback |
| **User Profiles** | Authenticated accounts with scores, O-level results, watchlists |
| **Public API** | RESTful JSON API with OpenAPI documentation |

---

## 📖 API Documentation

Interactive API documentation available at:
- **Swagger/OpenAPI**: https://edurepoai.xyz/api/docs (or http://localhost:3000/api/docs for local development)

### Key Endpoints

- `GET /api/institutions` - List institutions
- `GET /api/programs` - List programs
- `POST /api/recommendations` - Get program recommendations
- `POST /api/ai/chat` - AI chat assistant
- `GET /api/analytics/trends` - Analytics data

---

## 🔒 Data Quality & Security

### Data Quality System

Every data point includes quality metadata:
- **Confidence Levels**: verified, estimated, unverified
- **Freshness Tracking**: last_verified_at, data_quality_score
- **Source Provenance**: Source URL, fetch date, transformation notes

### Security Practices

- **Authentication**: NextAuth.js with email/password
- **Encryption**: Sensitive data encrypted at rest
- **Rate Limiting**: Per-user and per-IP limits
- **Audit Logging**: All data access logged
- **Privacy-First**: Minimize PII collection, clear consent flows

---

## 📝 License

This project is licensed under the MIT License. See [LEGAL.md](./LEGAL.md) for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.
