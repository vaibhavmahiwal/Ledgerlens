import { RawTransaction } from "../pdf.parser"

// ICICI format:
// S No. | Transaction Date | Value Date | Description | Debit | Credit | Balance
export const parseICICITransactions = (rawText: string): RawTransaction[] => {
  const transactions: RawTransaction[] = []
  const lines = rawText.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const dateMatch = trimmed.match(/(\d{2}-\d{2}-\d{4})/)
    if (!dateMatch) continue

    const parts = trimmed.split(/\s{2,}/).filter(Boolean)
    if (parts.length < 5) continue

    const date = parts[1] || parts[0]
    const description = parts[3] || parts[2] || ""
    const debit = parts[4] || null
    const credit = parts[5] || null
    const balance = parts[6] || parts[5] || ""

    if (description.toLowerCase().includes("description")) continue

    transactions.push({
      date,
      description: description.trim(),
      debit: debit && debit !== "" ? debit.replace(/,/g, "") : null,
      credit: credit && credit !== "" ? credit.replace(/,/g, "") : null,
      balance: balance.replace(/,/g, ""),
      rawText: trimmed,
    })
  }

  return transactions
}