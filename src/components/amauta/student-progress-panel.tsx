import type { LucideIcon } from "lucide-react"
import { Trophy, Star, Target } from "lucide-react"

import { AmautaStatCard } from "./amauta-stat-card"
import { AmautaProgress } from "./amauta-progress"
import { AmautaLearningPath } from "./amauta-learning-path"
import type { LearningPathStep } from "./amauta-learning-path"
import { AmautaAchievement } from "./amauta-achievement"

interface StudentStats {
  points: number
  level: number
  accuracy: number
}

interface AchievementItem {
  id: string
  icon?: LucideIcon
  title: string
  description?: string
  unlocked: boolean
}

interface StudentProgressPanelProps {
  studentName?: string
  stats: StudentStats
  totalProgress: number
  learningPath: LearningPathStep[]
  achievements?: AchievementItem[]
  onStepClick?: (step: LearningPathStep) => void
  onAchievementReveal?: (achievement: AchievementItem) => void
  className?: string
}

function StudentProgressPanel({
  studentName,
  stats,
  totalProgress,
  learningPath,
  achievements,
  onStepClick,
  onAchievementReveal,
  className,
}: StudentProgressPanelProps) {
  return (
    <div className={className}>
      {studentName && (
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Progreso de {studentName}
        </h2>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <AmautaStatCard
          icon={Trophy}
          value={stats.points}
          label="Puntos"
          color="accent"
        />
        <AmautaStatCard
          icon={Star}
          value={`Nivel ${stats.level}`}
          label="Nivel"
          color="primary"
        />
        <AmautaStatCard
          icon={Target}
          value={`${stats.accuracy}%`}
          label="Precisión"
          color="success"
        />
      </div>

      <div className="mb-6">
        <AmautaProgress
          value={totalProgress}
          amautaVariant="lesson"
          label="Progreso General"
          size="lg"
        />
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-foreground">
          Ruta de Aprendizaje
        </h3>
        <AmautaLearningPath
          steps={learningPath}
          direction="horizontal"
          onStepClick={onStepClick}
        />
      </div>

      {achievements && achievements.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground">
            Logros
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {achievements.map((achievement) => (
              <AmautaAchievement
                key={achievement.id}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                unlocked={achievement.unlocked}
                size="sm"
                onReveal={() => onAchievementReveal?.(achievement)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { StudentProgressPanel }
export type { StudentProgressPanelProps, StudentStats, AchievementItem }
