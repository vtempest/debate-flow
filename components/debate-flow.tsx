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
import { Plus, Settings, FolderOpen, Undo, Redo, X, Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable"
import { Textarea } from "./ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"

export function DebateFlow() {
  const { flows, selected, setFlows, setSelected, flowsChange, getHistory } = useFlowStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [speechPanelOpen, setSpeechPanelOpen] = useState(false)
  const [selectedSpeech, setSelectedSpeech] = useState<string>("")
  const [speechContent, setSpeechContent] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
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

  const handleOpenSpeechPanel = (speechName: string) => {
    const currentFlow = flows[selected]
    if (currentFlow) {
      setSelectedSpeech(speechName)
      setSpeechContent(currentFlow.speechDocs?.[speechName] || "")
      setSpeechPanelOpen(true)
    }
  }

  const handleUpdateSpeechDoc = (content: string) => {
    setSpeechContent(content)
    if (flows[selected]) {
      const speechDocs = { ...flows[selected].speechDocs, [selectedSpeech]: content }
      updateFlow(selected, { speechDocs })
    }
  }

  const handleCloseSpeechPanel = () => {
    setSpeechPanelOpen(false)
  }

  const sortedFlows = [...flows].sort((a, b) => {
    if (a.archived === b.archived) return a.index - b.index
    return a.archived ? 1 : -1
  })

  const currentFlow = flows[selected]

  // Sidebar content component to reuse in both desktop and mobile
  const SidebarContent = () => (
    <div className="bg-[var(--background)] w-full h-full md:h-[var(--main-height)] rounded-[var(--border-radius)] p-[var(--padding)] flex flex-col box-border">
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
              onClick={() => {
                setSelected(flow.index)
                if (isMobile) setMobileMenuOpen(false)
              }}
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
  )

  return (
    <>
      <div className="w-screen h-screen overflow-hidden flex flex-col">
        {/* Mobile header with hamburger menu */}
        {isMobile && (
          <div className="bg-[var(--background)] p-2 flex items-center gap-2 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">{currentFlow?.content || "Debate Flow"}</h1>
          </div>
        )}

        <div
          className={`gap-[var(--gap)] p-[var(--main-margin)] w-full h-full box-border ${isMobile ? "flex flex-col" : "grid"}`}
          style={
            !isMobile
              ? {
                  gridTemplateColumns: flows.length === 0 ? "var(--sidebar-width) auto" : "var(--sidebar-width) 1fr",
                }
              : {}
          }
        >
          {/* Desktop sidebar */}
          {!isMobile && <SidebarContent />}

          {/* Mobile sidebar sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Flows</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-80px)]">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>

{flows.length > 0 && currentFlow ? (
            <>
              {isMobile ? (
                // Mobile layout - no resizable panels, speech doc in sheet
                <div className="flex flex-col h-full flex-1">
                  <div className="bg-[var(--background)] flex-1 overflow-auto rounded-[var(--border-radius)]">
                    <FlowViewer
                      flow={currentFlow}
                      onUpdate={(updates) => updateFlow(selected, updates)}
                      onOpenSpeechPanel={handleOpenSpeechPanel}
                    />
                  </div>
                </div>
              ) : (
                // Desktop layout - resizable panels
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={speechPanelOpen ? 70 : 100} minSize={30}>
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
                        <FlowViewer
                          flow={currentFlow}
                          onUpdate={(updates) => updateFlow(selected, updates)}
                          onOpenSpeechPanel={handleOpenSpeechPanel}
                        />
                      </div>
                    </div>
                  </ResizablePanel>

                  {speechPanelOpen && (
                    <>
                      <ResizableHandle className="w-1 bg-border hover:bg-primary transition-colors" />
                      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                        <div className="bg-[var(--background)] h-full rounded-[var(--border-radius)] flex flex-col">
                          <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-semibold">{selectedSpeech} - Speech Document</h2>
                            <Button variant="ghost" size="icon" onClick={handleCloseSpeechPanel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex-1 p-4 overflow-hidden">
                            <Textarea
                              value={speechContent}
                              onChange={(e) => handleUpdateSpeechDoc(e.target.value)}
                              placeholder="Write your speech notes here using markdown..."
                              className="h-full w-full resize-none font-mono"
                            />
                          </div>
                        </div>
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              )}

              {/* Mobile speech panel sheet */}
              {isMobile && (
                <Sheet open={speechPanelOpen} onOpenChange={setSpeechPanelOpen}>
                  <SheetContent side="right" className="w-full sm:w-[400px] p-0">
                    <SheetHeader className="p-4 border-b">
                      <SheetTitle>{selectedSpeech} - Speech Document</SheetTitle>
                    </SheetHeader>
                    <div className="h-[calc(100vh-80px)] p-4">
                      <Textarea
                        value={speechContent}
                        onChange={(e) => handleUpdateSpeechDoc(e.target.value)}
                        placeholder="Write your speech notes here using markdown..."
                        className="h-full w-full resize-none font-mono"
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </>
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
