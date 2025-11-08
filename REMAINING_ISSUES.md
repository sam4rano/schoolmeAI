# Remaining Issues & Implementation Checklist

**Date**: 2025-11-08  
**Status**: Active

---

## ✅ Completed

1. ✅ **Created structured logger** (`lib/utils/logger.ts`)
2. ✅ **Updated api-error-handler** to use logger
3. ✅ **Updated 4 API routes** to use logger:
   - `app/api/admin/institutions/route.ts`
   - `app/api/ai/chat/route.ts`
   - `app/api/auth/register/route.ts`
   - `app/api/admin/embeddings/generate/route.ts`

---

## 🔄 In Progress

### 1. Replace console.log with Logger (4/48 files done)

**Remaining Files** (44 files):
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
- [ ] `app/api/admin/institutions/route.ts` (partially done)
- [ ] `app/api/ai/chat/route.ts` (partially done)
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

**Test Files to Create**:
- [ ] `__tests__/api/auth/register.test.ts`
- [ ] `__tests__/api/institutions/route.test.ts`
- [ ] `__tests__/api/programs/route.test.ts`
- [ ] `__tests__/api/calculate/eligibility.test.ts`
- [ ] `__tests__/lib/utils/logger.test.ts`
- [ ] `__tests__/lib/middleware/admin.test.ts`
- [ ] `__tests__/lib/queries/institutions.test.ts`
- [ ] `__tests__/lib/queries/programs.test.ts`

**Dependencies to Add**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

**Jest Configuration**:
- [ ] Update `jest.config.js`
- [ ] Add test setup file
- [ ] Configure test environment

---

### 3. Optimize Database Queries

**Status**: Not Started  
**Priority**: High

#### 3.1 Fix N+1 Queries
- [ ] Review `app/api/programs/route.ts` for N+1 issues
- [ ] Review `app/api/institutions/route.ts` for N+1 issues
- [ ] Review `app/api/recommendations/route.ts` for N+1 issues
- [ ] Use `include` instead of separate queries
- [ ] Batch related queries with `Promise.all`

#### 3.2 Add Composite Indexes
- [ ] Add `@@index([institutionId, name])` to Program model
- [ ] Add `@@index([institutionId, degreeType])` to Program model
- [ ] Add `@@index([name, degreeType])` to Program model
- [ ] Add `@@index([type, ownership])` to Institution model
- [ ] Add `@@index([state, type])` to Institution model
- [ ] Add `@@index([name, type])` to Institution model
- [ ] Create migration for new indexes

#### 3.3 Configure Connection Pooling
- [ ] Update `DATABASE_URL` with pool parameters
- [ ] Test connection pool settings
- [ ] Monitor pool usage

#### 3.4 Optimize JSON Field Queries
- [ ] Analyze JSON field usage
- [ ] Plan migration to separate tables
- [ ] Create migration for new tables

---

### 4. Add API Documentation

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Install `swagger-jsdoc` and `swagger-ui-react`
- [ ] Create `lib/api-docs.ts` with OpenAPI spec
- [ ] Document all API routes
- [ ] Create `/api/docs` endpoint
- [ ] Create `/api/docs/page.tsx` for Swagger UI
- [ ] Add JSDoc comments to API routes

---

## 📋 Priority 2: Database Design (Week 2)

### 5. Fix Database Design Issues

#### 5.1 JSON Fields Overuse

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Create `CutoffHistory` model
- [ ] Create `FeeSchedule` model
- [ ] Create `ContactInfo` model
- [ ] Create migration for new models
- [ ] Migrate existing JSON data to new tables
- [ ] Update API routes to use new models
- [ ] Remove JSON fields from schema (optional)

#### 5.2 Add Full-Text Search

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Add full-text search indexes to schema
- [ ] Create migration for full-text indexes
- [ ] Update `lib/queries/institutions.ts` with full-text search
- [ ] Update `lib/queries/programs.ts` with full-text search
- [ ] Test full-text search queries

#### 5.3 Fix Embedding Storage Type Safety

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Research Prisma pgvector support
- [ ] Create custom type wrapper if needed
- [ ] Update Embedding model type
- [ ] Test embedding storage/retrieval

---

## 📋 Priority 3: Code Quality (Week 3)

### 6. Refactor Code Quality Issues

#### 6.1 Code Duplication in API Routes

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Create `lib/middleware/auth.ts` for authentication
- [ ] Create `lib/middleware/validation.ts` for validation
- [ ] Create `lib/utils/api-response.ts` for standardized responses
- [ ] Refactor API routes to use middleware
- [ ] Remove duplicated code

#### 6.2 Large Component Files (>500 lines)

**Status**: Not Started  
**Priority**: Medium

**Files to Split**:
- [ ] `app/calculator/page.tsx` (705 lines)
  - [ ] Extract `components/calculator/calculator-form.tsx`
  - [ ] Extract `components/calculator/calculator-results.tsx`
  - [ ] Extract `components/calculator/calculator-history.tsx`
- [ ] `app/ai/page.tsx` (671 lines)
  - [ ] Extract `components/ai/chat-interface.tsx`
  - [ ] Extract `components/ai/message-list.tsx`
  - [ ] Extract `components/ai/conversation-sidebar.tsx`
- [ ] `app/recommendations/page.tsx` (if >500 lines)
  - [ ] Extract recommendation components
- [ ] `app/admin/institutions/[id]/page.tsx` (if >500 lines)
  - [ ] Extract form components

#### 6.3 Magic Numbers/Strings

**Status**: Not Started  
**Priority**: Low

**Actions**:
- [ ] Create `lib/constants/index.ts`
- [ ] Extract pagination constants
- [ ] Extract AI constants
- [ ] Extract calculator constants
- [ ] Extract API constants
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
- [ ] Update `next.config.js` for image domains
- [ ] Replace `<img>` with Next.js `<Image>` component
- [ ] Configure CDN for static assets
- [ ] Test image optimization
- [ ] Monitor CDN performance

### 8. Implement Caching Strategy

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Create `lib/cache/redis.ts` (if using Redis)
- [ ] Create `lib/cache/vercel-kv.ts` (if using Vercel KV)
- [ ] Create `lib/cache/cache-utils.ts` with utilities
- [ ] Cache API responses (institutions, programs)
- [ ] Cache AI responses
- [ ] Cache database queries
- [ ] Add cache invalidation logic
- [ ] Test caching performance

---

## 📋 Additional Improvements

### 9. Rate Limiting

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Install `@upstash/ratelimit`
- [ ] Create `lib/middleware/rate-limit.ts`
- [ ] Apply rate limiting to all API routes
- [ ] Configure rate limits per endpoint
- [ ] Test rate limiting

### 10. Error Tracking

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Install `@sentry/nextjs`
- [ ] Configure Sentry
- [ ] Integrate Sentry with logger
- [ ] Add error alerting
- [ ] Test error tracking

### 11. Performance Monitoring

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Add APM (Application Performance Monitoring)
- [ ] Monitor database queries
- [ ] Track API response times
- [ ] Set up performance alerts

### 12. Security Hardening

**Status**: Not Started  
**Priority**: High

**Actions**:
- [ ] Remove hardcoded secrets from `lib/auth.ts`
- [ ] Add CSRF protection
- [ ] Add security headers
- [ ] Add 2FA for admin accounts
- [ ] Security audit

### 13. Documentation

**Status**: Not Started  
**Priority**: Medium

**Actions**:
- [ ] Generate API docs (OpenAPI)
- [ ] Update README
- [ ] Add architecture diagrams
- [ ] Add deployment guide
- [ ] Add troubleshooting guide

---

## 📊 Progress Summary

### Completed: 4/100+ tasks (4%)
- ✅ Logger utility created
- ✅ 4 API routes updated to use logger
- ✅ Implementation plan created

### In Progress: 1 task
- 🔄 Replace console.log (4/48 files done)

### Pending: 95+ tasks
- ⏳ Test coverage (0%)
- ⏳ Database optimization
- ⏳ API documentation
- ⏳ Code quality improvements
- ⏳ Performance optimizations
- ⏳ Security hardening

---

## 🎯 Next Steps

1. **Continue replacing console.log** - Complete remaining 44 files
2. **Add basic tests** - Start with API routes
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

