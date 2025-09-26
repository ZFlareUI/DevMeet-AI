# GitHub Actions CI/CD Troubleshooting Guide

## Common Issues and Solutions

### 1. Environment File Missing Error

**Error**: `cp: cannot stat '.env.example': No such file or directory`

**Cause**: The `.env.example` file was being ignored by git due to `.env*` pattern in `.gitignore`.

**Solution**: 
- Updated `.gitignore` to specifically exclude only actual environment files while allowing `.env.example`
- Added graceful fallback in GitHub Actions workflow

### 2. Build Failures in CI/CD

**Error**: Various build-related errors in GitHub Actions

**Solutions**:
- Ensure all necessary files are tracked by git
- Use appropriate build commands for CI environment
- Set up proper environment variables for testing

### 3. Database Connection Issues in Tests

**Error**: Database connection failures during CI/CD

**Solution**: 
- Use PostgreSQL service in GitHub Actions
- Set correct `DATABASE_URL` for test environment
- Run database migrations before tests

## GitHub Actions Configuration

### Required Environment Variables

The following environment variables are automatically set in the CI/CD pipeline:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devmeet_test?schema=public
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=test-secret-key-for-github-actions
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=test
```

### Services Used

- **PostgreSQL**: For database testing
- **Redis**: For caching and sessions
- **Node.js**: For application runtime

### Workflow Steps

1. **Setup**: Install Node.js and dependencies
2. **Environment**: Create test environment variables
3. **Database**: Generate Prisma client and run migrations
4. **Linting**: Run ESLint checks
5. **Type Checking**: Validate TypeScript types
6. **Testing**: Run unit and integration tests
7. **Build**: Create production build
8. **Deploy**: Deploy to staging/production (if configured)

## Testing Locally

To test the GitHub Actions environment setup locally:

```bash
# Run the test script
chmod +x scripts/test-env-setup.sh
./scripts/test-env-setup.sh
```

## Debugging GitHub Actions

1. **Check Workflow Logs**: Go to GitHub Actions tab in your repository
2. **Review Build Steps**: Each step shows detailed logs
3. **Environment Variables**: Ensure all required variables are set
4. **File Permissions**: Check if files are properly tracked by git

## Support

If you encounter issues:

1. Check the workflow logs in GitHub Actions
2. Verify all required files are committed to the repository
3. Test the environment setup locally
4. Refer to the main troubleshooting documentation