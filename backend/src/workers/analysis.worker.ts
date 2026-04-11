import { Worker, Job } from "bullmq"
import { bullMQRedis } from "../lib/redis"
import { prisma } from "../db"
import { createChildLogger } from "../lib/logger"
import { buildAnalysisPrompt } from "../services/analysis/prompt"
import { analyzeTransactions } from "../services/analysis/llm.service"
import { AnalysisJobData } from "../queues/analysis.queue"
import { reportQueue } from "../queues/report.queue"

const processAnalysisJob = async (job: Job<AnalysisJobData>) => {
  const { jobId, statementId, applicantId, correlationId } = job.data
  const log = createChildLogger(correlationId, { jobId, workerId: "analysis" })

  log.info("Analysis worker started")

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "ANALYZING" },
  })

  try {
    const transactions = await prisma.transaction.findMany({
      where: { statementId },
      orderBy: { date: "asc" },
    })

    log.info({ count: transactions.length }, "Transactions fetched")

    if (transactions.length === 0) {
      throw new Error("No transactions found for analysis")
    }

    const prompt = buildAnalysisPrompt(transactions)

    const analysisResult = await analyzeTransactions(
      transactions,
      prompt,
      correlationId
    )

    log.info(
      {
        salary: analysisResult.income.primarySalary.amount,
        totalEmis: analysisResult.obligations.totalMonthlyEmiBurden,
        score: analysisResult.recommendation.creditworthinessScore,
      },
      "Analysis complete"
    )

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "ANALYZED" },
    })

    await reportQueue.add("generate", {
      jobId,
      statementId,
      applicantId,
      analysisResult,
      correlationId,
    })

    log.info({ jobId }, "Job pushed to report queue")

    return { jobId, correlationId, analysisResult }

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

export const analysisWorker = new Worker<AnalysisJobData>(
  "analysis",
  processAnalysisJob,
  {
    connection: bullMQRedis,
    concurrency: 2,
  }
)

analysisWorker.on("completed", (job) => {
  const log = createChildLogger(job.data.correlationId)
  log.info({ jobId: job.data.jobId }, "Analysis job completed")
})

analysisWorker.on("failed", (job, err) => {
  const log = createChildLogger(job?.data.correlationId ?? "unknown")
  log.error({ jobId: job?.data.jobId, err }, "Analysis job failed")
})