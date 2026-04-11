import { parserWorker } from "./src/workers/parser.worker"
import { analysisWorker } from "./src/workers/analysis.worker"
import { logger } from "./src/lib/logger"
import { Queue } from "bullmq"
import { bullMQRedis } from "./src/lib/redis"
import { reportWorker } from "./src/workers/report.worker"
logger.info("Worker process started")
logger.info("Parser worker listening...")
logger.info("Analysis worker listening...")
logger.info("Report worker listening...")

const analysisQueue = new Queue("analysis", { connection: bullMQRedis })

setTimeout(async () => {
  const waiting = await analysisQueue.getWaiting()
  const active = await analysisQueue.getActive()
  console.log("Waiting jobs:", waiting.length)
  console.log("Active jobs:", active.length)
}, 3000)

process.on("SIGTERM", async () => {
  logger.info("Shutting down workers...")
  await parserWorker.close()
  await analysisWorker.close()
   await reportWorker.close()
  process.exit(0)
})