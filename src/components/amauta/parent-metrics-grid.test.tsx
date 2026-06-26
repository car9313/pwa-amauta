import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ParentMetricsGrid } from "./parent-metrics-grid"
import type { ChildOverview, ActivityItem } from "./parent-metrics-grid"

const mockChildren: ChildOverview[] = [
  { id: "c1", name: "Carlos", level: 3, points: 250, accuracy: 85, streakDays: 5 },
  { id: "c2", name: "Ana", level: 5, points: 420, accuracy: 92, streakDays: 12 },
]

describe("ParentMetricsGrid", () => {
  it("renders summary stat cards", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("Hijos")).toBeInTheDocument()
    expect(screen.getByText("670")).toBeInTheDocument()
    expect(screen.getByText("Puntos Totales")).toBeInTheDocument()
    expect(screen.getByText("89%")).toBeInTheDocument()
    expect(screen.getByText("Precisión Promedio")).toBeInTheDocument()
  })

  it("computes totalPoints from childrenData when not provided", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.getByText("670")).toBeInTheDocument()
  })

  it("uses provided totalPoints when given", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} totalPoints={999} />)
    expect(screen.getByText("999")).toBeInTheDocument()
  })

  it("computes average accuracy from childrenData when not provided", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.getByText("89%")).toBeInTheDocument()
  })

  it("uses provided averageAccuracy when given", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} averageAccuracy={75} />)
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("renders child cards for each child", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.getByText("Carlos")).toBeInTheDocument()
    expect(screen.getByText("Ana")).toBeInTheDocument()
  })

  it("shows child level and points in child cards", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.getByText("Nivel 3")).toBeInTheDocument()
    expect(screen.getByText("Nivel 5")).toBeInTheDocument()
  })

  it("renders accuracy trend on stat card", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.getAllByText("89%").length).toBeGreaterThanOrEqual(2)
  })

  it("renders recent activity items", () => {
    const activity: ActivityItem[] = [
      { id: "act1", childName: "Carlos", action: "completó una lección", timestamp: "hace 5m", type: "completed" },
      { id: "act2", childName: "Ana", action: "subió de nivel", timestamp: "hace 1h", type: "level_up" },
    ]
    render(<ParentMetricsGrid childrenData={mockChildren} recentActivity={activity} />)
    expect(screen.getByText("Actividad Reciente")).toBeInTheDocument()
    expect(screen.getByText(/completó una lección/)).toBeInTheDocument()
    expect(screen.getByText(/subió de nivel/)).toBeInTheDocument()
    expect(screen.getByText("hace 5m")).toBeInTheDocument()
    expect(screen.getByText("hace 1h")).toBeInTheDocument()
  })

  it("does not render activity section when empty", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} recentActivity={[]} />)
    expect(screen.queryByText("Actividad Reciente")).not.toBeInTheDocument()
  })

  it("does not render activity section when not provided", () => {
    render(<ParentMetricsGrid childrenData={mockChildren} />)
    expect(screen.queryByText("Actividad Reciente")).not.toBeInTheDocument()
  })

  it("merges custom className", () => {
    const { container } = render(
      <ParentMetricsGrid childrenData={mockChildren} className="custom-class" />
    )
    expect(container.firstElementChild?.className).toContain("custom-class")
  })
})
