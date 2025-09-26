import { PrismaClient } from '@prisma/client'
import { Logger } from './error-handler'

// Global prisma instance with connection management
declare global {
  var __globalPrisma__: PrismaClient | undefined
}

class DatabaseManager {
  private static instance: PrismaClient

  static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      const isProduction = process.env.NODE_ENV === 'production'
      
      DatabaseManager.instance = new PrismaClient({
        log: isProduction ? ['error'] : ['error', 'warn'],
      })

      // Connection lifecycle management
      DatabaseManager.instance.$connect()
        .then(() => {
          Logger.info('Database connected successfully')
        })
        .catch((error) => {
          Logger.error('Database connection failed', error)
        })

      // Graceful shutdown
      process.on('beforeExit', async () => {
        await DatabaseManager.instance.$disconnect()
        Logger.info('Database disconnected')
      })
    }
    
    return DatabaseManager.instance
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await DatabaseManager.instance.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      Logger.error('Database health check failed', error)
      return false
    }
  }

  static async getConnectionInfo(): Promise<{
    isConnected: boolean
    databaseVersion?: string
  }> {
    try {
      const isConnected = await DatabaseManager.healthCheck()
      
      let databaseVersion: string | undefined
      if (isConnected) {
        try {
          const result = await DatabaseManager.instance.$queryRaw<Array<{ version: string }>>`SELECT version() as version`
          databaseVersion = result[0]?.version
        } catch {
          // SQLite or other database
          try {
            const result = await DatabaseManager.instance.$queryRaw<Array<{ version: string }>>`SELECT sqlite_version() as version`
            databaseVersion = `SQLite ${result[0]?.version}`
          } catch {
            databaseVersion = 'Unknown'
          }
        }
      }
      
      return {
        isConnected,
        databaseVersion
      }
    } catch (error) {
      Logger.error('Failed to get connection info', error)
      return {
        isConnected: false
      }
    }
  }

  static async closeAllConnections(): Promise<void> {
    try {
      await DatabaseManager.instance.$disconnect()
      Logger.info('All database connections closed')
    } catch (error) {
      Logger.error('Error closing database connections', error)
    }
  }
}

// Create the global instance
const prisma = globalThis.__globalPrisma__ || DatabaseManager.getInstance()

if (process.env.NODE_ENV === 'development') {
  globalThis.__globalPrisma__ = prisma
}

// Database utilities
export const DatabaseUtils = {
  // Transaction helper with retry logic
  async withTransaction<T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(callback, {
          timeout: 30000, // 30 seconds
          maxWait: 10000,  // 10 seconds
        })
      } catch (error) {
        lastError = error as Error
        Logger.warn(`Transaction attempt ${attempt} failed`, lastError)
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError!
  },

  // Pagination helper
  async paginate<T>(
    model: Record<string, unknown>,
    page: number = 1,
    limit: number = 10,
    where?: Record<string, unknown>,
    orderBy?: Record<string, unknown>,
    include?: Record<string, unknown>
  ): Promise<{
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> {
    const skip = (page - 1) * limit
    
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        include,
        skip,
        take: limit
      }),
      model.count({ where })
    ])
    
    const pages = Math.ceil(total / limit)
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    }
  },

  // Soft delete helper
  async softDelete(model: Record<string, unknown>, id: string): Promise<unknown> {
    return (model as any).update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    })
  },

  // Bulk operations with batching
  async bulkCreate<T>(
    model: Record<string, unknown>,
    data: T[],
    batchSize: number = 100
  ): Promise<number> {
    let totalCreated = 0
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const result = await (model as any).createMany({
        data: batch,
        skipDuplicates: true
      })
      totalCreated += result.count
    }
    
    return totalCreated
  },

  // Search helper with full-text search
  async search<T>(
    model: Record<string, unknown>,
    searchTerm: string,
    searchFields: string[],
    options: {
      page?: number
      limit?: number
      where?: Record<string, unknown>
      orderBy?: Record<string, unknown>
      include?: Record<string, unknown>
    } = {}
  ): Promise<{ data: T[]; total: number }> {
    const { page = 1, limit = 10, where = {}, orderBy, include } = options
    
    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }))
    
    const searchWhere = {
      ...where,
      OR: searchConditions
    }
    
    const skip = (page - 1) * limit
    
    const [data, total] = await Promise.all([
      (model as any).findMany({
        where: searchWhere,
        orderBy,
        include,
        skip,
        take: limit
      }),
      (model as any).count({ where: searchWhere })
    ])
    
    return { data, total }
  }
}

export { prisma, DatabaseManager }
export default prisma