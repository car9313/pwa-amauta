import { Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AgendaItemProps {
  title: string
  subject: string
  time: string
  duration: string
  status: "pending" | "completed" | "in-progress"
  onStart?: () => void
}

export function AgendaItem({
  title,
  subject,
  time,
  duration,
  status,
  onStart,
}: AgendaItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "border-l-[#1F4FA3]"
      case "completed":
        return "border-l-[#22C55E]"
      case "in-progress":
        return "border-l-[#F2994A]"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-[#1F4FA3]" />
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-[#F2994A]" />
    }
  }

  return (
    <div
      className={`p-4 bg-card rounded-xl border border-border border-l-4 ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getStatusIcon()}</div>
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
            className="bg-[#1F4FA3] hover:bg-[#17306D] text-white rounded-xl"
          >
            Iniciar
          </Button>
        )}
      </div>
    </div>
  )
}
