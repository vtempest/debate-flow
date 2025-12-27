"use client"

import { useEffect, useState, useRef } from "react"
import { useFlowStore, clearHistory } from "@/lib/store"
import { FlowViewer } from "./flow/flow-viewer"
import { FlowTab } from "./flow/flow-tab"
import { Timers } from "./timers/timers"
import { SettingsDialog } from "./dialogs/settings-dialog"
import { FlowHistoryDialog } from "./dialogs/flow-history-dialog"
import { RoundDialog } from "./dialogs/round-dialog"
import { newFlow } from "@/lib/flow-utils"
import { settings } from "@/lib/settings"
import { shareSpeech } from "@/app/actions"
import { Plus, Settings, FolderOpen, Undo, Redo, X, Menu, ChevronLeft, ChevronRight, Users, Mail, Clock, MoreHorizontal, FileText, CheckCircle2, Edit } from "lucide-react"
import { Button } from "./ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable"
import { Textarea } from "./ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { MarkdownEditor } from "./markdown/markdown-editor"


export function DebateFlow() {
  const { flows, selected, setFlows, setSelected, flowsChange, getHistory, setRounds, getRounds, rounds } = useFlowStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [roundDialogOpen, setRoundDialogOpen] = useState(false)
  const [editingRoundId, setEditingRoundId] = useState<number | undefined>(undefined)
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

    const savedRounds = localStorage.getItem("rounds")
    if (savedRounds) {
      try {
        const parsed = JSON.parse(savedRounds)
        setRounds(parsed)
      } catch (e) {
        console.error("Failed to load rounds:", e)
      }
    }

    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [setFlows, setRounds])

  useEffect(() => {
    // Apply initial font size
    const applyFontSize = () => {
      const fontSizeSetting = settings.data.fontSize
      if (fontSizeSetting && (fontSizeSetting.type === "radio")) {
        // Safe cast to access detail
        const nav = fontSizeSetting as any
        const options = nav.detail.options
        const index = nav.value as number
        if (options && options[index]) {
          document.documentElement.style.setProperty("--font-size", options[index])
        }
      }
    }

    applyFontSize()

    // Subscribe to font size changes
    const unsubscribe = settings.subscribe(["fontSize"], () => {
      applyFontSize()
    })

    return unsubscribe
  }, [])

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
  const flowsChangeTimeoutRef = useRef<NodeJS.Timeout>(undefined)

  const updateFlow = (index: number, updates: Partial<(typeof flows)[0]>, saveToHistory = false) => {
    // Directly mutate the flow object to avoid triggering re-renders
    Object.assign(flows[index], updates)
    flowsChange(saveToHistory)  // Only save to history when explicitly requested
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

  const handleEditRound = (roundId: number) => {
    setEditingRoundId(roundId)
    setRoundDialogOpen(true)
  }

  const handleRoundDialogClose = (open: boolean) => {
    setRoundDialogOpen(open)
    if (!open) {
      setEditingRoundId(undefined)
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

  const handleShareSpeech = async () => {
    if (!flows[selected]) return

    const currentFlow = flows[selected]
    const round = rounds.find((r) => r.id === currentFlow.roundId)
    const sharedSpeeches = currentFlow.sharedSpeeches || {}

    // Check if already shared
    const isShared = !!sharedSpeeches[selectedSpeech]

    if (isShared) {
      // Unshare - remove from sharedSpeeches
      delete sharedSpeeches[selectedSpeech]
      updateFlow(selected, { sharedSpeeches: { ...sharedSpeeches } })
    } else {
      // Get emails from round if available, otherwise use empty array
      const emails = round ? [
        ...round.debaters.aff,
        ...round.debaters.neg,
        ...round.judges
      ].filter(email => email && email.trim() !== "") : []

      // Mark the speech as shared
      sharedSpeeches[selectedSpeech] = {
        timestamp: Date.now(),
        emails: emails
      }
      updateFlow(selected, { sharedSpeeches })

      // If there are emails, send the share action
      if (emails.length > 0) {
        try {
          await shareSpeech(emails, selectedSpeech, speechContent)
        } catch (error) {
          console.error("Failed to share speech:", error)
        }
      }
    }
  }

  const sortedFlows = [...flows].sort((a, b) => {
    // Sort archived flows to the bottom
    if (a.archived && !b.archived) return 1
    if (!a.archived && b.archived) return -1
    // Otherwise maintain index order
    return a.index - b.index
  })

  const currentFlow = flows[selected]

  // Sidebar content component to reuse in both desktop and mobile
  const SidebarContent = () => {
    // Get the current round for the selected flow
    const currentRound = currentFlow?.roundId ? rounds.find(r => r.id === currentFlow.roundId) : undefined

    return (
      <div className="bg-[var(--background)] w-full h-full md:h-[var(--main-height)] rounded-[var(--border-radius)] p-[var(--padding)] flex flex-col box-border">
        <div className="h-auto pb-[var(--padding)] grid grid-cols-3 gap-1">

          <Button
            onClick={() => addFlow("primary")}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Add Flow"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setHistoryDialogOpen(true)}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Flow History"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setSettingsOpen(true)}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => currentRound && handleEditRound(currentRound.id)}
            disabled={!currentRound}
            title="Edit Round Metadata"
          >
            <Edit className="h-4 w-4" />
          </Button>
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
  }

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
                      onUpdate={(updates) => updateFlow(selected, updates, false)}
                      onOpenSpeechPanel={handleOpenSpeechPanel}
                    />
                  </div>
                </div>
              ) : (
                // Desktop layout - resizable panels
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={speechPanelOpen ? 70 : 100} minSize={30}>
                    <div className="flex flex-col h-full">


                      <div className="bg-[var(--background)] flex-grow overflow-auto rounded-[var(--border-radius)]">
                        <FlowViewer
                          flow={currentFlow}
                          onUpdate={(updates) => updateFlow(selected, updates, false)}
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
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-semibold">{selectedSpeech}</h2>
                              {currentFlow.sharedSpeeches?.[selectedSpeech] && (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Shared with {currentFlow.sharedSpeeches[selectedSpeech].emails.length}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleShareSpeech}
                                title={currentFlow.sharedSpeeches?.[selectedSpeech] ? "Unshare speech" : "Share with round participants"}
                                className={currentFlow.sharedSpeeches?.[selectedSpeech] ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-900/20" : ""}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCloseSpeechPanel}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <MarkdownEditor
                              content={speechContent}
                              onChange={handleUpdateSpeechDoc}
                              placeholder="Write your speech notes here using markdown..."
                              className="h-full"
                              showToolbar={true}
                              fileName={selectedSpeech}
                              localStorageKey={`speech-doc-${currentFlow.id}-${selectedSpeech}`}
                              autoSaveInterval={5000}
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SheetTitle>{selectedSpeech}</SheetTitle>
                          {currentFlow.sharedSpeeches?.[selectedSpeech] && (
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{currentFlow.sharedSpeeches[selectedSpeech].emails.length}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleShareSpeech}
                          title={currentFlow.sharedSpeeches?.[selectedSpeech] ? "Unshare speech" : "Share with round participants"}
                          className={currentFlow.sharedSpeeches?.[selectedSpeech] ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-900/20" : ""}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </SheetHeader>
                    <div className="h-[calc(100vh-80px)]">
                      <MarkdownEditor
                        content={speechContent}
                        onChange={handleUpdateSpeechDoc}
                        placeholder="Write your speech notes here using markdown..."
                        className="h-full"
                        showToolbar={true}
                        fileName={selectedSpeech}
                        localStorageKey={`speech-doc-${currentFlow.id}-${selectedSpeech}`}
                        autoSaveInterval={5000}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center p-8 max-w-sm mx-auto">
                {/* Empty State */}
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No rounds yet</h3>
                <p className="mb-6">Create your first debate round to get started</p>
                <Button onClick={() => setRoundDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Round
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FlowHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        onEditRound={handleEditRound}
        onCreateRound={() => {
          setEditingRoundId(undefined)
          setRoundDialogOpen(true)
        }}
      />
      <RoundDialog
        open={roundDialogOpen}
        onOpenChange={handleRoundDialogClose}
        roundId={editingRoundId}
      />
    </>
  )
}
