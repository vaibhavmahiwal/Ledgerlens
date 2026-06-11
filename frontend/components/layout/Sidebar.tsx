"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  LayoutDashboard,
  Upload,
  Briefcase,
  FileText,
  Users,
  Settings,
  LogOut,
  Search,
} from "lucide-react"

const navItems = [
  {
    group: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Upload",    href: "/upload",    icon: Upload },
      { label: "Jobs",      href: "/jobs",      icon: Briefcase },
      { label: "Reports",   href: "/reports",   icon: FileText },
      { label: "Applicants",href: "/applicants",icon: Users },
    ],
  },
  {
    group: "Account",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { logout, getAgent } = useAuth()
  const agent = getAgent()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">LedgerLens</h1>
            <p className="text-xs text-gray-400">Credit Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.group}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              {group.group}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={isActive ? "text-blue-600" : "text-gray-400"}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Agent Info + Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 text-sm font-semibold">
              {agent?.email?.[0]?.toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {agent?.email ?? "Agent"}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {agent?.role ?? "agent"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}