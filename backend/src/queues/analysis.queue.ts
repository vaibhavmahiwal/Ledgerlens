import { Queue } from "bullmq"
import { bullMQRedis } from "../lib/redis"

export interface AnalysisJobData {
  jobId: string
  statementId: string
  applicantId: string
  correlationId: string
}

export const analysisQueue = new Queue<AnalysisJobData>("analysis", {
  connection: bullMQRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})