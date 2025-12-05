"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFlowStore } from "@/lib/store"
import { Clock, FileText, ChevronRight, ChevronDown, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DebateRound } from "@/lib/types"

interface FlowHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FlowHistoryDialog({ open, onOpenChange }: FlowHistoryDialogProps) {
  const { debateRounds, loadDebateRounds, loadRoundWithFlows } = useFlowStore()
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      loadDebateRounds().then(() => {
        setLoading(false)
      })
    }
  }, [open, loadDebateRounds])

  const dateGroups = useMemo(() => {
    const groups: Record<string, DebateRound[]> = {}

    debateRounds.forEach((round) => {
      const date = new Date(round.createdAt || Date.now())
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(round)
    })

    return Object.entries(groups).map(([dateKey, rounds]) => ({
      dateKey,
      rounds,
      expanded: expandedDates.has(dateKey),
    }))
  }, [debateRounds, expandedDates])

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

  const handleLoadRound = async () => {
    if (selectedRoundId) {
      setLoading(true)
      await loadRoundWithFlows(selectedRoundId)
      setLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Debate Round History
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Select a debate round to load all its flows</p>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center p-8">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50 animate-spin" />
                  <p>Loading rounds...</p>
                </div>
              </div>
            ) : debateRounds.length > 0 ? (
              <div className="p-2">
                {dateGroups.map((group) => (
                  <div key={group.dateKey} className="mb-2">
                    <button
                      onClick={() => toggleDate(group.dateKey)}
                      className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      {group.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">{group.dateKey}</span>
                      <span className="text-sm text-muted-foreground ml-auto">({group.rounds.length})</span>
                    </button>

                    {group.expanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {group.rounds.map((round) => {
                          const time = new Date(round.createdAt || Date.now()).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          return (
                            <button
                              key={round.id}
                              onClick={() => setSelectedRoundId(round.id)}
                              className={cn(
                                "flex flex-col gap-1 w-full p-3 rounded-md transition-colors text-left",
                                selectedRoundId === round.id ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1 font-medium truncate">{round.name}</span>
                                <span className="text-xs opacity-70 flex-shrink-0">{time}</span>
                              </div>
                              {round.description && (
                                <p className="text-xs opacity-80 ml-6 line-clamp-2">{round.description}</p>
                              )}
                              <div className="text-xs opacity-70 ml-6 flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                <span>{round.flowIds?.length || 0} flows</span>
                              </div>
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
                  <p>No debate rounds yet</p>
                  <p className="text-sm mt-2">Create a new round to get started</p>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoadRound} disabled={!selectedRoundId || loading}>
              Load Selected Round
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
