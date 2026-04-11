import { RawTransaction } from "../pdf.parser"

// HDFC statement format:
// Date | Narration | Chq/Ref | Value Date | Withdrawal | Deposit | Closing Balance
// 01/11/24 | NEFT-SALARY | 123456 | 01/11/24 | | 85000.00 | 112400.00

export const parseHDFCTransactions = (rawText: string): RawTransaction[] => {
  const transactions: RawTransaction[] = []
  const lines = rawText.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Match HDFC date pattern DD/MM/YY or DD/MM/YYYY
    const dateMatch = trimmed.match(/^(\d{2}\/\d{2}\/\d{2,4})/)
    if (!dateMatch) continue

    // Split by multiple spaces (HDFC uses space-padding)
    const parts = trimmed.split(/\s{2,}/).filter(Boolean)
    if (parts.length < 5) continue

    const date = parts[0]
    const description = parts[1] || ""
    const withdrawal = parts[3] || null   // debit
    const deposit = parts[4] || null      // credit
    const balance = parts[5] || parts[4]  // closing balance

    // Skip header rows
    if (description.toLowerCase().includes("narration")) continue
    if (description.toLowerCase().includes("opening balance")) continue

    transactions.push({
      date,
      description: description.trim(),
      debit: withdrawal && withdrawal !== "" ? withdrawal.replace(/,/g, "") : null,
      credit: deposit && deposit !== "" ? deposit.replace(/,/g, "") : null,
      balance: balance.replace(/,/g, ""),
      rawText: trimmed,
    })
  }

  return transactions
}