# Gemini API Setup Guide

## Quick Setup

Your RAG implementation now supports Gemini API! Here's how to configure it:

### 1. Add to your `.env` file:

```bash
# Gemini API (recommended - most cost-effective)
GEMINI_API_KEY="AIzaSyCL3nkb0BeTwabP9R2FDAInaspCbIhMvTk"
GEMINI_MODEL="gemini-1.5-flash"  # or "gemini-1.5-pro" for better quality
```

**Note**: Make sure there's no `?` at the end of your API key. The key should be: `AIzaSyCL3nkb0BeTwabP9R2FDAInaspCbIhMvTk`

### 2. How It Works

The system now uses a **smart fallback mechanism**:

1. **First**: Tries Gemini API (if `GEMINI_API_KEY` is set)
2. **Second**: Falls back to OpenAI API (if `OPENAI_API_KEY` is set)
3. **Third**: Uses rule-based fallback (if no API keys are set)

### 3. Available Models

#### Gemini Models:
- **`gemini-1.5-flash`** (default) - Fast and cost-effective ($0.075/$0.30 per 1M tokens)
- **`gemini-1.5-pro`** - Better quality ($1.25/$5.00 per 1M tokens)

#### OpenAI Models (fallback):
- **`gpt-3.5-turbo`** - Budget option
- **`gpt-4o-mini`** - Recommended OpenAI option
- **`gpt-4o`** - Best quality

### 4. Cost Comparison

For typical RAG queries (~1,050 tokens per query):

| API | Model | Cost per 1M queries |
|-----|-------|---------------------|
| **Gemini** | 1.5 Flash | **$75** |
| **Gemini** | 1.5 Pro | **$1,250** |
| OpenAI | GPT-4o-mini | **$150** |
| OpenAI | GPT-3.5-turbo | **$500** |

**Gemini 1.5 Flash is 2x cheaper than GPT-4o-mini!**

### 5. Testing

After setting up your API key, test the AI chat feature:

1. Navigate to `/ai` page
2. Ask a question about Nigerian universities
3. The system will use Gemini API automatically

### 6. Troubleshooting

**Issue**: "GEMINI_API_KEY not set"
- **Solution**: Make sure your `.env` file has `GEMINI_API_KEY` set and restart your dev server

**Issue**: "Gemini API error"
- **Solution**: Check that your API key is valid and doesn't have extra characters (like `?` at the end)

**Issue**: Still using OpenAI
- **Solution**: The system falls back to OpenAI if Gemini fails. Check your server logs for errors.

### 7. Environment Variables

```bash
# Primary (recommended)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-flash"

# Fallback (optional)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"
```

### 8. Benefits of Gemini

✅ **Cost-effective**: 2x cheaper than OpenAI  
✅ **Fast**: Optimized for speed  
✅ **Large context**: 1M+ token context window  
✅ **Good quality**: Excellent for RAG use cases  
✅ **Automatic fallback**: Seamlessly falls back to OpenAI if needed

---

**Your API key**: `AIzaSyCL3nkb0BeTwabP9R2FDAInaspCbIhMvTk`

Make sure to add it to your `.env` file without the `?` at the end!

