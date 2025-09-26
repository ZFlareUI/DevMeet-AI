# Development Setup Guide

## Database Setup (PostgreSQL)

The project now uses PostgreSQL for both development and production to ensure consistency.

### Option 1: Docker (Recommended)

1. **Start Development Database:**
   ```bash
   npm run dev:db:up
   ```

2. **Setup Database Schema:**
   ```bash
   npm run dev:db:setup
   ```

3. **Stop Development Database:**
   ```bash
   npm run dev:db:down
   ```

### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL:**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Databases:**
   ```sql
   createdb devmeet_dev
   createdb devmeet_test
   ```

3. **Update Environment Variables:**
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/devmeet_dev"
   ```

## Environment Configuration

### Development Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required variables for development:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devmeet_dev"
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Available Commands

- `npm run dev` - Start development server
- `npm run dev:db:up` - Start PostgreSQL and Redis in Docker
- `npm run dev:db:down` - Stop development databases
- `npm run dev:db:setup` - Initialize database with schema and seed data
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and reseed

## Troubleshooting

### Database Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   docker ps  # If using Docker
   # or
   pg_isready  # If using local installation
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l
   ```

3. **Check environment variables:**
   ```bash
   echo $DATABASE_URL
   ```

### Migration Issues

1. **Reset migrations:**
   ```bash
   npm run db:reset
   ```

2. **Generate new migration:**
   ```bash
   npx prisma migrate dev --name your-migration-name
   ```

## CI/CD Environment

The GitHub Actions workflow uses:
- PostgreSQL 15
- Redis 7
- Node.js 20

Environment variables are automatically configured for testing.

## Production Deployment

See `VERCEL_DEPLOYMENT.md` for production deployment instructions.