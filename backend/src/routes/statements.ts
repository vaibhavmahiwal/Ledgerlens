import { Router, Request, Response, NextFunction } from "express"
import { upload } from "../middleware/upload"
import { prisma } from "../db"
import { parserQueue } from "../queues/parser.queue"
import { newApplicantUploadSchema, uploadStatementSchema } from "../validators/statement.validator"
import { createChildLogger } from "../lib/logger"
import { ValidationError, NotFoundError } from "../lib/errors"
import { v4 as uuidv4 } from "uuid"

const router = Router()

// POST /api/v1/statements/upload
// Upload a bank statement for a new applicant
router.post(
  "/upload",
  upload.single("statement"),
  async (req: Request, res: Response, next: NextFunction) => {
    const log = createChildLogger(req.correlationId)

    try {
      // 1. Check file was actually uploaded
      if (!req.file) {
        throw new ValidationError("No file uploaded")
      }

     // console.log("req.body:", req.body)
    // console.log("req.file:", req.file)
    
       
      log.info({ file: req.file.filename }, "File uploaded successfully")

      // 2. Validate request body with Zod
      // Trim all keys and values before validation
const trimmedBody: Record<string, string> = {}
for (const key of Object.keys(req.body)) {
  trimmedBody[key.trim()] = typeof req.body[key] === "string"
    ? req.body[key].trim()
    : req.body[key]
}

// 2. Validate request body with Zod
const parsed = newApplicantUploadSchema.safeParse(trimmedBody)
console.log("trimmedBody:", JSON.stringify(trimmedBody))
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues.map((e) => e.message).join(", ")
        )
      }

      const { name, pan, phone, agentId, bank, periodStart, periodEnd, months } = parsed.data

      log.info({ pan, bank }, "Payload validated")

      // 3. Create applicant in database
      // upsert — create if not exists, return existing if PAN already registered
      const applicant = await prisma.applicant.upsert({
        where: { pan },
        create: { name, pan, phone, agentId },
        update: { name, phone },
      })

      log.info({ applicantId: applicant.id }, "Applicant saved")

      // 4. Save statement record
      const statement = await prisma.statement.create({
        data: {
          applicantId: applicant.id,
          bank,
          format: req.file.mimetype.includes("pdf") ? "pdf" : "csv",
          filePath: req.file.path,
          periodStart,
          periodEnd,
          months,
        },
      })

      log.info({ statementId: statement.id }, "Statement saved")

      // 5. Create job record in database
      const job = await prisma.job.create({
        data: {
          statementId: statement.id,
          correlationId: req.correlationId,
          status: "QUEUED",
        },
      })

      log.info({ jobId: job.id }, "Job record created")

      // 6. Push to BullMQ parser queue
      const bullJob = await parserQueue.add("parse", {
        jobId: job.id,
        statementId: statement.id,
        applicantId: applicant.id,
        filePath: req.file.path,
        bank,
        format: req.file.mimetype.includes("pdf") ? "pdf" : "csv",
        correlationId: req.correlationId,
      })

      // 7. Save BullMQ job ID back to our job record
      await prisma.job.update({
        where: { id: job.id },
        data: { bullJobId: bullJob.id },
      })

      log.info({ jobId: job.id, bullJobId: bullJob.id }, "Job queued successfully")

      // 8. Return job ID to client
      // Client polls GET /api/v1/statements/status/:jobId to check progress
      res.status(202).json({
        message: "Statement uploaded successfully. Processing started.",
        jobId: job.id,
        applicantId: applicant.id,
        statementId: statement.id,
        correlationId: req.correlationId,
      })
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/v1/statements/status/:jobId
// Poll this to check job progress
router.get(
  "/status/:jobId",
  async (req: Request, res: Response, next: NextFunction) => {
    const log = createChildLogger(req.correlationId)
    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.jobId as string },
      })

      if (!job) throw new NotFoundError("Job")

      log.info({ jobId: job.id, status: job.status }, "Job status fetched")

      res.status(200).json({
        jobId: job.id,
        status: job.status,
        correlationId: job.correlationId,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router