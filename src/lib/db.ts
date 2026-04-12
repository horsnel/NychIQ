import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const db =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL ? createPrismaClient() : (null as unknown as PrismaClient))

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = db
}

export function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL && db !== null
}
