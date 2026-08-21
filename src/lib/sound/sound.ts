type AudioContextConstructor = typeof AudioContext

let audioCtx: AudioContext | null = null
let soundEnabled = true

const getAudioContextConstructor = (): AudioContextConstructor | null => {
  if (typeof window === "undefined") return null
  const ctxClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext
  return ctxClass ?? null
}

const getAudioContext = (): AudioContext | null => {
  const CtxClass = getAudioContextConstructor()
  if (!CtxClass) return null
  if (!audioCtx) {
    audioCtx = new CtxClass()
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume()
  }
  return audioCtx
}

export function toggleSound(enabled?: boolean): boolean {
  soundEnabled = enabled ?? !soundEnabled
  return soundEnabled
}

export function isSoundEnabled(): boolean {
  return soundEnabled
}

interface NoteStep {
  f: number
  d: number
  t: number
  type: OscillatorType
  volume: number
}

const playNotes = (notes: NoteStep[]) => {
  if (!soundEnabled) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    notes.forEach(({ f, d, t, type, volume }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.value = f

      gain.gain.setValueAtTime(volume, now + t)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + t)
      osc.stop(now + t + d)
    })
  } catch {
    return
  }
}

export const playCorrectSound = () => {
  playNotes([
    { f: 523.25, d: 0.25, t: 0, type: "triangle", volume: 0.2 },
    { f: 659.25, d: 0.25, t: 0.08, type: "triangle", volume: 0.2 },
    { f: 783.99, d: 0.25, t: 0.16, type: "triangle", volume: 0.2 },
  ])
}

export const playWrongSound = () => {
  playNotes([
    { f: 392.0, d: 0.3, t: 0, type: "sine", volume: 0.15 },
    { f: 329.63, d: 0.3, t: 0.12, type: "sine", volume: 0.15 },
  ])
}

export const playVictoryFanfare = () => {
  playNotes([
    { f: 523.25, d: 0.12, t: 0, type: "triangle", volume: 0.25 },
    { f: 659.25, d: 0.12, t: 0.12, type: "triangle", volume: 0.25 },
    { f: 783.99, d: 0.12, t: 0.24, type: "triangle", volume: 0.25 },
    { f: 1046.5, d: 0.4, t: 0.36, type: "triangle", volume: 0.25 },
  ])
}

export const speakText = (text: string, lang = "es") => {
  if (!soundEnabled || typeof window === "undefined") return
  if (!("speechSynthesis" in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95
    utterance.pitch = 1.1
    window.speechSynthesis.speak(utterance)
  } catch {
    return
  }
}
