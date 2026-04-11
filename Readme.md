# LedgerLens 🔍
### AI-Powered Bank Statement Intelligence for Indian NBFCs and Loan DSAs

> Transforming raw bank statements into structured credit intelligence — in under 90 seconds instead of 60 minutes.

---

## The Problem

India has over **50 million active loan applications** processed annually by NBFCs, cooperative banks, and independent DSAs (Direct Selling Agents). Every single one requires a manual bank statement analysis.

A typical loan agent receives 6–12 months of bank statements per applicant — anywhere from 100 to 400 transactions — and manually reads through every line looking for:

- Is salary coming every month? Same amount?
- How many EMIs are already running?
- Did any cheque bounce? How many times?
- Is the balance always near zero at month end?
- What's the cash withdrawal ratio vs. digital spend?

**This takes 45–90 minutes per applicant.** A DSA handling 15 applicants per day spends their entire working day just reading bank statements. They make mistakes. They miss things. They get tired.

There is no affordable software solving this for India's Tier 2 and Tier 3 lending ecosystem. Enterprise credit bureau tools cost lakhs per year. Most DSAs are still doing this in Excel — or worse, on paper.

**LedgerLens is the missing operations layer.** It accepts a bank statement, processes it through an async AI pipeline, and delivers a structured credit brief PDF — automatically, in under 90 seconds.

---

## How It Works

```
DSA uploads bank statement (PDF or CSV)
              ↓
    Express API validates & saves file
              ↓
    Job queued in BullMQ (Redis-backed)
              ↓
    Parser Worker extracts transactions
    (bank-specific normalizers for HDFC, SBI, ICICI)
              ↓
    Analysis Worker sends to Groq LLM
    (llama-3.3-70b extracts income, EMIs, risk signals)
              ↓
    Report Worker generates PDF via PDFKit
              ↓
    DSA downloads structured credit brief
```

Each stage runs in a dedicated worker process, decoupled from the API server. If the API goes down, jobs keep processing. If a worker crashes, BullMQ retries automatically. Zero job loss guaranteed by Redis AOF persistence.

---

## Key Features

### AI-Powered Credit Analysis (Groq LLaMA 3.3 70B)
- **Income Detection**: Identifies primary salary, frequency, employer, and consistency score (0–10)
- **EMI Extraction**: Detects recurring debits matching EMI patterns — payee, amount, first seen date
- **Risk Signals**: Bounce charges, low-balance occurrences, cash withdrawal ratios, salary advance detection
- **Cash Flow Summary**: Average monthly inflow/outflow, closing balance trends, net surplus
- **Credit Recommendation**: Creditworthiness score (0–100) and maximum recommended EMI ceiling

### Enterprise-Grade Distributed Architecture
- **Decoupled API & Worker Tiers**: API server handles HTTP, dedicated workers handle parsing, AI analysis, and PDF generation independently
- **3-Queue System**: Separate `parser`, `analysis`, and `report` queues with different concurrency settings tuned to each workload's characteristics
- **Robust Queueing**: BullMQ + Redis with AOF persistence — jobs survive crashes and restarts
- **Automatic Retries**: Exponential backoff on failures with configurable retry limits per queue
- **Data Layer**: PostgreSQL with Prisma ORM for type-safe, relational data storage

### Multi-Bank Support
- HDFC Bank statement format
- SBI statement format
- ICICI Bank statement format
- CSV and PDF ingestion supported

### Security & Observability
- **Correlation IDs**: Auto-generated UUID threads through every log line — across HTTP request, queue job, and all three worker boundaries. Full audit trail for financial data
- **Structured Logging**: Pino logger with child loggers per request/job — production-ready JSON logs
- **Error Tracking**: Sentry integration for real-time crash alerts and non-operational error detection
- **Security Headers**: Helmet middleware, Zod input validation on all endpoints, rate limiting
- **Graceful Shutdown**: SIGTERM handling ensures in-flight jobs complete before process exits

### Instant PDF Reports
- Professional credit brief generated via PDFKit
- Includes: income analysis, EMI table, risk signals, cash flow summary, credit recommendation
- Named with applicant PAN for easy filing

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js & TypeScript |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Queue / Cache** | Redis & BullMQ |
| **AI Engine** | Groq LLaMA 3.3 70B |
| **Observability** | Sentry & Pino (with Correlation IDs) |
| **Security** | Helmet, Zod validation |
| **PDF Generation** | PDFKit |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Express API Server                 │
│  POST /upload  │  GET /status/:id  │  GET /health   │
└──────────────────────┬──────────────────────────────┘
                       │ Enqueue job
                       ▼
┌─────────────────────────────────────────────────────┐
│              Redis (BullMQ + AOF Persistence)        │
│   parser-queue  │  analysis-queue  │  report-queue  │
└──────┬──────────────────┬────────────────┬──────────┘
       ▼                  ▼                ▼
┌──────────────┐  ┌───────────────┐  ┌────────────────┐
│ Parser Worker│  │Analysis Worker│  │ Report Worker  │
│ PDF/CSV →    │  │ Transactions →│  │ JSON → PDFKit  │
│ Transactions │  │ Groq LLM →   │  │ → Credit Brief │
│              │  │ JSON Summary  │  │                │
└──────┬───────┘  └───────┬───────┘  └────────┬───────┘
       │                  │                   │
       └──────────────────┴───────────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │   PostgreSQL (via Prisma)     │
          │  Applicants │ Statements     │
          │  Transactions │ Jobs         │
          │  Reports                     │
          └───────────────────────────────┘
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/           # Zod-validated env vars
│   ├── routes/           # Express route handlers
│   ├── middleware/        # correlationId, errorHandler, upload, auth
│   ├── workers/          # parser, analysis, report workers
│   ├── queues/           # BullMQ queue definitions
│   ├── services/
│   │   ├── parser/       # PDF/CSV extractors + bank normalizers
│   │   ├── analysis/     # Groq LLM service + prompt engineering
│   │   └── report/       # PDFKit report generation
│   ├── db/               # Prisma client
│   ├── validators/       # Zod schemas
│   ├── lib/              # logger, redis, errors, sentry
│   └── types/            # shared TypeScript types
├── prisma/
│   └── schema.prisma     # DB schema (5 models)
├── index.ts              # API server entry point
├── worker.ts             # Worker process entry point
└── docker-compose.yml    # PostgreSQL + Redis
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/vaibhavmahiwal/Ledgerlens.git
cd Ledgerlens/backend

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env
```

### Environment Variables

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ledgerlens
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your-groq-api-key
JWT_SECRET=your-jwt-secret
UPLOAD_DIR=./uploads
REPORTS_DIR=./reports
```

### Start Infrastructure

```bash
docker-compose up -d
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start the Application

Open two terminals:

```bash
# Terminal 1 — API Server
npx tsx index.ts

# Terminal 2 — Worker Process
npx tsx worker.ts
```

---

## API Reference

### Core Operations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/statements/upload` | Upload bank statement (PDF or CSV) |
| `GET` | `/api/v1/statements/status/:jobId` | Poll job processing status |
| `GET` | `/api/v1/reports/:reportId` | Get report summary JSON |
| `GET` | `/api/v1/reports/:reportId/download` | Download credit brief PDF |
| `GET` | `/health` | System health check |

### Upload Statement

```
POST /api/v1/statements/upload
Content-Type: multipart/form-data

Fields:
  statement   → File   (PDF or CSV)
  name        → string (Applicant full name)
  pan         → string (PAN card number e.g. ABCDE1234F)
  phone       → string (10-digit Indian mobile)
  agentId     → string (DSA agent identifier)
  bank        → string (hdfc | sbi | icici)
  periodStart → string (YYYY-MM-DD)
  periodEnd   → string (YYYY-MM-DD)
  months      → number (1–24)
```

**Response:**
```json
{
  "message": "Statement uploaded successfully. Processing started.",
  "jobId": "uuid",
  "applicantId": "uuid",
  "statementId": "uuid",
  "correlationId": "uuid"
}
```

### Poll Job Status

```
GET /api/v1/statements/status/:jobId
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "COMPLETED",
  "correlationId": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "completedAt": "2024-01-01T00:01:30Z",
  "errorMessage": null
}
```

**Job Status Flow:**
```
QUEUED → PARSING → PARSED → ANALYZING → ANALYZED → GENERATING → COMPLETED
                                                               → FAILED
```

### Download Report

```
GET /api/v1/reports/:reportId/download
```

Returns a PDF file — credit brief ready to share with lender.

---

## Job Status Flow

```
Upload received
      ↓
   QUEUED          Job created in DB, pushed to parser queue
      ↓
   PARSING         Parser worker picked up job
      ↓
   PARSED          Transactions extracted and saved to DB
      ↓
   ANALYZING       Analysis worker calling Groq LLM
      ↓
   ANALYZED        JSON summary received and saved
      ↓
   GENERATING      Report worker generating PDF
      ↓
   COMPLETED       PDF saved, report record created
```

---

## Sample Credit Report Output

```
CREDIT ASSESSMENT REPORT
Generated: 12/04/2026

APPLICANT DETAILS
Name: Ramesh Sharma
PAN: ABCDE1234F
Bank: HDFC
Statement Period: 01/11/2024 - 31/12/2024

INCOME ANALYSIS
Primary Salary: ₹85,000 / month
Employer: INFOSYS LTD
Consistency Score: 9/10
Total Monthly Income: ₹1,02,500

EMI OBLIGATIONS
• HDFC Car Loan: ₹8,200 / monthly
• Bajaj Finserv: ₹11,300 / monthly
Total Monthly EMI Burden: ₹19,500

RISK SIGNALS
Bounce Charges: 2 occurrences (₹1,000 total)
Low Balance Occurrences: 0
Cash Withdrawal Ratio: 18%
Salary Advance Detected: No

CASH FLOW SUMMARY
Avg Monthly Inflow:  ₹1,02,500
Avg Monthly Outflow: ₹45,000
Avg Closing Balance: ₹1,25,000
Lowest Balance:      ₹83,950
Net Monthly Surplus: ₹57,500

CREDIT RECOMMENDATION
Creditworthiness Score: 74/100
Max Recommended EMI: ₹23,000
Summary: Applicant shows consistent salary income from Infosys
with good repayment history. Two existing EMIs detected totaling
₹19,500 per month. Overall profile is creditworthy.
```

---

## Observability

Every request generates a `correlationId` that threads through the entire pipeline:

```
[INFO] correlationId: abc-123 → Statement uploaded
[INFO] correlationId: abc-123 → Job queued in parser queue
[INFO] correlationId: abc-123 → Parser worker started
[INFO] correlationId: abc-123 → 20 transactions extracted
[INFO] correlationId: abc-123 → Job pushed to analysis queue
[INFO] correlationId: abc-123 → Sending to Groq LLM
[INFO] correlationId: abc-123 → Analysis complete — score: 74
[INFO] correlationId: abc-123 → PDF report generated
[INFO] correlationId: abc-123 → Job marked as COMPLETED
```

When something goes wrong, search the correlationId across logs to instantly pinpoint exactly where and why.

---

## License

MIT