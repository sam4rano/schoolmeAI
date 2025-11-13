# Multi-stage build for Next.js 14 with Prisma
FROM node:18-alpine AS base

# Install OpenSSL and other dependencies required by Prisma
RUN apk add --no-cache libc6-compat openssl

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files AND prisma schema (needed for postinstall)
COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (Prisma Client already generated during npm ci via postinstall)
# Accept DATABASE_URL as build arg, or use dummy for build-time only
# Prisma Client needs DATABASE_URL to initialize, but won't connect until queries are made
ARG DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=${DATABASE_URL:-"postgresql://dummy:dummy@localhost:5432/dummy?schema=public"}
# Ensure public directory exists (Next.js may create it during build)
# Create public with a placeholder if it doesn't exist, so COPY won't fail
RUN mkdir -p public && touch public/.gitkeep || true
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs --disabled-password --no-create-home nextjs
RUN mkdir -p /home/nextjs && chown -R nextjs:nodejs /home/nextjs
RUN mkdir -p /home/nextjs/.npm && chown -R nextjs:nodejs /home/nextjs

# Copy built application
# Copy public directory (now guaranteed to exist from builder stage)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Copy Prisma CLI package with all engines and WASM files (needed for npx to work)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Set npm cache to writable location
ENV NPM_CONFIG_CACHE=/home/nextjs/.npm

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]