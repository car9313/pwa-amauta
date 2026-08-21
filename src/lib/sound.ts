type NoteType = "sine" | "square" | "triangle" | "sawtooth"

interface Note {
  frequency: number
  startAt: number
  duration: number
  volume?: number
  type?: NoteType
}

let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null
  if (audioContext) return audioContext
  const Context =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return null
  audioContext = new Context()
  return audioContext
}

const playNote = (ctx: AudioContext, note: Note) => {
  const { frequency, startAt, duration, volume = 0.15, type = "triangle" } = note
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const startTime = ctx.currentTime + startAt

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

export const playCorrectSound = () => {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === "suspended") {
    void ctx.resume()
  }
  const notes: Note[] = [
    { frequency: 523.25, startAt: 0, duration: 0.25 },
    { frequency: 659.25, startAt: 0.1, duration: 0.25 },
    { frequency: 783.99, startAt: 0.2, duration: 0.35 },
  ]
  notes.forEach((note) => playNote(ctx, note))
}
