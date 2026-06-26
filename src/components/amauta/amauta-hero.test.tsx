import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaHero, AmautaHeroContent, AmautaHeroActions } from "./amauta-hero"

describe("AmautaHero", () => {
  it("renders children", () => {
    render(<AmautaHero>Content</AmautaHero>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders as a section element", () => {
    render(<AmautaHero>Section</AmautaHero>)
    expect(screen.getByText("Section").tagName).toBe("SECTION")
  })

  it("applies default size by default", () => {
    render(<AmautaHero>Default</AmautaHero>)
    const el = screen.getByText("Default")
    expect(el.className).toContain("min-h-[60vh]")
  })

  it("applies compact size", () => {
    render(<AmautaHero size="compact">Compact</AmautaHero>)
    const el = screen.getByText("Compact")
    expect(el.className).toContain("min-h-[40vh]")
  })

  it("applies large size", () => {
    render(<AmautaHero size="large">Large</AmautaHero>)
    const el = screen.getByText("Large")
    expect(el.className).toContain("min-h-[80vh]")
  })

  it("applies gradient background classes", () => {
    render(<AmautaHero>Gradient</AmautaHero>)
    const el = screen.getByText("Gradient")
    expect(el.className).toContain("bg-gradient-to-br")
    expect(el.className).toContain("text-white")
  })

  it("renders noise overlay div", () => {
    const { container } = render(<AmautaHero>Overlay</AmautaHero>)
    const noise = container.querySelector(".noise-overlay")
    expect(noise).toBeInTheDocument()
  })

  it("merges custom className", () => {
    render(<AmautaHero className="custom-class">Custom</AmautaHero>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })

  it("renders children inside max-w-7xl wrapper", () => {
    render(<AmautaHero>Wrapped</AmautaHero>)
    const el = screen.getByText("Wrapped")
    expect(el.className).toContain("max-w-7xl")
  })
})

describe("AmautaHeroContent", () => {
  it("renders children", () => {
    render(<AmautaHeroContent>Content</AmautaHeroContent>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("applies centered text classes", () => {
    render(<AmautaHeroContent>Centered</AmautaHeroContent>)
    const el = screen.getByText("Centered")
    expect(el.className).toContain("mx-auto")
    expect(el.className).toContain("text-center")
  })

  it("merges custom className", () => {
    render(<AmautaHeroContent className="custom-class">Custom</AmautaHeroContent>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})

describe("AmautaHeroActions", () => {
  it("renders children", () => {
    render(<AmautaHeroActions><button>Action</button></AmautaHeroActions>)
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument()
  })

  it("applies flex layout classes", () => {
    render(<AmautaHeroActions>Actions</AmautaHeroActions>)
    const el = screen.getByText("Actions")
    expect(el.className).toContain("flex")
    expect(el.className).toContain("items-center")
    expect(el.className).toContain("gap-4")
  })

  it("merges custom className", () => {
    render(<AmautaHeroActions className="custom-class">Custom</AmautaHeroActions>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
