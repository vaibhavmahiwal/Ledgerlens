import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { AnalysisResult } from "../analysis/llm.service"
import { createChildLogger } from "../../lib/logger"

const ensureReportsDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export const generateCreditReport = async (
  applicantName: string,
  pan: string,
  bank: string,
  period: string,
  analysis: AnalysisResult,
  correlationId: string
): Promise<string> => {
  const log = createChildLogger(correlationId)

  const reportsDir = process.env.REPORTS_DIR || "./reports"
  ensureReportsDir(reportsDir)

  const fileName = `report-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
  const filePath = path.join(reportsDir, fileName)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(filePath)

    doc.pipe(stream)

    // ── Header ─────────────────────────────────────────────
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("CREDIT ASSESSMENT REPORT", { align: "center" })
    doc.moveDown(0.5)
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, { align: "center" })
    doc.moveDown(1)

    // ── Applicant Info ─────────────────────────────────────
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("APPLICANT DETAILS")
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica")
    doc.text(`Name: ${applicantName}`)
    doc.text(`PAN: ${pan}`)
    doc.text(`Bank: ${bank.toUpperCase()}`)
    doc.text(`Statement Period: ${period}`)
    doc.moveDown(1)

    // ── Income Analysis ────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").text("INCOME ANALYSIS")
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica")
    doc.text(`Primary Salary: ₹${analysis.income.primarySalary.amount.toLocaleString("en-IN")} / month`)
    doc.text(`Employer: ${analysis.income.primarySalary.employer || "Not identified"}`)
    doc.text(`Consistency Score: ${analysis.income.primarySalary.consistencyScore}/10`)
    doc.text(`Total Monthly Income: ₹${analysis.income.totalMonthlyIncome.toLocaleString("en-IN")}`)

    if (analysis.income.secondaryIncome.length > 0) {
      doc.moveDown(0.3)
      doc.font("Helvetica-Bold").text("Secondary Income:")
      doc.font("Helvetica")
      analysis.income.secondaryIncome.forEach((inc: any) => {
        doc.text(`  • ${inc.description}: ₹${inc.amount?.toLocaleString("en-IN") ?? "-"}`)
      })
    }
    doc.moveDown(1)

    // ── EMI Obligations ────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").text("EMI OBLIGATIONS")
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica")
    if (analysis.obligations.emis.length === 0) {
      doc.text("No EMIs detected")
    } else {
      analysis.obligations.emis.forEach((emi) => {
        doc.text(`  • ${emi.description}: ₹${emi.amount.toLocaleString("en-IN")} / ${emi.frequency}`)
      })
    }
    doc.moveDown(0.3)
    doc
      .font("Helvetica-Bold")
      .text(`Total Monthly EMI Burden: ₹${analysis.obligations.totalMonthlyEmiBurden.toLocaleString("en-IN")}`)
    doc.moveDown(1)

    // ── Risk Signals ───────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").text("RISK SIGNALS")
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica")
    doc.text(`Bounce Charges: ${analysis.riskSignals.bounceCharges.count} occurrences (₹${analysis.riskSignals.bounceCharges.totalAmount.toLocaleString("en-IN")} total)`)
    doc.text(`Low Balance Occurrences: ${analysis.riskSignals.lowBalanceOccurrences}`)
    doc.text(`Cash Withdrawal Ratio: ${analysis.riskSignals.cashWithdrawalRatio}%`)
    doc.text(`Salary Advance Detected: ${analysis.riskSignals.salaryAdvanceDetected ? "Yes ⚠️" : "No"}`)
    doc.moveDown(1)

    // ── Cash Flow Summary ──────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").text("CASH FLOW SUMMARY")
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica")
    doc.text(`Avg Monthly Inflow:  ₹${analysis.cashFlow.avgMonthlyInflow.toLocaleString("en-IN")}`)
    doc.text(`Avg Monthly Outflow: ₹${analysis.cashFlow.avgMonthlyOutflow.toLocaleString("en-IN")}`)
    doc.text(`Avg Closing Balance: ₹${analysis.cashFlow.avgClosingBalance.toLocaleString("en-IN")}`)
    doc.text(`Lowest Balance:      ₹${analysis.cashFlow.lowestBalance.toLocaleString("en-IN")}`)
    doc.text(`Net Monthly Surplus: ₹${analysis.cashFlow.netMonthlySurplus.toLocaleString("en-IN")}`)
    doc.moveDown(1)

    // ── Recommendation ─────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").text("CREDIT RECOMMENDATION")
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica")
    doc.text(`Creditworthiness Score: ${analysis.recommendation.creditworthinessScore}/100`)
    doc.text(`Max Recommended EMI: ₹${analysis.recommendation.maxRecommendedEmi.toLocaleString("en-IN")}`)
    doc.moveDown(0.5)
    doc.font("Helvetica-Bold").text("Summary:")
    doc.font("Helvetica").text(analysis.recommendation.summary, {
      width: 500,
      align: "justify",
    })
    doc.moveDown(1)

    // ── Footer ─────────────────────────────────────────────
    doc
      .fontSize(9)
      .fillColor("grey")
      .text(
        "This report is generated by LedgerLens AI and is intended for internal use only. Not a substitute for professional credit assessment.",
        { align: "center" }
      )

    doc.end()

    stream.on("finish", () => {
      log.info({ filePath }, "PDF report generated")
      resolve(filePath)
    })

    stream.on("error", reject)
  })
}