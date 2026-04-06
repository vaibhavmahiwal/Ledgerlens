import { Request, Response, NextFunction } from "express"
import { AppError, isOperationalError } from "../lib/errors"
import { logger } from "../lib/logger"

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const log = logger.child({ correlationId: req.correlationId })

  if (err instanceof AppError) {
    log.warn({ err, statusCode: err.statusCode }, "Operational error")
    return res.status(err.statusCode).json({
      error: err.message,
      correlationId: req.correlationId,
    })
  }

  log.error({ err, path: req.path }, "Unexpected error")

  if (!isOperationalError(err)) {
    log.error({ err }, "Non-operational error — potential bug")
  }

  return res.status(500).json({
    error: "Internal server error",
    correlationId: req.correlationId,
  })
}