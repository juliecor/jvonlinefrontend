"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { LoaderCircle, Mic, Square } from "lucide-react"
import { toast } from "@/components/feedback"

/** A recording can't run longer than this (seconds). */
const LIMIT = 60
/** Loudest moment below this (RMS, 0–1) means nothing was said: a silent recording comes back as made-up text. */
const QUIET = 0.015
/** How often what's been said so far is written out while talking (ms). */
const LIVE_EVERY = 1500
const noop = () => () => {}
// The microphone needs https (or localhost) and a browser that can record.
const canRecord = () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia
const extension = (type: string) => (type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm")

/**
 * Ask by voice: tap to record, tap again to stop. While talking, the words
 * appear in the question box (what's been said so far is written out every
 * second and a half); when you stop, the whole recording is written out once
 * more, the most accurate version, to check before sending. English, Tagalog
 * or Bisaya. Hidden where the browser can't record.
 *
 * onText(text, final): the words so far (final: the finished version).
 */
export function VoiceButton({ slug, disabled, onText, onRecording }: { slug: string; disabled?: boolean; onText: (text: string, final: boolean) => void; onRecording?: (recording: boolean) => void }) {
  const supported = useSyncExternalStore(noop, canRecord, () => false)
  const [state, setState] = useState<"idle" | "recording" | "sending">("idle")
  const [seconds, setSeconds] = useState(0)
  // How loud it is right now (0–1), for the bar in the button.
  const [level, setLevel] = useState(0)
  const stopRef = useRef<(() => void) | null>(null)

  // Leaving the page mid-recording lets the microphone go.
  useEffect(() => () => stopRef.current?.(), [])

  if (!supported) return null

  const transcribe = async (blob: Blob, signal?: AbortSignal): Promise<string> => {
    const form = new FormData()
    form.append("audio", blob, `question.${extension(blob.type)}`)
    const res = await fetch(`/${slug}/dashboard/ai/transcribe`, { method: "POST", body: form, signal })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.message ?? "Couldn't make out the recording. Try again.")
    return String(data?.text ?? "").trim()
  }

  const start = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast("Allow the microphone for this site to ask by voice.", "error")
      return
    }

    // How loud it gets: for the bar, and so a recording where nothing was said isn't sent.
    let loudest = 0
    let audio: AudioContext | null = null
    let meter: ReturnType<typeof setInterval> | null = null
    try {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audio = new Context()
      const analyser = audio.createAnalyser()
      analyser.fftSize = 1024
      audio.createMediaStreamSource(stream).connect(analyser)
      const samples = new Float32Array(analyser.fftSize)
      meter = setInterval(() => {
        analyser.getFloatTimeDomainData(samples)
        const now = Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length)
        loudest = Math.max(loudest, now)
        setLevel(now)
      }, 100)
    } catch {
      // No meter on this browser: send whatever was recorded.
      loudest = 1
    }

    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t))
    const options = type ? { mimeType: type } : undefined
    // Two recordings of the same mic: one in pieces for the words while talking, one whole for the final version.
    const whole = new MediaRecorder(stream, options)
    const wholeChunks: Blob[] = []
    whole.ondataavailable = (e) => {
      if (e.data.size) wholeChunks.push(e.data)
    }
    let live: MediaRecorder | null = null
    const liveChunks: Blob[] = []
    try {
      live = new MediaRecorder(stream, options)
      live.ondataavailable = (e) => {
        if (e.data.size) liveChunks.push(e.data)
      }
    } catch {
      live = null
    }

    const startedAt = Date.now()
    let finished = false
    let asking: AbortController | null = null
    let lastAsked = 0
    let latest = ""
    // What's been said so far, written out; a late answer never overwrites a newer one.
    let asked = 0
    let shown = 0
    const writeOutSoFar = async () => {
      if (!live || finished || asking || loudest < QUIET || !liveChunks.length || Date.now() - startedAt < 1200 || Date.now() - lastAsked < LIVE_EVERY) return
      const mine = ++asked
      const controller = new AbortController()
      asking = controller
      lastAsked = Date.now()
      try {
        const text = await transcribe(new Blob(liveChunks, { type: live.mimeType || type || "audio/webm" }), controller.signal)
        if (!finished && text && mine > shown) {
          shown = mine
          latest = text
          onText(text, false)
        }
      } catch {
        // Only a preview: the whole recording is still written out at the end.
      } finally {
        if (asking === controller) asking = null
      }
    }

    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000)
      setSeconds(s)
      if (s >= LIMIT) stop()
      else void writeOutSoFar()
    }, 250)

    const stop = () => {
      if (finished) return
      finished = true
      stopRef.current = null
      asking?.abort()
      clearInterval(timer)
      if (meter) clearInterval(meter)
      if (live?.state === "recording") live.stop()
      if (whole.state === "recording") whole.stop()
    }

    whole.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      void audio?.close().catch(() => {})
      setLevel(0)
      onRecording?.(false)
      const blob = new Blob(wholeChunks, { type: whole.mimeType || type || "audio/webm" })
      // A tap by mistake, or nothing said: nothing worth sending.
      if (blob.size < 1000 || loudest < QUIET) {
        if (loudest < QUIET) toast("Didn't hear anything. Try again, a little closer to the mic.", "info")
        return setState("idle")
      }
      setState("sending")
      try {
        const text = await transcribe(blob)
        if (text || latest) onText(text || latest, true)
        else toast("Didn't catch that. Try again, a little closer to the mic.", "info")
      } catch (e) {
        toast(e instanceof Error ? e.message : "Couldn't make out the recording. Try again.", "error")
        if (latest) onText(latest, true)
      }
      setState("idle")
    }

    stopRef.current = stop
    whole.start()
    live?.start(1000)
    setSeconds(0)
    setState("recording")
    onRecording?.(true)
  }

  const recording = state === "recording"
  return (
    <button
      type="button"
      disabled={disabled || state === "sending"}
      onClick={() => (recording ? stopRef.current?.() : start())}
      aria-label={recording ? "Stop recording" : "Ask by voice"}
      title={recording ? "Stop and use what I said" : "Ask by voice"}
      className={`relative flex h-11 shrink-0 items-center justify-center gap-1.5 overflow-hidden font-bold transition disabled:opacity-40 ${recording ? "bg-red-700 px-3 text-sm text-white" : "w-11 border border-[#d9d4cb] bg-white text-[#3d3a34] hover:border-[#17150f]"}`}
    >
      {state === "sending" ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : recording ? (
        <>
          <Square className="h-3.5 w-3.5 animate-pulse fill-current" />
          <span className="tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
          {/* It hears you: the bar moves with your voice. */}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white/80 transition-transform duration-100" style={{ transform: `scaleX(${Math.min(1, level * 12)})` }} />
        </>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  )
}
