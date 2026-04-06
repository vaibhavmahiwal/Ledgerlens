//this file creates prisma client instance shared across the whole app

import { PrismaClient } from "@prisma/client"
import { logger } from "../lib/logger"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
    ],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

prisma.$on("error", (e) => {
  logger.error({ err: e }, "Prisma error")
})

export const disconnectPrisma = async () => {
  await prisma.$disconnect()
  logger.info("Prisma disconnected")
}

