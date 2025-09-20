# DevMeet AI - Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying DevMeet AI to production environments with enterprise-grade configurations, security, monitoring, and scalability.

## Quick Production Deployment

### Prerequisites
- Node.js 20+ 
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+ (optional but recommended)
- Git

### 1. Environment Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd devmeet-ai

# Copy and configure environment variables
cp .env.example .env.production

# Edit .env.production with your production values
# IMPORTANT: Update all secret keys, database URLs, and API keys
```

### 2. Quick Deploy with Docker
```bash
# Make deployment script executable (Linux/Mac)
chmod +x deploy.sh

# Run full deployment
./deploy.sh deploy

# For Windows, use PowerShell script
.\deploy.ps1 deploy
```

### 3. Manual Deployment Steps
```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Build application
npm run build:prod

# Run database migrations
npm run db:migrate:prod

# Start production server
npm run start:prod
```

## 🏗️ Production Architecture

### System Components
- **Next.js Application**: Main web application with SSR/SSG
- **PostgreSQL**: Primary database for persistent data
- **Redis**: Caching layer and session storage
- **Docker**: Containerization for consistent deployments
- **Nginx**: Reverse proxy and load balancer (optional)

### Security Features
- ✅ Rate limiting with Redis
- ✅ CORS protection
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Input validation with Zod
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection via NextAuth

## Configuration Files

### Environment Variables (.env.production)
```bash
# Core Application
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com

# Database (PostgreSQL for production)
DATABASE_URL="postgresql://username:password@localhost:5432/devmeet_production"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-secret-32-chars-min"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Services
GEMINI_API_KEY="your-google-gemini-api-key"

# Security & Performance
REDIS_URL="redis://localhost:6379"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

### Docker Configuration
The application includes production-ready Docker configuration:
- Multi-stage builds for optimized images
- Non-root user for security
- Health checks for monitoring
- Volume mounts for persistent data

### Database Setup
```sql
-- Create production database
CREATE DATABASE devmeet_production;
CREATE USER devmeet WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE devmeet_production TO devmeet;
```

## Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose --env-file .env.production up -d

# Monitor logs
docker-compose logs -f app

# Health check
curl http://localhost:3000/api/health
```

### Option 2: Kubernetes
```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devmeet-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devmeet-ai
  template:
    metadata:
      labels:
        app: devmeet-ai
    spec:
      containers:
      - name: devmeet-ai
        image: devmeet-ai:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: devmeet-secrets
              key: database-url
```

### Option 3: Cloud Platforms

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
```

#### AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t devmeet-ai .
docker tag devmeet-ai:latest <account>.dkr.ecr.us-east-1.amazonaws.com/devmeet-ai:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/devmeet-ai:latest
```

## Monitoring & Health Checks

### Health Check Endpoint
```bash
# Application health
curl http://localhost:3000/api/health

# Simple health check (for load balancers)
curl -I http://localhost:3000/api/health
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 5
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2
    },
    "ai": {
      "status": "healthy",
      "responseTime": 10
    },
    "storage": {
      "status": "healthy",
      "responseTime": 1
    }
  },
  "metrics": {
    "memoryUsage": {
      "rss": 123456789,
      "heapTotal": 87654321,
      "heapUsed": 65432109
    }
  }
}
```

### Monitoring Integration
- **Uptime Monitoring**: Use health check endpoint
- **Error Tracking**: Sentry integration ready
- **Performance**: New Relic or DataDog compatible
- **Logs**: Structured JSON logging with Winston

## Security Checklist

### Pre-deployment Security
- [ ] Update all default passwords and secrets
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates (Let's Encrypt recommended)
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy

### Production Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🔄 CI/CD Pipeline

### GitHub Actions
The repository includes a complete CI/CD pipeline:
- Automated testing on PR/push
- Security scanning with Trivy
- Docker image building and publishing
- Automated deployment to staging/production
- Performance testing with Lighthouse

### Manual Deployment Commands
```bash
# Build and test
npm run build:prod
npm run test

# Deploy with Docker
npm run docker:build
npm run docker:compose

# Database migrations
npm run db:migrate:prod

# Health check
curl -f http://localhost:3000/api/health
```

## Performance Optimization

### Production Optimizations
- ✅ Next.js standalone output for smaller images
- ✅ Turbopack for faster builds
- ✅ Image optimization with WebP/AVIF
- ✅ Code splitting and chunk optimization
- ✅ Redis caching for sessions and data
- ✅ Database connection pooling
- ✅ Gzip compression enabled

### Performance Monitoring
```bash
# Monitor application performance
docker-compose exec app npm run monitor

# Database performance
docker-compose exec postgres pg_stat_activity

# Redis monitoring
docker-compose exec redis redis-cli monitor
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database status
docker-compose exec postgres pg_isready -U devmeet

# View database logs
docker-compose logs postgres

# Test connection
docker-compose exec app npx prisma db push --preview-feature
```

#### Application Not Starting
```bash
# Check application logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep -E "(DATABASE_URL|NEXTAUTH_SECRET)"

# Manual health check
docker-compose exec app curl http://localhost:3000/api/health
```

#### Memory Issues
```bash
# Monitor memory usage
docker stats

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Log Locations
- Application logs: `./logs/app.log`
- Database logs: Docker container logs
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## Maintenance

### Regular Maintenance Tasks
```bash
# Update dependencies
npm audit fix
npm update

# Database maintenance
npm run db:migrate:prod
npx prisma db push

# Docker cleanup
docker system prune -f
docker volume prune -f

# Backup database
./deploy.sh backup
```

### Backup Strategy
```bash
# Automated daily backups
0 2 * * * /path/to/deploy.sh backup

# Manual backup
pg_dump -U devmeet devmeet_production > backup_$(date +%Y%m%d).sql
```

## Emergency Procedures

### Rollback Deployment
```bash
# Stop current deployment
docker-compose down

# Restore from backup
psql -U devmeet devmeet_production < backup_latest.sql

# Deploy previous version
docker-compose up -d
```

### Scale Application
```bash
# Scale horizontally (Docker Swarm)
docker service scale devmeet-ai_app=3

# Scale vertically (increase resources)
docker-compose down
# Edit docker-compose.yml resource limits
docker-compose up -d
```

## 📞 Support

### Getting Help
- Check logs: `docker-compose logs app`
- Health check: `curl http://localhost:3000/api/health`
- GitHub Issues: Create detailed bug reports
- Documentation: Review this guide and code comments

### Performance Tuning
- Database indexing and query optimization
- Redis cache configuration
- Node.js memory tuning
- Load balancer configuration
- CDN setup for static assets

---

## Production Readiness Checklist

- [x] **Security**: Rate limiting, CORS, security headers, input validation
- [x] **Database**: PostgreSQL with connection pooling and health checks
- [x] **Caching**: Redis integration for sessions and performance
- [x] **Monitoring**: Health checks, error tracking, performance metrics
- [x] **Deployment**: Docker containerization with CI/CD pipeline
- [x] **Backup**: Automated database backups and disaster recovery
- [x] **Documentation**: Comprehensive deployment and maintenance guides
- [x] **Testing**: Unit tests, integration tests, and security scans

Your DevMeet AI application is now production-ready with enterprise-grade features!