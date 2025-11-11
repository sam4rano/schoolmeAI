# Vercel Deployment Guide for edurepoai.xyz

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Domain**: `edurepoai.xyz` should be configured in your domain registrar

## Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration

## Step 2: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Environment Variables

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://edurepoai.xyz
NEXTAUTH_URL=https://edurepoai.xyz
NEXTAUTH_SECRET=<your-strong-secret-key>

# Database (PostgreSQL)
DATABASE_URL=<your-postgresql-connection-string>

# Email Service (SendGrid)
SENDGRID_API_KEY=<your-sendgrid-api-key>
EMAIL_FROM=noreply@edurepoai.xyz

# Redis (for rate limiting - optional, uses in-memory fallback if not set)
KV_URL=<your-vercel-kv-url>
KV_REST_API_URL=<your-vercel-kv-rest-api-url>
KV_REST_API_TOKEN=<your-vercel-kv-rest-api-token>
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Step 3: Configure Domain

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add `edurepoai.xyz` as a custom domain
3. Follow Vercel's DNS configuration instructions:
   - Add A record pointing to Vercel's IP
   - Or add CNAME record pointing to Vercel's domain

### DNS Configuration

Add these records in your domain registrar (e.g., Hostinger):

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Or use Vercel's recommended DNS settings shown in the dashboard.

## Step 4: Database Setup

### Option A: Vercel Postgres (Recommended)

1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the connection string
3. Add to environment variables as `DATABASE_URL`

### Option B: External Database

Use your existing PostgreSQL database (e.g., Supabase, Railway, etc.)

## Step 5: Redis Setup (Optional but Recommended)

For production rate limiting:

1. In Vercel Dashboard → Storage → Create Database → KV
2. Copy the connection details
3. Add to environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

**Note**: If Redis is not configured, the app will use in-memory rate limiting (resets on each deployment).

## Step 6: Build Configuration

Vercel will automatically:
- Detect Next.js framework
- Run `npm install`
- Run `npm run build`
- Deploy to production

### Build Settings

The `vercel.json` file is already configured with:
- Build command: `npm run build`
- Framework: `nextjs`
- Region: `iad1` (US East)

## Step 7: Run Database Migrations

After first deployment:

1. Connect to your database
2. Run Prisma migrations:

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Direct connection
DATABASE_URL="your-connection-string" npx prisma migrate deploy
```

3. Seed the database (optional):

```bash
DATABASE_URL="your-connection-string" npm run db:seed
```

## Step 8: Verify Deployment

1. Visit `https://edurepoai.xyz`
2. Test authentication flow
3. Verify email sending
4. Check admin dashboard access

## Post-Deployment Checklist

- [ ] Domain is properly configured and SSL certificate is active
- [ ] Environment variables are set correctly
- [ ] Database migrations are applied
- [ ] Email service (SendGrid) is working
- [ ] Authentication flow is functional
- [ ] Admin user can sign in
- [ ] Rate limiting is working (if Redis is configured)
- [ ] API routes are accessible

## Environment-Specific Configuration

### Production Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables → Production:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://edurepoai.xyz
NEXTAUTH_URL=https://edurepoai.xyz
```

### Preview Environment Variables

For preview deployments (pull requests), you can use different values or the same production values.

## Monitoring and Logs

- **Logs**: Vercel Dashboard → Your Project → Logs
- **Analytics**: Vercel Dashboard → Your Project → Analytics
- **Real-time**: Monitor deployments in real-time

## Troubleshooting

### Build Failures

1. Check build logs in Vercel Dashboard
2. Verify all dependencies are in `package.json`
3. Ensure environment variables are set

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database firewall settings
3. Ensure database allows connections from Vercel IPs

### Email Not Sending

1. Verify `SENDGRID_API_KEY` is set
2. Check SendGrid dashboard for API key permissions
3. Verify sender email `noreply@edurepoai.xyz` is verified in SendGrid

### Domain Not Working

1. Check DNS records are correct
2. Wait for DNS propagation (can take up to 48 hours)
3. Verify SSL certificate is issued (automatic with Vercel)

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

