import { LRUCache } from 'lru-cache'
import { NextRequest, NextResponse } from 'next/server'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
  maxRequests?: number
}

export const rateLimit = (options?: Options) => {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (req: NextRequest, limit: number, token: string) => {
      const tokenCount = tokenCache.get(token) || [0]
      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount)
      }
      tokenCount[0] += 1

      const currentUsage = tokenCount[0]
      const isRateLimited = currentUsage > limit

      const response = isRateLimited ? new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.'
        }), 
        { status: 429 }
      ) : null

      return {
        isRateLimited,
        currentUsage,
        limit,
        remaining: isRateLimited ? 0 : limit - currentUsage,
        response
      }
    },
  }
}

// Create a rate limiter with default options
export const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max users per interval
  maxRequests: 100, // Max requests per user per interval
})
