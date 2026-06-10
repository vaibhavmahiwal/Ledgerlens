import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../db"
import { NotFoundError } from "../lib/errors"
import { createChildLogger } from "../lib/logger"

const router = Router()

// GET /api/v1/jobs
// List all jobs with pagination and status filter
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const log = createChildLogger(req.correlationId)

  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const status = req.query.status as string | undefined
    const skip = (page - 1) * limit

    const where = status ? { status: status as any } : {}

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          statement: {
            include: {
              applicant: {
                select: {
                  id: true,
                  name: true,
                  pan: true,
                },
              },
            },
          },
          report: {
            select: {
              id: true,
              avgMonthlyInflow: true,
              totalEmisBurden: true,
              bounceCount: true,
              jsonSummary: true,
            },
          },
        },
      }),
    ])

    log.info({ total, page, status }, "Jobs fetched")

    res.status(200).json({
      data: jobs.map((job) => ({
        id: job.id,
        status: job.status,
        correlationId: job.correlationId,
        retryCount: job.retryCount,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        applicant: {
          id: job.statement.applicant.id,
          name: job.statement.applicant.name,
          pan: job.statement.applicant.pan,
        },
        statement: {
          id: job.statement.id,
          bank: job.statement.bank,
          months: job.statement.months,
          format: job.statement.format,
        },
        report: job.report
          ? {
              id: job.report.id,
              avgMonthlyInflow: job.report.avgMonthlyInflow,
              totalEmisBurden: job.report.totalEmisBurden,
              bounceCount: job.report.bounceCount,
              creditScore:
                (job.report.jsonSummary as any)?.recommendation
                  ?.creditworthinessScore ?? null,
              downloadUrl: `/api/v1/reports/${job.report.id}/download`,
            }
          : null,
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

// GET /api/v1/jobs/:jobId
// Single job detail — same as statements/status but more complete
router.get("/:jobId", async (req: Request, res: Response, next: NextFunction) => {
  const log = createChildLogger(req.correlationId)

  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: {
        statement: {
          include: {
            applicant: true,
          },
        },
        report: true,
      },
    })

    if (!job) throw new NotFoundError("Job")

    log.info({ jobId: job.id, status: job.status }, "Job detail fetched")

    res.status(200).json({
      id: job.id,
      status: job.status,
      correlationId: job.correlationId,
      retryCount: job.retryCount,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      applicant: {
        id: job.statement.applicant.id,
        name: job.statement.applicant.name,
        pan: job.statement.applicant.pan,
        phone: job.statement.applicant.phone,
      },
      statement: {
        id: job.statement.id,
        bank: job.statement.bank,
        months: job.statement.months,
        format: job.statement.format,
        periodStart: job.statement.periodStart,
        periodEnd: job.statement.periodEnd,
      },
      report: job.report
        ? {
            id: job.report.id,
            avgMonthlyInflow: job.report.avgMonthlyInflow,
            avgMonthlyOutflow: job.report.avgMonthlyOutflow,
            totalEmisBurden: job.report.totalEmisBurden,
            bounceCount: job.report.bounceCount,
            generatedAt: job.report.generatedAt,
            downloadUrl: `/api/v1/reports/${job.report.id}/download`,
          }
        : null,
    })
  } catch (err) {
    next(err)
  }
})

export default router