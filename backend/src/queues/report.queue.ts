import { Queue } from "bullmq"
import { bullMQRedis } from "../lib/redis"
import { AnalysisResult } from "../services/analysis/llm.service"

export interface ReportJobData {
  jobId: string
  statementId: string
  applicantId: string
  analysisResult: AnalysisResult
  correlationId: string
}

export const reportQueue = new Queue<ReportJobData>("report", {
  connection: bullMQRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})