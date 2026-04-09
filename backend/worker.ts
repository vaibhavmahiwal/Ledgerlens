import { parserWorker } from "./src/workers/parser.worker"
import { logger } from "./src/lib/logger"

logger.info("Worker process started")
logger.info("Parser worker listening...")

process.on("SIGTERM", async () => {
  logger.info("Shutting down workers...")
  await parserWorker.close()
  process.exit(0)
})