"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Briefcase, CheckCircle, Loader, XCircle, Upload, ArrowRight
} from "lucide-react"
import { getJobs } from "@/lib/api/statements"
import StatCard from "@/components/dashboard/StatCard"
import JobStatusBadge from "@/components/dashboard/JobStatusBadge"
import { Job, JobStatus } from "@/types"

export default function DashboardPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "recent"],
    queryFn: () => getJobs({ page: 1, limit: 8 }),
  })

  const jobs: Job[] = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  const completed = jobs.filter((j) => j.status === "COMPLETED").length
  const processing = jobs.filter((j) =>
    ["QUEUED", "PARSING", "PARSED", "ANALYZING", "ANALYZED", "GENERATING"].includes(j.status)
  ).length
  const failed = jobs.filter((j) => j.status === "FAILED").length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Here's what's happening today
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Upload size={16} />
          Upload Statement
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs"  value={total}      icon={Briefcase}    color="blue"   />
        <StatCard label="Completed"   value={completed}  icon={CheckCircle}  color="green"  />
        <StatCard label="Processing"  value={processing} icon={Loader}       color="yellow" />
        <StatCard label="Failed"      value={failed}     icon={XCircle}      color="red"    />
      </div>

      {/* Recent Jobs */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Jobs</h2>
          <Link
            href="/jobs"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <Loader size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No jobs yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload a bank statement to get started
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={14} />
              Upload Statement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                    Applicant
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                    Bank
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                    Score
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {job.applicant?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {job.applicant?.pan ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 uppercase">
                        {job.statement?.bank ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <JobStatusBadge status={job.status as JobStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {job.report?.creditScore
                          ? `${job.report.creditScore}/100`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {job.status === "COMPLETED" && job.report ? (
                        <Link
                          href={`/reports/${job.report.id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          View Report
                        </Link>
                      ) : (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          Track
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}