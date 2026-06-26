import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { HowItWorks } from "./how-it-works"

const mockSteps = [
  { number: 1, title: "Regístrate", description: "Crea tu cuenta gratis" },
  { number: 2, title: "Explora", description: "Descubre lecciones" },
  { number: 3, title: "Aprende", description: "Comienza a aprender" },
]

describe("HowItWorks", () => {
  it("renders title", () => {
    render(<HowItWorks title="Cómo funciona" steps={mockSteps} />)
    expect(screen.getByText("Cómo funciona")).toBeInTheDocument()
  })

  it("renders subtitle when provided", () => {
    render(
      <HowItWorks title="Cómo funciona" subtitle="En 3 pasos" steps={mockSteps} />
    )
    expect(screen.getByText("En 3 pasos")).toBeInTheDocument()
  })

  it("renders all steps with number, title, description", () => {
    render(<HowItWorks title="Cómo funciona" steps={mockSteps} />)
    expect(screen.getByText("Regístrate")).toBeInTheDocument()
    expect(screen.getByText("Crea tu cuenta gratis")).toBeInTheDocument()
    expect(screen.getByText("Explora")).toBeInTheDocument()
    expect(screen.getByText("Descubre lecciones")).toBeInTheDocument()
    expect(screen.getByText("Aprende")).toBeInTheDocument()
    expect(screen.getByText("Comienza a aprender")).toBeInTheDocument()
  })

  it("renders step numbers", () => {
    render(<HowItWorks title="Cómo funciona" steps={mockSteps} />)
    const stepNumber = screen.getByText("1")
    expect(stepNumber).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("renders custom icon instead of number when provided", () => {
    const stepsWithIcon = [
      { number: 1, title: "Paso 1", description: "Desc", icon: <span>🔹</span> },
    ]
    render(<HowItWorks title="Cómo funciona" steps={stepsWithIcon} />)
    expect(screen.getByText("🔹")).toBeInTheDocument()
    expect(screen.queryByText("1")).not.toBeInTheDocument()
  })

  it("renders connector lines between steps", () => {
    const { container } = render(<HowItWorks title="Cómo funciona" steps={mockSteps} />)
    const connectors = container.querySelectorAll(".h-full.w-0\\.5")
    expect(connectors.length).toBe(0)
    const verticalLines = container.querySelectorAll("[class*='h-full']")
    expect(verticalLines.length).toBeGreaterThanOrEqual(1)
  })

  it("applies default variant", () => {
    render(<HowItWorks title="Cómo funciona" steps={mockSteps} />)
    const section = screen.getByText("Cómo funciona").closest("section")
    expect(section?.className).toContain("bg-background")
  })

  it("applies alt variant", () => {
    render(<HowItWorks title="Cómo funciona" steps={mockSteps} variant="alt" />)
    const section = screen.getByText("Cómo funciona").closest("section")
    expect(section?.className).toContain("amauta-surface-alt")
  })

  it("renders with id prop", () => {
    const { container } = render(
      <HowItWorks title="Cómo funciona" steps={mockSteps} id="how-it-works" />
    )
    const section = container.querySelector("section")
    expect(section?.getAttribute("id")).toBe("how-it-works")
  })

  it("merges custom className", () => {
    const { container } = render(
      <HowItWorks title="Cómo funciona" steps={mockSteps} className="custom-class" />
    )
    const section = container.querySelector("section")
    expect(section?.className).toContain("custom-class")
  })
})
