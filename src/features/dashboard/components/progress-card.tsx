interface ProgressCardProps {
  title: string
  progress: number
  color?: "blue" | "green" | "orange"
}

export function ProgressCard({
  title,
  progress,
  color = "blue",
}: ProgressCardProps) {
  const getColor = () => {
    switch (color) {
      case "blue":
        return "bg-[#1F4FA3]"
      case "green":
        return "bg-[#22C55E]"
      case "orange":
        return "bg-[#F2994A]"
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span
          className={`text-sm font-semibold ${
            color === "blue"
              ? "text-[#1F4FA3]"
              : color === "green"
                ? "text-[#22C55E]"
                : "text-[#F2994A]"
          }`}
        >
          {progress}%
        </span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
