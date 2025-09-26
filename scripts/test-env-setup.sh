#!/bin/bash

# Test script to validate GitHub Actions environment setup
# This script mimics what GitHub Actions does

echo "🧪 Testing GitHub Actions environment setup..."

# Check if .env.example exists
if [ -f .env.example ]; then
    echo "✅ .env.example found"
    cp .env.example .env.test
    echo "✅ .env.test created from .env.example"
else
    echo "⚠️  .env.example not found, creating empty .env.test"
    touch .env.test
fi

# Add test environment variables
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devmeet_test?schema=public" >> .env.test
echo "REDIS_URL=redis://localhost:6379" >> .env.test
echo "NEXTAUTH_SECRET=test-secret-key-for-github-actions" >> .env.test
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.test
echo "NODE_ENV=test" >> .env.test

echo "✅ Environment variables added to .env.test"

# Validate the file was created properly
if [ -f .env.test ]; then
    echo "✅ .env.test file created successfully"
    echo ""
    echo "📄 Contents of .env.test:"
    echo "========================"
    cat .env.test
    echo "========================"
    echo ""
    echo "🎉 Environment setup test completed successfully!"
else
    echo "❌ Failed to create .env.test file"
    exit 1
fi

# Clean up
rm -f .env.test
echo "🧹 Cleaned up test file"