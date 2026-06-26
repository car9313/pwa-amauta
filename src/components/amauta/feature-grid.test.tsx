import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BookOpen, Gamepad2, Star } from "lucide-react"
import { FeatureGrid } from "./feature-grid"

const mockFeatures = [
  { icon: BookOpen, title: "Lectura", description: "Aprende a leer" },
  { icon: Gamepad2, title: "Juegos", description: "Juega y aprende" },
  { icon: Star, title: "Logros", description: "Gana recompensas" },
]

describe("FeatureGrid", () => {
  it("renders title when provided", () => {
    render(<FeatureGrid title="Características" features={mockFeatures} />)
    expect(screen.getByText("Características")).toBeInTheDocument()
  })

  it("renders subtitle when provided", () => {
    render(
      <FeatureGrid
        title="Características"
        subtitle="Todo lo que necesitas"
        features={mockFeatures}
      />
    )
    expect(screen.getByText("Todo lo que necesitas")).toBeInTheDocument()
  })

  it("does not render header when no title or subtitle", () => {
    render(<FeatureGrid features={mockFeatures} />)
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("renders correct number of feature cards", () => {
    render(<FeatureGrid features={mockFeatures} />)
    expect(screen.getByText("Lectura")).toBeInTheDocument()
    expect(screen.getByText("Juegos")).toBeInTheDocument()
    expect(screen.getByText("Logros")).toBeInTheDocument()
  })

  it("renders feature description for each card", () => {
    render(<FeatureGrid features={mockFeatures} />)
    expect(screen.getByText("Aprende a leer")).toBeInTheDocument()
    expect(screen.getByText("Juega y aprende")).toBeInTheDocument()
    expect(screen.getByText("Gana recompensas")).toBeInTheDocument()
  })

  it("renders icon for each feature", () => {
    const { container } = render(<FeatureGrid features={mockFeatures} />)
    expect(container.querySelector(".lucide-book-open")).toBeInTheDocument()
    expect(container.querySelector(".lucide-gamepad-2")).toBeInTheDocument()
    expect(container.querySelector(".lucide-star")).toBeInTheDocument()
  })

  it("applies cols=3 by default", () => {
    const { container } = render(<FeatureGrid features={mockFeatures} />)
    const grid = container.querySelector(".grid")
    expect(grid?.className).toContain("lg:grid-cols-3")
  })

  it("applies cols=2 when specified", () => {
    const { container } = render(<FeatureGrid features={mockFeatures} cols={2} />)
    const grid = container.querySelector(".grid")
    expect(grid?.className).toContain("sm:grid-cols-2")
  })

  it("applies default variant", () => {
    render(<FeatureGrid features={mockFeatures} />)
    const section = screen.getByText("Lectura").closest("section")
    expect(section?.className).toContain("bg-background")
  })

  it("applies alt variant", () => {
    render(<FeatureGrid features={mockFeatures} variant="alt" />)
    const section = screen.getByText("Lectura").closest("section")
    expect(section?.className).toContain("amauta-surface-alt")
  })

  it("renders with id prop", () => {
    const { container } = render(
      <FeatureGrid features={mockFeatures} id="features-section" />
    )
    const section = container.querySelector("section")
    expect(section?.getAttribute("id")).toBe("features-section")
  })

  it("merges custom className", () => {
    const { container } = render(
      <FeatureGrid features={mockFeatures} className="custom-class" />
    )
    const section = container.querySelector("section")
    expect(section?.className).toContain("custom-class")
  })
})
