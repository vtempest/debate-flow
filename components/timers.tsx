"use client"

import { useState, useEffect } from "react"
import { Timer } from "./timer"
import { SpeechTimer } from "./speech-timer"
import { settings } from "@/lib/settings"
import { debateStyles, debateStyleMap } from "@/lib/debate-styles"
import type { TimerState, SpeechTimerState, DebateStyle } from "@/lib/types"

export function Timers() {
  const [debateStyleIndex, setDebateStyleIndex] = useState(settings.data.debateStyle.value as number)
  const [debateStyle, setDebateStyle] = useState<DebateStyle>(debateStyles[debateStyleMap[debateStyleIndex]])

  const [speechState, setSpeechState] = useState<SpeechTimerState>({
    resetTimeIndex: 0,
    time: debateStyle.timerSpeeches[0].time,
    state: { name: "paused" },
  })

  const [prepState, setPrepState] = useState<TimerState | null>(
    debateStyle.prepTime
      ? {
          resetTime: debateStyle.prepTime,
          time: debateStyle.prepTime,
          state: { name: "paused" },
        }
      : null,
  )

  const [prepSecondaryState, setPrepSecondaryState] = useState<TimerState | null>(
    debateStyle.prepTime
      ? {
          resetTime: debateStyle.prepTime,
          time: debateStyle.prepTime,
          state: { name: "paused" },
        }
      : null,
  )

  useEffect(() => {
    const unsubscribe = settings.subscribe(["debateStyle"], (key: string) => {
      const newIndex = settings.data[key].value as number
      if (newIndex !== debateStyleIndex) {
        setDebateStyleIndex(newIndex)
        const newStyle = debateStyles[debateStyleMap[newIndex]]
        setDebateStyle(newStyle)

        // Reset all timers
        setSpeechState({
          resetTimeIndex: 0,
          time: newStyle.timerSpeeches[0].time,
          state: { name: "paused" },
        })

        if (newStyle.prepTime) {
          setPrepState({
            resetTime: newStyle.prepTime,
            time: newStyle.prepTime,
            state: { name: "paused" },
          })
          setPrepSecondaryState({
            resetTime: newStyle.prepTime,
            time: newStyle.prepTime,
            state: { name: "paused" },
          })
        } else {
          setPrepState(null)
          setPrepSecondaryState(null)
        }
      }
    })

    return unsubscribe
  }, [debateStyleIndex])

  return (
    <div className="flex flex-col gap-[var(--padding)]">
      <div className="flex justify-center w-full">
        <SpeechTimer
          speeches={debateStyle.timerSpeeches}
          resetTimeIndex={speechState.resetTimeIndex}
          time={speechState.time}
          state={speechState.state}
          onResetTimeIndexChange={(index) => setSpeechState((prev) => ({ ...prev, resetTimeIndex: index }))}
          onTimeChange={(time) => setSpeechState((prev) => ({ ...prev, time }))}
          onStateChange={(state) => setSpeechState((prev) => ({ ...prev, state }))}
        />
      </div>

      {prepState && (
        <Timer
          resetTime={prepState.resetTime}
          time={prepState.time}
          state={prepState.state}
          palette="accent-secondary"
          onTimeChange={(time) => setPrepState((prev) => prev && { ...prev, time })}
          onStateChange={(state) => setPrepState((prev) => prev && { ...prev, state })}
        />
      )}

      {prepSecondaryState && (
        <Timer
          resetTime={prepSecondaryState.resetTime}
          time={prepSecondaryState.time}
          state={prepSecondaryState.state}
          palette="accent-secondary"
          onTimeChange={(time) => setPrepSecondaryState((prev) => prev && { ...prev, time })}
          onStateChange={(state) => setPrepSecondaryState((prev) => prev && { ...prev, state })}
        />
      )}
    </div>
  )
}
