import { Worker, Job } from "bullmq"
import { bullMQRedis } from "../lib/redis"
import { prisma } from "../db"
import { createChildLogger } from "../lib/logger"
import { extractTextFromPDF } from "../services/parser/pdf.parser"
import { parseHDFCTransactions } from "../services/parser/banks/hdfc"
import { parseSBITransactions } from "../services/parser/banks/sbi"
import { parseICICITransactions } from "../services/parser/banks/icici"
import { parseCSVTransactions } from "../services/parser/csv.parser"
import { ParserJobData } from "../queues/parser.queue"


const parseIndianDate = (dateStr: string): Date => {
  // Handle DD/MM/YYYY format
  const parts = dateStr.split("/")
  if (parts.length === 3) {
    const [day, month, year] = parts
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
  }
  // Fallback
  return new Date(dateStr)
}

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

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "PARSING", startedAt: new Date() },
  })

  try {
    // Extract transactions based on format
    let rawTransactions

    if (format === "csv") {
      log.info({ filePath }, "Parsing CSV file")
      rawTransactions = parseCSVTransactions(filePath, correlationId)
    } else {
      log.info({ filePath }, "Extracting text from PDF")
      const rawText = await extractTextFromPDF(filePath, correlationId)
      const bankParser = getBankParser(bank)
      rawTransactions = bankParser(rawText)
    }

    log.info({ count: rawTransactions.length }, "Transactions extracted")

    if (rawTransactions.length === 0) {
      throw new Error("No transactions found in statement")
    }

    // Save to database
    const transactionData = rawTransactions.map((tx) => ({
  statementId,
  date: parseIndianDate(tx.date),   
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

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "PARSED" },
    })

    log.info("Parser worker completed successfully")

    return { jobId, statementId, transactionCount: transactionData.length, correlationId }

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

export const parserWorker = new Worker<ParserJobData>(
  "parser",
  processParserJob,
  { connection: bullMQRedis, concurrency: 3 }
)

parserWorker.on("completed", (job) => {
  const log = createChildLogger(job.data.correlationId)
  log.info({ jobId: job.data.jobId }, "Parser job completed")
})

parserWorker.on("failed", (job, err) => {
  const log = createChildLogger(job?.data.correlationId ?? "unknown")
  log.error({ jobId: job?.data.jobId, err }, "Parser job failed")
})