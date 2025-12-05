"use client"

import { useEffect, useState } from "react"
import { useFlowStore, clearHistory } from "@/lib/store"
import { FlowViewer } from "./flow-viewer"
import { FlowTab } from "./flow-tab"
import { Timers } from "./timers"
import { SettingsDialog } from "./settings-dialog"
import { FlowHistoryDialog } from "./flow-history-dialog"
import { newFlow } from "@/lib/flow-utils"
import { settings } from "@/lib/settings"
import { Plus, Settings, FolderOpen, Undo, Redo, Users, Menu, X } from "lucide-react"
import { Button } from "./ui/button"
import { RoundCreateDialog } from "./round-create-dialog"
import { useMobile } from "@/lib/hooks/use-mobile"

export function DebateFlow() {
  const {
    flows,
    selected,
    setFlows,
    setSelected,
    flowsChange,
    getHistory,
    loadFlows,
    saveFlow,
    updateFlow: updateFlowInDb,
    deleteFlow: deleteFlowInDb,
    loading,
    currentRoundId, // Get current round
    setCurrentRoundId,
    saveDebateRound,
    loadDebateRounds,
  } = useFlowStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [roundCreateOpen, setRoundCreateOpen] = useState(false) // Round creation dialog
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    settings.init()
    loadFlows()
    loadDebateRounds() // Load debate rounds on mount
  }, [loadFlows, loadDebateRounds])

  useEffect(() => {
    if (flows[selected]) {
      const history = getHistory(flows[selected].id)
      setCanUndo(history.canUndo())
      setCanRedo(history.canRedo())
    }
  }, [flows, selected, getHistory])

  const createDebateRound = async (
    roundData: Omit<import("@/lib/types").DebateRound, "id" | "createdAt" | "updatedAt">,
  ) => {
    const round: import("@/lib/types").DebateRound = {
      ...roundData,
      id: `round-${Date.now()}`,
    }
    await saveDebateRound(round)
    setCurrentRoundId(round.id)
    // Clear current flows and start fresh for the new round
    setFlows([])
    setSelected(0)
  }

  const addFlow = async (type: "primary" | "secondary") => {
    const debateStyleIndex = settings.data.debateStyle.value as number
    const flow = newFlow(flows.length, type, false, debateStyleIndex)

    if (flow) {
      // Associate flow with current round if one is active
      if (currentRoundId) {
        flow.debateRoundId = currentRoundId
      }
      await saveFlow(flow)
      setSelected(flows.length)
    }
  }

  const deleteFlow = async (index: number) => {
    const flowId = flows[index].id
    clearHistory(flowId)
    await deleteFlowInDb(flowId)
  }

  const updateFlow = async (index: number, updates: Partial<(typeof flows)[0]>) => {
    const newFlows = [...flows]
    newFlows[index] = { ...newFlows[index], ...updates }
    setFlows(newFlows)
    await updateFlowInDb(newFlows[index])
  }

  const handleUndo = () => {
    if (flows[selected]) {
      const history = getHistory(flows[selected].id)
      if (history.canUndo()) {
        const updatedFlow = history.undo()
        if (updatedFlow) {
          updateFlow(selected, updatedFlow)
        }
      }
    }
  }

  const handleRedo = () => {
    if (flows[selected]) {
      const history = getHistory(flows[selected].id)
      if (history.canRedo()) {
        const updatedFlow = history.redo()
        if (updatedFlow) {
          updateFlow(selected, updatedFlow)
        }
      }
    }
  }

  const archiveFlow = async (index: number) => {
    const newFlows = [...flows]
    newFlows[index] = { ...newFlows[index], archived: !newFlows[index].archived }
    setFlows(newFlows)
    await updateFlowInDb(newFlows[index])
  }

  const renameFlow = async (index: number, newName: string) => {
    const newFlows = [...flows]
    newFlows[index] = { ...newFlows[index], name: newName }
    setFlows(newFlows)
    await updateFlowInDb(newFlows[index])
  }

  const sortedFlows = [...flows].sort((a, b) => {
    if (a.archived === b.archived) return (a.index || 0) - (b.index || 0)
    return a.archived ? 1 : -1
  })

  const currentFlow = flows[selected]

  if (loading && flows.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[var(--text-weak)]">Loading flows...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-screen h-screen overflow-hidden flex flex-col">
        {/* Hamburger Menu Button for Mobile */}
        {isMobile && (
          <div className="fixed top-4 left-4 z-50">
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              size="icon"
              variant="default"
              className="h-10 w-10 rounded-lg shadow-lg"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        )}

        <div
          className={`${isMobile ? "flex flex-col" : "grid gap-[var(--gap)]"} p-[var(--main-margin)] w-full h-full box-border`}
          style={{
            gridTemplateColumns: !isMobile && (flows.length === 0 ? "var(--sidebar-width) auto" : "var(--sidebar-width) 1fr"),
          }}
        >
          {/* Sidebar */}
          <div className={`
            bg-[var(--background)]
            ${isMobile ? `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : 'w-full h-[var(--main-height)]'}
            rounded-[var(--border-radius)] p-[var(--padding)] flex flex-col box-border
            ${isMobile ? 'shadow-xl' : ''}
          `}>
            <div className="h-auto pb-[var(--padding)] space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setRoundCreateOpen(true)}
                  size="sm"
                  variant="default"
                  className="flex-1"
                  title="New Debate Round"
                >
                  <Users className="h-4 w-4 mr-1" />
                  New Round
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setHistoryDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  title="Round History"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                <Button onClick={() => setSettingsOpen(true)} size="sm" variant="outline" className="flex-1">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo (Cmd+Z)"
                  className="flex-1 bg-transparent"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo (Cmd+Shift+Z)"
                  className="flex-1 bg-transparent"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addFlow("primary")} size="sm" className="flex-1" disabled={loading}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Flow
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto flex-grow box-border">
              <div className="p-0 m-0">
                {sortedFlows.map((flow) => (
                  <FlowTab
                    key={flow.id}
                    flow={flow}
                    selected={flow.index === selected}
                    onClick={() => setSelected(flow.index || 0)}
                    onRename={(newName) => renameFlow(flow.index || 0, newName)}
                    onArchive={() => archiveFlow(flow.index || 0)}
                    onDelete={() => deleteFlow(flow.index || 0)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto pt-[var(--padding)]">
              <Timers />
            </div>
          </div>

          {/* Main Content Area */}
          <div className={`${isMobile ? 'flex-1' : ''} ${isMobile ? 'pb-16' : ''}`}>
            {flows.length > 0 && currentFlow ? (
              <div className={`bg-[var(--background)] ${isMobile ? 'h-full' : 'h-full'} overflow-auto rounded-[var(--border-radius)]`}>
                <FlowViewer flow={currentFlow} onUpdate={(updates) => updateFlow(selected, updates)} isMobile={isMobile} />
              </div>
            ) : (
              <div className={`flex items-center justify-center ${isMobile ? 'h-full' : 'h-[var(--main-height)]'}`}>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">No flows yet</h2>
                  <p className="text-[var(--text-weak)] mb-4">Create your first debate flow to get started</p>
                  <Button onClick={() => addFlow("primary")} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flow
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Timer Bar at Bottom */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-border z-20 p-2">
            <Timers compact={true} />
          </div>
        )}
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FlowHistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />
      <RoundCreateDialog open={roundCreateOpen} onOpenChange={setRoundCreateOpen} onCreateRound={createDebateRound} />
    </>
  )
}
