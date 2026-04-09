import { PrismaClient } from "@prisma/client"
import { logger } from "../lib/logger"

// We create ONE PrismaClient instance and reuse it everywhere
// Creating multiple instances wastes database connections
// globalForPrisma trick prevents multiple instances in development
// because tsx/nodemon restarts the module but not globalThis 
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      // Log errors as events so we can pipe them to Pino
      { emit: "event", level: "error" },
      // In development, log every query so you can see what SQL is running
      { emit: "event", level: "query" },
    ],
  })

// In development, store the instance on globalThis
// so hot reloads don't create new connections every time
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Pipe Prisma errors into our Pino logger
// So all errors appear in one place with the same format
prisma.$on("error", (e) => {
  logger.error({ err: e }, "Prisma error")
})

// Only log queries in development — too noisy in production
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, "Prisma query")
  })
}

// Call this when the process is shutting down
// So database connections close cleanly
export const disconnectPrisma = async () => {
  await prisma.$disconnect()
  logger.info("Prisma disconnected")
}

