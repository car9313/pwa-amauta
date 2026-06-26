import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AmautaErrorState } from "./amauta-error-state"

describe("AmautaErrorState", () => {
  it("renders default title when none provided", () => {
    render(<AmautaErrorState />)
    expect(screen.getByText("¡Ups! Algo salió mal")).toBeInTheDocument()
  })

  it("renders custom title", () => {
    render(<AmautaErrorState title="Error personalizado" />)
    expect(screen.getByText("Error personalizado")).toBeInTheDocument()
  })

  it("renders message when provided", () => {
    render(<AmautaErrorState message="No se pudo cargar la lección" />)
    expect(screen.getByText("No se pudo cargar la lección")).toBeInTheDocument()
  })

  it("renders retry button when onRetry provided", () => {
    render(<AmautaErrorState onRetry={() => {}} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("does not render retry button without onRetry", () => {
    render(<AmautaErrorState />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("calls onRetry when button clicked", () => {
    const onRetry = vi.fn()
    render(<AmautaErrorState onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("renders default retry label", () => {
    render(<AmautaErrorState onRetry={() => {}} />)
    expect(screen.getByText("Intentar de nuevo")).toBeInTheDocument()
  })

  it("renders custom retryLabel", () => {
    render(<AmautaErrorState onRetry={() => {}} retryLabel="Reintentar" />)
    expect(screen.getByText("Reintentar")).toBeInTheDocument()
  })

  it("renders help circle icon", () => {
    render(<AmautaErrorState />)
    const container = screen.getByText("¡Ups! Algo salió mal").closest("div")
    expect(container?.querySelector("svg")).toBeInTheDocument()
  })
})
