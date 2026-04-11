
import { Plus, TrendingUp, BookOpen, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "../components/stat-card"
import { AgendaItem } from "../components/agenda-item"
import { ProgressCard } from "../components/progress-card"
import { AchievementCard } from "../components/achievement-card"

const WEEK_DAYS = [
  { day: "L", active: true },
  { day: "M", active: true },
  { day: "M", active: true },
  { day: "J", active: true },
  { day: "V", active: false },
  { day: "S", active: false },
  { day: "D", active: false },
] as const

interface StudentDashboardProps {
  userName?: string
  userAvatar?: string
}

export function StudentDashboardPage({
  userName = "Mario",
  userAvatar,
}: StudentDashboardProps) {

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Card */}
      <div className="bg-linear-to-r from-[#6366F1] via-[#8B5CF6] to-[#F2994A] rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">¡Hola, {userName}!</h1>
            <p className="text-white/80">
              Viernes, 20 de Febrero 2026
            </p>
          </div>
          <div className="h-16 w-16 rounded-full border-4 border-white/30 overflow-hidden bg-white">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"
                alt={userName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Streak Section */}
        <div className="mt-4 bg-white/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/30 rounded-full">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/80">Racha actual</p>
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm text-white/80">días</p>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            {WEEK_DAYS.map((day, index) => (
              <div
                key={index}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  day.active
                    ? "bg-[#F2994A] text-white"
                    : "bg-white/30 text-white/60"
                }`}
              >
                {day.day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard type="points" value={156} label="Puntos" />
        <StatCard type="level" value="Nivel 2" label="Progreso" />
        <StatCard type="accuracy" value="85%" label="Precisión" />
      </div>

      {/* Today's Agenda */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[#1F4FA3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">
              Agenda de Hoy
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-[#E7EEFB] text-[#1F4FA3]"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-3">
          <AgendaItem
            title="División con fracciones"
            subject="Matemáticas"
            time="10:00 AM"
            duration="30 min"
            status="pending"
            onStart={() => {}}
          />
          <AgendaItem
            title="Multiplicación de fracciones"
            subject="Matemáticas"
            time="11:00 AM"
            duration="25 min"
            status="completed"
          />
          <AgendaItem
            title="Quiz de fracciones"
            subject="Matemáticas"
            time="2:00 PM"
            duration="15 min"
            status="pending"
            onStart={() => {}}
          />
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Tu Progreso
            </h2>
          </div>
          <button className="text-[#1F4FA3] font-medium text-sm">
            Ver todo
          </button>
        </div>
        <div className="space-y-4">
          <ProgressCard
            title="División con fracciones"
            progress={75}
            color="blue"
          />
          <ProgressCard
            title="Multiplicación con fracciones"
            progress={100}
            color="green"
          />
          <ProgressCard
            title="Suma de fracciones"
            progress={50}
            color="orange"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-linear-to-r from-[#F2994A] to-[#F8B76B] rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-white mb-1">
          ¡Sigue aprendiendo!
        </h2>
        <p className="text-white/80 text-sm mb-4">
          Completa tus lecciones de hoy con Amauta
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button className="bg-white/20 hover:bg-white/30 text-white rounded-xl gap-2">
              <BookOpen className="h-4 w-4" />
              Continuar Lección
            </Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white rounded-xl">
              ¡Jugar!
            </Button>
          </div>
          <img
            src="/img/amauta-mascot.jpg"
            alt="Amauta"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Últimos Logros
          </h2>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <AchievementCard
            type="streak"
            title="Primera Racha"
            description="4 días seguidos"
          />
          <AchievementCard
            type="level"
            title="Nivel 2"
            description="Alcanzado"
          />
          <AchievementCard
            type="accuracy"
            title="100% Precisión"
            description="En quiz"
          />
        </div>
      </div>
    </div>
  )
}
