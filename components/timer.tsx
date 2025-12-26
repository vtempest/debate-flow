"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import type { TimerState } from "@/lib/types"
import { playSoundEffect } from "@/lib/sound-effects"

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
        const newTime = Math.max(0, resetTime - elapsed)

        onTimeChange(newTime)

        if (newTime <= 0) {
          playSoundEffect("finalBeep")
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
    playSoundEffect("bloop")
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
    const formattedMinutes = (parseInt(minutes) || 0).toString() // Remove leading zeros for minutes usually? Original code didn't force padding on minutes, mostly seconds.
    const formattedSeconds = formatTimeValue(seconds)
    setMinutes(formattedMinutes)
    setSeconds(formattedSeconds)
    updateTime(formattedMinutes, formattedSeconds)
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
            "text-2xl font-bold tabular-nums min-w-[80px] flex items-center justify-center", // Added flex centering
            isDone && "text-[var(--text-error)] animate-pulse", // approximates the 'done' animation
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
