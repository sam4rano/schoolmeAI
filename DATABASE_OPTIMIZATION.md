# Database Query Optimization

**Date**: 2025-11-08  
**Status**: In Progress

---

## ✅ Completed

### 1. Added Composite Indexes

**Institution Model**:
- `@@index([type, ownership])` - For filtering by type and ownership
- `@@index([state, type])` - For filtering by state and type
- `@@index([name, type])` - For searching by name and type

**Program Model**:
- `@@index([institutionId, name])` - For institution + program queries
- `@@index([institutionId, degreeType])` - For filtering by institution and degree type
- `@@index([name, degreeType])` - For searching by name and degree type

**Review Model**:
- `@@index([entityType, entityId, status])` - For filtering reviews by entity and status

**Notification Model**:
- `@@index([userId, status])` - For user notifications by status
- `@@index([userId, status, type])` - For user notifications by status and type

---

## 🔄 In Progress

### 2. N+1 Query Analysis

**Current Status**: Most API routes are using `include` properly, which is good.

**Routes Using `include` (Good)**:
- ✅ `app/api/institutions/route.ts` - Uses `include` for programs
- ✅ `app/api/programs/route.ts` - Uses `include` for institution
- ✅ `app/api/institutions/[id]/route.ts` - Uses `include` for programs
- ✅ `app/api/programs/[id]/route.ts` - Uses `include` for institution
- ✅ `app/api/calculate/fees/route.ts` - Uses `include` for institution
- ✅ `app/api/recommendations/route.ts` - Uses `include` for institution
- ✅ `app/api/reviews/route.ts` - Uses `include` for user
- ✅ `app/api/watchlist/route.ts` - Uses `include` for program and institution

**Potential N+1 Issues**:
- ⚠️ `app/api/recommendations/route.ts` - Fetches 200 programs, then processes each one (not N+1, but could be optimized)
- ⚠️ `app/api/programs/route.ts` - When ranking by difficulty, processes all programs (not N+1, but could be optimized)

---

## 📋 Next Steps

### 3. Query Optimizations

1. **Batch Processing**:
   - Optimize `app/api/recommendations/route.ts` to use database aggregation instead of JavaScript filtering
   - Optimize `app/api/programs/route.ts` difficulty ranking to use database queries

2. **Connection Pooling**:
   - Configure connection pool in `DATABASE_URL`
   - Add pool parameters: `connection_limit=10&pool_timeout=20`

3. **Query Select Optimization**:
   - Review all queries to ensure only necessary fields are selected
   - Use `select` instead of `include` where possible

4. **Pagination Optimization**:
   - Ensure all list endpoints use proper pagination
   - Add cursor-based pagination for large datasets

---

## 📊 Performance Metrics

**Before Optimization**:
- No composite indexes
- Potential N+1 queries in some routes
- No connection pooling configuration

**After Optimization**:
- ✅ 8 composite indexes added
- ✅ Most routes using `include` properly
- ⏳ Connection pooling to be configured
- ⏳ Query optimizations to be applied

---

## 🎯 Migration

To apply the new indexes, run:
```bash
npx prisma migrate dev
```

Or if you want to apply without creating a new migration:
```bash
npx prisma db push
```

---

## 📝 Notes

- All indexes are composite indexes that support common query patterns
- Indexes are automatically maintained by PostgreSQL
- Monitor query performance after applying indexes
- Consider adding more indexes based on actual query patterns

