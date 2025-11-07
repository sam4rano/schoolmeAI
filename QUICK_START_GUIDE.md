# Quick Start Guide - RAG, AI & Admin Access

## 🔑 Admin Login Details

### Default Test User
- **Email**: `test@example.com`
- **Password**: `password123`
- **Status**: Regular user (NOT admin by default)

### To Make This User an Admin:

**Option 1: SQL (Recommended)**
```sql
UPDATE users 
SET roles = array_append(roles, 'admin') 
WHERE email = 'test@example.com';
```

**Option 2: Prisma Studio**
1. Run: `npx prisma studio`
2. Open `User` table
3. Find `test@example.com`
4. Edit `roles` field → Add `"admin"` → Save

**Option 3: Create New Admin User**
```bash
# Run seed script to create test user
npm run db:seed

# Then grant admin role using Option 1 or 2
```

---

## 🎓 How RAG Works for Students

### Student Journey

1. **Sign In** → `test@example.com` / `password123`
2. **Go to AI Page** → `/ai`
3. **Ask Question** → e.g., "What universities offer Medicine in Lagos?"
4. **Get Answer** → AI responds with:
   - Personalized answer based on database
   - Source citations [1], [2], etc.
   - Clickable links to institutions/programs

### How It Works Behind the Scenes

```
Student Question
    ↓
Generate Vector Embedding (1536 dimensions)
    ↓
Search Similar Content (PostgreSQL + PGVector)
    ↓
Retrieve Top 5 Relevant Sources
    ↓
Generate AI Answer (Gemini API)
    ↓
Return Answer + Sources + Links
```

### Current Configuration

- ✅ **Gemini API**: Configured (`GEMINI_API_KEY` set)
- ✅ **Model**: `gemini-2.5-flash`
- ✅ **Database**: PostgreSQL with PGVector
- ⚠️ **Embeddings**: May need to be generated (see below)

---

## 🔄 How Everything Syncs Together

### Current Sync Status

#### ✅ Automatically Synced
- Database updates (admin changes → immediately in DB)
- API responses (reflect DB changes immediately)
- User authentication (NextAuth)

#### ⚠️ Requires Manual Sync
- **Embeddings** (for RAG to work properly)

### Embedding Sync Process

**When to Sync:**
- After adding new institutions/programs
- After updating institution/program details
- After adding cutoff history
- After updating descriptions

**How to Sync:**

```bash
# Generate embeddings for all institutions and programs
npx tsx scripts/generate-embeddings.ts
```

**What Gets Embedded:**
- Institution: name, type, location, programs list
- Program: name, faculty, cutoff scores, requirements

### Data Flow

```
Admin Updates Data (via /admin)
        ↓
PostgreSQL Database (updated immediately)
        ↓
[Manual Step] Generate Embeddings
        ↓
PGVector Store (embeddings ready)
        ↓
Student Queries (RAG finds relevant content)
        ↓
AI Generates Answer (Gemini API)
        ↓
Student Sees Response
```

---

## 🧪 Testing Checklist

### Test as Student

- [ ] Sign in: `test@example.com` / `password123`
- [ ] Navigate to `/ai`
- [ ] Ask: "What universities offer Computer Science?"
- [ ] Verify: Get answer with citations
- [ ] Click: Source links work

### Test as Admin

- [ ] Grant admin role (see above)
- [ ] Sign in with admin user
- [ ] Navigate to `/admin`
- [ ] Update an institution
- [ ] Run embedding generation: `npx tsx scripts/generate-embeddings.ts`
- [ ] Test RAG: Ask question about updated data
- [ ] Verify: Answer includes updated information

---

## 🐛 Common Issues & Fixes

### "I couldn't find specific information..."
**Fix**: Generate embeddings
```bash
npx tsx scripts/generate-embeddings.ts
```

### "Unauthorized" on `/ai`
**Fix**: Sign in first at `/auth/signin`

### "Access Denied" on `/admin`
**Fix**: Grant admin role (see above)

### "GEMINI_API_KEY not set"
**Fix**: Add to `.env`:
```env
GEMINI_API_KEY="your-key-here"
```

---

## 📊 Current System Status

| Component | Status | Notes |
|-----------|--------|-------|
| RAG Pipeline | ✅ Working | Requires embeddings |
| Gemini API | ✅ Configured | Key set in `.env` |
| Admin Dashboard | ✅ Working | Need admin role |
| Embeddings | ⚠️ Manual | Run script after updates |
| Database | ✅ Connected | PostgreSQL + PGVector |
| Authentication | ✅ Working | NextAuth configured |

---

## 🚀 Quick Commands

```bash
# Start dev server
npm run dev

# Generate embeddings
npx tsx scripts/generate-embeddings.ts

# Open Prisma Studio
npx prisma studio

# Run database migrations
npx prisma migrate dev

# Seed database
npm run db:seed
```

---

## 📝 Summary

### For Students
1. Sign in → `/ai` → Ask questions
2. Get AI answers with sources
3. Click links to explore

### For Admins
1. Grant admin role → Sign in → `/admin`
2. Update data
3. **Important**: Run embedding script
4. Students see updated info

### Key Points
- ✅ RAG is functional (needs embeddings)
- ✅ Gemini API configured
- ⚠️ Embeddings require manual sync
- ⚠️ Admin role must be granted manually

---

**Need Help?** See `RAG_AI_INTEGRATION_GUIDE.md` for detailed documentation.

