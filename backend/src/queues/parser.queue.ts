import { Queue } from "bullmq"
import { bullMQRedis } from "../lib/redis"

export interface ParserJobData {
  jobId: string
  statementId: string
  applicantId: string
  filePath: string
  bank: string
  format: string
  correlationId: string
}

export const parserQueue = new Queue<ParserJobData>("parser", {
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

//This file sets up a Background Task Manager using BullMQ and Redis.
//ParserJobData:This interface defines exactly what information must be
//  included whenever you ask the system to parse a file
//parserQueue (The Manager): This creates the actual queue named "parser".
//  When you upload a bank statement, you'll "add" a job here
//connection: redis: BullMQ uses Redis (an ultra-fast in-memory database)
//  to keep track of the jobs even if the server restarts.