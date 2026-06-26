import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaCard, AmautaCardHeader, AmautaCardTitle, AmautaCardDescription, AmautaCardContent, AmautaCardFooter, AmautaCardAction } from "./amauta-card"

describe("AmautaCard", () => {
  it("renders children", () => {
    render(<AmautaCard>Content</AmautaCard>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("applies default variant classes", () => {
    render(<AmautaCard>Default</AmautaCard>)
    const el = screen.getByText("Default")
    expect(el.className).toContain("rounded-xl")
  })

  it("applies glass variant", () => {
    render(<AmautaCard amautaVariant="glass">Glass</AmautaCard>)
    const el = screen.getByText("Glass")
    expect(el.className).toContain("rounded-xl")
  })

  it("applies elevated variant classes", () => {
    render(<AmautaCard amautaVariant="elevated">Elevated</AmautaCard>)
    const el = screen.getByText("Elevated")
    expect(el.className).toContain("shadow-lg")
    expect(el.className).toContain("hover:shadow-xl")
    expect(el.className).toContain("border-0")
  })

  it("applies bordered variant classes", () => {
    render(<AmautaCard amautaVariant="bordered">Bordered</AmautaCard>)
    const el = screen.getByText("Bordered")
    expect(el.className).toContain("border-2")
    expect(el.className).toContain("border-[var(--amauta-blue-light)]")
  })

  it("applies interactive variant classes", () => {
    render(<AmautaCard amautaVariant="interactive">Interactive</AmautaCard>)
    const el = screen.getByText("Interactive")
    expect(el.className).toContain("hover:shadow-md")
    expect(el.className).toContain("hover:-translate-y-1")
    expect(el.className).toContain("cursor-pointer")
  })

  it("merges custom className", () => {
    render(<AmautaCard className="custom-class">Custom</AmautaCard>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })

  it("renders AmautaCardHeader", () => {
    render(<AmautaCardHeader>Header</AmautaCardHeader>)
    expect(screen.getByText("Header")).toBeInTheDocument()
  })

  it("renders AmautaCardTitle", () => {
    render(<AmautaCardTitle>Title</AmautaCardTitle>)
    expect(screen.getByText("Title")).toBeInTheDocument()
  })

  it("renders AmautaCardDescription", () => {
    render(<AmautaCardDescription>Desc</AmautaCardDescription>)
    expect(screen.getByText("Desc")).toBeInTheDocument()
  })

  it("renders AmautaCardContent", () => {
    render(<AmautaCardContent>Content</AmautaCardContent>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders AmautaCardFooter", () => {
    render(<AmautaCardFooter>Footer</AmautaCardFooter>)
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("renders AmautaCardAction", () => {
    render(<AmautaCardAction>Action</AmautaCardAction>)
    expect(screen.getByText("Action")).toBeInTheDocument()
  })
})
