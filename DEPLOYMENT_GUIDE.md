# Production Deployment Guide

This guide provides comprehensive instructions for deploying DevMeet-AI SaaS platform to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Stripe Configuration](#stripe-configuration)
- [Email Service Setup](#email-service-setup)
- [Deployment Options](#deployment-options)
- [Post-Deployment Setup](#post-deployment-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (or yarn equivalent)
- **Database**: PostgreSQL 14+ or MySQL 8+ (SQLite for development only)
- **Memory**: Minimum 2GB RAM, 4GB+ recommended
- **Storage**: Minimum 20GB, 100GB+ recommended for production
- **SSL Certificate**: Required for HTTPS (provided by most platforms)

### Required Accounts

- **Hosting Platform**: Vercel, Netlify, AWS, Google Cloud, or Digital Ocean
- **Database Provider**: Vercel Postgres, PlanetScale, Supabase, or AWS RDS
- **Stripe Account**: For payment processing
- **Email Service**: SendGrid, AWS SES, or similar
- **Domain Name**: For custom domain (optional)

## Environment Setup

### Environment Variables

Create a production `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-min-32-characters"
NEXTAUTH_URL="https://your-domain.com"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_live_your_live_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_live_your_live_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_BASIC_PRICE_ID="price_1234567890"
STRIPE_PRO_PRICE_ID="price_0987654321"
STRIPE_ENTERPRISE_PRICE_ID="price_1122334455"

# Email Configuration
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
FROM_EMAIL="noreply@your-domain.com"

# Optional: Custom Email Configuration
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="your_email@domain.com"
SMTP_PASS="your_app_password"

# File Upload Configuration
UPLOAD_MAX_SIZE="10485760" # 10MB in bytes
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.jpg,.png"

# Security Configuration
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW="900000" # 15 minutes in milliseconds

# Analytics (Optional)
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
POSTHOG_API_KEY="phc_your_posthog_key"

# Monitoring (Optional)
SENTRY_DSN="https://your_sentry_dsn"
```

### Security Considerations

1. **Generate Strong Secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

2. **Environment Variable Security**
   - Never commit `.env` files to version control
   - Use your platform's secure environment variable storage
   - Rotate secrets regularly
   - Use different keys for staging and production

## Database Configuration

### PostgreSQL Setup (Recommended)

#### Option 1: Vercel Postgres
```bash
# Install Vercel CLI
npm install -g vercel

# Create Vercel Postgres database
vercel postgres create devmeet-production

# Get connection string
vercel env pull .env.local
```

#### Option 2: PlanetScale
```bash
# Create database
pscale database create devmeet-production

# Create production branch
pscale branch create devmeet-production main

# Get connection string
pscale connect devmeet-production main --port 3309
```

#### Option 3: AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Create database user
4. Get connection string

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

## Stripe Configuration

### 1. Create Stripe Products and Prices

Log into Stripe Dashboard and create:

#### Products
- **Basic Plan**: $29/month
- **Pro Plan**: $99/month  
- **Enterprise Plan**: $299/month

#### Webhooks
1. Go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`

### 2. Test Stripe Integration

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Test webhook locally
stripe listen --forward-to localhost:3000/api/billing/webhook

# Test payment flows
stripe trigger payment_intent.succeeded
```

## Email Service Setup

### Option 1: SendGrid

1. **Create SendGrid Account**
2. **Generate API Key**
3. **Verify Domain** (recommended for production)
4. **Create Email Templates**

```javascript
// Example email template setup
const templates = {
  invitation: "d-1234567890abcdef",
  welcome: "d-fedcba0987654321",
  passwordReset: "d-1122334455667788"
};
```

### Option 2: AWS SES

1. **Setup AWS Account**
2. **Verify Email Domain**
3. **Move out of Sandbox**
4. **Create IAM User with SES permissions**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Automatic Deployment

1. **Connect Repository**
   - Link GitHub repository to Vercel
   - Configure auto-deployments

2. **Configure Environment Variables**
   ```bash
   # Using Vercel CLI
   vercel env add NEXTAUTH_SECRET production
   vercel env add DATABASE_URL production
   ```

3. **Deploy**
   ```bash
   # Manual deployment
   vercel --prod
   
   # Or push to main branch for auto-deployment
   git push origin main
   ```

#### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Vercel
vercel deploy --prod
```

### Option 2: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: devmeet
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Option 3: AWS Deployment

#### Using AWS Amplify
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

#### Using AWS ECS
1. Create ECS cluster
2. Build and push Docker image to ECR
3. Create task definition
4. Deploy service

### Option 4: Google Cloud Platform

#### Using Cloud Run
```bash
# Build and deploy
gcloud run deploy devmeet-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Post-Deployment Setup

### 1. Domain Configuration

#### Custom Domain Setup
1. **Add Domain to Platform**
2. **Configure DNS Records**
   ```
   Type: CNAME
   Name: www
   Value: your-app.vercel.app
   
   Type: A
   Name: @
   Value: 76.76.19.61 (Vercel IP)
   ```

#### SSL Certificate
- Most platforms provide automatic SSL
- Verify HTTPS is working
- Configure HTTPS redirects

### 2. Database Initialization

```bash
# Run final migrations
npx prisma migrate deploy

# Create initial admin user (if needed)
npx prisma db seed

# Verify database connection
npx prisma db pull
```

### 3. Stripe Live Mode

1. **Switch to Live Mode** in Stripe Dashboard
2. **Update Environment Variables** with live keys
3. **Test Payment Flow** with real card
4. **Verify Webhooks** are receiving events

### 4. Email Service Verification

```bash
# Test email sending
curl -X POST https://your-domain.com/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test"}'
```

## Monitoring and Maintenance

### Application Monitoring

#### Health Checks
Create a health check endpoint:

```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check external services
    const stripeCheck = await stripe.accounts.retrieve();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        stripe: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

#### Error Tracking
Configure Sentry for error monitoring:

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

#### Metrics to Track
- Response time
- Database query performance
- Memory usage
- CPU utilization
- Error rates
- User activity

#### Tools
- **Vercel Analytics**: Built-in performance monitoring
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring

### Database Maintenance

#### Backup Strategy
```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

#### Performance Optimization
```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Create necessary indexes
CREATE INDEX idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
```

## Security Hardening

### Application Security

1. **Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

2. **Input Validation**
   ```typescript
   import { z } from 'zod';
   
   const userSchema = z.object({
     email: z.string().email(),
     name: z.string().min(2).max(50)
   });
   ```

3. **Security Headers**
   ```javascript
   // next.config.js
   const securityHeaders = [
     {
       key: 'X-DNS-Prefetch-Control',
       value: 'on'
     },
     {
       key: 'Strict-Transport-Security',
       value: 'max-age=63072000; includeSubDomains; preload'
     },
     {
       key: 'X-Frame-Options',
       value: 'DENY'
     }
   ];
   ```

### Infrastructure Security

1. **Environment Variables**
   - Use secure storage (not plain text)
   - Rotate secrets regularly
   - Audit access logs

2. **Database Security**
   - Use SSL connections
   - Implement connection pooling
   - Regular security updates

3. **Network Security**
   - Configure firewall rules
   - Use VPC when possible
   - Monitor network traffic

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Check connection string format
echo $DATABASE_URL

# Verify SSL requirements
psql "$DATABASE_URL" -c "SELECT version();"
```

#### Stripe Webhook Issues
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type":"test"}'

# Check webhook logs in Stripe Dashboard
```

#### Email Delivery Issues
```bash
# Test SMTP connection
telnet smtp.sendgrid.net 587

# Check email service logs
# Verify SPF/DKIM records
```

### Performance Issues

#### Database Performance
```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Monitor connection pool
SELECT count(*), state 
FROM pg_stat_activity 
GROUP BY state;
```

#### Application Performance
```bash
# Monitor memory usage
node --max-old-space-size=4096 server.js

# Profile application
npm run build:analyze
```

### Deployment Issues

#### Build Failures
```bash
# Check Node.js version
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

#### Runtime Errors
```bash
# Check application logs
vercel logs your-deployment-url

# Monitor error rates
# Check Sentry dashboard
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**
   - Multiple application instances
   - Database read replicas
   - CDN for static assets

2. **Caching**
   - Redis for session storage
   - Application-level caching
   - Database query caching

### Vertical Scaling

1. **Resource Optimization**
   - Increase server resources
   - Optimize database queries
   - Enable compression

### Database Scaling

1. **Read Replicas**
   ```typescript
   // Configure read/write splitting
   const readDB = new PrismaClient({
     datasources: { db: { url: READ_DATABASE_URL } }
   });
   
   const writeDB = new PrismaClient({
     datasources: { db: { url: WRITE_DATABASE_URL } }
   });
   ```

2. **Connection Pooling**
   ```typescript
   // Configure connection pool
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: `${DATABASE_URL}?connection_limit=20&pool_timeout=20`
       }
     }
   });
   ```

## Maintenance Schedule

### Daily Tasks
- Monitor application health
- Check error rates
- Review performance metrics

### Weekly Tasks
- Update dependencies
- Review security alerts
- Backup verification
- Performance analysis

### Monthly Tasks
- Security audit
- Capacity planning
- User feedback review
- Cost optimization

### Quarterly Tasks
- Disaster recovery testing
- Security penetration testing
- Architecture review
- Compliance audit

## Support and Resources

### Documentation Links
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)
- [Stripe Production Checklist](https://stripe.com/docs/development/checklist)

### Community Resources
- GitHub Issues
- Discord/Slack community
- Stack Overflow

### Professional Support
- Priority support plans
- Consulting services
- Training and workshops

---

This deployment guide should be regularly updated to reflect changes in the platform, infrastructure, and best practices.