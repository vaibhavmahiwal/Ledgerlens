import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../db"
import { NotFoundError } from "../lib/errors"
import { createChildLogger } from "../lib/logger"
import fs from "fs"

const router = Router()

// GET /api/v1/reports/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  // Fix 1: Cast correlationId to string
  const log = createChildLogger(req.correlationId as string || "")
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { applicant: true },
    })

    if (!report) throw new NotFoundError("Report")
    
    // Fix 2: Safety check for the relation
    if (!report.applicant) throw new Error("Applicant not found for this report")

    log.info({ reportId: report.id }, "Report fetched")

    res.status(200).json({
      reportId: report.id,
      applicant: report.applicant.name,
      pan: report.applicant.pan,
      avgMonthlyInflow: report.avgMonthlyInflow,
      avgMonthlyOutflow: report.avgMonthlyOutflow,
      totalEmisBurden: report.totalEmisBurden,
      bounceCount: report.bounceCount,
      generatedAt: report.generatedAt,
      downloadUrl: `/api/v1/reports/${report.id}/download`,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/reports/:id/download
router.get("/:id/download", async (req: Request, res: Response, next: NextFunction) => {
  const log = createChildLogger(req.correlationId as string || "")
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { applicant: true },
    })

    if (!report) throw new NotFoundError("Report")
    if (!report.applicant) throw new Error("Applicant not found")
    if (!fs.existsSync(report.pdfPath)) throw new NotFoundError("PDF file")

    log.info({ reportId: report.id }, "PDF download started")

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ledgerlens-${report.applicant.pan}-report.pdf"`
    )

    fs.createReadStream(report.pdfPath).pipe(res)
  } catch (err) {
    next(err)
  }
})

export default router