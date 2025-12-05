"use client"

import { create } from "zustand"
import type { Flow, DebateRound, Speech } from "./types"
import { History } from "./history"

const historyMap = new Map<string, History>()

export interface FlowHistory {
  id: number
  flowId: string
  flowName: string
  flowData: Flow
  savedAt: string
}

interface FlowStore {
  flows: Flow[]
  selected: number
  activeMouse: boolean
  loading: boolean
  debateRounds: DebateRound[]
  speeches: Speech[]
  currentRoundId: string | null // Track current active round
  setFlows: (flows: Flow[]) => void
  setSelected: (selected: number) => void
  setActiveMouse: (active: boolean) => void
  flowsChange: () => void
  getHistory: (flowId: string) => History
  loadFlows: () => Promise<void>
  saveFlow: (flow: Flow) => Promise<void>
  updateFlow: (flow: Flow) => Promise<void>
  deleteFlow: (flowId: string) => Promise<void>
  getFlowHistory: () => Promise<FlowHistory[]>
  loadFromHistory: (historyId: number) => Promise<void>
  clearFlowHistory: () => Promise<void>
  // Debate round methods
  setCurrentRoundId: (roundId: string | null) => void // Set active round
  loadDebateRounds: () => Promise<void>
  saveDebateRound: (round: DebateRound) => Promise<void>
  updateDebateRound: (round: DebateRound) => Promise<void>
  deleteDebateRound: (roundId: string) => Promise<void>
  loadRoundWithFlows: (roundId: string) => Promise<void> // Load all flows from a round
  // Speech methods
  loadSpeeches: () => Promise<void>
  saveSpeech: (speech: Speech) => Promise<void>
  updateSpeech: (speech: Speech) => Promise<void>
  deleteSpeech: (speechId: string) => Promise<void>
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  flows: [],
  selected: 0,
  activeMouse: true,
  loading: false,
  debateRounds: [],
  speeches: [],
  currentRoundId: null, // Initialize current round

  setFlows: (flows) => set({ flows }),

  setSelected: (selected) => {
    set({ selected })
  },

  setActiveMouse: (activeMouse) => set({ activeMouse }),

  flowsChange: () => {
    set((state) => ({ flows: [...state.flows] }))
    const current = get().flows[get().selected]
    if (current) {
      // Auto-save to database
      get().updateFlow(current)
    }
  },

  getHistory: (flowId: string) => {
    if (!historyMap.has(flowId)) {
      const flow = get().flows.find((f) => f.id === flowId)
      if (flow) {
        historyMap.set(flowId, new History(flow))
      }
    }
    return historyMap.get(flowId)!
  },

  loadFlows: async () => {
    try {
      set({ loading: true })
      const response = await fetch("/api/flows")
      if (response.ok) {
        const { flows } = await response.json()
        set({ flows, loading: false })
      } else {
        console.error("Failed to load flows")
        set({ loading: false })
      }
    } catch (error) {
      console.error("Error loading flows:", error)
      set({ loading: false })
    }
  },

  saveFlow: async (flow: Flow) => {
    try {
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flow),
      })

      if (response.ok) {
        await get().loadFlows()
      } else {
        console.error("Failed to save flow")
      }
    } catch (error) {
      console.error("Error saving flow:", error)
    }
  },

  updateFlow: async (flow: Flow) => {
    try {
      const response = await fetch(`/api/flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flow),
      })

      if (!response.ok) {
        console.error("Failed to update flow")
      }
    } catch (error) {
      console.error("Error updating flow:", error)
    }
  },

  deleteFlow: async (flowId: string) => {
    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await get().loadFlows()
        // Adjust selected index if needed
        const currentSelected = get().selected
        const flowsLength = get().flows.length
        if (currentSelected >= flowsLength && flowsLength > 0) {
          set({ selected: flowsLength - 1 })
        }
      } else {
        console.error("Failed to delete flow")
      }
    } catch (error) {
      console.error("Error deleting flow:", error)
    }
  },

  getFlowHistory: async () => {
    try {
      const response = await fetch("/api/flows/history")
      if (response.ok) {
        const { history } = await response.json()
        return history
      }
      return []
    } catch (error) {
      console.error("Error loading history:", error)
      return []
    }
  },

  loadFromHistory: async (historyId: number) => {
    try {
      const history = await get().getFlowHistory()
      const entry = history.find((h: FlowHistory) => h.id === historyId)
      if (entry) {
        const newFlow: Flow = {
          ...entry.flowData,
          id: `${Date.now()}`, // Generate new ID
          name: `${entry.flowName} (Copy)`,
        }
        await get().saveFlow(newFlow)
        await get().loadFlows()
        // Select the newly added flow
        const flows = get().flows
        set({ selected: flows.length - 1 })
      }
    } catch (error) {
      console.error("Error loading from history:", error)
    }
  },

  clearFlowHistory: async () => {
    try {
      const response = await fetch("/api/flows/history", {
        method: "DELETE",
      })
      if (!response.ok) {
        console.error("Failed to clear history")
      }
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  },

  // Debate round methods
  loadDebateRounds: async () => {
    try {
      const response = await fetch("/api/debate-rounds")
      if (response.ok) {
        const { rounds } = await response.json()
        set({ debateRounds: rounds })
      }
    } catch (error) {
      console.error("Error loading debate rounds:", error)
    }
  },

  saveDebateRound: async (round: DebateRound) => {
    try {
      const response = await fetch("/api/debate-rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(round),
      })
      if (response.ok) {
        await get().loadDebateRounds()
      }
    } catch (error) {
      console.error("Error saving debate round:", error)
    }
  },

  updateDebateRound: async (round: DebateRound) => {
    try {
      await fetch(`/api/debate-rounds/${round.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(round),
      })
    } catch (error) {
      console.error("Error updating debate round:", error)
    }
  },

  deleteDebateRound: async (roundId: string) => {
    try {
      await fetch(`/api/debate-rounds/${roundId}`, {
        method: "DELETE",
      })
      await get().loadDebateRounds()
    } catch (error) {
      console.error("Error deleting debate round:", error)
    }
  },

  loadRoundWithFlows: async (roundId: string) => {
    try {
      set({ loading: true })
      const response = await fetch(`/api/debate-rounds/${roundId}`)
      if (response.ok) {
        const { round } = await response.json()
        // Load flows associated with this round
        const flowResponse = await fetch(`/api/flows?roundId=${roundId}`)
        if (flowResponse.ok) {
          const { flows } = await flowResponse.json()
          set({ flows, currentRoundId: roundId, selected: 0, loading: false })
        }
      } else {
        set({ loading: false })
      }
    } catch (error) {
      console.error("Error loading round with flows:", error)
      set({ loading: false })
    }
  },

  setCurrentRoundId: (roundId) => set({ currentRoundId: roundId }),

  // Speech methods
  loadSpeeches: async () => {
    try {
      const response = await fetch("/api/speeches")
      if (response.ok) {
        const { speeches } = await response.json()
        set({ speeches })
      }
    } catch (error) {
      console.error("Error loading speeches:", error)
    }
  },

  saveSpeech: async (speech: Speech) => {
    try {
      const response = await fetch("/api/speeches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(speech),
      })
      if (response.ok) {
        await get().loadSpeeches()
      }
    } catch (error) {
      console.error("Error saving speech:", error)
    }
  },

  updateSpeech: async (speech: Speech) => {
    try {
      await fetch(`/api/speeches/${speech.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(speech),
      })
    } catch (error) {
      console.error("Error updating speech:", error)
    }
  },

  deleteSpeech: async (speechId: string) => {
    try {
      await fetch(`/api/speeches/${speechId}`, {
        method: "DELETE",
      })
      await get().loadSpeeches()
    } catch (error) {
      console.error("Error deleting speech:", error)
    }
  },
}))

export const clearHistory = (flowId: string) => {
  historyMap.delete(flowId)
}
