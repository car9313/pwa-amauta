import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaEmptyState } from "./amauta-empty-state"

describe("AmautaEmptyState", () => {
  it("renders title", () => {
    render(<AmautaEmptyState title="Sin resultados" />)
    expect(screen.getByText("Sin resultados")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<AmautaEmptyState title="Vacío" description="No hay elementos" />)
    expect(screen.getByText("No hay elementos")).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    render(<AmautaEmptyState title="Vacío" />)
    expect(screen.queryByText("No hay elementos")).not.toBeInTheDocument()
  })

  it("renders icon when provided without condorMessage", () => {
    render(<AmautaEmptyState title="Vacío" icon={<span>📦</span>} />)
    expect(screen.getByText("📦")).toBeInTheDocument()
  })

  it("does not render icon when condorMessage is set", () => {
    render(<AmautaEmptyState title="Vacío" icon={<span>📦</span>} condorMessage="Hola" />)
    expect(screen.queryByText("📦")).not.toBeInTheDocument()
  })

  it("renders CondorGuide when condorMessage is provided", () => {
    render(<AmautaEmptyState title="Vacío" condorMessage="Mensaje del cóndor" />)
    expect(screen.getByText("Mensaje del cóndor")).toBeInTheDocument()
  })

  it("renders action node when provided", () => {
    render(<AmautaEmptyState title="Vacío" action={<button>Action</button>} />)
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument()
  })

  it("does not render action when not provided", () => {
    render(<AmautaEmptyState title="Vacío" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("applies sm size padding", () => {
    render(<AmautaEmptyState title="Sm" size="sm" />)
    const el = screen.getByText("Sm").closest(".flex")
    expect(el?.className).toContain("py-8")
  })

  it("applies md size padding by default", () => {
    render(<AmautaEmptyState title="Md" />)
    const el = screen.getByText("Md").closest(".flex")
    expect(el?.className).toContain("py-16")
  })

  it("applies lg size padding", () => {
    render(<AmautaEmptyState title="Lg" size="lg" />)
    const el = screen.getByText("Lg").closest(".flex")
    expect(el?.className).toContain("py-24")
  })

  it("merges custom className", () => {
    render(<AmautaEmptyState title="Custom" className="custom-class" />)
    const el = screen.getByText("Custom").closest(".flex")
    expect(el?.className).toContain("custom-class")
  })
})
