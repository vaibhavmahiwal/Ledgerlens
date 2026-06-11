import { JobStatus } from "@/types"

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  QUEUED:     { label: "Queued",     className: "bg-gray-100 text-gray-600"   },
  PARSING:    { label: "Parsing",    className: "bg-blue-100 text-blue-600"   },
  PARSED:     { label: "Parsed",     className: "bg-blue-100 text-blue-600"   },
  ANALYZING:  { label: "Analyzing",  className: "bg-yellow-100 text-yellow-700"},
  ANALYZED:   { label: "Analyzed",   className: "bg-yellow-100 text-yellow-700"},
  GENERATING: { label: "Generating", className: "bg-purple-100 text-purple-600"},
  COMPLETED:  { label: "Completed",  className: "bg-green-100 text-green-700" },
  FAILED:     { label: "Failed",     className: "bg-red-100 text-red-600"     },
}

export default function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status] ?? statusConfig.QUEUED
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}