"use client"

import { create } from "zustand"
import type { Flow } from "./types"
import { History } from "./history"

const historyMap = new Map<number, History>()

export interface FlowHistory {
  id: string
  flow: Flow
  timestamp: number
  label: string
}

interface FlowStore {
  flows: Flow[]
  selected: number
  activeMouse: boolean
  setFlows: (flows: Flow[]) => void
  setSelected: (selected: number) => void
  setActiveMouse: (active: boolean) => void
  flowsChange: () => void
  getHistory: (flowId: number) => History
  saveToHistory: (flow: Flow) => void
  getFlowHistory: () => FlowHistory[]
  loadFromHistory: (historyId: string) => void
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  flows: [],
  selected: 0,
  activeMouse: true,
  setFlows: (flows) => set({ flows }),
  setSelected: (selected) => {
    set({ selected })
    const flow = get().flows[selected]
    if (flow) {
      get().saveToHistory(flow)
    }
  },
  setActiveMouse: (activeMouse) => set({ activeMouse }),
  flowsChange: () => {
    set((state) => ({ flows: [...state.flows] }))
    const current = get().flows[get().selected]
    if (current) {
      get().saveToHistory(current)
    }
  },
  getHistory: (flowId: number) => {
    if (!historyMap.has(flowId)) {
      const flow = get().flows.find((f) => f.id === flowId)
      if (flow) {
        historyMap.set(flowId, new History(flow))
      }
    }
    return historyMap.get(flowId)!
  },
  saveToHistory: (flow: Flow) => {
    try {
      const historyKey = "flow-history"
      const existingHistory = localStorage.getItem(historyKey)
      const history: FlowHistory[] = existingHistory ? JSON.parse(existingHistory) : []

      const historyEntry: FlowHistory = {
        id: `${flow.id}-${Date.now()}`,
        flow: JSON.parse(JSON.stringify(flow)),
        timestamp: Date.now(),
        label: flow.content || "Untitled Flow",
      }

      history.unshift(historyEntry)

      // Keep only last 50 entries
      const trimmedHistory = history.slice(0, 50)
      localStorage.setItem(historyKey, JSON.stringify(trimmedHistory))
    } catch (error) {
      console.error("Failed to save to history:", error)
    }
  },
  getFlowHistory: () => {
    try {
      const historyKey = "flow-history"
      const existingHistory = localStorage.getItem(historyKey)
      return existingHistory ? JSON.parse(existingHistory) : []
    } catch (error) {
      console.error("Failed to load history:", error)
      return []
    }
  },
  loadFromHistory: (historyId: string) => {
    const history = get().getFlowHistory()
    const entry = history.find((h) => h.id === historyId)
    if (entry) {
      const flows = get().flows
      const newFlow = { ...entry.flow, id: Date.now(), index: flows.length }
      set({ flows: [...flows, newFlow], selected: flows.length })
      get().flowsChange()
    }
  },
}))

export const clearHistory = (flowId: number) => {
  historyMap.delete(flowId)
}
