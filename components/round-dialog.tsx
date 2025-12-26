"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFlowStore } from "@/lib/store"
import { settings } from "@/lib/settings"
import type { Flow } from "@/lib/types"

interface RoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoundDialog({ open, onOpenChange }: RoundDialogProps) {
  const [roundName, setRoundName] = useState("")
  const [affDebater1, setAffDebater1] = useState("")
  const [affDebater2, setAffDebater2] = useState("")
  const [negDebater1, setNegDebater1] = useState("")
  const [negDebater2, setNegDebater2] = useState("")
  const [judge1, setJudge1] = useState("")
  const [judge2, setJudge2] = useState("")
  const [judge3, setJudge3] = useState("")

  const { createRound, flows, setFlows } = useFlowStore()

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Empty is okay for optional fields
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleCreateRound = () => {
    // Validate required fields
    if (!roundName.trim()) {
      alert("Please enter a round name")
      return
    }

    if (!affDebater1 || !affDebater2 || !negDebater1 || !negDebater2) {
      alert("Please enter emails for all debaters (2 per side)")
      return
    }

    if (!judge1) {
      alert("Please enter at least one judge email")
      return
    }

    // Validate email formats
    const emails = [affDebater1, affDebater2, negDebater1, negDebater2, judge1, judge2, judge3]
    for (const email of emails) {
      if (email && !validateEmail(email)) {
        alert(`Invalid email format: ${email}`)
        return
      }
    }

    // Collect judges (1-3)
    const judges = [judge1, judge2, judge3].filter((j) => j.trim())

    // Get current debate style to create flows
    const debateStyle = settings.data.debateStyle
    const styleConfig = debateStyle.value

    // Create flows for each speech in the debate style
    const newFlows: Flow[] = []
    const newFlowIds: number[] = []

    // Get the primary flow configuration
    const primaryFlow = styleConfig.primary
    const columns = primaryFlow.columns

    // Create a flow for each speech (each column represents a speech)
    columns.forEach((speechName, index) => {
      const flowId = Date.now() + index
      const newFlow: Flow = {
        id: flowId,
        content: `${roundName} - ${speechName}`,
        level: 0,
        columns: columns,
        invert: primaryFlow.invert,
        focus: false,
        index: flows.length + index,
        lastFocus: [],
        children: primaryFlow.starterBoxes
          ? primaryFlow.starterBoxes.map((content, idx) => ({
              content,
              children: [],
              index: idx,
              level: 1,
              focus: false,
            }))
          : [],
        speechDocs: {},
        archived: false,
        speechNumber: index + 1,
      }
      newFlows.push(newFlow)
      newFlowIds.push(flowId)
    })

    // Create the round
    const round = createRound({
      name: roundName,
      debaters: {
        aff: [affDebater1, affDebater2],
        neg: [negDebater1, negDebater2],
      },
      judges,
      flowIds: newFlowIds,
      status: "active",
    })

    // Associate flows with the round
    const updatedFlows = newFlows.map((flow) => ({ ...flow, roundId: round.id }))
    setFlows([...flows, ...updatedFlows])

    // Save flows to localStorage
    localStorage.setItem("flows", JSON.stringify([...flows, ...updatedFlows]))

    // Reset form
    setRoundName("")
    setAffDebater1("")
    setAffDebater2("")
    setNegDebater1("")
    setNegDebater2("")
    setJudge1("")
    setJudge2("")
    setJudge3("")

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Round</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Round Name */}
          <div className="space-y-2">
            <Label htmlFor="round-name">Round Name *</Label>
            <Input
              id="round-name"
              placeholder="e.g., Quarterfinals Round 1"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
            />
          </div>

          {/* Affirmative Debaters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Affirmative Team *</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="aff-debater-1">Debater 1 Email</Label>
                <Input
                  id="aff-debater-1"
                  type="email"
                  placeholder="debater1@example.com"
                  value={affDebater1}
                  onChange={(e) => setAffDebater1(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="aff-debater-2">Debater 2 Email</Label>
                <Input
                  id="aff-debater-2"
                  type="email"
                  placeholder="debater2@example.com"
                  value={affDebater2}
                  onChange={(e) => setAffDebater2(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Negative Debaters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Negative Team *</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="neg-debater-1">Debater 1 Email</Label>
                <Input
                  id="neg-debater-1"
                  type="email"
                  placeholder="debater3@example.com"
                  value={negDebater1}
                  onChange={(e) => setNegDebater1(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="neg-debater-2">Debater 2 Email</Label>
                <Input
                  id="neg-debater-2"
                  type="email"
                  placeholder="debater4@example.com"
                  value={negDebater2}
                  onChange={(e) => setNegDebater2(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Judges */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Judges (1-3 required) *</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="judge-1">Judge 1 Email</Label>
                <Input
                  id="judge-1"
                  type="email"
                  placeholder="judge1@example.com"
                  value={judge1}
                  onChange={(e) => setJudge1(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="judge-2">Judge 2 Email (Optional)</Label>
                <Input
                  id="judge-2"
                  type="email"
                  placeholder="judge2@example.com"
                  value={judge2}
                  onChange={(e) => setJudge2(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="judge-3">Judge 3 Email (Optional)</Label>
                <Input
                  id="judge-3"
                  type="email"
                  placeholder="judge3@example.com"
                  value={judge3}
                  onChange={(e) => setJudge3(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateRound}>Create Round & Invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
