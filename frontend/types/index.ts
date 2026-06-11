export type JobStatus =
  | "QUEUED"
  | "PARSING"
  | "PARSED"
  | "ANALYZING"
  | "ANALYZED"
  | "GENERATING"
  | "COMPLETED"
  | "FAILED"

export interface Job {
  id: string
  status: JobStatus
  correlationId: string
  retryCount: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  applicant: {
    id: string
    name: string
    pan: string
  }
  statement: {
    id: string
    bank: string
    months: number
    format: string
  }
  report: {
    id: string
    avgMonthlyInflow: string | null
    totalEmisBurden: string | null
    bounceCount: string | null
    creditScore: number | null
    downloadUrl: string
  } | null
}

export interface Applicant {
  id: string
  name: string
  pan: string
  phone: string
  agentId: string
  totalStatements: number
  totalReports: number
  lastBank: string | null
  lastUpload: string | null
  createdAt: string
}

export interface Report {
  id: string
  applicant: string
  pan: string
  avgMonthlyInflow: string | null
  avgMonthlyOutflow: string | null
  totalEmisBurden: string | null
  bounceCount: string | null
  generatedAt: string
  downloadUrl: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}