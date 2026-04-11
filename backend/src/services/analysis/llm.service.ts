import Groq from "groq-sdk"
import { config } from "../../config"
import { createChildLogger } from "../../lib/logger"

const groq = new Groq({
  apiKey: config.GROQ_API_KEY,
})

export interface AnalysisResult {
  income: {
    primarySalary: {
      amount: number
      frequency: string
      consistencyScore: number
      employer: string
    }
    secondaryIncome: any[]
    totalMonthlyIncome: number
  }
  obligations: {
    emis: Array<{
      description: string
      amount: number
      frequency: string
    }>
    totalMonthlyEmiBurden: number
  }
  riskSignals: {
    bounceCharges: {
      count: number
      totalAmount: number
    }
    lowBalanceOccurrences: number
    cashWithdrawalRatio: number
    salaryAdvanceDetected: boolean
  }
  cashFlow: {
    avgMonthlyInflow: number
    avgMonthlyOutflow: number
    avgClosingBalance: number
    lowestBalance: number
    netMonthlySurplus: number
  }
  recommendation: {
    maxRecommendedEmi: number
    creditworthinessScore: number
    summary: string
  }
}

export const analyzeTransactions = async (
  transactions: any[],
  prompt: string,
  correlationId: string
): Promise<AnalysisResult> => {
  const log = createChildLogger(correlationId)

  log.info({ transactionCount: transactions.length }, "Sending to Groq")

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // free, fast, great at JSON
    messages: [
      {
        role: "system",
        content: "You are a senior credit analyst. Always respond with valid JSON only. No markdown, no explanation, just raw JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1,      // low temperature = more consistent JSON output
    max_tokens: 2000,
    response_format: { type: "json_object" }, // forces JSON output
  })

  log.info(
    {
      model: completion.model,
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
    },
    "Groq response received"
  )

  const responseText = completion.choices[0]?.message?.content ?? ""

  if (!responseText) {
    throw new Error("Groq returned empty response")
  }

  try {
    const parsed = JSON.parse(responseText) as AnalysisResult
    log.info("Groq response parsed successfully")
    return parsed
  } catch (err) {
    log.error({ response: responseText }, "Failed to parse Groq response")
    throw new Error("Groq returned invalid JSON")
  }
}