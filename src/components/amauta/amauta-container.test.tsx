import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaContainer } from "./amauta-container"

describe("AmautaContainer", () => {
  it("renders children", () => {
    render(<AmautaContainer>Content</AmautaContainer>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders as a div by default", () => {
    render(<AmautaContainer>Div</AmautaContainer>)
    const el = screen.getByText("Div")
    expect(el.tagName).toBe("DIV")
  })

  it("renders as a section when as='section'", () => {
    render(<AmautaContainer as="section">Section</AmautaContainer>)
    const el = screen.getByText("Section")
    expect(el.tagName).toBe("SECTION")
  })

  it("renders as an article when as='article'", () => {
    render(<AmautaContainer as="article">Article</AmautaContainer>)
    const el = screen.getByText("Article")
    expect(el.tagName).toBe("ARTICLE")
  })

  it("renders as main when as='main'", () => {
    render(<AmautaContainer as="main">Main</AmautaContainer>)
    const el = screen.getByText("Main")
    expect(el.tagName).toBe("MAIN")
  })

  it("applies sm size class", () => {
    render(<AmautaContainer size="sm">Small</AmautaContainer>)
    expect(screen.getByText("Small").className).toContain("max-w-4xl")
  })

  it("applies md size class", () => {
    render(<AmautaContainer size="md">Medium</AmautaContainer>)
    expect(screen.getByText("Medium").className).toContain("max-w-5xl")
  })

  it("applies lg size class by default", () => {
    render(<AmautaContainer>Large</AmautaContainer>)
    expect(screen.getByText("Large").className).toContain("max-w-7xl")
  })

  it("applies full size class", () => {
    render(<AmautaContainer size="full">Full</AmautaContainer>)
    expect(screen.getByText("Full").className).toContain("max-w-none")
  })

  it("merges custom className", () => {
    render(<AmautaContainer className="custom-class">Custom</AmautaContainer>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
