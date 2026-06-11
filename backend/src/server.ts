import express from "express"
import helmet from "helmet"
import cors from "cors"
import { config } from "./config"
import { logger } from "./lib/logger"
import { correlationIdMiddleware } from "./middleware/correlationId"
import { errorHandler } from "./middleware/errorHandler"
import statementsRouter from "./routes/statements"
import reportsRouter from "./routes/reports"
import applicantsRouter from "./routes/applicants"
import jobsRouter from "./routes/jobs"

const app = express()

// 1. Global Network Access Rules (CORS first)
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}))

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// 2. Request Parsing & Validation Utilities
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(correlationIdMiddleware)

// Trim all body keys and values (Runs BEFORE routes, safely)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const trimmed: Record<string, any> = {}
    for (const key of Object.keys(req.body)) {
      trimmed[key.trim()] = typeof req.body[key] === "string" 
        ? req.body[key].trim() 
        : req.body[key]
    }
    req.body = trimmed
  }
  next()
})

// 3. System Health Checks
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ledgerlens-api",
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
  })
})

// 4. API Endpoints Routes Definitions Grouped Together
app.use("/api/v1/reports", reportsRouter)
app.use("/api/v1/applicants", applicantsRouter)
app.use("/api/v1/jobs", jobsRouter)
app.use("/api/v1/statements", statementsRouter) // Move this here!

// 5. Fallback Error Boundary Handlers
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  })
})

app.use(errorHandler)

export const startServer = () => {
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "LedgerLens API server started")
  })

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully")
    server.close(() => {
      logger.info("Server closed")
      process.exit(0)
    })
  })

  return server
}

export { app }