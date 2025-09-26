# Vercel Deployment Guide for DevMeet AI

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommend PlanetScale, Supabase, or Neon)
3. **Environment Variables**: Configure all required environment variables

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pratikacharya1234/DevMeet-AI)

## Step-by-Step Deployment

### 1. Database Setup

Choose one of these PostgreSQL providers:

#### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the database URL from Settings > Database

#### Option C: PlanetScale
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Copy the connection string

### 2. Vercel Project Setup

1. **Import Project**:
   ```bash
   # Clone the repository
   git clone https://github.com/pratikacharya1234/DevMeet-AI.git
   cd DevMeet-AI
   
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy to Vercel
   vercel
   ```

2. **Or use Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub repository
   - Select `DevMeet-AI` repository

### 3. Environment Variables Configuration

In Vercel Dashboard > Settings > Environment Variables, add:

#### Required Variables
```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="generate-a-32-character-secret"
NEXTAUTH_URL="https://your-app.vercel.app"

# Stripe (for billing)
STRIPE_SECRET_KEY="sk_live_or_test_key"
STRIPE_PUBLISHABLE_KEY="pk_live_or_test_key"
STRIPE_WEBHOOK_SECRET="whsec_webhook_secret"

# OpenAI (for AI interviews)
OPENAI_API_KEY="sk-your-openai-key"

# GitHub (for candidate analysis)
GITHUB_TOKEN="ghp_your_github_token"
```

#### Optional Variables
```env
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### 4. Database Initialization

After deployment, initialize your database:

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Database** (optional):
   ```bash
   npm run db:seed
   ```

### 5. Domain Configuration

1. **Custom Domain** (optional):
   - Go to Vercel Dashboard > Domains
   - Add your custom domain
   - Update `NEXTAUTH_URL` environment variable

2. **Update OAuth Callbacks**:
   - Google: Add `https://your-domain.com/api/auth/callback/google`
   - GitHub: Add `https://your-domain.com/api/auth/callback/github`

### 6. Webhook Configuration

1. **Stripe Webhooks**:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/billing/webhook`
   - Select events: `customer.subscription.*`, `invoice.*`

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Remove turbopack for Vercel compatibility
   "build": "next build"  # instead of "next build --turbopack"
   ```

2. **Database Connection**:
   - Ensure DATABASE_URL is correct
   - Check database is accessible from Vercel's regions

3. **Environment Variables**:
   - Verify all required variables are set
   - Check variable names match exactly

4. **Function Timeouts**:
   - Vercel free tier has 10s timeout
   - Upgrade to Pro for 60s timeout for complex operations

### Deployment Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs your-deployment-url
```

### Performance Optimization

1. **Enable Edge Runtime** for API routes:
   ```typescript
   export const runtime = 'edge';
   ```

2. **Database Connection Pooling**:
   - Use connection pooling for PostgreSQL
   - Consider Prisma Data Proxy for serverless

3. **Image Optimization**:
   - Images are automatically optimized by Vercel
   - No additional configuration needed

## Security Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use production Stripe keys
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set secure headers in Next.js config
- [ ] Validate environment variables on startup

## Monitoring

1. **Vercel Analytics**: Enable in dashboard
2. **Error Monitoring**: Consider Sentry integration
3. **Performance**: Use Vercel Speed Insights

## Support

For deployment issues:
1. Check Vercel build logs
2. Review function logs
3. Contact support through GitHub issues