import { useTranslation } from "react-i18next"
import { Flame, Gift, Snowflake } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface StreakModalProps {
  isOpen: boolean
  onClose: () => void
  streakDays: number
  weekDayLabels: string[]
  activeWeek: { active: boolean }[]
}

export function StreakModal({
  isOpen,
  onClose,
  streakDays,
  weekDayLabels,
  activeWeek,
}: StreakModalProps) {
  const { t } = useTranslation("dashboard")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl gap-0">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Flame className="h-5 w-5 text-accent" />
            </div>
            {t("student.streakModal.title")}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {t("student.streakModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-5 text-center text-white">
          <p className="text-5xl font-black tabular-nums">{streakDays}</p>
          <p className="mt-1 text-sm font-semibold text-white/80">
            {t("student.streakModal.daysActive")}
          </p>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("student.streakModal.thisWeek")}
          </p>
          <div className="flex justify-between gap-1.5">
            {weekDayLabels.slice(0, 7).map((day, index) => (
              <div
                key={index}
                className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm font-bold transition-all",
                  activeWeek[index]?.active
                    ? "bg-accent text-white shadow-lg shadow-accent/30"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3 opacity-60">
          <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <Gift className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-xs font-bold text-foreground">
              {t("student.streakModal.dailyBonus")}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <Snowflake className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-xs font-bold text-foreground">
              {t("student.streakModal.freezeStreak")}
            </p>
          </div>
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-md">
            {t("student.streakModal.comingSoon")}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
