
import { useState } from "react"
import { CheckCircle2, ChevronRight, TrendingUp } from "lucide-react"

interface ParentDashboardProps {
  studentName?: string
}

export function ParentDashboardPage({ studentName = "Mario" }: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"today" | "week">("today")

  const weekDays = [
    { day: "L", active: true, height: 100 },
    { day: "M", active: true, height: 90 },
    { day: "M", active: false, height: 50 },
    { day: "J", active: false, height: 70 },
    { day: "V", active: false, height: 40 },
    { day: "S", active: false, height: 30 },
    { day: "D", active: false, height: 20 },
  ]

  const achievements = [
    { icon: "trophy", title: "Primera Racha", description: "4 días seguidos", color: "bg-amber-100" },
    { icon: "star", title: "Nivel 2", description: "Alcanzado", color: "bg-yellow-100" },
    { icon: "target", title: "100% Precisión", description: "En quiz", color: "bg-pink-100" },
    { icon: "flame", title: "Estudiante Activo", description: "Esta semana", color: "bg-orange-100" },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
      
      {/* Welcome Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#17306D]">
              Hola, mamá de {studentName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              Revisa el progreso de hoy
            </p>
          </div>
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border-2 border-[#E7EEFB] self-start sm:self-auto flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"
              alt={studentName}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex gap-2 sm:gap-3 mb-4 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === "today"
                ? "bg-[#1F4FA3] text-white"
                : "bg-[#E7EEFB] text-[#17306D]"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setActiveTab("week")}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === "week"
                ? "bg-[#1F4FA3] text-white"
                : "bg-[#E7EEFB] text-[#17306D]"
            }`}
          >
            Semana
          </button>
        </div>

        {/* Activities count */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#FDE8D6] rounded-xl">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-[#F2994A] flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#17306D] text-sm sm:text-base">Actividades de hoy</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">1 de 3 completadas</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-[#17306D] mb-4">
          Actividad Reciente
        </h2>
        
        <div className="p-3 sm:p-4 bg-[#E7EEFB] rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#1F4FA3] mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#17306D] text-sm sm:text-base">Nivel 2 - Matemáticas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Trabajó fracciones con Amauta</p>
              <p className="text-xs sm:text-sm text-muted-foreground">40 minutos</p>
            </div>
          </div>
          <button className="mt-3 w-full sm:w-auto px-4 py-2 bg-[#F2994A] text-white rounded-lg font-medium text-sm hover:bg-[#e68a3c] transition-colors">
            ¡Día completo!
          </button>
        </div>
      </div>

      {/* Progreso Diario */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-[#17306D] mb-4 sm:mb-6">
          Progreso Diario (Esta Semana)
        </h2>
        
        {/* Weekly Chart - Scrollable on small screens */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="flex items-end justify-between min-w-[280px] sm:min-w-0 h-32 sm:h-40 mb-4 sm:mb-6 gap-1 sm:gap-2">
            {weekDays.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                <div 
                  className={`w-6 sm:w-8 rounded-t-lg transition-all ${
                    day.active ? "bg-[#1F4FA3]" : "bg-[#E7EEFB]"
                  }`}
                  style={{ height: `${day.height}%` }}
                />
                <span className="text-xs font-medium text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chart legend for mobile */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[#1F4FA3]"></div>
            <span>Activo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[#E7EEFB]"></div>
            <span>Pendiente</span>
          </div>
        </div>
      </div>

      {/* Logros Recientes */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-[#17306D] mb-4">
          Logros Recientes
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map((achievement, index) => (
            <div 
              key={index} 
              className={`${achievement.color} rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="mb-1 sm:mb-2">
                {achievement.icon === "trophy" && <span className="text-2xl sm:text-4xl">🏆</span>}
                {achievement.icon === "star" && <span className="text-2xl sm:text-4xl">⭐</span>}
                {achievement.icon === "target" && <span className="text-2xl sm:text-4xl">🎯</span>}
                {achievement.icon === "flame" && <span className="text-2xl sm:text-4xl">🔥</span>}
              </div>
              <h3 className="font-bold text-[#17306D] text-xs sm:text-sm">{achievement.title}</h3>
              <p className="text-muted-foreground text-[10px] sm:text-xs">{achievement.description}</p>
            </div>
          ))}
        </div>

        {/* Ver todos button */}
        <button className="w-full mt-4 py-2.5 sm:py-3 bg-linear-to-r from-[#E8DAEF] to-[#D5C8E8] text-[#8B5CF6] font-medium rounded-xl text-sm sm:text-base hover:opacity-90 transition-opacity">
          Ver todos los logros
        </button>
      </div>

      {/* Nivel de Mario */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#17306D]">
            Nivel de {studentName}
          </h2>
          <img
            src="/img/amauta-mascot.jpg"
            alt="Amauta"
            width={48}
            height={48}
            className="rounded-full w-12 h-12 sm:w-12 sm:h-12 object-cover self-start sm:self-auto"
          />
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#F2994A] flex-shrink-0" />
            <span className="text-[#17306D] text-sm sm:text-base">Nivel 2 - Matemáticas</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
            <span className="text-[#17306D] text-sm sm:text-base">Racha de 4 días consecutivos</span>
          </div>
        </div>

        {/* Points Card */}
        <div className="mt-4 bg-green-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <span className="text-2xl sm:text-3xl flex-shrink-0">🏆</span>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">156 puntos</p>
            <p className="text-xs sm:text-sm text-green-600">Total acumulado</p>
          </div>
        </div>

        {/* Ver progreso button */}
        <button className="w-full mt-4 py-2.5 sm:py-3 bg-blue-50 text-[#1F4FA3] font-medium rounded-xl flex items-center justify-between px-4 text-sm sm:text-base hover:bg-blue-100 transition-colors">
          <span>Ver progreso detallado</span>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  )
}