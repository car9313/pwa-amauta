import { Trophy, Star, Target } from "lucide-react"

interface StatCardProps {
  type: "points" | "level" | "accuracy"
  value: string | number
  label: string
}

export function StatCard({ type, value, label }: StatCardProps) {
  const getIcon = () => {
    switch (type) {
      case "points":
        return <Trophy className="h-6 w-6 text-[#F2994A]" />
      case "level":
        return <Star className="h-6 w-6 text-[#1F4FA3]" />
      case "accuracy":
        return <Target className="h-6 w-6 text-[#22C55E]" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case "points":
        return "bg-[#FDE8D6]"
      case "level":
        return "bg-[#E7EEFB]"
      case "accuracy":
        return "bg-green-100"
    }
  }

  return (
    <div className="flex flex-col items-center p-4 bg-card rounded-2xl shadow-sm border border-border">
      <div className={`p-3 rounded-full ${getIconBg()} mb-2`}>
        {getIcon()}
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
