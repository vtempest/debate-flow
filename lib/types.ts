export type Flow = {
  content: string
  level: number
  columns: string[]
  invert: boolean
  focus: boolean
  index: number
  lastFocus: number[]
  children: Box[]
  id: number
  speechDocs?: Record<string, string>
  archived?: boolean
  roundId?: number
  speechNumber?: number
}

export type Round = {
  id: number
  tournamentName: string
  roundLevel: string
  debaters: {
    aff: [string, string]
    neg: [string, string]
  }
  judges: string[]
  flowIds: number[]
  timestamp: number
  status: "pending" | "active" | "completed"
}

export type Box = {
  content: string
  children: Box[]
  index: number
  level: number
  focus: boolean
  empty?: boolean
  placeholder?: string
  crossed?: boolean
}

export type TimerState = {
  resetTime: number
  time: number
  state: { name: "paused" } | { name: "running"; startTime: number } | { name: "done" }
}

export type SpeechTimerState = {
  resetTimeIndex: number
  time: number
  state: { name: "paused" } | { name: "running"; startTime: number } | { name: "done" }
}

export type TimerSpeech = {
  name: string
  time: number
  secondary: boolean
}

export type DebateStyleFlow = {
  name: string
  columns: string[]
  columnsSwitch?: string[]
  invert: boolean
  starterBoxes?: string[]
}

export type DebateStyle = {
  primary: DebateStyleFlow
  secondary?: DebateStyleFlow
  timerSpeeches: TimerSpeech[]
  prepTime?: number
}

export type Setting = ToggleSetting | RadioSetting | SliderSetting

type SettingBasic<T> = {
  name: string
  value: T
  auto: T
  type: string
  info?: string
}

export type ToggleSetting = SettingBasic<boolean> & {
  type: "toggle"
}

export type RadioSetting = SettingBasic<number> & {
  type: "radio"
  detail: {
    options: string[]
    customOption?: boolean
    customOptionValue?: string
  }
}

export type SliderSetting = SettingBasic<number> & {
  type: "slider"
  detail: {
    min: number
    max: number
    step: number
    hue?: boolean
  }
}
