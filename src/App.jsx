import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const audioContextRef = { current: null }

function getAudioContext() {
  if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContextRef.current.state === 'suspended') {
    audioContextRef.current.resume()
  }
  return audioContextRef.current
}

function playKick() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.setValueAtTime(150, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  osc.type = 'sine'
  gain.gain.setValueAtTime(1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}

function playSnare() {
  const ctx = getAudioContext()
  const noise = ctx.createBufferSource()
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5
  noise.buffer = noiseBuffer
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.4, ctx.currentTime)
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
  noise.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(ctx.currentTime)
  noise.stop(ctx.currentTime + 0.2)
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  osc.type = 'triangle'
  oscGain.gain.setValueAtTime(0.3, ctx.currentTime)
  oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
  osc.connect(oscGain)
  oscGain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.1)
}

function playTom() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120 + Math.random() * 80, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25)
  gain.gain.setValueAtTime(0.5, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.25)
}

function playHat() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'square'
  osc.frequency.setValueAtTime(8000 + Math.random() * 2000, ctx.currentTime)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

const PAD_PLAYERS = {
  kick1: playKick,
  kick2: playKick,
  snare1: playSnare,
  snare2: playSnare,
  tom1: playTom,
  tom2: playTom,
  hat1: playHat,
  hat2: playHat,
}

const BARS = 24

function WaveformVisualizer({ trigger }) {
  const barsRef = useRef([])

  useEffect(() => {
    if (trigger === 0) return
    barsRef.current.forEach((_, i) => {
      const bar = barsRef.current[i]
      if (!bar) return
      const peak = 0.3 + Math.random() * 0.7
      bar.style.height = `${peak * 100}%`
    })
    const t = setTimeout(() => {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = '8px'
      })
    }, 120)
    return () => clearTimeout(t)
  }, [trigger])

  return (
    <div className="waveform" data-name="Waveform Visualizer">
      <div className="waveform-bars">
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className="waveform-bar"
            style={{ height: '8px' }}
          />
        ))}
      </div>
    </div>
  )
}

function DrumPad({ id, onHit }) {
  const [playing, setPlaying] = useState(false)
  const play = PAD_PLAYERS[id]

  const handleClick = useCallback(async () => {
    if (!play) return
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()
    play()
    setPlaying(true)
    onHit?.()
    setTimeout(() => setPlaying(false), 120)
  }, [play, onHit])

  return (
    <button
      type="button"
      className={`drum-pad ${playing ? 'playing' : ''}`}
      onClick={handleClick}
      aria-label={`Play ${id}`}
    />
  )
}

function InstrumentRow({ title, padIds, onPadHit }) {
  return (
    <div className="instrument-row" data-name="Instrument Row">
      <label>{title}</label>
      <div className="pad-row" data-name="Buttons">
        {padIds.map((id) => (
          <DrumPad key={id} id={id} onHit={onPadHit} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [waveformTrigger, setWaveformTrigger] = useState(0)

  const handlePadHit = useCallback(() => {
    setWaveformTrigger((t) => t + 1)
  }, [])

  return (
    <div className="drumkit" data-name="Drumkit">
      <WaveformVisualizer trigger={waveformTrigger} />
      <div className="instrument-pads" data-name="Instrument Pads">
        <InstrumentRow
          title="Kick + Snare"
          padIds={['kick1', 'snare1']}
          onPadHit={handlePadHit}
        />
        <InstrumentRow
          title="Toms"
          padIds={['tom1', 'tom2']}
          onPadHit={handlePadHit}
        />
        <InstrumentRow
          title="Hats"
          padIds={['hat1', 'hat2']}
          onPadHit={handlePadHit}
        />
      </div>
    </div>
  )
}
