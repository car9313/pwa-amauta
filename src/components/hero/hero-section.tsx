
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Star,
  Pencil,
  BookOpen,
  Sparkles,
  Heart,
  CloudSun,
} from "lucide-react"
import { useParallax } from "@/hooks/use-parallax"

const floatingIcons = [
  { Icon: Star, className: "text-amauta-orange", size: 22, delay: "0s", x: "8%", y: "15%" },
  { Icon: Pencil, className: "text-primary", size: 20, delay: "0.8s", x: "88%", y: "12%" },
  { Icon: BookOpen, className: "text-amauta-orange", size: 24, delay: "1.6s", x: "78%", y: "70%" },
  { Icon: Sparkles, className: "text-accent", size: 18, delay: "2.4s", x: "12%", y: "75%" },
  { Icon: Heart, className: "text-amauta-orange/60", size: 16, delay: "3.2s", x: "50%", y: "8%" },
  { Icon: CloudSun, className: "text-primary/40", size: 28, delay: "1.2s", x: "92%", y: "40%" },
]

export function HeroSection() {
  const { ref: bgRef, offset: bgOffset } = useParallax({ speed: 0.1 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-amauta-blue-light"
      ref={bgRef}
    >
      {/* Animated background waves */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute bottom-0 left-0 w-full animate-wave"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          style={{ transform: `translateY(${bgOffset * 0.3}px)` }}
        >
          <path
            d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,117.3C672,107,768,117,864,138.7C960,160,1056,192,1152,186.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L0,320Z"
            className="fill-background/50"
          />
        </svg>
        <svg
          className="absolute bottom-0 left-0 w-full animate-wave-slow"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          style={{ transform: `translateY(${bgOffset * 0.15}px)` }}
        >
          <path
            d="M0,192L60,176C120,160,240,128,360,128C480,128,600,160,720,170.7C840,181,960,171,1080,149.3C1200,128,1320,96,1380,80L1440,64L1440,320L0,320Z"
            className="fill-background/30"
          />
        </svg>

        {/* Floating decorative circles */}
        <div
          className="absolute left-[5%] top-[20%] h-40 w-40 rounded-full bg-primary/5 animate-float-gentle"
          style={{ transform: `translateY(${bgOffset * 0.4}px)` }}
        />
        <div
          className="absolute right-[10%] top-[10%] h-24 w-24 rounded-full bg-accent/10 animate-float-gentle-reverse"
          style={{ transform: `translateY(${bgOffset * -0.25}px)` }}
        />
        <div
          className="absolute left-[40%] bottom-[25%] h-32 w-32 rounded-full bg-amauta-orange/5 animate-float-gentle"
          style={{ animationDelay: "1s", transform: `translateY(${bgOffset * 0.2}px)` }}
        />
      </div>

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, className, size, delay, x, y }, i) => (
        <div
          key={i}
          className="absolute animate-icon-float pointer-events-none"
          style={{
            left: x,
            top: y,
            animationDelay: delay,
          }}
          aria-hidden="true"
        >
          <Icon className={className} size={size} />
        </div>
      ))}

      {/* Main hero content */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col-reverse items-center gap-8 px-4 py-16 md:flex-row md:gap-12 lg:gap-20">
        {/* Text content with staggered animations */}
        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          {/* Tagline chip */}
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 transition-all duration-700 ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-accent">
              Para ninos de 5 a 9 anos
            </span>
          </div>

          {/* Main title */}
          <h1
            className={`text-5xl font-extrabold leading-tight tracking-tight text-primary md:text-6xl lg:text-7xl text-balance transition-all duration-700 delay-150 ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            Ama<span className="text-accent animate-color-shift">uta</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mt-3 text-lg font-semibold text-muted-foreground md:text-xl transition-all duration-700 delay-300 ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            Sabiduria que aprende contigo.
          </p>

          {/* Description */}
          <p
            className={`mt-6 max-w-lg text-base leading-relaxed text-foreground md:text-lg transition-all duration-700 delay-[450ms] ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            La plataforma de acompanamiento academico inteligente. Un mentor
            digital que guia <strong>paso a paso</strong> el aprendizaje en
            casa, con <strong>empatia</strong> y <strong>claridad</strong>.
          </p>

          {/* CTA Buttons */}
          <div
            className={`mt-8 flex flex-col gap-4 sm:flex-row transition-all duration-700 delay-[600ms] ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <Button
              asChild
              size="lg"
              className="group relative min-h-[52px] rounded-full bg-accent px-8 text-base font-bold text-accent-foreground hover:bg-accent/90 overflow-hidden"
            >
              <a href="#cta">
                <span className="relative z-10 flex items-center gap-2">
                  Quiero probarlo
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                </span>
                <span className="absolute inset-0 bg-amauta-orange/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[52px] rounded-full border-2 border-primary px-8 text-base font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <a href="#que-es">Conocer mas</a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div
            className={`mt-10 flex items-center gap-6 transition-all duration-700 delay-[750ms] ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-amauta-orange text-amauta-orange"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                Culturalmente hispano
              </span>
            </div>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="hidden items-center gap-1.5 sm:flex">
              <Heart className="h-4 w-4 fill-amauta-orange/60 text-amauta-orange" />
              <span className="text-sm font-semibold text-muted-foreground">
                Hecho con amor
              </span>
            </div>
          </div>
        </div>

        {/* Mascot with animated entrance and floating effect */}
        <div
          className={`flex flex-1 justify-center transition-all duration-1000 delay-200 ${
            mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-90"
          }`}
        >
          <div className="relative">
            {/* Glow ring behind mascot */}
            <div
              className="absolute inset-0 m-auto h-[85%] w-[85%] rounded-full bg-accent/10 animate-pulse-ring"
              aria-hidden="true"
            />

            {/* Speech bubble */}
            <div className="absolute -right-4 -top-2 z-20 animate-bounce-gentle">
              <div className="rounded-2xl bg-card px-4 py-2 shadow-lg border border-border">
                <p className="text-sm font-bold text-primary">
                  {'Hola, aprende conmigo!'}
                </p>
              </div>
              <div className="ml-6 h-3 w-3 -translate-y-0.5 rotate-45 bg-card border-b border-r border-border" />
            </div>

            {/* Mascot image */}
            <div className="animate-float relative z-10">
              <img
                src="/icons/web-app-manifest-512x512.png"
                alt="Amauta, el mentor ave sabia que acompana a los ninos en su aprendizaje"
                width={420}
                height={420}
                className="drop-shadow-2xl"
                />
            </div>

            {/* Floating sparkle decorations around mascot */}
            <div className="absolute -left-4 top-1/4 animate-sparkle" aria-hidden="true">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="absolute -right-6 bottom-1/3 animate-sparkle" style={{ animationDelay: "0.5s" }} aria-hidden="true">
              <Star className="h-5 w-5 text-amauta-orange fill-amauta-orange" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
