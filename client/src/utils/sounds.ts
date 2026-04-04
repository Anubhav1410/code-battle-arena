const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
  gain.gain.setValueAtTime(volume, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

export function playMatchFound() {
  playTone(880, 0.15, 'sine', 0.08)
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.08), 150)
  setTimeout(() => playTone(1320, 0.2, 'sine', 0.08), 300)
}

export function playCountdownBeep() {
  playTone(660, 0.1, 'square', 0.05)
}

export function playCountdownGo() {
  playTone(880, 0.3, 'sine', 0.1)
}

export function playSubmit() {
  playTone(520, 0.1, 'sine', 0.06)
  setTimeout(() => playTone(660, 0.15, 'sine', 0.06), 100)
}

export function playVictory() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.3, 'sine', 0.08), i * 150))
}

export function playDefeat() {
  playTone(330, 0.3, 'sawtooth', 0.05)
  setTimeout(() => playTone(262, 0.4, 'sawtooth', 0.05), 300)
}
