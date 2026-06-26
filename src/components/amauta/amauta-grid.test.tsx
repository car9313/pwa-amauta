import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaGrid } from "./amauta-grid"

describe("AmautaGrid", () => {
  it("renders children", () => {
    render(<AmautaGrid><span>Item</span></AmautaGrid>)
    expect(screen.getByText("Item")).toBeInTheDocument()
  })

  it("renders as a div with grid class", () => {
    render(<AmautaGrid>Grid</AmautaGrid>)
    const el = screen.getByText("Grid")
    expect(el.tagName).toBe("DIV")
    expect(el.className).toContain("grid")
  })

  it("applies cols=1 by default", () => {
    render(<AmautaGrid>Col1</AmautaGrid>)
    expect(screen.getByText("Col1").className).toContain("grid-cols-1")
  })

  it("applies cols=2 with responsive classes", () => {
    render(<AmautaGrid cols={2}>Col2</AmautaGrid>)
    const el = screen.getByText("Col2")
    expect(el.className).toContain("grid-cols-1")
    expect(el.className).toContain("sm:grid-cols-2")
  })

  it("applies cols=3 with responsive classes", () => {
    render(<AmautaGrid cols={3}>Col3</AmautaGrid>)
    const el = screen.getByText("Col3")
    expect(el.className).toContain("grid-cols-1")
    expect(el.className).toContain("sm:grid-cols-2")
    expect(el.className).toContain("lg:grid-cols-3")
  })

  it("applies cols=4 with responsive classes", () => {
    render(<AmautaGrid cols={4}>Col4</AmautaGrid>)
    const el = screen.getByText("Col4")
    expect(el.className).toContain("grid-cols-1")
    expect(el.className).toContain("sm:grid-cols-2")
    expect(el.className).toContain("lg:grid-cols-4")
  })

  it("applies gap=md by default", () => {
    render(<AmautaGrid>Gap</AmautaGrid>)
    expect(screen.getByText("Gap").className).toContain("gap-6")
  })

  it("applies gap=sm", () => {
    render(<AmautaGrid gap="sm">GapSm</AmautaGrid>)
    expect(screen.getByText("GapSm").className).toContain("gap-4")
  })

  it("applies gap=lg", () => {
    render(<AmautaGrid gap="lg">GapLg</AmautaGrid>)
    expect(screen.getByText("GapLg").className).toContain("gap-8")
  })

  it("merges custom className", () => {
    render(<AmautaGrid className="custom-class">Custom</AmautaGrid>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
