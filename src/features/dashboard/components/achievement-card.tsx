import { Trophy, Star, Target } from "lucide-react"

interface AchievementCardProps {
  type: "streak" | "level" | "accuracy"
  title: string
  description: string
}

export function AchievementCard({
  type,
  title,
  description,
}: AchievementCardProps) {
  const getIcon = () => {
    switch (type) {
      case "streak":
        return <Trophy className="h-8 w-8 text-[#F2994A]" />
      case "level":
        return <Star className="h-8 w-8 text-[#F2994A]" />
      case "accuracy":
        return <Target className="h-8 w-8 text-red-500" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case "streak":
        return "bg-[#FDE8D6]"
      case "level":
        return "bg-[#FDE8D6]"
      case "accuracy":
        return "bg-red-100"
    }
  }

  return (
    <div className="flex flex-col items-center p-4 bg-card rounded-2xl shadow-sm border border-border min-w-[120px]">
      <div className={`p-3 rounded-full ${getIconBg()} mb-2`}>
        {getIcon()}
      </div>
      <span className="text-sm font-semibold text-foreground text-center">
        {title}
      </span>
      <span className="text-xs text-muted-foreground text-center">
        {description}
      </span>
    </div>
  )
}
