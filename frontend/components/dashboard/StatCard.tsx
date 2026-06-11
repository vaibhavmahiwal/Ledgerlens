import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: "blue" | "green" | "yellow" | "red"
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   value: "text-blue-700"   },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  value: "text-green-700"  },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", value: "text-yellow-700" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    value: "text-red-700"    },
}

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className={`${c.bg} p-3 rounded-lg`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
      </div>
    </div>
  )
}