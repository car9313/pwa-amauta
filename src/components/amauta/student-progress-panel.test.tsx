import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Trophy } from "lucide-react"
import { StudentProgressPanel } from "./student-progress-panel"
import type { LearningPathStep } from "./amauta-learning-path"

const mockSteps: LearningPathStep[] = [
  { id: "1", label: "Sumas", status: "completed" },
  { id: "2", label: "Restas", status: "current" },
  { id: "3", label: "Multiplicación", status: "locked" },
]

const mockStats = { points: 250, level: 3, accuracy: 85 }

describe("StudentProgressPanel", () => {
  it("renders student name heading when provided", () => {
    render(
      <StudentProgressPanel
        studentName="Carlos"
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
      />
    )
    expect(screen.getByText("Progreso de Carlos")).toBeInTheDocument()
  })

  it("does not render heading when studentName not provided", () => {
    render(
      <StudentProgressPanel
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
      />
    )
    expect(screen.queryByText(/Progreso de/)).not.toBeInTheDocument()
  })

  it("renders stat cards with correct values", () => {
    render(
      <StudentProgressPanel
        studentName="Carlos"
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
      />
    )
    expect(screen.getByText("250")).toBeInTheDocument()
    expect(screen.getByText("Puntos")).toBeInTheDocument()
    expect(screen.getByText("Nivel 3")).toBeInTheDocument()
    expect(screen.getByText("85%")).toBeInTheDocument()
    expect(screen.getByText("Precisión")).toBeInTheDocument()
  })

  it("renders progress bar with correct value", () => {
    render(
      <StudentProgressPanel
        studentName="Carlos"
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
      />
    )
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toBeInTheDocument()
    const fill = progressBar.querySelector(".h-full") as HTMLElement
    expect(fill.style.width).toBe("60%")
  })

  it("renders learning path heading and steps", () => {
    render(
      <StudentProgressPanel
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
      />
    )
    expect(screen.getByText("Ruta de Aprendizaje")).toBeInTheDocument()
    expect(screen.getByText("Sumas")).toBeInTheDocument()
    expect(screen.getByText("Restas")).toBeInTheDocument()
    expect(screen.getByText("Multiplicación")).toBeInTheDocument()
  })

  it("renders achievements section when provided", () => {
    const achievements = [
      { id: "a1", title: "Primer logro", unlocked: true },
      { id: "a2", title: "Logro bloqueado", unlocked: false, icon: Trophy },
    ]
    render(
      <StudentProgressPanel
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
        achievements={achievements}
      />
    )
    expect(screen.getByText("Logros")).toBeInTheDocument()
    expect(screen.getByText("Primer logro")).toBeInTheDocument()
    expect(screen.getByText("Logro bloqueado")).toBeInTheDocument()
  })

  it("does not render achievements section when empty array", () => {
    render(
      <StudentProgressPanel
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
        achievements={[]}
      />
    )
    expect(screen.queryByText("Logros")).not.toBeInTheDocument()
  })

  it("calls onAchievementReveal when achievement is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default
    const handleReveal = vi.fn()
    const achievements = [
      { id: "a1", title: "Logro", unlocked: true },
    ]
    render(
      <StudentProgressPanel
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
        achievements={achievements}
        onAchievementReveal={handleReveal}
      />
    )
    const userEvent = user.setup()
    await userEvent.click(screen.getByText("Logro"))
    expect(handleReveal).toHaveBeenCalledOnce()
    expect(handleReveal).toHaveBeenCalledWith(achievements[0])
  })

  it("merges custom className", () => {
    const { container } = render(
      <StudentProgressPanel
        stats={mockStats}
        totalProgress={60}
        learningPath={mockSteps}
        className="custom-class"
      />
    )
    expect(container.firstElementChild?.className).toContain("custom-class")
  })
})
