import { sign, verify, SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken'
import crypto from 'crypto'

// Generate a secure random secret if not provided
const JWT_SECRET = process.env.NEXTAUTH_SECRET || crypto.randomBytes(32).toString('hex')
const JWT_ALGORITHM = 'HS256'
const DEFAULT_EXPIRES_IN = '30d'

interface JWTDecoded extends JwtPayload {
  id?: string
  role?: string
  email?: string
  organizationId?: string
  [key: string]: any
}

export const signJWT = (
  payload: object,
  options?: SignOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    sign(
      payload,
      JWT_SECRET,
      {
        algorithm: JWT_ALGORITHM,
        expiresIn: options?.expiresIn || DEFAULT_EXPIRES_IN,
        ...options,
      },
      (err, token) => {
        if (err || !token) {
          reject(err || new Error('Failed to sign token'))
        } else {
          resolve(token)
        }
      }
    )
  })
}

export const verifyJWT = <T = JWTDecoded>(
  token: string,
  secret: string = JWT_SECRET,
  options?: VerifyOptions
): Promise<T> => {
  return new Promise((resolve, reject) => {
    verify(
      token,
      secret,
      {
        algorithms: [JWT_ALGORITHM],
        ...options,
      },
      (err, decoded) => {
        if (err || !decoded) {
          reject(err || new Error('Failed to verify token'))
        } else {
          resolve(decoded as T)
        }
      }
    )
  })
}

export const decodeJWT = <T = JWTDecoded>(token: string): T | null => {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf8')
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    )
    
    return JSON.parse(jsonPayload) as T
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}
