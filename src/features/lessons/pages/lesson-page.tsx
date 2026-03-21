
import { Star, ChevronRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"


interface LessonScreenProps {
  onBack?: () => void
}

export function LessonScreen({ onBack }: LessonScreenProps) {
  return (
    <div className="space-y-6 pb-6">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <ChevronRight className="h-5 w-5 rotate-180" />
        <span>
          Inicio {">"} <span className="text-foreground">Lección</span>
        </span>
      </button>

      {/* Lesson Card */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          División con fracciones
        </h1>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Dificultad:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= 3 ? "text-[#F2994A] fill-[#F2994A]" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-muted-foreground">Paso 1 de 3</span>
        </div>

        {/* Problem */}
        <div className="bg-[#F6F3EE] rounded-xl p-6 mb-6">
          <p className="text-lg font-semibold text-foreground mb-4">
            Resuelve: <span className="text-2xl">³/₄ ÷ ⁷/₅ =</span>
          </p>
          <p className="text-muted-foreground mb-4">
            La división de fracciones es como multiplicar en cruz. Mira cómo
            funciona.
          </p>

          {/* Demonstration */}
          <div className="bg-[#17306D] rounded-xl p-6 flex items-center justify-between">
            <div className="text-white text-3xl font-bold">
              ³/₄ ÷ ²/₅ = ²/₂
            </div>
            <img
              src="/img/amauta-mascot.jpg"
              alt="Amauta"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-[#FDE8D6] rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-6 w-6 text-[#F2994A] mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Cuánto y simplificado es{" "}
                <span className="text-xl">¹⁵/₈ =</span>
              </p>
              <p className="text-muted-foreground">¡Hazlo como en la pizarra!</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full h-14 bg-[#1F4FA3] hover:bg-[#17306D] text-white rounded-xl text-lg font-semibold">
            Contestar
          </Button>
          <button className="w-full text-center text-[#1F4FA3] font-medium flex items-center justify-center gap-2">
            Saltar paso <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
