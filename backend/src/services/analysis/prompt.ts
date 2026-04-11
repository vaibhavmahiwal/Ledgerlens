export const buildAnalysisPrompt = (transactions: any[]): string => {
  const transactionText = transactions
    .map(
      (tx) =>
        `${tx.date.toISOString().split("T")[0]} | ${tx.description} | Debit: ${tx.debit ?? "-"} | Credit: ${tx.credit ?? "-"} | Balance: ${tx.balance}`
    )
    .join("\n")

  return `You are a senior credit analyst at an Indian NBFC. Analyze the following bank transactions and extract structured financial intelligence.

TRANSACTIONS:
${transactionText}

Analyze these transactions and return ONLY a valid JSON object with NO additional text, markdown, or explanation. Return exactly this structure:

{
  "income": {
    "primarySalary": {
      "amount": 0,
      "frequency": "monthly",
      "consistencyScore": 0,
      "employer": ""
    },
    "secondaryIncome": [],
    "totalMonthlyIncome": 0
  },
  "obligations": {
    "emis": [
      {
        "description": "",
        "amount": 0,
        "frequency": "monthly"
      }
    ],
    "totalMonthlyEmiBurden": 0
  },
  "riskSignals": {
    "bounceCharges": {
      "count": 0,
      "totalAmount": 0
    },
    "lowBalanceOccurrences": 0,
    "cashWithdrawalRatio": 0,
    "salaryAdvanceDetected": false
  },
  "cashFlow": {
    "avgMonthlyInflow": 0,
    "avgMonthlyOutflow": 0,
    "avgClosingBalance": 0,
    "lowestBalance": 0,
    "netMonthlySurplus": 0
  },
  "recommendation": {
    "maxRecommendedEmi": 0,
    "creditworthinessScore": 0,
    "summary": ""
  }
}

Rules:
- consistencyScore: 0-10, where 10 means salary came every month same amount
- creditworthinessScore: 0-100
- cashWithdrawalRatio: percentage of total debits that are cash withdrawals
- maxRecommendedEmi: based on 40% of net monthly surplus
- summary: 2-3 sentence plain English assessment
- All amounts in INR numbers, no commas or currency symbols
- Return ONLY the JSON, nothing else`
}