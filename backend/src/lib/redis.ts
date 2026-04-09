import { Redis } from "ioredis"
import { config } from "../config"
import { logger } from "./logger"

// Main Redis connection — for general use
const redis = new Redis(config.REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 2000, 10000)
    logger.warn({ attempt: times, delayMs: delay }, "Redis connection retry")
    return delay
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
})

// Separate connection for BullMQ
// BullMQ requires maxRetriesPerRequest: null
// and NO commandTimeout — it uses long-polling internally
export const bullMQRedis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 2000, 10000)
  },
})

redis.on("connect", () => logger.info("Redis connected"))
redis.on("ready", () => logger.info("Redis ready"))
redis.on("error", (err) => logger.error({ err }, "Redis error"))
redis.on("close", () => logger.warn("Redis connection closed"))
redis.on("reconnecting", () => logger.warn("Redis reconnecting..."))

export const closeRedis = async (): Promise<void> => {
  await redis.quit()
  await bullMQRedis.quit()
  logger.info("Redis connection closed gracefully")
}

export { redis }