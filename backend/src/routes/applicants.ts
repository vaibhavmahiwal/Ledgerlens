import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../db"
import { NotFoundError } from "../lib/errors"
import { createChildLogger } from "../lib/logger"

const router = Router()

// GET /api/v1/applicants
// List all applicants for the logged-in agent
// Supports search by name or PAN + pagination
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const log = createChildLogger(req.correlationId)

  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ""
    const skip = (page - 1) * limit

    // Build search filter
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { pan: { contains: search.toUpperCase() } },
          ],
        }
      : {}

    // Run count and data fetch in parallel
    const [total, applicants] = await Promise.all([
      prisma.applicant.count({ where }),
      prisma.applicant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          // Count reports and statements without fetching all data
          _count: {
            select: {
              statements: true,
              reports: true,
            },
          },
          // Get latest statement for quick info
          statements: {
            orderBy: { uploadedAt: "desc" },
            take: 1,
            select: {
              bank: true,
              uploadedAt: true,
            },
          },
        },
      }),
    ])

    log.info({ total, page, search }, "Applicants fetched")

    res.status(200).json({
      data: applicants.map((a) => ({
        id: a.id,
        name: a.name,
        pan: a.pan,
        phone: a.phone,
        agentId: a.agentId,
        totalStatements: a._count.statements,
        totalReports: a._count.reports,
        lastBank: a.statements[0]?.bank ?? null,
        lastUpload: a.statements[0]?.uploadedAt ?? null,
        createdAt: a.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/applicants/:id
// Get one applicant with all their statements and reports
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const log = createChildLogger(req.correlationId)

  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: req.params.id },
      include: {
        statements: {
          orderBy: { uploadedAt: "desc" },
          include: {
            jobs: {
              orderBy: { createdAt: "desc" },
              take: 1, // latest job per statement
              include: {
                report: {
                  select: {
                    id: true,
                    avgMonthlyInflow: true,
                    avgMonthlyOutflow: true,
                    totalEmisBurden: true,
                    bounceCount: true,
                    generatedAt: true,
                    jsonSummary: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!applicant) throw new NotFoundError("Applicant")

    log.info({ applicantId: applicant.id }, "Applicant fetched")

    // Shape the response cleanly
    res.status(200).json({
      id: applicant.id,
      name: applicant.name,
      pan: applicant.pan,
      phone: applicant.phone,
      agentId: applicant.agentId,
      createdAt: applicant.createdAt,
      statements: applicant.statements.map((s) => {
        const latestJob = s.jobs[0] ?? null
        return {
          id: s.id,
          bank: s.bank,
          format: s.format,
          months: s.months,
          periodStart: s.periodStart,
          periodEnd: s.periodEnd,
          uploadedAt: s.uploadedAt,
          jobStatus: latestJob?.status ?? null,
          jobId: latestJob?.id ?? null,
          report: latestJob?.report
            ? {
                id: latestJob.report.id,
                avgMonthlyInflow: latestJob.report.avgMonthlyInflow,
                avgMonthlyOutflow: latestJob.report.avgMonthlyOutflow,
                totalEmisBurden: latestJob.report.totalEmisBurden,
                bounceCount: latestJob.report.bounceCount,
                creditScore:
                  (latestJob.report.jsonSummary as any)?.recommendation
                    ?.creditworthinessScore ?? null,
                generatedAt: latestJob.report.generatedAt,
                downloadUrl: `/api/v1/reports/${latestJob.report.id}/download`,
              }
            : null,
        }
      }),
    })
  } catch (err) {
    next(err)
  }
})

export default router