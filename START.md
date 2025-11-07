# Quick Start Guide

## Prerequisites

1. **Start Docker Desktop** (if not already running)
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon in menu bar should be steady)

2. **Verify Docker is running**:
   ```bash
   docker ps
   ```

## Step-by-Step Setup

### 1. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (with PGVector) on port 5432
- Redis on port 6379

### 2. Wait for Services to be Ready

```bash
# Check service status
docker-compose ps

# Wait a few seconds for PostgreSQL to initialize
sleep 5
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This creates all database tables.

### 4. Seed the Database (Optional but Recommended)

```bash
npm run db:seed
```

This populates the database with:
- 20 major Nigerian institutions
- Sample programs with cutoff history
- Test user account (test@example.com / password123)

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api

### 6. Access Prisma Studio (Optional)

In a new terminal:
```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

## Troubleshooting

### Docker Not Running

If you see "Cannot connect to Docker daemon":
1. Open Docker Desktop
2. Wait for it to fully start
3. Try again

### Database Connection Error

If migrations fail:
1. Check Docker services are running: `docker-compose ps`
2. Check PostgreSQL is ready: `docker-compose exec postgres pg_isready -U postgres`
3. Verify `.env` file has correct `DATABASE_URL`

### Port Already in Use

If port 3000 is already in use:
1. Kill the process: `lsof -ti:3000 | xargs kill`
2. Or change port in `package.json` dev script

## Quick Commands Reference

```bash
# Start everything
docker-compose up -d && npm run db:migrate && npm run db:seed && npm run dev

# Stop Docker services
docker-compose down

# View logs
docker-compose logs -f

# Reset database (WARNING: deletes all data)
docker-compose down -v && docker-compose up -d && npm run db:migrate && npm run db:seed
```


