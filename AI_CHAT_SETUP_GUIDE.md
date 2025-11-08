# AI Chat Setup Guide

## Problem: "I couldn't find information" Error

If the AI chat is saying "I couldn't find information" or "the provided context does not contain information", it means **embeddings haven't been generated yet**.

## Solution: Generate Embeddings

### Step 1: Check if you have data

First, make sure you have institutions and programs in your database:
- Go to `/admin/institutions` - should show institutions
- Go to `/admin/programs` - should show programs

If the database is empty, you need to add data first.

### Step 2: Generate Embeddings

1. **Sign in as admin** (you need admin access)
2. **Go to** `/admin/embeddings`
3. **Click** "Generate All Embeddings"
4. **Wait** for the process to complete (may take several minutes)

### Step 3: Test the AI Chat

1. Go to `/ai`
2. Ask a question like "What universities offer Computer Science?"
3. The AI should now be able to answer based on your data

## What Are Embeddings?

Embeddings are vector representations of your data that allow the AI to:
- Search through institutions and programs
- Understand relationships between data
- Answer questions about your database

## When to Regenerate Embeddings

Regenerate embeddings after:
- Adding new institutions or programs
- Updating institution or program details
- Adding or updating cutoff history
- If AI chat responses are inaccurate

## Troubleshooting

### Still getting "I couldn't find information"?

1. **Check embeddings count**: Go to `/admin/embeddings` and verify embeddings were generated
2. **Check data exists**: Make sure you have institutions/programs in the database
3. **Check API keys**: Make sure `GEMINI_API_KEY` or `OPENAI_API_KEY` is set in `.env`
4. **Regenerate embeddings**: Try generating embeddings again

### AI answers but they're not accurate?

1. **Regenerate embeddings**: The data might have changed
2. **Check data quality**: Make sure your institutions/programs have complete information
3. **Lower similarity threshold**: Already set to 0.3 for better results

## Quick Commands

```bash
# Generate embeddings via script
npx tsx scripts/generate-embeddings.ts

# Or use the admin UI at /admin/embeddings
```

## Next Steps

1. ✅ Add institutions and programs to database
2. ✅ Generate embeddings at `/admin/embeddings`
3. ✅ Test AI chat at `/ai`
4. ✅ If issues persist, check error logs and regenerate embeddings

