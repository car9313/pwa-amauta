import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaInput } from "./amauta-input"

describe("AmautaInput", () => {
  it("renders as an input element", () => {
    render(<AmautaInput />)
    const input = screen.getByRole("textbox")
    expect(input.tagName).toBe("INPUT")
  })

  it("renders with placeholder text", () => {
    render(<AmautaInput placeholder="Escribe aquí" />)
    expect(screen.getByPlaceholderText("Escribe aquí")).toBeInTheDocument()
  })

  it("applies rounded-xl class", () => {
    render(<AmautaInput />)
    const input = screen.getByRole("textbox")
    expect(input.className).toContain("rounded-xl")
  })

  it("accepts value and onChange", () => {
    const handleChange = vi.fn()
    render(<AmautaInput value="test" onChange={handleChange} />)
    const input = screen.getByRole("textbox") as HTMLInputElement
    expect(input.value).toBe("test")
  })

  it("accepts type prop", () => {
    render(<AmautaInput type="email" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("type", "email")
  })

  it("merges custom className", () => {
    render(<AmautaInput className="custom-class" />)
    expect(screen.getByRole("textbox").className).toContain("custom-class")
  })

  it("renders as disabled", () => {
    render(<AmautaInput disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("renders as required", () => {
    render(<AmautaInput required />)
    expect(screen.getByRole("textbox")).toBeRequired()
  })
})
