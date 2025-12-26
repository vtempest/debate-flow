"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFlowStore } from "@/lib/store"
import { settings } from "@/lib/settings"
import type { Flow } from "@/lib/types"

const ROUND_LEVELS = [
  "Prelim 1",
  "Prelim 2",
  "Prelim 3",
  "Prelim 4",
  "Prelim 5",
  "Prelim 6",
  "Prelim 7",
  "Prelim 8",
  "Triple Octafinals",
  "Double Octafinals",
  "Octafinals",
  "Quarterfinals",
  "Semifinals",
  "Finals",
]

interface RoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roundId?: number
}

export function RoundDialog({ open, onOpenChange, roundId }: RoundDialogProps) {
  const [tournamentName, setTournamentName] = useState("")
  const [roundLevel, setRoundLevel] = useState("Prelim 1")
  const [affDebater1, setAffDebater1] = useState("")
  const [affDebater2, setAffDebater2] = useState("")
  const [negDebater1, setNegDebater1] = useState("")
  const [negDebater2, setNegDebater2] = useState("")
  const [affSchool1, setAffSchool1] = useState("")
  const [affSchool2, setAffSchool2] = useState("")
  const [negSchool1, setNegSchool1] = useState("")
  const [negSchool2, setNegSchool2] = useState("")
  const [judge1, setJudge1] = useState("")
  const [judge2, setJudge2] = useState("")
  const [judge3, setJudge3] = useState("")

  const { createRound, updateRound, flows, setFlows, rounds } = useFlowStore()

  // Load round data when editing
  useEffect(() => {
    if (roundId && open) {
      const round = rounds.find((r) => r.id === roundId)
      if (round) {
        setTournamentName(round.tournamentName)
        setRoundLevel(round.roundLevel)
        setAffDebater1(round.debaters.aff[0])
        setAffDebater2(round.debaters.aff[1])
        setNegDebater1(round.debaters.neg[0])
        setNegDebater2(round.debaters.neg[1])
        setAffSchool1(round.schools?.aff[0] || "")
        setAffSchool2(round.schools?.aff[1] || "")
        setNegSchool1(round.schools?.neg[0] || "")
        setNegSchool2(round.schools?.neg[1] || "")
        setJudge1(round.judges[0] || "")
        setJudge2(round.judges[1] || "")
        setJudge3(round.judges[2] || "")
      }
    } else if (!open) {
      // Reset form when closing
      setTournamentName("")
      setRoundLevel("Prelim 1")
      setAffDebater1("")
      setAffDebater2("")
      setNegDebater1("")
      setNegDebater2("")
      setAffSchool1("")
      setAffSchool2("")
      setNegSchool1("")
      setNegSchool2("")
      setJudge1("")
      setJudge2("")
      setJudge3("")
    }
  }, [roundId, open, rounds])

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Empty is okay for optional fields
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleCreateRound = () => {
    // Validate required fields
    if (!tournamentName.trim()) {
      alert("Please enter a tournament name")
      return
    }

    if (!roundLevel.trim()) {
      alert("Please select a round level")
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

    // If editing existing round
    if (roundId) {
      updateRound(roundId, {
        tournamentName,
        roundLevel,
        debaters: {
          aff: [affDebater1, affDebater2],
          neg: [negDebater1, negDebater2],
        },
        schools: {
          aff: [affSchool1, affSchool2],
          neg: [negSchool1, negSchool2],
        },
        judges,
      })
      onOpenChange(false)
      return
    }

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
        content: `${tournamentName} - ${roundLevel} - ${speechName}`,
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
      tournamentName,
      roundLevel,
      debaters: {
        aff: [affDebater1, affDebater2],
        neg: [negDebater1, negDebater2],
      },
      schools: {
        aff: [affSchool1, affSchool2],
        neg: [negSchool1, negSchool2],
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
    setTournamentName("")
    setRoundLevel("Prelim 1")
    setAffDebater1("")
    setAffDebater2("")
    setNegDebater1("")
    setNegDebater2("")
    setAffSchool1("")
    setAffSchool2("")
    setNegSchool1("")
    setNegSchool2("")
    setJudge1("")
    setJudge2("")
    setJudge3("")

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roundId ? "Edit Round" : "Create New Round"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Name */}
          <div className="space-y-2">
            <Label htmlFor="tournament-name">Tournament Name *</Label>
            <Input
              id="tournament-name"
              placeholder="e.g., Harvard Invitational"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>

          {/* Round Level */}
          <div className="space-y-2">
            <Label htmlFor="round-level">Round Level *</Label>
            <select
              id="round-level"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={roundLevel}
              onChange={(e) => setRoundLevel(e.target.value)}
            >
              {ROUND_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Affirmative Debaters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Affirmative Team *</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
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
                  <Label htmlFor="aff-school-1">School (Optional)</Label>
                  <Input
                    id="aff-school-1"
                    type="text"
                    placeholder="School Name"
                    value={affSchool1}
                    onChange={(e) => setAffSchool1(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <Label htmlFor="aff-school-2">School (Optional)</Label>
                  <Input
                    id="aff-school-2"
                    type="text"
                    placeholder="School Name"
                    value={affSchool2}
                    onChange={(e) => setAffSchool2(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Negative Debaters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Negative Team *</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
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
                  <Label htmlFor="neg-school-1">School (Optional)</Label>
                  <Input
                    id="neg-school-1"
                    type="text"
                    placeholder="School Name"
                    value={negSchool1}
                    onChange={(e) => setNegSchool1(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <Label htmlFor="neg-school-2">School (Optional)</Label>
                  <Input
                    id="neg-school-2"
                    type="text"
                    placeholder="School Name"
                    value={negSchool2}
                    onChange={(e) => setNegSchool2(e.target.value)}
                  />
                </div>
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
          <Button onClick={handleCreateRound}>
            {roundId ? "Update Round" : "Create Round & Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
