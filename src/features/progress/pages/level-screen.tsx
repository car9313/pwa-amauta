"use client"

import { ChevronRight, Lightbulb, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"


interface LevelScreenProps {
  onBack?: () => void
}

export function LevelScreen({ onBack }: LevelScreenProps) {
  const progressDots = [
    { filled: true, color: "bg-[#F2994A]" },
    { filled: true, color: "bg-[#F2994A]" },
    { filled: false, color: "bg-[#E7EEFB]" },
    { filled: false, color: "bg-gray-300" },
  ]

  return (
    <div className="space-y-6 pb-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-[#1F4FA3] font-medium">10:50am</span>
        <span>Matemáticas</span>
      </button>

      {/* Level Card */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Nivel 2</h2>
            <div className="flex gap-2 mt-2">
              {progressDots.map((dot, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full ${dot.color}`}
                />
              ))}
            </div>
          </div>
          <span className="text-[#F2994A] font-semibold">Nivel 2</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#F2994A] rounded-full"
            style={{ width: "65%" }}
          />
        </div>

        {/* Current Level Info */}
        <div className="bg-[#E7EEFB] rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground">Nivel 2</h3>
              <button className="flex items-center gap-1 text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
                <span>4/3</span>
              </button>
              <p className="text-foreground mt-2">
                Trigo fracciones con pangina 35.4
              </p>
              <div className="flex gap-2 mt-3">
                <Button className="bg-[#F2994A] hover:bg-[#E8893D] text-white rounded-xl">
                  Desgarrar
                </Button>
                <span className="text-muted-foreground self-center">
                  Dis completo
                </span>
              </div>
            </div>
            <img
              src="/images/amauta-mascot.jpg"
              alt="Amauta"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
        </div>

        {/* What You Forgot */}
        <div className="bg-[#F6F3EE] rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-[#1F4FA3] mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground">
                Lo que se te olvidó:
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span>▸</span> Multiplicar en cruz.
                </li>
                <li className="flex items-center gap-2">
                  <span>▸</span> Practicar cómo simplificar tu respuesta.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Suggested Problems */}
        <div className="bg-[#E7EEFB] rounded-xl p-4">
          <h4 className="font-semibold text-[#1F4FA3] mb-3 flex items-center gap-2">
            Problemas Sugeridos
            <ChevronRight className="h-5 w-5" />
          </h4>
          <div className="flex gap-3">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                className="h-14 w-14 rounded-xl bg-[#FDE8D6] text-[#F2994A] font-bold text-lg hover:bg-[#F2994A] hover:text-white transition-colors"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
