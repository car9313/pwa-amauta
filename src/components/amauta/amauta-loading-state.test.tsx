import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaLoadingState } from "./amauta-loading-state"

describe("AmautaLoadingState", () => {
  it("renders page variant by default", () => {
    render(<AmautaLoadingState />)
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getAllByText("Cargando...")).toHaveLength(2)
  })

  it("renders with custom label", () => {
    render(<AmautaLoadingState label="Preparando actividades..." />)
    expect(screen.getByText("Preparando actividades...")).toBeInTheDocument()
  })

  it("renders card variant", () => {
    const { container } = render(<AmautaLoadingState variant="card" count={2} />)
    const cards = container.querySelectorAll(".rounded-2xl")
    expect(cards).toHaveLength(2)
  })

  it("renders text variant with count", () => {
    const { container } = render(<AmautaLoadingState variant="text" count={3} />)
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders avatar variant", () => {
    render(<AmautaLoadingState variant="avatar" />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("renders stat variant", () => {
    const { container } = render(<AmautaLoadingState variant="stat" count={4} />)
    const cards = container.querySelectorAll(".rounded-2xl")
    expect(cards).toHaveLength(4)
  })

  it("has proper ARIA attributes", () => {
    render(<AmautaLoadingState />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
  })

  it("includes sr-only loading text", () => {
    render(<AmautaLoadingState />)
    const srSpan = document.querySelector(".sr-only")
    expect(srSpan).toBeInTheDocument()
    expect(srSpan?.textContent).toBe("Cargando...")
  })

  it("applies custom className", () => {
    render(<AmautaLoadingState className="my-class" />)
    expect(screen.getByRole("status").className).toContain("my-class")
  })
})
