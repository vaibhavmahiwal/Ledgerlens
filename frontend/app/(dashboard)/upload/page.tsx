"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { uploadStatement } from "@/lib/api/statements"
import {
  Upload, FileText, Table, ClipboardList,
  CheckCircle, Loader2, AlertCircle, X
} from "lucide-react"

const uploadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format e.g. ABCDE1234F"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  agentId: z.string().min(1, "Agent ID is required"),
  bank: z.enum(["hdfc", "sbi", "icici"], {
    required_error: "Please select a bank",
  }),
  periodStart: z.string().min(1, "Start date is required"),
  periodEnd: z.string().min(1, "End date is required"),
  months: z.string().min(1, "Please select months"),
})

type UploadForm = z.infer<typeof uploadSchema>
type UploadTab = "pdf" | "csv" | "paste"

export default function UploadPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UploadTab>("csv")
  const [file, setFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { agentId: "agent_001" },
  })

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async (data: UploadForm) => {
      const formData = new FormData()

      // Append all text fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })

      // Append file
      if (activeTab === "paste") {
        const blob = new Blob([pasteText], { type: "text/csv" })
        formData.append("statement", blob, "pasted-statement.csv")
      } else if (file) {
        formData.append("statement", file)
      }

      return uploadStatement(formData)
    },
    onSuccess: (data) => {
      router.push(`/jobs/${data.jobId}`)
    },
  })

  const onSubmit = (data: UploadForm) => {
    if (activeTab !== "paste" && !file) return
    if (activeTab === "paste" && !pasteText.trim()) return
    mutate(data)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const tabs = [
    { id: "pdf" as UploadTab,   label: "PDF",   icon: FileText      },
    { id: "csv" as UploadTab,   label: "CSV",   icon: Table         },
    { id: "paste" as UploadTab, label: "Paste", icon: ClipboardList },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Bank Statement</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the applicant details and upload their bank statement
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Applicant Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Applicant Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                {...register("name")}
                placeholder="Ramesh Sharma"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                PAN Number
              </label>
              <input
                {...register("pan")}
                placeholder="ABCDE1234F"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                style={{ textTransform: "uppercase" }}
              />
              {errors.pan && (
                <p className="text-red-500 text-xs mt-1">{errors.pan.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                {...register("phone")}
                placeholder="9876543210"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Agent ID
              </label>
              <input
                {...register("agentId")}
                placeholder="agent_001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.agentId && (
                <p className="text-red-500 text-xs mt-1">{errors.agentId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Statement Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Statement Details
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bank
              </label>
              <select
                {...register("bank")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select bank</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="sbi">SBI</option>
                <option value="icici">ICICI Bank</option>
              </select>
              {errors.bank && (
                <p className="text-red-500 text-xs mt-1">{errors.bank.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Months
              </label>
              <select
                {...register("months")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select</option>
                {[3, 6, 9, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>{m} months</option>
                ))}
              </select>
              {errors.months && (
                <p className="text-red-500 text-xs mt-1">{errors.months.message}</p>
              )}
            </div>

            <div>
              {/* spacer */}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Period Start
              </label>
              <input
                {...register("periodStart")}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.periodStart && (
                <p className="text-red-500 text-xs mt-1">{errors.periodStart.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Period End
              </label>
              <input
                {...register("periodEnd")}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.periodEnd && (
                <p className="text-red-500 text-xs mt-1">{errors.periodEnd.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Method */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Upload Method
          </h2>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setFile(null) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* PDF / CSV Dropzone */}
          {(activeTab === "pdf" || activeTab === "csv") && (
            <div>
              {!file ? (
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <Upload size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {activeTab === "pdf" ? "PDF files only" : "CSV files only"} • Max 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={activeTab === "pdf" ? ".pdf" : ".csv"}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl p-4">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === "paste" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Copy transactions from your bank's netbanking portal and paste below
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Date,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n01/11/2024,NEFT-SALARY-INFOSYS,,85000.00,112400.00\n03/11/2024,UPI-AMAZON PAY,1500.00,,110900.00`}
                rows={8}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Format: CSV with headers — Date, Narration, Withdrawal Amt, Deposit Amt, Closing Balance
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {isError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              {(error as any)?.response?.data?.error ?? "Upload failed. Please try again."}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || (activeTab !== "paste" && !file) || (activeTab === "paste" && !pasteText.trim())}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading & Processing...
            </>
          ) : (
            <>
              <Upload size={16} />
              Analyze Statement →
            </>
          )}
        </button>

      </form>
    </div>
  )
}