import { useScrollReveal } from "@/hooks/use-scroll-reveal"


export function WhatIsSection() {
  const { ref: textRef, isVisible: textVisible } = useScrollReveal()
  const { ref: imgRef, isVisible: imgVisible } = useScrollReveal()

  return (
    <section id="que-es" className="bg-card py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        {/* Section header */}
        <div
          ref={textRef}
          className="transition-all duration-700 ease-out"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </span>
            <h2 className="text-3xl font-extrabold text-primary md:text-4xl text-balance">
              {"Que es "}
              <span className="text-accent">Amauta</span>
            </h2>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="mt-12 flex flex-col items-center gap-10 md:flex-row">
          {/* Text side */}
          <div
            className="flex-1 transition-all duration-700 ease-out"
            style={{
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "translateX(0)" : "translateX(-30px)",
              transitionDelay: "200ms",
            }}
          >
            <div className="rounded-2xl bg-amauta-blue-light p-6 md:p-8">
              <p className="text-base leading-relaxed text-foreground md:text-lg">
                {"Amauta es un acompanamiento academico inteligente que "}
                <strong className="text-primary">
                  {"guia a cada nino paso a paso"}
                </strong>
                {", adaptandole a su ritmo y necesidades."}
              </p>
              {/* Animated tablet preview */}
              <div
                className="mt-6 flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition-all duration-500"
                style={{
                  opacity: textVisible ? 1 : 0,
                  transform: textVisible ? "translateY(0) scale(1)" : "translateY(15px) scale(0.95)",
                  transitionDelay: "500ms",
                }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary" aria-hidden="true">
                    <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="18" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{"3 x 5 = 15"}</p>
                  <p className="text-xs text-muted-foreground">Lecciones interactivas paso a paso</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mascot side */}
          <div
            ref={imgRef}
            className="flex flex-1 justify-center transition-all duration-700 ease-out"
            style={{
              opacity: imgVisible ? 1 : 0,
              transform: imgVisible ? "translateX(0) scale(1)" : "translateX(30px) scale(0.9)",
            }}
          >
            <div className="relative">
              {/* Glow ring */}
              <div
                className="absolute inset-0 -m-4 rounded-full bg-accent/10 animate-pulse-ring"
                aria-hidden="true"
              />
              <img
                src="/icons/web-app-manifest-512x512.png"
                alt="Amauta, el ave sabia mostrando una tablet con ejercicios"
                width={300}
                height={300}
                className="relative animate-float drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
