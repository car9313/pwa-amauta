"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Inicio", href: "#hero" },
  { label: "Que es", href: "#que-es" },
  { label: "Funciones", href: "#funciones" },
  { label: "Unico", href: "#unico" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#hero" className="flex items-center gap-2" aria-label="Amauta - Inicio">
          <img
            src="/icons/web-app-manifest-192x192.png"
            alt=""
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-xl font-bold text-primary">
            Ama<span className="text-accent">uta</span>
          </span>
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegacion principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <Button
            asChild
            size="lg"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
          >
            <a href="#cta">Comenzar</a>
          </Button>
        </nav>

        {/* Mobile menu button */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <nav
          className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden"
          aria-label="Navegacion movil"
        >
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              size="lg"
              className="mt-2 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            >
              <a href="#cta" onClick={() => setIsOpen(false)}>
                Comenzar
              </a>
            </Button>
          </div>
        </nav>
      )}
    </header>
  )
}
