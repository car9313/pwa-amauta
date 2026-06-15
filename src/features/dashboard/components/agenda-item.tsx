import { Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AgendaItemProps {
  title: string
  subject: string
  time: string
  duration: string
  status: "pending" | "completed" | "in-progress"
  onStart?: () => void
}

const statusConfig = {
  pending: {
    border: "border-l-primary",
    icon: Clock,
    iconColor: "text-primary",
  },
  completed: {
    border: "border-l-emerald-500",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  "in-progress": {
    border: "border-l-accent",
    icon: Clock,
    iconColor: "text-accent",
  },
} as const

export function AgendaItem({
  title,
  subject,
  time,
  duration,
  status,
  onStart,
}: AgendaItemProps) {
  const cfg = statusConfig[status]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        "p-4 bg-card rounded-xl border border-border border-l-4 hover:scale-[1.01] transition-transform duration-200",
        cfg.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon className={cn("h-5 w-5", cfg.iconColor)} />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{subject}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {time} · {duration}
              </span>
            </div>
          </div>
        </div>
        {status === "pending" && onStart && (
          <Button
            onClick={onStart}
            className="bg-primary hover:bg-primary/80 text-white rounded-xl"
          >
            Iniciar
          </Button>
        )}
      </div>
    </div>
  )
}
