import express from "express"
import helmet from "helmet"
import { config } from "./config"
import { logger } from "./lib/logger"
import { correlationIdMiddleware } from "./middleware/correlationId"
import { errorHandler } from "./middleware/errorHandler"
import statementsRouter from "./routes/statements"

// Create the Express app
const app = express()

//security
app.use(helmet())



// Parse incoming JSON bodies
app.use(express.json({ limit: "10mb" }))

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }))



// Attach a unique ID to every request
// This ID flows through every log line for that request
app.use(correlationIdMiddleware)

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ledgerlens-api",
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
  })
})
app.use("/api/v1/statements", statementsRouter)

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  })
})

app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

export const startServer = () => {
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "LedgerLens API server started")
  })

  // Graceful shutdown on SIGTERM (sent by Render/Docker when stopping)
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