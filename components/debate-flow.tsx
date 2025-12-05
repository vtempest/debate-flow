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
import { Plus, Settings, FolderOpen, Undo, Redo } from "lucide-react"
import { Button } from "./ui/button"

export function DebateFlow() {
  const { flows, selected, setFlows, setSelected, flowsChange, getHistory } = useFlowStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    settings.init()

    const savedFlows = localStorage.getItem("flows")
    if (savedFlows) {
      try {
        const parsed = JSON.parse(savedFlows)
        setFlows(parsed)
      } catch (e) {
        console.error("Failed to load flows:", e)
      }
    }
  }, [setFlows])

  useEffect(() => {
    if (flows.length > 0) {
      localStorage.setItem("flows", JSON.stringify(flows))
    }
  }, [flows])

  useEffect(() => {
    if (flows[selected]) {
      const history = getHistory(flows[selected].id)
      setCanUndo(history.canUndo())
      setCanRedo(history.canRedo())
    }
  }, [flows, selected, getHistory])

  const addFlow = (type: "primary" | "secondary") => {
    const debateStyleIndex = settings.data.debateStyle.value as number
    const flow = newFlow(flows.length, type, false, debateStyleIndex)

    if (flow) {
      setFlows([...flows, flow])
      setSelected(flows.length)
      flowsChange()
    }
  }

  const deleteFlow = (index: number) => {
    const flowId = flows[index].id
    clearHistory(flowId)

    const newFlows = flows.filter((_, i) => i !== index)
    for (let i = 0; i < newFlows.length; i++) {
      newFlows[i].index = i
    }
    setFlows(newFlows)

    if (index === 0) {
      setSelected(0)
    } else {
      setSelected(index - 1)
    }
    flowsChange()
  }

  const updateFlow = (index: number, updates: Partial<(typeof flows)[0]>) => {
    const newFlows = [...flows]
    newFlows[index] = { ...newFlows[index], ...updates }
    setFlows(newFlows)
    flowsChange()
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

  const archiveFlow = (index: number) => {
    const newFlows = [...flows]
    newFlows[index] = { ...newFlows[index], archived: !newFlows[index].archived }
    setFlows(newFlows)
    flowsChange()
  }

  const renameFlow = (index: number, newName: string) => {
    const newFlows = [...flows]
    newFlows[index] = { ...newFlows[index], content: newName }
    setFlows(newFlows)
    flowsChange()
  }

  const sortedFlows = [...flows].sort((a, b) => {
    if (a.archived === b.archived) return a.index - b.index
    return a.archived ? 1 : -1
  })

  const currentFlow = flows[selected]

  return (
    <>
      <div className="w-screen h-screen overflow-hidden flex flex-col">
        <div
          className="grid gap-[var(--gap)] p-[var(--main-margin)] w-full h-full box-border"
          style={{
            gridTemplateColumns: flows.length === 0 ? "var(--sidebar-width) auto" : "var(--sidebar-width) 1fr",
          }}
        >
          <div className="bg-[var(--background)] w-full h-[var(--main-height)] rounded-[var(--border-radius)] p-[var(--padding)] flex flex-col box-border">
            <div className="h-auto pb-[var(--padding)] space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setHistoryDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  title="Flow History"
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
                <Button onClick={() => addFlow("primary")} size="sm" className="flex-1">
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
                    onClick={() => setSelected(flow.index)}
                    onRename={(newName) => renameFlow(flow.index, newName)}
                    onArchive={() => archiveFlow(flow.index)}
                    onDelete={() => deleteFlow(flow.index)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto pt-[var(--padding)]">
              <Timers />
            </div>
          </div>

          {flows.length > 0 && currentFlow ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center h-[var(--title-height)] mb-[var(--gap)] space-x-[var(--gap)]">
                <div className="bg-[var(--background)] rounded-[var(--border-radius)] flex-grow h-full min-w-0 flex items-center px-[var(--padding)]">
                  <input
                    type="text"
                    value={currentFlow.content}
                    onChange={(e) => updateFlow(selected, { content: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-xl font-bold"
                    placeholder="Flow title"
                  />
                  <Button variant="ghost" size="sm" onClick={() => deleteFlow(selected)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="bg-[var(--background)] flex-grow overflow-auto rounded-[var(--border-radius)]">
                <FlowViewer flow={currentFlow} onUpdate={(updates) => updateFlow(selected, updates)} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[var(--main-height)]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">No flows yet</h2>
                <p className="text-[var(--text-weak)] mb-4">Create your first debate flow to get started</p>
                <Button onClick={() => addFlow("primary")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FlowHistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />
    </>
  )
}
