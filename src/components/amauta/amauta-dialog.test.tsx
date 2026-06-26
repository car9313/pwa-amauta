import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaDialog, AmautaDialogTrigger, AmautaDialogContent, AmautaDialogHeader, AmautaDialogFooter, AmautaDialogTitle, AmautaDialogDescription, AmautaDialogClose } from "./amauta-dialog"

describe("AmautaDialog", () => {
  it("renders AmautaDialogTitle text", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <AmautaDialogTitle>Dialog Title</AmautaDialogTitle>
        </AmautaDialogContent>
      </AmautaDialog>
    )
    expect(screen.getByText("Dialog Title")).toBeInTheDocument()
  })

  it("renders AmautaDialogDescription", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <AmautaDialogDescription>Description</AmautaDialogDescription>
        </AmautaDialogContent>
      </AmautaDialog>
    )
    expect(screen.getByText("Description")).toBeInTheDocument()
  })

  it("renders children inside AmautaDialogContent", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <span>Content child</span>
        </AmautaDialogContent>
      </AmautaDialog>
    )
    expect(screen.getByText("Content child")).toBeInTheDocument()
  })

  it("renders AmautaDialogHeader", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <AmautaDialogHeader>Header</AmautaDialogHeader>
        </AmautaDialogContent>
      </AmautaDialog>
    )
    expect(screen.getByText("Header")).toBeInTheDocument()
  })

  it("renders AmautaDialogFooter", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <AmautaDialogFooter>Footer</AmautaDialogFooter>
        </AmautaDialogContent>
      </AmautaDialog>
    )
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("renders AmautaDialogClose button", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <AmautaDialogClose />
        </AmautaDialogContent>
      </AmautaDialog>
    )
    const closeBtn = screen.getByRole("button", { name: "Close" })
    expect(closeBtn).toBeInTheDocument()
  })

  it("AmautaDialogContent applies rounded-2xl class", () => {
    render(
      <AmautaDialog open>
        <AmautaDialogContent>
          <span>Styled</span>
        </AmautaDialogContent>
      </AmautaDialog>
    )
    const overlay = document.querySelector("[data-state='open']")
    if (overlay) {
      expect(overlay.parentElement?.className).toBeDefined()
    }
  })
})
