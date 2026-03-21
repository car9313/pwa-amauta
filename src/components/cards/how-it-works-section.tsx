import {useScrollReveal} from "@/hooks/use-scroll-reveal"
import {BookOpen, Heart, Search} from "lucide-react"
import {Card, CardContent} from "@/components/ui/card"

const steps = [
    {
        number: 1,
        icon: Search,
        title: "Analiza",
        description: "Amauta detecta los puntos fuertes y los temas a mejorar.",
        color: "bg-primary",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
    },
    {
        number: 2,
        icon: BookOpen,
        title: "Explica",
        description: "Brinda lecciones claras y personalizadas.",
        color: "bg-accent",
        iconBg: "bg-accent/10",
        iconColor: "text-accent",
    },
    {
        number: 3,
        icon: Heart,
        title: "Acompana",
        description: "Acompana en todo el proceso de aprendizaje.",
        color: "bg-primary",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
    },
]

function StepCard({
                      step,
                      index,
                  }: {
    step: (typeof steps)[number]
    index: number
}) {
    const {ref, isVisible} = useScrollReveal()

    return (
        <div className="flex flex-1 flex-col items-center gap-4">
            <div
                ref={ref}
                className="flex w-full flex-col items-center gap-4 transition-all duration-700 ease-out"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.9)",
                    transitionDelay: `${index * 200}ms`,
                }}
            >
                {/* Step number badge */}
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${step.color} text-lg font-extrabold text-primary-foreground shadow-md`}
                >
                    {step.number}
                </div>

                {/* Card */}
                <Card
                    className="w-full border-none shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                        <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg}`}
                        >
                            <step.icon className={`h-7 w-7 ${step.iconColor}`} aria-hidden="true"/>
                        </div>
                        <h3 className="text-xl font-extrabold text-foreground">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ConnectorArrow({index}: { index: number }) {
    const {ref, isVisible} = useScrollReveal()

    return (
        <div
            ref={ref}
            className="hidden items-center justify-center md:flex"
            style={{
                opacity: isVisible ? 1 : 0,
                transition: "opacity 0.5s ease-out",
                transitionDelay: `${150 + index * 200}ms`,
            }}
        >
            <div className="flex items-center gap-1">
                <span className="h-0.5 w-6 bg-accent/40" aria-hidden="true"/>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className="text-accent/60"
                    aria-hidden="true"
                >
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none"
                          strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="h-0.5 w-6 bg-accent/40" aria-hidden="true"/>
            </div>
        </div>
    )
}

export function HowItWorksSection() {
    const {ref: titleRef, isVisible: titleVisible} = useScrollReveal()

    return (
        <section className="bg-amauta-blue-light py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-4">
                {/* Section header */}
                <div
                    ref={titleRef}
                    className="flex items-center justify-center gap-3 transition-all duration-700 ease-out"
                    style={{
                        opacity: titleVisible ? 1 : 0,
                        transform: titleVisible ? "translateY(0)" : "translateY(30px)",
                    }}
                >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
                    <h2 className="text-3xl font-extrabold text-primary md:text-4xl text-balance">
                        Como funciona
                    </h2>
                </div>

                {/* Steps row */}
                <div className="mt-12 flex flex-col items-stretch gap-6 md:flex-row md:items-start md:gap-0">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-1 items-start">
                            <StepCard step={step} index={index}/>
                            {index < steps.length - 1 && <ConnectorArrow index={index}/>}
                        </div>
                    ))}
                </div>

                {/* Animated progress bar underneath */}
                <ProgressBar/>
            </div>
        </section>
    )
}

function ProgressBar() {
    const {ref, isVisible} = useScrollReveal()

    return (
        <div ref={ref} className="mx-auto mt-10 max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
                    style={{
                        width: isVisible ? "100%" : "0%",
                        transitionDelay: "600ms",
                    }}
                />
            </div>
            <p
                className="mt-3 text-center text-sm font-semibold text-muted-foreground transition-all duration-500"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: "1200ms",
                }}
            >
                Aprendizaje continuo y adaptado
            </p>
        </div>
    )
}
