"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { LoaderCircle, Mic, Square } from "lucide-react"
import { toast } from "@/components/feedback"

/** A recording can't run longer than this (seconds). */
const LIMIT = 60
/** Loudest moment below this (RMS, 0–1) means nothing was said: a silent recording comes back as made-up text. */
const QUIET = 0.015
const noop = () => () => {}
// The microphone needs https (or localhost) and a browser that can record.
const canRecord = () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia

/**
 * Ask by voice: tap to record, tap again to stop. The recording goes to the
 * backend, comes back as text (English, Tagalog or Bisaya) and lands in the
 * question box to check before sending. Hidden where the browser can't record.
 */
export function VoiceButton({ slug, disabled, onText, onRecording }: { slug: string; disabled?: boolean; onText: (text: string) => void; onRecording?: (recording: boolean) => void }) {
  const supported = useSyncExternalStore(noop, canRecord, () => false)
  const [state, setState] = useState<"idle" | "recording" | "sending">("idle")
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Leaving the page mid-recording lets the microphone go.
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
      if (recorder.current?.state === "recording") recorder.current.stop()
    },
    [],
  )

  if (!supported) return null

  const send = async (blob: Blob) => {
    setState("sending")
    const form = new FormData()
    form.append("audio", blob, `question.${blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm"}`)
    try {
      const res = await fetch(`/${slug}/dashboard/ai/transcribe`, { method: "POST", body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok) toast(data?.message ?? "Couldn't make out the recording. Try again.", "error")
      else if (data?.text) onText(data.text)
      else toast("Didn't catch that. Try again, a little closer to the phone.", "info")
    } catch {
      toast("Couldn't reach the AI. Check your connection and try again.", "error")
    }
    setState("idle")
  }

  const start = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast("Allow the microphone for this site to ask by voice.", "error")
      return
    }
    // How loud it gets, so a recording where nothing was said isn't sent.
    let loudest = 0
    let meter: ReturnType<typeof setInterval> | null = null
    let audio: AudioContext | null = null
    try {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audio = new Context()
      const analyser = audio.createAnalyser()
      analyser.fftSize = 1024
      audio.createMediaStreamSource(stream).connect(analyser)
      const samples = new Float32Array(analyser.fftSize)
      meter = setInterval(() => {
        analyser.getFloatTimeDomainData(samples)
        loudest = Math.max(loudest, Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length))
      }, 100)
    } catch {
      // No meter on this browser: send whatever was recorded.
      loudest = 1
    }
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t))
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      if (timer.current) clearInterval(timer.current)
      if (meter) clearInterval(meter)
      void audio?.close().catch(() => {})
      onRecording?.(false)
      const blob = new Blob(chunks, { type: rec.mimeType || type || "audio/webm" })
      // A tap by mistake, or nothing said: nothing worth sending.
      if (blob.size < 1000 || loudest < QUIET) {
        if (loudest < QUIET) toast("Didn't hear anything. Try again, a little closer to the mic.", "info")
        return setState("idle")
      }
      void send(blob)
    }
    recorder.current = rec
    rec.start()
    setSeconds(0)
    setState("recording")
    onRecording?.(true)
    const startedAt = Date.now()
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000)
      setSeconds(s)
      if (s >= LIMIT && rec.state === "recording") rec.stop()
    }, 250)
  }

  const recording = state === "recording"
  return (
    <button
      type="button"
      disabled={disabled || state === "sending"}
      onClick={() => (recording ? recorder.current?.stop() : start())}
      aria-label={recording ? "Stop recording" : "Ask by voice"}
      title={recording ? "Stop and use what I said" : "Ask by voice"}
      className={`flex h-11 shrink-0 items-center justify-center gap-1.5 font-bold transition disabled:opacity-40 ${recording ? "bg-red-700 px-3 text-sm text-white" : "w-11 border border-[#d9d4cb] bg-white text-[#3d3a34] hover:border-[#17150f]"}`}
    >
      {state === "sending" ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : recording ? (
        <>
          <Square className="h-3.5 w-3.5 animate-pulse fill-current" />
          <span className="tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        </>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  )
}
