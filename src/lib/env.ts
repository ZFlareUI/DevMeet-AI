import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters long'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid database connection string'),
  
  // OAuth Providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // API Keys
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().default('false').transform(val => val === 'true'),
  ENABLE_EMAIL_VERIFICATION: z.string().default('false').transform(val => val === 'true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().default('100'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  
  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  
  // Other
  APP_URL: z.string().url('APP_URL must be a valid URL').default('http://localhost:3000'),
  
  // Add any other environment variables your application needs
  // ...
})

// Parse the environment variables
type EnvConfig = z.infer<typeof envSchema>

let env: EnvConfig

try {
  // This will throw if required environment variables are missing or invalid
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:')
    error.issues.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`)
    })
    process.exit(1)
  }
  throw error
}

// Export the validated environment variables
export default env as EnvConfig

// Helper function to get environment variable with type safety
export function getEnvVar<T extends keyof EnvConfig>(
  key: T,
  defaultValue?: EnvConfig[T]
): EnvConfig[T] {
  const value = env[key] ?? defaultValue
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but was not provided`)
  }
  
  return value
}

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production'

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development'

// Helper function to check if we're in test environment
export const isTest = env.NODE_ENV === 'test'

// Helper to get the full URL for a path
export function getFullUrl(path: string = ''): string {
  const baseUrl = env.APP_URL.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  return `${baseUrl}/${normalizedPath}`
}

// Helper to get CORS options
export function getCorsOptions() {
  const origins = env.CORS_ORIGIN
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
  
  return {
    origin: origins.length === 1 && origins[0] === '*' ? true : origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600, // 10 minutes
  }
}

// Helper to get rate limit options
export function getRateLimitOptions() {
  return {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(env.RATE_LIMIT_MAX, 10),
  }
}

// Export environment-specific configurations
export const config = {
  isProduction,
  isDevelopment,
  isTest,
  app: {
    name: 'DevMeet AI',
    version: process.env.npm_package_version || '1.0.0',
    port: parseInt(env.PORT, 10),
    host: env.HOST,
    url: env.APP_URL,
  },
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  database: {
    url: env.DATABASE_URL,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  features: {
    analytics: env.ENABLE_ANALYTICS,
    emailVerification: env.ENABLE_EMAIL_VERIFICATION,
  },
  sentry: {
    dsn: env.SENTRY_DSN,
  },
  rateLimit: getRateLimitOptions(),
  cors: getCorsOptions(),
} as const
