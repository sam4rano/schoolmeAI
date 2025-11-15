# URL Configuration Guide

**Domain:** `edurepoai.xyz`  
**Last Updated:** November 13, 2025

---

## ✅ Configuration Status

### Environment Variables

**Production:**
- `NEXTAUTH_URL=https://edurepoai.xyz`
- `NEXT_PUBLIC_APP_URL=https://edurepoai.xyz`

**Local Development:**
- `NEXTAUTH_URL=http://localhost:3000` (fallback)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` (fallback)

---

## 📋 Files Updated

### Configuration Files
- ✅ `docker-compose.yml` - Uses environment variables with `https://edurepoai.xyz` as default
- ✅ `vercel.json` - Sets `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` for build
- ✅ `lib/api-docs.ts` - Updated production server URL to `https://edurepoai.xyz`
- ✅ `README.md` - Updated API docs URL

### Code Files
- ✅ `lib/email/service.ts` - Uses `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` with localhost fallback
- ✅ `lib/email/notifications.ts` - Uses `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` with localhost fallback
- ✅ `lib/email/templates.ts` - Uses `NEXT_PUBLIC_APP_URL` with localhost fallback

---

## 🔧 Setup Instructions

### For Production (Docker)

Set in `.env` file or environment:
```bash
NEXTAUTH_URL=https://edurepoai.xyz
NEXT_PUBLIC_APP_URL=https://edurepoai.xyz
```

### For Production (Vercel)

Set in Vercel Dashboard → Settings → Environment Variables:
```bash
NEXTAUTH_URL=https://edurepoai.xyz
NEXT_PUBLIC_APP_URL=https://edurepoai.xyz
```

### For Local Development

No configuration needed - defaults to `http://localhost:3000` automatically.

---

## ✅ Verification Checklist

- [x] `docker-compose.yml` uses environment variables with production default
- [x] `vercel.json` includes both URL variables
- [x] API documentation shows correct production URL
- [x] Email templates use correct URLs
- [x] All fallbacks point to localhost for development
- [x] No hardcoded production URLs in code (uses env vars)

---

## 🎯 Current Configuration

**Production Default:** `https://edurepoai.xyz`  
**Development Fallback:** `http://localhost:3000`  
**Status:** ✅ **CONFIGURED**

All URLs are properly configured and will use `edurepoai.xyz` in production!

