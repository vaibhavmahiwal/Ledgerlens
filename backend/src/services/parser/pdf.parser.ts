const pdfParse = require("pdf-parse")
import fs from "fs"
import { createChildLogger } from "../../lib/logger"

export interface RawTransaction {
  date: string
  description: string
  debit: string | null
  credit: string | null
  balance: string
  rawText: string
}

export async function extractTextFromPDF(
  filePath: string,
  correlationId: string
): Promise<string> {
  const log = createChildLogger(correlationId)
  const fileBuffer = fs.readFileSync(filePath)
  const data = await pdfParse(fileBuffer)
  log.info({ pages: data.numpages, chars: data.text.length }, "PDF text extracted")
  return data.text
}