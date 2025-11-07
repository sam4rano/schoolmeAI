# 🇳🇬 EduRepo-NG-AI

AI-powered educational repository and guidance system for Nigerian tertiary admissions — integrating **institutional metadata**, **JAMB/O-level calculators**, and **AI-driven school recommendations**.

> Built with Next.js + Prisma + Shadcn + TailwindCSS + PGVector  
> Designed for Cursor AI and local containerized development.

---

## ✨ Overview

EduRepo-NG-AI centralizes all **Nigerian higher institutions** (universities, polytechnics, colleges, nursing schools, military academies, etc.) and provides:

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

## 🧩 Features

| Feature | Description |
|---------|-------------|
| **Institution Registry** | Centralized DB of NUC-accredited institutions (federal/state/private) with data quality scoring |
| **Eligibility Calculator** | Computes admission chance from JAMB + O-level grades with confidence intervals and institution-specific formulas |
| **AI Advisor** | LLM-based guide (RAG) suggesting suitable schools (safety/target/reach) with explainable recommendations |
| **Data Scrapers** | Automated ingestion from NUC, Myschool, MySchoolGist with provenance tracking |
| **RAG Pipeline** | Vectorized institutional knowledge base (PGVector) for natural language queries |
| **Historical Analytics** | Trend analysis of cutoffs per program over 5–10 years with visualizations |
| **Data Quality System** | Confidence scoring (verified/estimated/unverified), freshness tracking, user feedback |
| **User Profiles** | Authenticated accounts with scores, O-level results, watchlists, notification preferences |
| **Public API** | RESTful JSON API with OpenAPI documentation for developers and researchers |
| **Open Dataset** | Machine-readable exports (JSON/CSV/Parquet) with clear licensing (CC-BY or ODbL) |

---

## 🚀 Getting Started (Local Dev)

### Prerequisites

- **Node.js** ≥ 18.x
- **PostgreSQL** ≥ 14.x (or Docker for containerized setup)
- **Docker + Docker Compose** (optional, for containerized development)
- **Git** for version control
- **Cursor** (optional but recommended for AI-assisted development)

### Clone the Repository

```bash
git clone https://github.com/your-org/edurepo-ng-ai.git
cd edurepo-ng-ai
```

### Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/edurepo?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI (optional, for LLM)
OPENAI_API_KEY="sk-..."

# Vercel KV (optional, for caching - free tier available)
KV_URL="redis://localhost:6379"
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."

# Redis (alternative to Vercel KV)
REDIS_URL="redis://localhost:6379"

# Object Storage (for scrapers)
S3_ENDPOINT="https://..."
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_BUCKET="edurepo-raw"

# App Configuration
NODE_ENV="development"
```

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Or using yarn
yarn install
```

### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed sample data (optional)
npm run seed
```

### Start Development Server

```bash
# Start Next.js dev server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api

### Docker Compose Setup (Alternative)

For containerized development with PostgreSQL and Redis:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379` (optional)
- Next.js dev server on `http://localhost:3000`

---

## 💾 Caching Strategy

We use caching to improve performance and reduce costs. Here's a detailed breakdown of options:

### Option 1: Vercel KV (Recommended for MVP)

**Cost**: **FREE** for MVP (256MB storage, unlimited requests)

- **Free Tier**: 256MB storage, unlimited requests, global edge network
- **Paid Tier**: Starts at $0.20 per 100K commands (only if you exceed free tier)
- **Pros**: 
  - Zero setup (managed service)
  - Edge network (fast globally)
  - Redis-compatible API
  - Perfect for Next.js deployments on Vercel
- **Cons**: 
  - Limited to Vercel deployments (or use REST API)
  - 256MB may be limiting for large datasets

**Setup**:
```bash
# Install Vercel KV
npm install @vercel/kv

# Configure in .env
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
```

### Option 2: Docker Redis (Free for Development)

**Cost**: **FREE** (self-hosted, requires infrastructure)

- Run Redis in Docker or on your VPS
- **Pros**: 
  - Full control, no per-request fees
  - Unlimited storage (within your server limits)
- **Cons**: 
  - You manage scaling, backups, monitoring
  - Requires server/VPS (~$5–20/month if not using existing infrastructure)

**Setup**:
```bash
# Run Redis in Docker
docker run -d -p 6379:6379 redis:alpine

# Or use docker-compose (included in repo)
docker-compose up redis
```

### Option 3: Managed Redis (Production)

**Cost**: $10–60/month depending on provider and instance size

- **Providers**: 
  - Upstash: Free tier (10K commands/day), then pay-as-you-go
  - Redis Cloud: Free tier (30MB), then $10–50/month
  - AWS ElastiCache: $15–100/month
  - DigitalOcean: $15–60/month
- **Pros**: 
  - Managed backups, scaling, monitoring
  - High availability
- **Cons**: 
  - Ongoing cost
  - Vendor lock-in

### Recommendation

- **MVP**: Use **Vercel KV free tier** (256MB is sufficient for caching eligibility calculations, AI responses, and frequently accessed data)
- **Development**: Use **Docker Redis** (free, simple setup)
- **Production**: Start with Vercel KV, upgrade to managed Redis only if needed (when you exceed 256MB or need more control)

---

## 🧠 AI Pipeline

### RAG Architecture

We use **Retrieval-Augmented Generation (RAG)** to provide accurate, source-cited AI guidance:

1. **Vector Store**: PGVector extension in PostgreSQL stores institution profiles, cutoffs, FAQs, and policy documents as embeddings
2. **Retrieval**: Query embeddings are compared against stored vectors to find top-k relevant documents
3. **Generation**: LLM generates recommendations using retrieved context + user query
4. **Citation**: All AI outputs include source links and confidence scores

### LLM Options

**Local (Free)**:
- **Llama 2/3/4** via Ollama or Hugging Face
- Run on your own infrastructure
- Zero API costs, but requires GPU resources

**Cloud (Paid)**:
- **OpenAI GPT-4/GPT-3.5** via API
- **Anthropic Claude** via API
- Pay per token/request

**Cost Optimization**:
- Cache AI responses (use Vercel KV or Redis)
- Use smaller models for simple queries (GPT-3.5 vs GPT-4)
- Fallback to rule-based recommendations when LLM unavailable
- Rate limiting per user to prevent abuse

### Example Query

```bash
POST /api/ai/recommendations
{
  "utme": 240,
  "olevels": {
    "maths": "A1",
    "english": "B2",
    "biology": "B2",
    "chemistry": "B3",
    "physics": "C4"
  },
  "preferred_state": "Lagos",
  "preferred_programs": ["Medicine", "Engineering"]
}
```

**Response**:
```json
{
  "composite_score": 58.4,
  "recommended_programs": [
    {
      "institution": "University of Lagos (UNILAG)",
      "program": "Medicine and Surgery",
      "probability": 0.65,
      "confidence_interval": [0.55, 0.75],
      "category": "target",
      "rationale": "Your composite score (58.4) is 5 points above the 2023 cutoff (53.4). Historical trend shows 65% admission rate for similar scores.",
      "sources": [
        "https://unilag.edu.ng/admissions/2023-cutoff",
        "https://edurepo.ng/programs/123/cutoff-history"
      ]
    }
  ],
  "alternatives": [...],
  "action_plan": {
    "documents": ["JAMB result", "O-level certificate", "Birth certificate"],
    "timeline": "Apply by March 15, 2024",
    "alternate_pathways": ["Consider Post-UTME preparation", "Review catchment policies"]
  }
}
```

---

## 📚 API Documentation

### Endpoints

#### Institutions

```bash
# Search institutions
GET /api/institutions?type=university&state=Lagos&page=1&limit=20

# Get institution details
GET /api/institutions/{id}

# Get institution programs
GET /api/institutions/{id}/programs
```

#### Programs

```bash
# Get program details with cutoff history
GET /api/programs/{id}

# Search programs
GET /api/programs?query=medicine&institution_type=university
```

#### Eligibility Calculator

```bash
POST /api/calculate/eligibility
{
  "utme": 240,
  "olevels": {
    "maths": "A1",
    "english": "B2",
    "biology": "B2",
    "chemistry": "B3",
    "physics": "C4"
  },
  "program_id": "123",
  "state_of_origin": "Lagos"
}
```

**Response**:
```json
{
  "composite_score": 58.4,
  "probability": 0.65,
  "confidence_interval": [0.55, 0.75],
  "category": "target",
  "rationale": "Based on 2023 cutoff (53.4) and historical data...",
  "data_quality": {
    "cutoff_confidence": "verified",
    "historical_data_years": 5,
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

#### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure-password"
}

# Get current user
GET /api/auth/me
```

#### Watchlist

```bash
# Add program to watchlist
POST /api/watchlist
{
  "program_id": "123",
  "priority": "high"
}

# Get user watchlist
GET /api/watchlist

# Remove from watchlist
DELETE /api/watchlist/{id}
```

### API Documentation

Interactive API documentation available at:
- **Swagger/OpenAPI**: http://localhost:3000/api/docs (when implemented)
- **Postman Collection**: Available in `/docs/postman` directory

---

## 🔒 Data Quality & Security

### Data Quality System

Every data point includes quality metadata:

- **Confidence Levels**:
  - `verified`: Official source, human-verified
  - `estimated`: Calculated from multiple sources with high confidence
  - `unverified`: Scraped data, not yet verified

- **Freshness Tracking**:
  - `last_verified_at`: Timestamp of last verification
  - `data_quality_score`: 0–100 score based on sources, age, and verification status
  - `missing_fields`: Array of fields not yet collected

- **Source Provenance**:
  - Source URL, fetch date, transformation notes
  - Version history with audit trail

### User Feedback

Users can report incorrect data:

```bash
POST /api/programs/{id}/report-incorrect
{
  "field": "cutoff",
  "reported_value": 250,
  "current_value": 240,
  "source_url": "https://institution.edu.ng/official-cutoff",
  "notes": "Official cutoff published on institution website"
}
```

Reports are queued for admin review and data updates.

### Security Practices

- **Authentication**: NextAuth.js with email/password, optional 2FA
- **Encryption**: Sensitive data encrypted at rest (student scores, preferences)
- **Rate Limiting**: Per-user and per-IP limits to prevent abuse
- **Audit Logging**: All data access logged for security monitoring
- **Privacy-First**: Minimize PII collection, clear consent flows
- **Input Validation**: All API inputs validated with Zod schemas
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Next.js built-in XSS protection, sanitized inputs

---

## 📁 Folder Structure

```
edurepo-ng-ai/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── institutions/
│   │   ├── programs/
│   │   ├── calculate/
│   │   ├── auth/
│   │   └── ai/
│   ├── (auth)/                  # Auth pages (login, register)
│   ├── dashboard/               # User dashboard
│   ├── institutions/            # Institution pages
│   ├── programs/                # Program pages
│   └── layout.tsx
├── components/                  # React components
│   ├── ui/                      # Shadcn UI components
│   ├── institution/             # Institution-related components
│   ├── program/                 # Program-related components
│   ├── calculator/              # Eligibility calculator
│   └── ai/                      # AI chat/guidance components
├── lib/                         # Utility functions
│   ├── prisma.ts                # Prisma client
│   ├── auth.ts                  # NextAuth configuration
│   ├── ai/                      # AI/RAG utilities
│   ├── cache.ts                 # Caching utilities (Vercel KV/Redis)
│   └── utils.ts
├── prisma/                      # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                      # Static assets
├── scrapers/                    # Python scrapers (separate repo/microservice)
│   ├── nuc/
│   ├── myschool/
│   └── myschoolgist/
├── scripts/                     # Utility scripts
│   ├── seed.ts                  # Database seeding
│   └── migrate.ts
├── legal/                       # Legal documents
│   ├── DISCLAIMER.md
│   ├── TERMS.md
│   └── PRIVACY.md
├── .env.example                 # Environment template
├── docker-compose.yml           # Docker Compose config
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Development Workflow

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run E2E tests
npm test:e2e

# Test coverage
npm test:coverage
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Prisma Workflow

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_data_quality_fields

# Apply migrations (production)
npx prisma migrate deploy

# View database (Prisma Studio)
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/eligibility-calculator

# Commit changes
git add .
git commit -m "feat: add eligibility calculator with confidence intervals"

# Push to remote
git push origin feature/eligibility-calculator

# Create pull request
```

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure linting passes (`npm run lint`)
6. Commit with clear messages (`git commit -m "feat: add amazing feature"`)
7. Push to your fork (`git push origin feature/amazing-feature`)
8. Open a Pull Request

---

## 💰 Cost Management & Optimization

### LLM Costs

**Strategies**:
- **Cache AI responses** (Vercel KV/Redis) to avoid duplicate queries
- **Use smaller models** for simple queries (GPT-3.5 vs GPT-4)
- **Fallback to rule-based** when LLM unavailable or cost limits reached
- **Rate limiting** per user (e.g., 10 AI queries/day on free tier)
- **Batch processing** for admin tasks (not real-time)

**Estimated Costs** (OpenAI GPT-3.5):
- ~$0.002 per query (average)
- 1,000 queries/day = ~$60/month
- With caching: ~$20/month (70% cache hit rate)

### Database Costs

- **PostgreSQL**: Self-hosted (free) or managed ($10–50/month)
- **PGVector**: Free extension (no additional cost)
- **Backups**: Include in hosting plan or use managed backups

### Infrastructure Costs (MVP)

**Minimal Setup** (self-hosted):
- VPS: $5–20/month (PostgreSQL + Redis)
- Domain: $10–15/year
- **Total**: ~$10–25/month

**Managed Setup** (Vercel + managed services):
- Vercel Pro: $20/month (includes KV free tier)
- Managed PostgreSQL: $10–30/month
- **Total**: ~$30–50/month

---

## 🗺️ Roadmap

### Phase 1 — MVP (6–10 weeks)

- [x] Project scaffolding (repo, CI, Docker, IaC templates)
- [x] Minimal ingestion (NUC master lists + 20 major institutions)
- [x] DB schema with Prisma (institutions, programs, users, eligibility)
- [x] Next.js API routes (institutions, programs, eligibility calculation)
- [x] Frontend PWA with search, eligibility form, watchlist
- [x] Basic AI assistant (RAG with PGVector) with explainable recommendations
- [x] Admin QA UI for verifying scraped cutoffs
- [x] Data quality system (confidence scoring, freshness tracking)

### Phase 2 — Data Expansion & Analytics (8–12 weeks)

- [ ] Scale scrapers to full NUC list and Myschool/MySchoolGist
- [ ] Capture historical cutoffs (5–10 years) for major programs
- [ ] Train per-program logistic models with probability bands
- [ ] Historical analytics dashboard with trend visualizations
- [ ] Comparative analysis page vs Myschool/MySchoolGist
- [ ] Exportable data packages (JSON/CSV/Parquet) for researchers
- [ ] User feedback system for data correction

### Phase 3 — Partnerships & Verification (12+ weeks)

- [ ] Formal partnerships with NUC and selected institutions
- [ ] Direct data feeds from official sources
- [ ] Document verification (KYC-lite) for counselors
- [ ] Mobile app (React Native) with offline-first features
- [ ] Community features (verified mentors, forums, reviews)
- [ ] Advanced AI features (multi-year trend analysis, similarity matching)

---

## 📊 Milestones

- **M1**: Repo + infra + basic DB + 20 institutions ingested ✅
- **M2**: Eligibility calculator + API + PWA search ✅
- **M3**: RAG-enabled AI assistant + provenance UI ✅
- **M4**: Full NUC coverage + cutoff history + probability models 🚧
- **M5**: Partnerships & official data feeds 📅

---

## 🛡️ License

MIT © 2025 — EduRepo-NG-AI Initiative

Dataset licensing: CC-BY or ODbL (depending on sourced data licenses)

---

## 💬 Contributors

- **Lead Architect**: [@sammuti](https://sammuti.com)
- **Maintainers**: Open call for Nigerian education data contributors

### Contributing

We welcome contributions! See [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/edurepo-ng-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/edurepo-ng-ai/discussions)
- **Email**: support@edurepo.ng

---

**Built with ❤️ for Nigerian students**
