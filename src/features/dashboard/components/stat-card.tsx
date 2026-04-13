import { useEffect, useState } from "react"
import { Trophy, Star, Target } from "lucide-react"

interface StatCardProps {
  type: "points" | "level" | "accuracy"
  value: string | number
  label: string
  delay?: number
}

export function StatCard({ type, value, label, delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 150)
    return () => clearTimeout(timer)
  }, [delay])

  const getIcon = () => {
    switch (type) {
      case "points":
        return <Trophy className="h-6 w-6" />
      case "level":
        return <Star className="h-6 w-6" />
      case "accuracy":
        return <Target className="h-6 w-6" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case "points":
        return "bg-orange-50 text-orange-500"
      case "level":
        return "bg-blue-50 text-blue-600"
      case "accuracy":
        return "bg-green-50 text-green-600"
    }
  }

  const getIconGlow = () => {
    switch (type) {
      case "points":
        return "group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
      case "level":
        return "group-hover:shadow-[0_0_20px_rgba(31,79,163,0.3)]"
      case "accuracy":
        return "group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
    }
  }

  return (
    <div 
      className={`
        group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100
        transition-all duration-500 ease-out
        hover-lift hover-glow
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${getIconGlow()}
      `}
    >
      {/* Animated pulse on hover */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300
        group-hover:opacity-100
        ${type === 'points' ? 'bg-orange-50/50' : type === 'level' ? 'bg-blue-50/50' : 'bg-green-50/50'}
      `} />

      <div className="relative z-10 flex flex-col items-center">
        <div className={`
          mb-2 flex h-12 w-12 items-center justify-center rounded-xl
          transition-transform duration-300 group-hover:scale-110
          ${getIconBg()}
        `}>
          {getIcon()}
        </div>
        
        <span className={`
          text-2xl font-bold tabular-nums tracking-tight
          transition-all duration-300 group-hover:scale-105
          ${type === 'points' ? 'text-orange-600' : type === 'level' ? 'text-blue-600' : 'text-green-600'}
        `}>
          {value}
        </span>
        
        <span className="mt-1 text-sm font-medium text-slate-500">
          {label}
        </span>
      </div>
    </div>
  )
}