import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CondorGuide } from "./condor-guide"

describe("CondorGuide", () => {
  it("renders image with alt text", () => {
    render(<CondorGuide />)
    const img = screen.getByAltText("Amauta")
    expect(img).toBeInTheDocument()
  })

  it("renders message text in speech bubble", () => {
    render(<CondorGuide message="¡Hola!" />)
    expect(screen.getByText("¡Hola!")).toBeInTheDocument()
  })

  it("does not render speech bubble when no message", () => {
    const { container } = render(<CondorGuide />)
    const bubble = container.querySelector(".rounded-2xl")
    expect(bubble).not.toBeInTheDocument()
  })

  it("applies center position by default", () => {
    render(<CondorGuide message="Test" />)
    const el = screen.getByText("Test").closest(".flex")
    expect(el?.className).toContain("items-center")
  })

  it("applies left position", () => {
    render(<CondorGuide message="Test" position="left" />)
    const el = screen.getByText("Test").closest(".flex")
    expect(el?.className).toContain("items-start")
  })

  it("applies right position", () => {
    render(<CondorGuide message="Test" position="right" />)
    const el = screen.getByText("Test").closest(".flex")
    expect(el?.className).toContain("items-end")
  })

  it("applies sm size", () => {
    render(<CondorGuide size="sm" />)
    const imgContainer = screen.getByAltText("Amauta").parentElement
    expect(imgContainer?.className).toContain("w-12")
    expect(imgContainer?.className).toContain("h-12")
  })

  it("applies md size by default", () => {
    render(<CondorGuide />)
    const imgContainer = screen.getByAltText("Amauta").parentElement
    expect(imgContainer?.className).toContain("w-16")
    expect(imgContainer?.className).toContain("h-16")
  })

  it("applies lg size", () => {
    render(<CondorGuide size="lg" />)
    const imgContainer = screen.getByAltText("Amauta").parentElement
    expect(imgContainer?.className).toContain("w-20")
    expect(imgContainer?.className).toContain("h-20")
  })

  it("merges custom className", () => {
    render(<CondorGuide message="Test" className="custom-class" />)
    const el = screen.getByText("Test").closest(".flex")
    expect(el?.className).toContain("custom-class")
  })
})
