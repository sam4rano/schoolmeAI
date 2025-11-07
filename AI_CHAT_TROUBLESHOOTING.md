# AI Chat Troubleshooting Guide

## Issue: 401 Unauthorized / JWEDecryptionFailed Error

### Symptoms
- Error message: "Sorry, I encountered an error. Please try again later."
- Terminal shows: `JWEDecryptionFailed` or `POST /api/ai/chat 401`
- Chat messages fail to send

### Root Cause
The `NEXTAUTH_SECRET` environment variable is either:
1. Missing from your `.env` file
2. Changed/regenerated (invalidating existing session cookies)
3. Not matching between server restarts

### Solution

#### Step 1: Check Your `.env` File

Make sure you have a `.env` or `.env.local` file in the root directory with:

```env
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

#### Step 2: Generate a New Secret (if needed)

If you don't have a secret or need a new one, generate it:

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Online Generator**
Visit: https://generate-secret.vercel.app/32

#### Step 3: Update Your `.env` File

```env
NEXTAUTH_SECRET="<paste-your-generated-secret-here>"
NEXTAUTH_URL="http://localhost:3000"
```

#### Step 4: Clear Browser Cookies

Since the secret changed, existing session cookies are invalid:

1. **Chrome/Edge**: 
   - Press `F12` → Application tab → Cookies → Delete all cookies for `localhost:3000`
   - Or use Incognito mode

2. **Firefox**:
   - Press `F12` → Storage tab → Cookies → Delete all cookies for `localhost:3000`

3. **Safari**:
   - Safari → Preferences → Privacy → Manage Website Data → Remove `localhost`

#### Step 5: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

#### Step 6: Sign In Again

1. Go to `/auth/signin`
2. Sign in with your credentials
3. Try the AI chat again

---

## Alternative: Quick Fix (Development Only)

If you just need to test quickly, you can temporarily disable authentication check:

**⚠️ WARNING: Only for local development! Never do this in production!**

1. Comment out the session check in `app/api/ai/chat/route.ts`:
```typescript
// Temporarily disable auth for testing
// const session = await getServerSession(authOptions)
// if (!session?.user?.id) {
//   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
// }
```

2. Restart the server
3. **Remember to uncomment this before deploying!**

---

## UI Improvements Made

The chat interface has been improved with:

1. **Better Visual Design**:
   - Rounded chat bubbles with shadows
   - Better spacing and padding
   - Improved color contrast
   - Gradient backgrounds

2. **Better Error Handling**:
   - Clear error messages
   - Automatic redirect to sign-in when unauthorized
   - Session status display

3. **Better UX**:
   - Loading states with spinner
   - Enter key to send messages
   - User email displayed when authenticated
   - Better message timestamps

4. **Better Authentication**:
   - Pre-check authentication before sending
   - Better error messages
   - Automatic session refresh

---

## Still Having Issues?

### Check These:

1. **Database Connection**:
   ```bash
   npx prisma studio
   ```
   Verify users exist in the database

2. **Session Provider**:
   Make sure `SessionProvider` wraps your app (check `app/layout.tsx`)

3. **Environment Variables**:
   ```bash
   # Check if variables are loaded
   node -e "console.log(process.env.NEXTAUTH_SECRET)"
   ```

4. **Browser Console**:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

5. **Server Logs**:
   - Check terminal for detailed error messages
   - Look for `Session error:` logs

---

## Quick Test

After fixing the secret:

1. **Clear cookies** (or use Incognito)
2. **Sign in** at `/auth/signin`
3. **Go to** `/ai`
4. **Send a message**: "What are the best universities in Lagos?"
5. **Should work** without errors

---

## Production Checklist

Before deploying to production:

- [ ] Set `NEXTAUTH_SECRET` in production environment
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Use a strong, randomly generated secret (32+ characters)
- [ ] Never commit `.env` file to git
- [ ] Enable HTTPS in production
- [ ] Test authentication flow end-to-end

