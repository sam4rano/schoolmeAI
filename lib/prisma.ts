import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// During build/static generation, Prisma Client needs DATABASE_URL to initialize
// but won't actually connect until a query is made
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma


