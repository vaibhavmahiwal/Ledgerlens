import { config } from "./src/config"
import { logger } from "./src/lib/logger"
import { redis } from "./src/lib/redis"

logger.info("Starting LedgerLens...")
logger.info({ port: config.PORT }, "Config loaded")