"use client"

import { useEffect, useRef } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import type { TimerState } from "@/lib/types"

interface TimerProps {
  resetTime: number
  time: number
  state: TimerState["state"]
  palette?: "accent" | "accent-secondary"
  onTimeChange: (time: number) => void
  onStateChange: (state: TimerState["state"]) => void
}

export function Timer({ resetTime, time, state, palette = "accent", onTimeChange, onStateChange }: TimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (state.name === "running") {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - state.startTime
        const newTime = Math.max(0, resetTime - elapsed)

        onTimeChange(newTime)

        if (newTime <= 0) {
          onStateChange({ name: "done" })
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
  }, [state, resetTime, onTimeChange, onStateChange])

  const toggleTimer = () => {
    if (state.name === "paused") {
      onStateChange({ name: "running", startTime: Date.now() - (resetTime - time) })
    } else if (state.name === "running") {
      onStateChange({ name: "paused" })
    } else if (state.name === "done") {
      onTimeChange(resetTime)
      onStateChange({ name: "paused" })
    }
  }

  const reset = () => {
    onTimeChange(resetTime)
    onStateChange({ name: "paused" })
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const isWarning = time <= 30000 && time > 0 // Last 30 seconds
  const isDone = state.name === "done" || time <= 0

  return (
    <div
      className={cn(
        "rounded-[var(--border-radius)] p-[var(--padding)] transition-colors",
        `palette-${palette}`,
        "bg-[var(--this-background)]",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "text-2xl font-bold tabular-nums min-w-[80px]",
            isDone && "text-[var(--text-error)]",
            isWarning && "text-yellow-600 dark:text-yellow-400",
          )}
        >
          {formatTime(time)}
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTimer}>
            {state.name === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
