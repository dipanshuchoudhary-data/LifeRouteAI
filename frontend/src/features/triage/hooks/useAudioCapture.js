import { useCallback, useRef, useState } from 'react'
import { PROVIDER_BUSY, transcribeVoice } from '../../../lib/api'
import { mediaBlobToWav } from '../../../lib/wav'

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
]

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return ''
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function speechEngine() {
  if (typeof window === 'undefined') return null
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function useAudioCapture({ onTranscript, onError, language = 'en' } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [level, setLevel] = useState(0)
  const recRef = useRef(null)
  const ctxRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const speechRef = useRef(null)
  const spokenRef = useRef('')
  const stoppingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    recRef.current = null
    ctxRef.current?.close?.()
    ctxRef.current = null
    streamRef.current?.getTracks?.().forEach((track) => track.stop())
    streamRef.current = null
    try { speechRef.current?.stop() } catch { /* ignore */ }
    speechRef.current = null
    setIsListening(false)
    setLevel(0)
  }, [])

  const finishTranscript = useCallback(async (blob) => {
    setIsTranscribing(true)
    const spoken = spokenRef.current.trim()
    try {
      let voiceText = ''
      let voiceFailed = false
      if (blob && blob.size >= 1500) {
        try {
          let payload = blob
          try {
            payload = await mediaBlobToWav(blob)
          } catch {
            payload = blob
          }
          const result = await transcribeVoice(payload, { timeoutMs: spoken ? 3500 : 10000 })
          voiceText = (result.text || '').trim()
        } catch {
          voiceFailed = true
          voiceText = ''
        }
      }
      const text = voiceText || spoken
      if (text) onTranscript?.(text)
      else if (voiceFailed) onError?.(PROVIDER_BUSY)
      else onError?.('No speech captured. Hold the mic, speak clearly, then tap again to stop.')
    } finally {
      setIsTranscribing(false)
      spokenRef.current = ''
      stoppingRef.current = false
    }
  }, [onError, onTranscript])

  const stop = useCallback(() => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    const recorder = recRef.current
    try { speechRef.current?.stop() } catch { /* ignore */ }
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    else {
      cleanup()
      finishTranscript(null)
    }
  }, [cleanup, finishTranscript])

  const start = useCallback(async () => {
    if (isListening || isTranscribing) {
      stop()
      return
    }
    if (typeof MediaRecorder === 'undefined' && !speechEngine()) {
      onError?.('Voice input is not supported in this browser. Type your symptoms instead.')
      return
    }
    spokenRef.current = ''
    stoppingRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      await ctx.resume?.()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      ctxRef.current = ctx
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!ctxRef.current) return
        analyser.getByteTimeDomainData(data)
        const amp = data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length
        setLevel(Math.min(1, amp / 40))
        requestAnimationFrame(tick)
      }
      tick()

      const recognition = speechEngine()
      if (recognition) {
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event) => {
          let text = ''
          for (let i = 0; i < event.results.length; i += 1) {
            text += event.results[i][0].transcript
          }
          spokenRef.current = text.trim()
        }
        recognition.onerror = () => {}
        try { recognition.start() } catch { /* already started */ }
        speechRef.current = recognition
      }

      chunksRef.current = []
      const mime = pickMime()
      const recorder = typeof MediaRecorder === 'undefined'
        ? null
        : new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      if (recorder) {
        recorder.ondataavailable = (event) => {
          if (event.data?.size) chunksRef.current.push(event.data)
        }
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          cleanup()
          await finishTranscript(blob)
        }
        recRef.current = recorder
        recorder.start(250)
      }
      setIsListening(true)
      timerRef.current = setTimeout(() => {
        if (!stoppingRef.current) stop()
      }, 20000)
    } catch {
      cleanup()
      stoppingRef.current = false
      onError?.('Microphone permission was denied. You can still type.')
    }
  }, [cleanup, finishTranscript, isListening, isTranscribing, language, onError, stop])

  return { isListening, isTranscribing, level, start, stop }
}
