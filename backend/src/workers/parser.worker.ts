import { Worker, Job } from "bullmq"
import { bullMQRedis } from "../lib/redis"
import { prisma } from "../db"
import { createChildLogger } from "../lib/logger"
import { extractTextFromPDF } from "../services/parser/pdf.parser"
import { parseHDFCTransactions } from "../services/parser/banks/hdfc"
import { parseSBITransactions } from "../services/parser/banks/sbi"
import { parseICICITransactions } from "../services/parser/banks/icici"
import { ParserJobData } from "../queues/parser.queue"

// Pick the right parser based on bank
const getBankParser = (bank: string) => {
  switch (bank.toLowerCase()) {
    case "hdfc": return parseHDFCTransactions
    case "sbi": return parseSBITransactions
    case "icici": return parseICICITransactions
    default: throw new Error(`Unsupported bank: ${bank}`)
  }
}

const processParserJob = async (job: Job<ParserJobData>) => {
  const { jobId, statementId, filePath, bank, format, correlationId } = job.data
  const log = createChildLogger(correlationId, { jobId, workerId: "parser" })

  log.info("Parser worker started")

  // 1. Update job status to PARSING
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "PARSING", startedAt: new Date() },
  })

  try {
    // 2. Extract raw text from PDF
    log.info({ filePath, format }, "Extracting text from file")
    const rawText = await extractTextFromPDF(filePath, correlationId)

    // 3. Parse transactions using bank-specific parser
    log.info({ bank }, "Parsing transactions")
    const bankParser = getBankParser(bank)
    const rawTransactions = bankParser(rawText)

    log.info({ count: rawTransactions.length }, "Transactions extracted")

    if (rawTransactions.length === 0) {
      throw new Error("No transactions found in statement")
    }

    // 4. Normalize and save transactions to PostgreSQL
    const transactionData = rawTransactions.map((tx) => ({
      statementId,
      date: new Date(tx.date),
      description: tx.description,
      debit: tx.debit ? parseFloat(tx.debit) : null,
      credit: tx.credit ? parseFloat(tx.credit) : null,
      balance: parseFloat(tx.balance),
      rawText: tx.rawText,
    }))

    await prisma.transaction.createMany({
      data: transactionData,
    })

    log.info({ count: transactionData.length }, "Transactions saved to DB")

    // 5. Update job status to PARSED
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "PARSED" },
    })

    log.info("Parser worker completed successfully")

    // 6. Return summary for next worker
    return {
      jobId,
      statementId,
      transactionCount: transactionData.length,
      correlationId,
    }

  } catch (err) {
    // Update job status to FAILED
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

// Create the worker — listens to parser queue
export const parserWorker = new Worker<ParserJobData>(
  "parser",
  processParserJob,
  {
    connection: bullMQRedis,
    concurrency: 3, // process 3 jobs simultaneously
  }
)

parserWorker.on("completed", (job) => {
  const log = createChildLogger(job.data.correlationId)
  log.info({ jobId: job.data.jobId }, "Parser job completed")
})

parserWorker.on("failed", (job, err) => {
  const log = createChildLogger(job?.data.correlationId ?? "unknown")
  log.error({ jobId: job?.data.jobId, err }, "Parser job failed")
})