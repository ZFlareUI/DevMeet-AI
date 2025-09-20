# DevMeet-AI Production Deployment Guide

## Overview

DevMeet-AI is a comprehensive AI-powered interview platform built with Next.js 15, TypeScript, and modern web technologies. This guide covers production deployment, security configurations, and maintenance procedures.

## Prerequisites

- Node.js 18+ 
- PostgreSQL or SQLite database
- SSL certificate for HTTPS
- Domain name
- Email service (for notifications)
- Cloud storage (optional, for file uploads)

## Environment Setup

### 1. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/devmeet_ai"

# NextAuth.js
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-key-32-chars-min

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# GitHub Personal Access Token for API access
GITHUB_TOKEN=your-github-personal-access-token

# Analytics & Monitoring
ANALYTICS_ENABLED=true
ERROR_REPORTING_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads

# Security
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_ENABLED=true

# Email Service (Optional)
SMTP_HOST=smtp.youremailservice.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password

# Environment
NODE_ENV=production
```

### 2. Security Configuration

#### SSL/TLS Setup
- Obtain SSL certificate from Let's Encrypt or your certificate authority
- Configure your reverse proxy (Nginx/Apache) or cloud provider for HTTPS
- Ensure all HTTP traffic redirects to HTTPS

#### Database Security
- Use strong database passwords
- Enable SSL connections to database
- Restrict database access to application servers only
- Regular database backups

#### Application Security
- Set strong NEXTAUTH_SECRET (minimum 32 characters)
- Configure CORS properly
- Enable rate limiting
- Regular security updates

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project directory
   vercel --prod
   ```

2. **Environment Variables**
   - Set all environment variables in Vercel dashboard
   - Use Vercel PostgreSQL addon or external database

3. **Domain Configuration**
   - Add custom domain in Vercel dashboard
   - Configure DNS records

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy source code
   COPY . .
   
   # Build application
   RUN npm run build
   
   # Create uploads directory
   RUN mkdir -p uploads
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       volumes:
         - ./uploads:/app/uploads
       depends_on:
         - postgres
   
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: devmeet_ai
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: your-password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional Server

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/devmeet-ai.git
   cd devmeet-ai
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build
   
   # Setup database
   npx prisma migrate deploy
   npx prisma generate
   
   # Start with PM2
   pm2 start npm --name "devmeet-ai" -- start
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
   
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   
       # Static file caching
       location /_next/static/ {
           proxy_pass http://localhost:3000;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

## Database Setup

### PostgreSQL (Recommended for Production)

1. **Install PostgreSQL**
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE devmeet_ai;
   CREATE USER devmeet_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE devmeet_ai TO devmeet_user;
   ```

3. **Run Migrations**
   ```bash
   DATABASE_URL="postgresql://devmeet_user:password@localhost:5432/devmeet_ai" npx prisma migrate deploy
   ```

## Monitoring and Logging

### 1. Application Monitoring

The application includes built-in monitoring:
- Performance metrics
- Error tracking
- User analytics
- Security event logging

Access monitoring data at `/analytics` (admin only).

### 2. Server Monitoring

Recommended monitoring tools:
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Logs**: ELK Stack, Papertrail
- **Errors**: Sentry

### 3. Log Management

```bash
# PM2 logs
pm2 logs devmeet-ai

# System logs
sudo journalctl -u nginx -f

# Application logs
tail -f /app/logs/application.log
```

## Backup Strategy

### 1. Database Backups

```bash
# Daily automated backup
pg_dump devmeet_ai > backup_$(date +%Y%m%d).sql

# Restore from backup
psql devmeet_ai < backup_20241201.sql
```

### 2. File Backups

```bash
# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Sync to cloud storage
aws s3 sync uploads/ s3://your-bucket/uploads/
```

### 3. Configuration Backups

- Environment files
- Nginx configurations
- SSL certificates
- PM2 process lists

## Security Checklist

- [ ] SSL/TLS enabled and configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] File upload restrictions in place
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Firewall properly configured
- [ ] SSH key-based authentication
- [ ] Regular security audits scheduled

## Performance Optimization

### 1. Next.js Optimizations

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  },
}
```

### 2. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);
```

### 3. Caching Strategy

- Static assets: 1 year cache
- API responses: Short-term cache where appropriate
- Database query optimization
- CDN for static content

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U devmeet_user -d devmeet_ai
   ```

2. **File Upload Issues**
   ```bash
   # Check disk space
   df -h
   
   # Check permissions
   ls -la uploads/
   chmod 755 uploads/
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory
   htop
   
   # Restart application
   pm2 restart devmeet-ai
   ```

### Performance Issues

1. **Database Query Optimization**
   - Enable query logging
   - Analyze slow queries
   - Add appropriate indexes

2. **Memory Leaks**
   - Monitor Node.js heap usage
   - Use profiling tools
   - Regular application restarts

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor application logs
   - Check system resources
   - Verify backup completion

2. **Weekly**
   - Update dependencies
   - Review security logs
   - Performance analysis

3. **Monthly**
   - Security patches
   - Database maintenance
   - SSL certificate renewal
   - Full system backup

### Update Process

1. **Preparation**
   ```bash
   # Backup current version
   git tag v1.0.0-backup
   
   # Backup database
   pg_dump devmeet_ai > pre_update_backup.sql
   ```

2. **Update**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install dependencies
   npm ci --only=production
   
   # Run migrations
   npx prisma migrate deploy
   
   # Build application
   npm run build
   
   # Restart application
   pm2 restart devmeet-ai
   ```

3. **Verification**
   - Test critical functionality
   - Monitor error logs
   - Verify performance metrics

## Support and Maintenance

For ongoing support:
- Monitor application logs
- Set up alerting for errors
- Regular security audits
- Performance monitoring
- User feedback collection

## Disaster Recovery

1. **Backup Strategy**
   - Daily database backups
   - Weekly full system backups
   - Offsite backup storage

2. **Recovery Procedures**
   - Database restoration steps
   - Application deployment procedures
   - DNS failover configuration

3. **Testing**
   - Regular disaster recovery drills
   - Backup verification
   - Recovery time objectives (RTO)
   - Recovery point objectives (RPO)

---

For technical support or questions about deployment, please refer to the project documentation or contact the development team.