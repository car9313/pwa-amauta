import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaSection } from "./amauta-section"

describe("AmautaSection", () => {
  it("renders children", () => {
    render(<AmautaSection>Content</AmautaSection>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders as section element by default", () => {
    render(<AmautaSection>Section</AmautaSection>)
    expect(screen.getByText("Section").tagName).toBe("SECTION")
  })

  it("renders as div when as='div'", () => {
    render(<AmautaSection as="div">Div</AmautaSection>)
    expect(screen.getByText("Div").tagName).toBe("DIV")
  })

  it("applies default variant classes", () => {
    render(<AmautaSection>Default</AmautaSection>)
    const el = screen.getByText("Default")
    expect(el.className).toContain("bg-background")
    expect(el.className).toContain("text-foreground")
  })

  it("applies alt variant classes", () => {
    render(<AmautaSection variant="alt">Alt</AmautaSection>)
    const el = screen.getByText("Alt")
    expect(el.className).toContain("amauta-surface-alt")
  })

  it("applies primary variant classes", () => {
    render(<AmautaSection variant="primary">Primary</AmautaSection>)
    const el = screen.getByText("Primary")
    expect(el.className).toContain("text-white")
  })

  it("applies accent variant classes", () => {
    render(<AmautaSection variant="accent">Accent</AmautaSection>)
    const el = screen.getByText("Accent")
    expect(el.className).toContain("amauta-orange-light")
  })

  it("applies hero variant classes", () => {
    render(<AmautaSection variant="hero">Hero</AmautaSection>)
    const el = screen.getByText("Hero")
    expect(el.className).toContain("text-white")
    expect(el.className).toContain("overflow-hidden")
  })

  it("applies padding classes", () => {
    render(<AmautaSection>Padded</AmautaSection>)
    const el = screen.getByText("Padded")
    expect(el.className).toContain("py-16")
  })

  it("accepts id prop", () => {
    render(<AmautaSection id="section-id">WithId</AmautaSection>)
    const el = screen.getByText("WithId")
    expect(el.getAttribute("id")).toBe("section-id")
  })

  it("merges custom className", () => {
    render(<AmautaSection className="custom-class">Custom</AmautaSection>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
