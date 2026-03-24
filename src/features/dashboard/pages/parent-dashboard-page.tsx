"use client"

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
    <div className="space-y-6 pb-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-[#17306D]">
            Hola, mamá de {studentName}
          </h1>
          <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-[#E7EEFB]">
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"
              alt={studentName}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === "today"
                ? "bg-[#1F4FA3] text-white"
                : "bg-[#E7EEFB] text-[#17306D]"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setActiveTab("week")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === "week"
                ? "bg-[#1F4FA3] text-white"
                : "bg-[#E7EEFB] text-[#17306D]"
            }`}
          >
            Semana
          </button>
        </div>

        {/* Activities count */}
        <div className="flex items-center gap-3 p-4 bg-[#FDE8D6] rounded-xl">
          <div className="h-10 w-10 rounded-lg bg-[#F2994A] flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#17306D]">Actividades de hoy</h3>
            <p className="text-sm text-muted-foreground">1 de 3 completadas</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#17306D] mb-4">
          Actividad Reciente
        </h2>
        
        <div className="p-4 bg-[#E7EEFB] rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#1F4FA3] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#17306D]">Nivel 2 - Matemáticas</h3>
              <p className="text-sm text-muted-foreground">Trabajó fracciones con Amauta</p>
              <p className="text-sm text-muted-foreground">40 minutos</p>
            </div>
          </div>
          <button className="mt-3 px-4 py-2 bg-[#F2994A] text-white rounded-lg font-medium text-sm">
            ¡Día completo!
          </button>
        </div>
      </div>

      {/* Progreso Diario */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#17306D] mb-6">
          Progreso Diario (Esta Semana)
        </h2>
        
        {/* Weekly Chart */}
        <div className="flex items-end justify-between h-32 mb-6">
          {weekDays.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div 
                className={`w-8 rounded-t-lg transition-all ${
                  day.active ? "bg-[#1F4FA3]" : "bg-[#E7EEFB]"
                }`}
                style={{ height: `${day.height}%` }}
              />
              <span className="text-sm font-medium text-muted-foreground">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logros Recientes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#17306D] mb-4">
          Logros Recientes
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <div 
              key={index} 
              className={`${achievement.color} rounded-2xl p-4 flex flex-col items-center justify-center text-center`}
            >
              <div className="mb-2">
                {achievement.icon === "trophy" && (
                  <span className="text-4xl">🏆</span>
                )}
                {achievement.icon === "star" && (
                  <span className="text-4xl">⭐</span>
                )}
                {achievement.icon === "target" && (
                  <span className="text-4xl">🎯</span>
                )}
                {achievement.icon === "flame" && (
                  <span className="text-4xl">🔥</span>
                )}
              </div>
              <h3 className="font-bold text-[#17306D] text-sm">{achievement.title}</h3>
              <p className="text-muted-foreground text-xs">{achievement.description}</p>
            </div>
          ))}
        </div>

        {/* Ver todos button */}
        <button className="w-full mt-4 py-3 bg-linear-to-r from-[#E8DAEF] to-[#D5C8E8] text-[#8B5CF6] font-medium rounded-xl">
          Ver todos los logros
        </button>
      </div>

      {/* Nivel de Mario */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-[#17306D]">
            Nivel de {studentName}
          </h2>
          <img
            src="/img/amauta-mascot.jpg"
            alt="Amauta"
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[#F2994A]" />
            <span className="text-[#17306D]">Nivel 2 - Matemáticas</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-[#17306D]">Racha de 4 días consecutivos</span>
          </div>
        </div>

        {/* Points Card */}
        <div className="mt-4 bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="text-3xl font-bold text-green-600">156 puntos</p>
            <p className="text-sm text-green-600">Total acumulado</p>
          </div>
        </div>

        {/* Ver progreso button */}
        <button className="w-full mt-4 py-3 bg-blue-50 text-[#1F4FA3] font-medium rounded-xl flex items-center justify-between px-4">
          <span>Ver progreso detallado</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
