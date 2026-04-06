import { Redis } from "ioredis"
import { config } from "../config"
import { logger } from "./logger"

// Create ONE Redis connection and export it
// Every part of the app imports this same instance
// Never create multiple Redis connections — wastes resources
const redis = new Redis(config.REDIS_URL, {
  // If Redis is down, keep retrying
  // retryStrategy gets called with the attempt number
  // Returns how many milliseconds to wait before next retry
  retryStrategy(times) {
    // Wait 2 seconds on first retry, 4 on second, up to max 10 seconds
    const delay = Math.min(times * 2000, 10000)
    logger.warn({ attempt: times, delayMs: delay }, "Redis connection retry")
    return delay
  },

  // Stop retrying after 10 attempts (about 1 minute total)
  maxRetriesPerRequest: null, // null = required for BullMQ compatibility

  // How long to wait for a command response before timing out
  commandTimeout: 5000,

  // Connection options
  enableReadyCheck: true,
  lazyConnect: false, // Connect immediately on startup
})

// Log when connection is established
redis.on("connect", () => {
  logger.info("Redis connected")
})

// Log when connection is ready to accept commands
redis.on("ready", () => {
  logger.info("Redis ready")
})

// Log errors but don't crash — retryStrategy handles reconnection
redis.on("error", (err) => {
  logger.error({ err }, "Redis error")
})

// Log when connection drops
redis.on("close", () => {
  logger.warn("Redis connection closed")
})

// Log when reconnecting
redis.on("reconnecting", () => {
  logger.warn("Redis reconnecting...")
})

// Graceful shutdown
// Call this when your process is shutting down (SIGTERM/SIGINT)
// so Redis connection closes cleanly
export const closeRedis = async (): Promise<void> => {
  await redis.quit()
  logger.info("Redis connection closed gracefully")
}

export { redis }

// Usage examples:
//
// In BullMQ queue definition:
//   import { redis } from "../lib/redis"
//   const queue = new Queue("parser", { connection: redis })
//
// For caching job status:
//   await redis.set(`job:${jobId}:status`, "processing", "EX", 3600)
//   const status = await redis.get(`job:${jobId}:status`)
//
// For rate limiting:
//   const key = `rate:${userId}`
//   const count = await redis.incr(key)
//   await redis.expire(key, 60)