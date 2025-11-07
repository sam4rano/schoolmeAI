# Program ID (UUID) - Explanation

## What is a Program ID?

A **Program ID** is a **UUID (Universally Unique Identifier)** that uniquely identifies each program in the database.

### UUID Format
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Example: `ef99eb1e-5cab-4f6f-90b0-d4f723105cda`
- Length: 36 characters (32 hex digits + 4 hyphens)

### Why UUID?
- **Unique**: Guaranteed to be unique across all programs
- **Secure**: Hard to guess (unlike sequential IDs like 1, 2, 3)
- **Database-friendly**: Works well with distributed systems

## Where is it Used?

### 1. **Eligibility Calculator**
When calculating admission probability, you need to specify which program:
```json
{
  "utme": 240,
  "olevels": {
    "maths": "A1",
    "english": "B2",
    "biology": "B2"
  },
  "programId": "ef99eb1e-5cab-4f6f-90b0-d4f723105cda"
}
```

### 2. **API Endpoints**
- `GET /api/programs/[id]` - Get program details
- `POST /api/calculate/eligibility` - Calculate eligibility for a program
- `POST /api/watchlist` - Add program to watchlist

### 3. **URLs**
- `/programs/[id]` - View program details page
- `/calculator?programId=[id]` - Pre-fill calculator with program

## How to Get a Program ID?

### Method 1: From Programs Page
1. Visit http://localhost:3000/programs
2. Click "View Details" on any program
3. The URL will show: `/programs/[program-id]`
4. Copy the ID from the URL

### Method 2: From API
```bash
# Get all programs
curl http://localhost:3000/api/programs

# Response includes IDs:
{
  "data": [
    {
      "id": "ef99eb1e-5cab-4f6f-90b0-d4f723105cda",
      "name": "Computer Science",
      "institution": { ... }
    }
  ]
}
```

### Method 3: From Database
```sql
SELECT id, name FROM programs LIMIT 5;
```

## Example Usage

### In Calculator Form
```typescript
// User enters program ID manually or selects from dropdown
const programId = "ef99eb1e-5cab-4f6f-90b0-d4f723105cda"

// Calculate eligibility
fetch("/api/calculate/eligibility", {
  method: "POST",
  body: JSON.stringify({
    utme: 240,
    olevels: { maths: "A1", english: "B2" },
    programId: programId
  })
})
```

### In URL
```
http://localhost:3000/calculator?programId=ef99eb1e-5cab-4f6f-90b0-d4f723105cda
```

## Current Implementation

### Database Schema
```prisma
model Program {
  id                 String   @id @default(uuid())  // ← UUID generated automatically
  institutionId      String
  name               String
  // ... other fields
}
```

### API Validation
```typescript
// API validates it's a proper UUID
programId: z.string().uuid()
```

## Tips

1. **Copy from URL**: When viewing a program, copy the ID from the browser URL
2. **Use API**: Query `/api/programs` to get a list with IDs
3. **Database**: Check Prisma Studio: `npm run db:studio`
4. **Test**: Use the test script: `scripts/test-api.js` shows how to get program IDs

## Related Files

- `prisma/schema.prisma` - Database schema definition
- `app/api/programs/route.ts` - API endpoint to get programs
- `app/calculator/page.tsx` - Calculator form that uses programId
- `app/programs/[id]/page.tsx` - Program detail page


