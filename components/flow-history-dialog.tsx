"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFlowStore, type FlowHistory } from "@/lib/store"
import { Clock, FileText, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlowHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DateGroup {
  dateKey: string
  entries: FlowHistory[]
  expanded: boolean
}

export function FlowHistoryDialog({ open, onOpenChange }: FlowHistoryDialogProps) {
  const { getFlowHistory, loadFromHistory } = useFlowStore()
  const [history, setHistory] = useState<FlowHistory[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setHistory(getFlowHistory())
    }
  }, [open, getFlowHistory])

  const dateGroups = useMemo(() => {
    const groups: Record<string, FlowHistory[]> = {}

    history.forEach((entry) => {
      const date = new Date(entry.timestamp)
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    return Object.entries(groups).map(([dateKey, entries]) => ({
      dateKey,
      entries,
      expanded: expandedDates.has(dateKey),
    }))
  }, [history, expandedDates])

  useEffect(() => {
    if (open && dateGroups.length > 0) {
      setExpandedDates(new Set(dateGroups.map((g) => g.dateKey)))
    }
  }, [open, dateGroups.length])

  const toggleDate = (dateKey: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey)
      } else {
        newSet.add(dateKey)
      }
      return newSet
    })
  }

  const handleLoadFlow = () => {
    if (selectedId) {
      loadFromHistory(selectedId)
      onOpenChange(false)
    }
  }

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all flow history?")) {
      localStorage.removeItem("flow-history")
      setHistory([])
      setSelectedId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Flow History
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Recently accessed flows (last 50)</p>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            {history.length > 0 ? (
              <div className="p-2">
                {dateGroups.map((group) => (
                  <div key={group.dateKey} className="mb-2">
                    <button
                      onClick={() => toggleDate(group.dateKey)}
                      className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      {group.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">{group.dateKey}</span>
                      <span className="text-sm text-muted-foreground ml-auto">({group.entries.length})</span>
                    </button>

                    {group.expanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {group.entries.map((entry) => {
                          const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          return (
                            <button
                              key={entry.id}
                              onClick={() => setSelectedId(entry.id)}
                              className={cn(
                                "flex items-center gap-2 w-full p-2 rounded-md transition-colors text-left",
                                selectedId === entry.id ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                              )}
                            >
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span className="flex-1 truncate">{entry.label}</span>
                              <span className="text-xs opacity-70 flex-shrink-0">{time}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center p-8">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No flow history yet</p>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoadFlow} disabled={!selectedId}>
              Load Selected Flow
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
