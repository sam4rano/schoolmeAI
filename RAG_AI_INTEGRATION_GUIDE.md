# RAG & AI Integration Guide

## Overview

This document explains how the RAG (Retrieval-Augmented Generation) and AI integration works from a student's perspective, admin login details, and how everything syncs together.

---

## 🎓 How RAG Works for Students

### Student Experience Flow

1. **Student Asks a Question**
   - Student navigates to `/ai` page (requires login)
   - Types a question like: "What are the best universities for Computer Science in Lagos?"
   - Clicks send

2. **RAG Pipeline Process**
   ```
   Student Question
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

3. **What Students See**
   - **AI Answer**: Contextual, accurate response based on database
   - **Sources**: Links to relevant institutions/programs
   - **Citations**: [1], [2], etc. referencing the sources
   - **Context Links**: Clickable links to institution/program pages

### Example Student Query

**Question**: "I scored 250 in UTME, what medical programs can I apply to?"

**RAG Process**:
1. Query embedding generated
2. Similar programs found (Medicine, Nursing, etc.)
3. Cutoff scores compared (250 vs program cutoffs)
4. AI generates personalized answer with recommendations
5. Student sees:
   - Answer with specific program recommendations
   - Links to each recommended program
   - Cutoff scores and admission requirements
   - Source citations

---

## 🔧 Technical Implementation

### RAG Pipeline Components

#### 1. **Embedding Generation** (`lib/ai/embeddings.ts`)
- Uses OpenAI `text-embedding-ada-002` (1536 dimensions)
- Falls back to hash-based embedding if API key not set
- Stores embeddings in PostgreSQL with PGVector extension

#### 2. **Context Retrieval** (`lib/ai/rag.ts`)
- Generates query embedding
- Searches using cosine similarity (`<=>` operator)
- Filters by similarity threshold (default: 0.5)
- Returns top-k relevant sources

#### 3. **Answer Generation** (`lib/ai/rag.ts`)
- **Priority 1**: Gemini API (cost-effective, recommended)
- **Priority 2**: OpenAI API (fallback)
- **Priority 3**: Rule-based fallback (if no API keys)

#### 4. **API Endpoint** (`app/api/ai/chat/route.ts`)
- Requires authentication
- Accepts: message, entityType, limit, userContext
- Returns: answer, sources, context

---

## 🔑 Admin Login Details

### Default Admin User

**From Seed File** (`prisma/seed.ts`):
- **Email**: `test@example.com`
- **Password**: `password123`
- **Note**: This user does NOT have admin role by default

### Granting Admin Access

You need to manually grant admin role to a user:

#### Option 1: Using SQL
```sql
UPDATE users 
SET roles = array_append(roles, 'admin') 
WHERE email = 'test@example.com';
```

#### Option 2: Using Prisma Studio
1. Run: `npx prisma studio`
2. Navigate to `User` table
3. Find your user (e.g., `test@example.com`)
4. Edit the `roles` field
5. Add `"admin"` to the array: `["admin"]`
6. Save

#### Option 3: Using Prisma Client (in code)
```typescript
await prisma.user.update({
  where: { email: "test@example.com" },
  data: {
    roles: {
      push: "admin"
    }
  }
})
```

### Admin Access Points

Once you have admin role:
- **Dashboard**: `/admin`
- **Institutions**: `/admin/institutions`
- **Programs**: `/admin/programs`
- **Data Quality**: `/admin/data-quality`
- **Audit Log**: `/admin/audit-log` (if implemented)

---

## 🔄 How Everything Syncs Together

### Data Flow Architecture

```
┌─────────────────┐
│  Admin Updates  │
│  (via Dashboard)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   (Institutions │
│   & Programs)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌─────────────────┐
│  Embeddings     │      │  Student Queries │
│  Generation     │◄─────┤  (RAG Pipeline)  │
│  (Manual/Script)│      └─────────────────┘
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  PGVector Store │
│  (Embeddings)   │
└─────────────────┘
```

### Embedding Sync Process

#### Current Status: **Manual Sync Required**

Embeddings are **NOT automatically synced** when data is updated. You need to manually regenerate embeddings after:
- Adding new institutions/programs
- Updating institution/program details
- Adding cutoff history
- Updating descriptions

#### How to Sync Embeddings

**Option 1: Using Script**
```bash
# Generate embeddings for all institutions and programs
npx tsx scripts/generate-embeddings.ts
```

**Option 2: Programmatically**
```typescript
import { generateAllEmbeddings } from "@/lib/ai/generate-embeddings"

await generateAllEmbeddings()
```

**Option 3: Individual Entity**
```typescript
import { createEmbedding } from "@/lib/ai/embeddings"

await createEmbedding({
  entityType: "institution",
  entityId: institution.id,
  content: "Institution details...",
  metadata: { title: institution.name }
})
```

### What Gets Embedded

**Institutions**:
- Name, type, ownership
- Location (city, state)
- Website, accreditation
- List of programs

**Programs**:
- Name, faculty, department
- Degree type
- Required UTME subjects
- Latest cutoff score
- Historical cutoffs

---

## ⚙️ Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# AI API (at least one required)
GEMINI_API_KEY="your-gemini-api-key"  # Recommended (cost-effective)
GEMINI_MODEL="gemini-1.5-flash"        # Optional, defaults to gemini-1.5-flash

# OR
OPENAI_API_KEY="your-openai-api-key"  # Alternative
OPENAI_MODEL="gpt-3.5-turbo"           # Optional, defaults to gpt-3.5-turbo
```

### Current Configuration

Based on your `.env`:
- ✅ `GEMINI_API_KEY` is set
- ✅ `GEMINI_MODEL` is set to `gemini-2.5-flash`
- ✅ Database connection configured

---

## 🧪 Testing the RAG System

### As a Student

1. **Sign In**
   - Email: `test@example.com`
   - Password: `password123`

2. **Navigate to AI Page**
   - Go to `/ai`
   - Should see chat interface

3. **Test Queries**
   - "What universities offer Medicine in Lagos?"
   - "What's the cutoff for Computer Science at UNILAG?"
   - "Which programs accept 240 UTME score?"

4. **Check Response**
   - Should get AI-generated answer
   - Should see source citations [1], [2], etc.
   - Should see clickable links to institutions/programs

### As an Admin

1. **Grant Admin Access** (see above)
2. **Sign In** with admin user
3. **Navigate to** `/admin`
4. **Update Data** (institutions/programs)
5. **Regenerate Embeddings** (run script)
6. **Test RAG** (ask questions about updated data)

---

## 🐛 Troubleshooting

### Issue: "I couldn't find specific information..."

**Cause**: No embeddings generated or similarity too low

**Solution**:
1. Check if embeddings exist: `SELECT COUNT(*) FROM embeddings;`
2. Generate embeddings: `npx tsx scripts/generate-embeddings.ts`
3. Lower similarity threshold in `lib/ai/rag.ts` (default: 0.5)

### Issue: "GEMINI_API_KEY not set"

**Cause**: API key missing or incorrect

**Solution**:
1. Check `.env` file has `GEMINI_API_KEY`
2. Restart dev server after adding key
3. System will fall back to rule-based answers

### Issue: "Unauthorized" when accessing `/ai`

**Cause**: Not logged in

**Solution**:
1. Sign in at `/auth/signin`
2. Use: `test@example.com` / `password123`

### Issue: Admin panel shows "Access Denied"

**Cause**: User doesn't have admin role

**Solution**:
1. Grant admin role (see "Granting Admin Access" above)
2. Sign out and sign back in

---

## 📊 Data Sync Status

### ✅ What's Synced Automatically

- **Database Updates**: When admin updates institutions/programs, changes are immediately in database
- **API Responses**: Public APIs reflect database changes immediately

### ❌ What Requires Manual Sync

- **Embeddings**: Must regenerate after data updates
- **Vector Search**: Won't find new/updated content until embeddings regenerated

### 🔄 Recommended Sync Workflow

1. Admin updates data via dashboard
2. Admin runs embedding generation script
3. New embeddings stored in database
4. RAG queries now include updated content

---

## 🚀 Future Improvements

### Automatic Embedding Sync

Consider implementing:
- **Webhook/Trigger**: Auto-generate embeddings on data update
- **Background Job**: Queue embedding generation
- **Incremental Updates**: Only regenerate changed entities

### Real-time Sync

- **Event Listeners**: Listen to Prisma updates
- **Database Triggers**: PostgreSQL triggers to queue embedding jobs
- **Cron Jobs**: Periodic full sync

---

## 📝 Summary

### For Students

1. Sign in → Go to `/ai` → Ask questions
2. Get AI-powered answers with source citations
3. Click links to explore institutions/programs

### For Admins

1. Sign in with admin role → Access `/admin`
2. Update institutions/programs data
3. **Important**: Run embedding generation script after updates
4. Students will see updated information in AI responses

### Current Status

- ✅ RAG pipeline implemented
- ✅ Gemini API configured
- ✅ Admin dashboard functional
- ⚠️ Embeddings require manual sync
- ⚠️ Admin role must be granted manually

---

**Last Updated**: 2025-01-XX
**Status**: Functional, requires manual embedding sync

