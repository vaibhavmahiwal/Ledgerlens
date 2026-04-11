import { Worker, Job } from "bullmq"
import { bullMQRedis } from "../lib/redis"
import { prisma } from "../db"
import { createChildLogger } from "../lib/logger"
import { generateCreditReport } from "../services/report/pdf.service"
import { ReportJobData } from "../queues/report.queue"

const processReportJob = async (job: Job<ReportJobData>) => {
  const { jobId, statementId, applicantId, analysisResult, correlationId } = job.data
  const log = createChildLogger(correlationId, { jobId, workerId: "report" })

  log.info("Report worker started")

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "GENERATING" },
  })

  try {
    // Fetch applicant and statement details for the PDF
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
    })

    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
    })

    if (!applicant || !statement) {
      throw new Error("Applicant or statement not found")
    }

    const period = `${statement.periodStart.toLocaleDateString("en-IN")} - ${statement.periodEnd.toLocaleDateString("en-IN")}`

    // Generate PDF
    const pdfPath = await generateCreditReport(
      applicant.name,
      applicant.pan,
      statement.bank,
      period,
      analysisResult,
      correlationId
    )

    log.info({ pdfPath }, "PDF generated successfully")

    // Save report to database
    await prisma.report.create({
      data: {
        jobId,
        applicantId,
        pdfPath,
        jsonSummary: analysisResult as any,
        avgMonthlyInflow: String(analysisResult.cashFlow.avgMonthlyInflow),
        avgMonthlyOutflow: String(analysisResult.cashFlow.avgMonthlyOutflow),
        totalEmisBurden: String(analysisResult.obligations.totalMonthlyEmiBurden),
        bounceCount: String(analysisResult.riskSignals.bounceCharges.count),
      },
    })

    log.info("Report saved to database")

    // Update job to COMPLETED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })

    log.info("Job marked as COMPLETED")

    return { jobId, pdfPath, correlationId }

  } catch (err) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    })
    throw err
  }
}

export const reportWorker = new Worker<ReportJobData>(
  "report",
  processReportJob,
  {
    connection: bullMQRedis,
    concurrency: 2,
  }
)

reportWorker.on("completed", (job) => {
  const log = createChildLogger(job.data.correlationId)
  log.info({ jobId: job.data.jobId }, "Report job completed")
})

reportWorker.on("failed", (job, err) => {
  const log = createChildLogger(job?.data.correlationId ?? "unknown")
  log.error({ jobId: job?.data.jobId, err }, "Report job failed")
})