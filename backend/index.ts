import { config } from "./src/config"
import { logger } from "./src/lib/logger"
import { redis } from "./src/lib/redis"
import { prisma } from "./src/db"
import { startServer } from "./src/server"
import { error } from "node:console"


const main=async()=>{
  logger.info("starting Ledgerlens")
  logger.info({port:config.PORT},"config loaded")

  //test databse connection
  await prisma.$connect()
  logger.info("database connnected")

  //start express server
  //redis connects automatically when imported
  startServer()

  //shutdown
  process.on("SIGINT",async()=>{
    logger.info("shutting down")
     await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  })

}

main().catch((err)=>{
  console.error("Failed to start server:", err)
  process.exit(1)

})