"use client"

import { useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import type { TimerSpeech, SpeechTimerState } from "@/lib/types"

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

  useEffect(() => {
    if (state.name === "running") {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - state.startTime
        const newTime = Math.max(0, currentSpeech.time - elapsed)

        onTimeChange(newTime)

        if (newTime <= 0) {
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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
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
                "text-3xl font-bold tabular-nums",
                isDone && "text-[var(--text-error)]",
                isWarning && "text-yellow-600 dark:text-yellow-400",
              )}
            >
              {formatTime(time)}
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
