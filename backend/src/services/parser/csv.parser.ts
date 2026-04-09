import fs from "fs"
import { parse } from "csv-parse/sync"
import { RawTransaction } from "./pdf.parser"
import { createChildLogger } from "../../lib/logger"

export const parseCSVTransactions = (
  filePath: string,
  correlationId: string
): RawTransaction[] => {
  const log = createChildLogger(correlationId)

  const fileContent = fs.readFileSync(filePath, "utf-8")

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  log.info({ count: records.length }, "CSV records read")

  const transactions: RawTransaction[] = records.map((row: any) => ({
    date: row["Date"] || row["date"],
    description: row["Narration"] || row["Description"] || row["description"],
    debit: row["Withdrawal Amt"] || row["Debit"] || null,
    credit: row["Deposit Amt"] || row["Credit"] || null,
    balance: row["Closing Balance"] || row["Balance"],
    rawText: JSON.stringify(row),
  }))

  return transactions.filter((tx) => tx.date && tx.description)
}