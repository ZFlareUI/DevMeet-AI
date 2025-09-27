import winston from 'winston'
import { format } from 'winston'
import 'winston-daily-rotate-file'
import path from 'path'

const { combine, timestamp, printf, colorize, json } = format

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
  silly: 6
}

// Define colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan',
  silly: 'white'
}

// Add colors to winston
winston.addColors(colors)

// Custom format for console logging
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`
})

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs')

// Define the logger configuration
const logger = winston.createLogger({
  levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'devmeet-ai' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
      level: 'debug'
    }),
    
    // Daily rotate file transport for error logs
    new winston.transports.DailyRotateFile({
      level: 'error',
      dirname: path.join(logDir, 'error'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      handleExceptions: true
    }),
    
    // Daily rotate file transport for all logs
    new winston.transports.DailyRotateFile({
      dirname: path.join(logDir, 'combined'),
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  exitOnError: false
})

// Add request logging middleware
const requestLogger = winston.format((info: any) => {
  if (info.req) {
    info.message = {
      method: info.req.method,
      url: info.req.url,
      status: info.res?.statusCode,
      responseTime: info.responseTime,
      user: info.req.user?.id ? { id: info.req.user.id } : undefined,
      ip: info.req.ip || info.req.connection.remoteAddress,
      userAgent: info.req.headers['user-agent']
    }
    
    // Redact sensitive information
    if (info.req.headers?.authorization) {
      info.req.headers.authorization = '[REDACTED]'
    }
    if (info.req.body?.password) {
      info.req.body.password = '[REDACTED]'
    }
    if (info.req.body?.token) {
      info.req.body.token = '[REDACTED]'
    }
  }
  return info
})

// Helper to redact sensitive information from logs
const redactSensitiveData = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data
  
  const sensitiveFields = [
    'password',
    'newPassword',
    'currentPassword',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'creditCard',
    'cvv',
    'ssn',
    'apiKey',
    'secret',
    'privateKey'
  ]
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item))
  }
  
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      result[key] = '***REDACTED***'
    } else if (value && typeof value === 'object') {
      result[key] = redactSensitiveData(value)
    } else {
      result[key] = value
    }
  }
  
  return result
}

// Stream for Morgan HTTP request logging
const stream = {
  write: (message: string) => {
    logger.http(message.trim())
  }
}

export { logger, requestLogger, stream }
