# DevMeet AI - Environment Setup Guide

## Quick Start (Demo Mode)
The application works out of the box with demo credentials. You can sign in using these accounts:

- **Admin**: admin@devmeet.ai / admin123
- **Recruiter**: recruiter@devmeet.ai / recruiter123  
- **Interviewer**: interviewer@devmeet.ai / interviewer123
- **Candidate**: candidate@devmeet.ai / candidate123

## GitHub OAuth Setup (Optional)

To enable GitHub authentication, you need to create a GitHub OAuth App:

### Step 1: Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: DevMeet AI
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/api/auth/callback/github
4. Click "Register application"

### Step 2: Update Environment Variables
Copy your Client ID and Client Secret and update `.env.local`:

```bash
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
```

### Step 3: Generate NextAuth Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Then update `.env.local`:
```bash
NEXTAUTH_SECRET=your_generated_secret_here
```

## Optional AI Services

### Google Gemini AI (Recommended)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Update `.env.local`:
```bash
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### OpenAI (Alternative)
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create an API key
3. Update `.env.local`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### GitHub Personal Access Token (For Repository Analysis)
1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token with `public_repo` scope
3. Update `.env.local`:
```bash
GITHUB_TOKEN=your_github_token_here
```

## Complete .env.local Example

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here

# GitHub OAuth App (Create at: https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret

# GitHub API (Personal Access Token)
GITHUB_TOKEN=your_github_token_here

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI (backup AI provider)
OPENAI_API_KEY=your_openai_api_key_here
```

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed database with demo data**:
   ```bash
   npm run seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: http://localhost:3000

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm run start
   ```

## Troubleshooting

### GitHub OAuth 404 Error
If you see a 404 error when clicking "Sign in with GitHub", it means the GitHub OAuth app isn't configured yet. The application will work with demo credentials even without GitHub OAuth.

### Database Issues
If you encounter database issues, reset it:
```bash
rm prisma/dev.db
npx prisma db push
npm run seed
```

### Missing Environment Variables
The application is designed to work with minimal configuration. Most features will work even if you only have the database configured.