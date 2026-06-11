"use client"

import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"

const pageTitles: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/upload":     "Upload Statement",
  "/jobs":       "Jobs",
  "/reports":    "Reports",
  "/applicants": "Applicants",
  "/settings":   "Settings",
}

export default function Navbar() {
  const pathname = usePathname()

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? "LedgerLens"

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative">
          <Bell size={18} className="text-gray-500" />
        </button>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    </header>
  )
}