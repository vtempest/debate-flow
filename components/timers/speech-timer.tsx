"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TimerSpeech, SpeechTimerState } from "@/lib/types"
import { playSoundEffect } from "@/lib/sound-effects"

interface SpeechTimerProps {
  speeches: TimerSpeech[]
  resetTimeIndex: number
  time: number
  state: SpeechTimerState["state"]
  onResetTimeIndexChange: (index: number) => void
  onTimeChange: (time: number) => void
  onStateChange: (state: SpeechTimerState["state"]) => void
  onFinish?: () => void
}

export function SpeechTimer({
  speeches,
  resetTimeIndex,
  time,
  state,
  onResetTimeIndexChange,
  onTimeChange,
  onStateChange,
  onFinish,
}: SpeechTimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentSpeech = speeches[resetTimeIndex]
  const [minutes, setMinutes] = useState("0")
  const [seconds, setSeconds] = useState("00")
  const minutesRef = useRef<HTMLInputElement>(null)
  const secondsRef = useRef<HTMLInputElement>(null)

  // Sync state with time prop
  useEffect(() => {
    const m = Math.floor(time / 60000)
    const s = Math.floor((time % 60000) / 1000)
    setMinutes(m.toString())
    setSeconds(s.toString().padStart(2, "0"))
  }, [time])

  useEffect(() => {
    if (state.name === "running") {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - state.startTime
        const newTime = Math.max(0, currentSpeech.time - elapsed)

        onTimeChange(newTime)

        if (newTime <= 0) {
          playSoundEffect("finalBeep")
          onStateChange({ name: "done" })
          if (onFinish) {
            onFinish()
          }
        }
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, currentSpeech.time, onTimeChange, onStateChange, onFinish])

  const toggleTimer = () => {
    playSoundEffect("bloop")
    if (state.name === "paused") {
      onStateChange({ name: "running", startTime: Date.now() - (currentSpeech.time - time) })
    } else if (state.name === "running") {
      onStateChange({ name: "paused" })
    } else if (state.name === "done") {
      onTimeChange(currentSpeech.time)
      onStateChange({ name: "paused" })
    }
  }

  const reset = () => {
    onTimeChange(currentSpeech.time)
    onStateChange({ name: "paused" })
  }

  const nextSpeech = () => {
    if (resetTimeIndex < speeches.length - 1) {
      const newIndex = resetTimeIndex + 1
      onResetTimeIndexChange(newIndex)
      onTimeChange(speeches[newIndex].time)
      onStateChange({ name: "paused" })
    }
  }

  const prevSpeech = () => {
    if (resetTimeIndex > 0) {
      const newIndex = resetTimeIndex - 1
      onResetTimeIndexChange(newIndex)
      onTimeChange(speeches[newIndex].time)
      onStateChange({ name: "paused" })
    }
  }

  const formatTimeValue = (val: string) => {
    let num = parseInt(val)
    if (isNaN(num)) num = 0
    num = Math.min(59, Math.max(0, num))
    return num.toString().padStart(2, "0")
  }

  const updateTime = (newMinutes: string, newSeconds: string) => {
    const m = parseInt(newMinutes) || 0
    const s = parseInt(newSeconds) || 0
    const newTime = m * 60000 + s * 1000
    onTimeChange(newTime)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let m = parseInt(minutes) || 0
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const newVal = (m + 1).toString()
      setMinutes(newVal)
      updateTime(newVal, seconds)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const newVal = Math.max(0, m - 1).toString()
      setMinutes(newVal)
      updateTime(newVal, seconds)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      secondsRef.current?.focus()
    }
  }

  const handleSecondsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let s = parseInt(seconds) || 0
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const newVal = Math.min(59, s + 1).toString()
      setSeconds(newVal)
      updateTime(minutes, newVal)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const newVal = Math.max(0, s - 1).toString()
      setSeconds(newVal)
      updateTime(minutes, newVal)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  const handleBlur = () => {
    const formattedMinutes = (parseInt(minutes) || 0).toString()
    const formattedSeconds = formatTimeValue(seconds)
    setMinutes(formattedMinutes)
    setSeconds(formattedSeconds)
    updateTime(formattedMinutes, formattedSeconds)
  }

  const isWarning = time <= 30000 && time > 0
  const isDone = state.name === "done" || time <= 0
  const palette = currentSpeech.secondary ? "accent-secondary" : "accent"

  return (
    <div
      className={cn(
        "rounded-[var(--border-radius)] p-[var(--padding)] transition-colors",
        `palette-${palette}`,
        "bg-[var(--this-background)]",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevSpeech} disabled={resetTimeIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-1">
            <div className="text-sm font-medium text-[var(--this-text)]">{currentSpeech.name}</div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums flex items-center justify-center",
                isDone && "text-[var(--text-error)] animate-pulse",
                isWarning && "text-yellow-600 dark:text-yellow-400",
              )}
            >
              <input
                ref={minutesRef}
                type="text"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={handleMinutesKeyDown}
                onBlur={handleBlur}
                disabled={state.name === "running"}
                className="w-[2ch] bg-transparent border-none text-right outline-none disabled:cursor-not-allowed p-0 m-0"
              />
              <span>:</span>
              <input
                ref={secondsRef}
                type="text"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={handleSecondsKeyDown}
                onBlur={handleBlur}
                disabled={state.name === "running"}
                className="w-[2ch] bg-transparent border-none text-left outline-none disabled:cursor-not-allowed p-0 m-0"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={nextSpeech}
            disabled={resetTimeIndex === speeches.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleTimer}>
            {state.name === "running" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={reset}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-xs text-center text-[var(--this-text-weak)]">
          {resetTimeIndex + 1} / {speeches.length}
        </div>
      </div>
    </div>
  )
}
