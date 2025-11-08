# All Remaining Issues - Complete Checklist

**Date**: 2025-11-08  
**Status**: Active Implementation

---

## ✅ Completed (5 tasks)

1. ✅ Created structured logger (`lib/utils/logger.ts`)
2. ✅ Updated api-error-handler to use logger
3. ✅ Updated 5 API routes to use logger (5/48 files)
4. ✅ Created implementation plan
5. ✅ Created comprehensive analysis document

---

## 🔄 In Progress (1 task)

### 1. Replace console.log with Logger (5/48 files done - 10%)

**Remaining Files** (43 files):
- [ ] `app/api/institutions/route.ts`
- [ ] `app/api/institutions/[id]/route.ts`
- [ ] `app/api/programs/route.ts`
- [ ] `app/api/programs/[id]/route.ts`
- [ ] `app/api/programs/courses/route.ts`
- [ ] `app/api/recommendations/route.ts`
- [ ] `app/api/calculate/eligibility/route.ts`
- [ ] `app/api/calculate/fees/route.ts`
- [ ] `app/api/export/programs/route.ts`
- [ ] `app/api/export/institutions/route.ts`
- [ ] `app/api/watchlist/route.ts`
- [ ] `app/api/watchlist/[id]/route.ts`
- [ ] `app/api/reviews/route.ts`
- [ ] `app/api/reviews/[id]/route.ts`
- [ ] `app/api/reviews/[id]/helpful/route.ts`
- [ ] `app/api/reviews/[id]/report/route.ts`
- [ ] `app/api/notifications/route.ts`
- [ ] `app/api/notifications/[id]/route.ts`
- [ ] `app/api/notifications/mark-all-read/route.ts`
- [ ] `app/api/notifications/check/route.ts`
- [ ] `app/api/scrape/import/route.ts`
- [ ] `app/api/scrape/programs/route.ts`
- [ ] `app/api/admin/embeddings/count/route.ts`
- [ ] `app/api/admin/programs/bulk-cutoff/route.ts`
- [ ] `app/api/admin/programs/bulk-fees/route.ts`
- [ ] `app/api/admin/programs/bulk-descriptions/route.ts`
- [ ] `app/api/admin/programs/route.ts`
- [ ] `app/api/admin/data-quality/route.ts`
- [ ] `app/api/admin/audit/route.ts`
- [ ] `app/api/admin/websites/review/route.ts`
- [ ] `app/api/admin/institutions/[id]/route.ts`
- [ ] `app/error.tsx`
- [ ] `app/page.tsx`
- [ ] `app/analytics/page.tsx`
- [ ] `app/institutions/[id]/page.tsx`
- [ ] `app/programs/[id]/page.tsx`
- [ ] `app/calculator/page.tsx`
- [ ] `app/ai/page.tsx`
- [ ] `app/recommendations/page.tsx`
- [ ] `app/watchlist/page.tsx`
- [ ] `app/profile/page.tsx`
- [ ] `app/admin/page.tsx`
- [ ] `app/admin/institutions/page.tsx`
- [ ] `app/admin/institutions/[id]/page.tsx`

---

## 📋 Priority 1: Critical Issues (Week 1)

### 2. Add Basic Test Coverage (0% → 30%)

**Status**: Not Started  
**Priority**: Critical  
**Risk**: No confidence in changes

**Test Files to Create**:
- [ ] `__tests__/api/auth/register.test.ts` - User registration tests
- [ ] `__tests__/api/institutions/route.test.ts` - Institution listing tests
- [ ] `__tests__/api/programs/route.test.ts` - Program listing tests
- [ ] `__tests__/api/calculate/eligibility.test.ts` - Eligibility calculation tests
- [ ] `__tests__/lib/utils/logger.test.ts` - Logger utility tests
- [ ] `__tests__/lib/middleware/admin.test.ts` - Admin middleware tests
- [ ] `__tests__/lib/queries/institutions.test.ts` - Query builder tests
- [ ] `__tests__/lib/queries/programs.test.ts` - Query builder tests

**Dependencies to Add**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

**Jest Configuration**:
- [ ] Create/update `jest.config.js`
- [ ] Create `jest.setup.js`
- [ ] Configure test environment
- [ ] Add test scripts to `package.json`

---

### 3. Optimize Database Queries

**Status**: Not Started  
**Priority**: High

#### 3.1 Fix N+1 Query Potential

**Files to Review**:
- [ ] `app/api/programs/route.ts` - Check for N+1 when fetching institutions
- [ ] `app/api/institutions/route.ts` - Already using `include` (verify)
- [ ] `app/api/recommendations/route.ts` - Check for N+1 in recommendations
- [ ] `app/api/calculate/eligibility/route.ts` - Check for N+1
- [ ] `app/api/calculate/fees/route.ts` - Check for N+1

**Actions**:
- [ ] Use `include` instead of separate queries
- [ ] Batch related queries with `Promise.all`
- [ ] Use `select` to limit fields
- [ ] Add query logging to identify N+1 issues

#### 3.2 Add Composite Indexes

**Indexes to Add**:
- [ ] `Program`: `@@index([institutionId, name])`
- [ ] `Program`: `@@index([institutionId, degreeType])`
- [ ] `Program`: `@@index([name, degreeType])`
- [ ] `Institution`: `@@index([type, ownership])`
- [ ] `Institution`: `@@index([state, type])`
- [ ] `Institution`: `@@index([name, type])`
- [ ] `Review`: `@@index([entityType, entityId, status])`
- [ ] `Notification`: `@@index([userId, status, type])`

**Actions**:
- [ ] Update `prisma/schema.prisma` with indexes
- [ ] Create migration for new indexes
- [ ] Test query performance
- [ ] Monitor index usage

#### 3.3 Configure Connection Pooling

**Actions**:
- [ ] Update `DATABASE_URL` with pool parameters:
  ```
  DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
  ```
- [ ] Test connection pool settings
- [ ] Monitor pool usage
- [ ] Adjust pool size based on load

#### 3.4 Optimize JSON Field Queries

**Current JSON Fields**:
- `cutoffHistory` (Program) - Array of cutoff data
- `tuitionFees` (Program, Institution) - Fee schedule
- `contact` (Program, Institution) - Contact information
- `profile` (User) - User profile data
- `admissionRequirements` (Program) - Requirements
- `courseCurriculum` (Program) - Curriculum data

**Actions**:
- [ ] Analyze JSON field query patterns
- [ ] Plan migration to separate tables
- [ ] Create `CutoffHistory` table
- [ ] Create `FeeSchedule` table
- [ ] Create `ContactInfo` table
- [ ] Migrate existing data
- [ ] Update API routes to use new tables

---

### 4. Add API Documentation

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Install `swagger-jsdoc` and `swagger-ui-react`
- [ ] Create `lib/api-docs.ts` with OpenAPI spec
- [ ] Document all API routes with JSDoc
- [ ] Create `/api/docs` endpoint for Swagger UI
- [ ] Create `/api/docs/page.tsx` for Swagger UI
- [ ] Add API versioning (optional)

**API Routes to Document**:
- [ ] `/api/auth/*` - Authentication endpoints
- [ ] `/api/institutions/*` - Institution endpoints
- [ ] `/api/programs/*` - Program endpoints
- [ ] `/api/calculate/*` - Calculator endpoints
- [ ] `/api/recommendations` - Recommendations endpoint
- [ ] `/api/ai/chat` - AI chat endpoint
- [ ] `/api/watchlist/*` - Watchlist endpoints
- [ ] `/api/reviews/*` - Review endpoints
- [ ] `/api/notifications/*` - Notification endpoints
- [ ] `/api/admin/*` - Admin endpoints

---

## 📋 Priority 2: Database Design (Week 2)

### 5. Fix Database Design Issues

#### 5.1 JSON Fields Overuse

**Status**: Not Started  
**Priority**: High

**Problem**: JSON fields are hard to query, index, and maintain

**Solution**: Create separate tables

**New Models to Create**:
- [ ] `CutoffHistory` model
  - Fields: `id`, `programId`, `year`, `cutoff`, `admissionMode`, `sourceUrl`, `confidence`
  - Indexes: `[programId]`, `[year]`, `[cutoff]`
  - Unique: `[programId, year, admissionMode]`

- [ ] `FeeSchedule` model
  - Fields: `id`, `programId`, `institutionId`, `amount`, `currency`, `perYear`, `level`, `academicYear`, `breakdown`, `lastUpdated`, `source`
  - Indexes: `[programId]`, `[institutionId]`, `[academicYear]`

- [ ] `ContactInfo` model
  - Fields: `id`, `institutionId`, `programId`, `email`, `phone`, `address`, `website`
  - Indexes: `[institutionId]`, `[programId]`

**Migration Steps**:
- [ ] Create new models in `schema.prisma`
- [ ] Create migration
- [ ] Write data migration script
- [ ] Migrate existing JSON data to new tables
- [ ] Update API routes to use new models
- [ ] Test data integrity
- [ ] Remove JSON fields (optional, for backward compatibility keep them)

#### 5.2 Add Full-Text Search

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Add full-text search indexes to schema:
  ```sql
  CREATE INDEX institutions_name_search ON institutions USING gin(to_tsvector('english', name));
  CREATE INDEX programs_name_search ON programs USING gin(to_tsvector('english', name));
  CREATE INDEX programs_description_search ON programs USING gin(to_tsvector('english', description));
  ```
- [ ] Create migration for full-text indexes
- [ ] Update `lib/queries/institutions.ts` with full-text search
- [ ] Update `lib/queries/programs.ts` with full-text search
- [ ] Add full-text search to API routes
- [ ] Test search performance

#### 5.3 Fix Embedding Storage Type Safety

**Status**: Not Started  
**Priority**: Medium

**Current Issue**:
```prisma
embedding   Unsupported("vector(1536)")
```

**Actions**:
- [ ] Research Prisma pgvector support
- [ ] Create custom type wrapper if needed:
  ```typescript
  // lib/types/vector.ts
  export type Vector<T extends number> = number[]
  ```
- [ ] Update Embedding model type
- [ ] Add type safety to embedding functions
- [ ] Test embedding storage/retrieval

---

## 📋 Priority 3: Code Quality (Week 3)

### 6. Refactor Code Quality Issues

#### 6.1 Code Duplication in API Routes

**Status**: Not Started  
**Priority**: Medium

**Duplicated Code**:
- Authentication checks
- Error handling
- Validation logic
- Response formatting

**Actions**:
- [ ] Create `lib/middleware/auth.ts` for authentication
- [ ] Create `lib/middleware/validation.ts` for validation
- [ ] Create `lib/utils/api-response.ts` for standardized responses
- [ ] Refactor API routes to use middleware
- [ ] Remove duplicated code

**Files to Create**:
- [ ] `lib/middleware/auth.ts`
- [ ] `lib/middleware/validation.ts`
- [ ] `lib/utils/api-response.ts`

#### 6.2 Large Component Files (>500 lines)

**Status**: Not Started  
**Priority**: Medium

**Files to Split**:
- [ ] `app/calculator/page.tsx` (705 lines)
  - [ ] Extract `components/calculator/calculator-form.tsx`
  - [ ] Extract `components/calculator/calculator-results.tsx`
  - [ ] Extract `components/calculator/calculator-history.tsx`
  - [ ] Extract `components/calculator/calculator-comparison.tsx`

- [ ] `app/ai/page.tsx` (671 lines)
  - [ ] Extract `components/ai/chat-interface.tsx`
  - [ ] Extract `components/ai/message-list.tsx`
  - [ ] Extract `components/ai/conversation-sidebar.tsx`
  - [ ] Extract `components/ai/suggested-questions.tsx`

- [ ] `app/recommendations/page.tsx` (check if >500 lines)
  - [ ] Extract recommendation components

- [ ] `app/admin/institutions/[id]/page.tsx` (check if >500 lines)
  - [ ] Extract form components

#### 6.3 Magic Numbers/Strings

**Status**: Not Started  
**Priority**: Low

**Magic Values to Extract**:
- Pagination: `20`, `100`, `1`
- AI: `5`, `3`, `0.3`, `1000`
- Calculator: `5`, `50`
- API: `401`, `403`, `500`
- Database: `10`, `20`, `3600`

**Actions**:
- [ ] Create `lib/constants/index.ts`
- [ ] Extract pagination constants
- [ ] Extract AI constants
- [ ] Extract calculator constants
- [ ] Extract API constants
- [ ] Extract database constants
- [ ] Replace magic values with constants

#### 6.4 Minimal Code Comments

**Status**: Not Started  
**Priority**: Low

**Actions**:
- [ ] Add JSDoc comments to all public functions
- [ ] Add comments to complex algorithms
- [ ] Add comments to API routes
- [ ] Add comments to database queries
- [ ] Document complex business logic

---

## 📋 Priority 4: Performance (Week 4)

### 7. Add CDN Configuration

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Update `next.config.js` for image domains:
  ```javascript
  images: {
    domains: ['institution-websites.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.edu.ng' },
    ],
  }
  ```
- [ ] Replace `<img>` with Next.js `<Image>` component
- [ ] Configure CDN for static assets (Vercel, Cloudflare, etc.)
- [ ] Test image optimization
- [ ] Monitor CDN performance

**Files to Update**:
- [ ] `next.config.js`
- [ ] All pages using images
- [ ] Institution/program detail pages

---

### 8. Implement Caching Strategy

**Status**: Not Started  
**Priority**: High

**Current**: Vercel KV installed but unused

**Actions**:
- [ ] Create `lib/cache/redis.ts` (if using Redis)
- [ ] Create `lib/cache/vercel-kv.ts` (if using Vercel KV)
- [ ] Create `lib/cache/cache-utils.ts` with utilities:
  - `getCached<T>(key: string): Promise<T | null>`
  - `setCached<T>(key: string, value: T, ttl: number): Promise<void>`
  - `invalidateCache(key: string): Promise<void>`
- [ ] Cache API responses:
  - [ ] Institution listings
  - [ ] Program listings
  - [ ] Recommendations
- [ ] Cache AI responses
- [ ] Cache database queries
- [ ] Add cache invalidation logic
- [ ] Test caching performance

**Cache Keys to Use**:
- `institutions:list:${filters}`
- `programs:list:${filters}`
- `recommendations:${userId}:${params}`
- `ai:chat:${queryHash}`
- `embeddings:count`

---

## 📋 Additional Improvements

### 9. Rate Limiting

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Install `@upstash/ratelimit`
- [ ] Create `lib/middleware/rate-limit.ts`
- [ ] Apply rate limiting to all API routes
- [ ] Configure rate limits per endpoint:
  - Public endpoints: 100 req/min
  - Authenticated endpoints: 200 req/min
  - Admin endpoints: 500 req/min
  - AI chat: 10 req/min (guest), 30 req/min (authenticated)
- [ ] Test rate limiting

---

### 10. Error Tracking

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Install `@sentry/nextjs`
- [ ] Configure Sentry in `sentry.client.config.ts`
- [ ] Configure Sentry in `sentry.server.config.ts`
- [ ] Integrate Sentry with logger
- [ ] Add error alerting (email, Slack)
- [ ] Test error tracking

---

### 11. Performance Monitoring

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Add APM (Application Performance Monitoring)
- [ ] Monitor database queries
- [ ] Track API response times
- [ ] Set up performance alerts
- [ ] Create performance dashboard

---

### 12. Security Hardening

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Remove hardcoded secrets from `lib/auth.ts`:
  ```typescript
  // Remove: secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production"
  // Add: if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET must be set")
  ```
- [ ] Add CSRF protection
- [ ] Add security headers (Next.js middleware)
- [ ] Add 2FA for admin accounts
- [ ] Security audit
- [ ] Penetration testing

---

### 13. Documentation

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Generate API docs (OpenAPI)
- [ ] Update README with latest features
- [ ] Add architecture diagrams
- [ ] Add deployment guide
- [ ] Add troubleshooting guide
- [ ] Add contributing guide

---

## 📊 Progress Summary

### Completed: 5/100+ tasks (5%)
- ✅ Logger utility created
- ✅ 5 API routes updated to use logger
- ✅ Implementation plan created
- ✅ Comprehensive analysis document created
- ✅ Remaining issues checklist created

### In Progress: 1 task
- 🔄 Replace console.log (5/48 files done - 10%)

### Pending: 95+ tasks
- ⏳ Test coverage (0%)
- ⏳ Database optimization (N+1, indexes, pooling)
- ⏳ API documentation
- ⏳ Database design (JSON fields, full-text search)
- ⏳ Code quality (duplication, large files, magic values)
- ⏳ Performance (CDN, caching)
- ⏳ Security (rate limiting, error tracking, hardening)
- ⏳ Documentation

---

## 🎯 Next Steps (Immediate)

1. **Continue replacing console.log** - Complete remaining 43 files
2. **Add basic tests** - Start with API routes (target: 30% coverage)
3. **Optimize database queries** - Fix N+1 issues, add indexes
4. **Add API documentation** - Generate OpenAPI spec
5. **Implement caching** - Use Vercel KV for API responses

---

## 📝 Notes

- All changes should maintain backward compatibility
- Database migrations should be tested thoroughly
- Tests should be added incrementally
- Documentation should be updated as changes are made
- Performance improvements should be measured
- Security fixes should be prioritized

