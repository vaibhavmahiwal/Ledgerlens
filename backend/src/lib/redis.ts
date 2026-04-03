import { Redis } from "ioredis"
import { config } from "../config"
import { logger } from "./logger"

//creating one redis connection will import this only
//in every part where needed

const redis=new Redis(config.REDIS_URL,{
    //if redis is down keep retrying

    retryStrategy(times){
        //waiting for 2,4,6,seconds on this.retry...
        const delay=Math.min(times*2000,10000)
         logger.warn({ attempt: times, delayMs: delay },"redis connection retry")
         return delay
    },

    // Stop retrying after 10 attempts (about 1 minute total)
  maxRetriesPerRequest: null, // null = required for BullMQ compatibility

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
 