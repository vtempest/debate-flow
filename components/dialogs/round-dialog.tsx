"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Minus, Lock, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFlowStore } from "@/lib/store"
import { settings } from "@/lib/settings"
import type { Flow, Box } from "@/lib/types"
import { getTournamentNames } from "@/app/actions"
import { debateStyles, debateStyleMap } from "@/lib/debate-styles"

const ROUND_LEVELS = [
  "Prelim 1",
  "Prelim 2",
  "Prelim 3",
  "Prelim 4",
  "Prelim 5",
  "Prelim 6",
  "Prelim 7",
  "Prelim 8",
  "Triples",
  "Doubles",
  "Octas",
  "Quarters",
  "Semis",
  "Finals",
]

interface RoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roundId?: number
}

export function RoundDialog({ open, onOpenChange, roundId }: RoundDialogProps) {
  const [tournamentName, setTournamentName] = useState("")
  const [tournamentSuggestions, setTournamentSuggestions] = useState<string[]>([])
  const [roundLevel, setRoundLevel] = useState("Prelim 1")
  const [affDebater1, setAffDebater1] = useState("")
  const [affDebater2, setAffDebater2] = useState("")
  const [negDebater1, setNegDebater1] = useState("")
  const [negDebater2, setNegDebater2] = useState("")
  const [affSchool, setAffSchool] = useState("")
  const [negSchool, setNegSchool] = useState("")
  const [judgeEmails, setJudgeEmails] = useState<string[]>([""])
  const [isPublic, setIsPublic] = useState(false)
  const [winner, setWinner] = useState<"aff" | "neg" | "none">("none")

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
        setAffSchool(round.schools?.aff[0] || "")
        setNegSchool(round.schools?.neg[0] || "")
        setJudgeEmails(round.judges.length > 0 ? round.judges : [""])
        setIsPublic(round.isPublic || false)
        setWinner(round.winner || "none")
      }
    } else if (!open) {
      // Reset form when closing
      setTournamentName("")
      setRoundLevel("Prelim 1")
      setAffDebater1("")
      setAffDebater2("")
      setNegDebater1("")
      setNegDebater2("")
      setAffSchool("")
      setNegSchool("")
      setJudgeEmails([""])
      setIsPublic(false)
      setWinner("none")
    }
  }, [roundId, open, rounds])

  useEffect(() => {
    if (open) {
      getTournamentNames().then((names) => {
        console.log("Tournament suggestions:", names)
        setTournamentSuggestions(names)
      })
    }
  }, [open])

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

    if (!affDebater1 || !negDebater1) {
      alert("Please enter emails for at least one debater per side")
      return
    }

    if (!judgeEmails[0]?.trim()) {
      alert("Please enter at least one judge email")
      return
    }

    // Validate email formats
    const emails = [affDebater1, affDebater2, negDebater1, negDebater2, ...judgeEmails]
    for (const email of emails) {
      if (email && !validateEmail(email)) {
        alert(`Invalid email format: ${email}`)
        return
      }
    }

    // Collect judges (filter empty)
    const judges = judgeEmails.filter((j) => j.trim())

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
          aff: [affSchool, affSchool],
          neg: [negSchool, negSchool],
        },
        judges,
        isPublic,
        winner: winner === "none" ? undefined : winner,
      })
      onOpenChange(false)
      return
    }

    // Get current debate style to create flows
    const debateStyleSetting = settings.data.debateStyle
    const styleIndex = debateStyleSetting.value as number
    const styleKey = debateStyleMap[styleIndex]
    const styleConfig = debateStyles[styleKey]

    // Create flows for each speech in the debate style
    const newFlows: Flow[] = []
    const newFlowIds: number[] = []

    // Get the primary flow configuration
    const primaryFlow = styleConfig.primary
    const columns = primaryFlow.columns

    // Create a flow for each speech (each column represents a speech)
    // Only create the first flow initially as per user request
    const firstColumn = columns.slice(0, 1)

    firstColumn.forEach((speechName, index) => {
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
        children: (() => {
          const rows: Box[] = []
          if (!primaryFlow.starterBoxes) {
            // Create 100 empty rows
            for (let r = 0; r < 100; r++) {
              const rootBox: Box = {
                content: "",
                children: [],
                index: r,
                level: 1,
                focus: false,
                empty: columns.length > 1,
              }
              rows.push(rootBox)

              let currentBox = rootBox
              for (let c = 1; c < columns.length; c++) {
                const childBox: Box = {
                  content: "",
                  children: [],
                  index: 0,
                  level: c + 1,
                  focus: false,
                  empty: c < columns.length - 1,
                }
                currentBox.children.push(childBox)
                currentBox = childBox
              }
            }
            return rows
          }
          return primaryFlow.starterBoxes.map((content, idx) => ({
            content,
            children: [],
            index: idx,
            level: 1,
            focus: false,
          }))
        })(),
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
        aff: [affSchool, affSchool],
        neg: [negSchool, negSchool],
      },
      judges,
      flowIds: newFlowIds,
      status: "active",
      isPublic,
    })

    // Archive all existing flows to "close" them from the workspace
    const archivedFlows = flows.map(f => ({ ...f, archived: true }))

    // Associate flows with the round
    const updatedFlows = newFlows.map((flow) => ({ ...flow, roundId: round.id }))

    // Combine archived old flows with new active flows
    const finalFlows = [...archivedFlows, ...updatedFlows]
    setFlows(finalFlows)

    // Save flows to localStorage
    localStorage.setItem("flows", JSON.stringify(finalFlows))

    // Reset form
    setTournamentName("")
    setRoundLevel("Prelim 1")
    setAffDebater1("")
    setAffDebater2("")
    setNegDebater1("")
    setNegDebater2("")
    setAffSchool("")
    setNegSchool("")
    setJudgeEmails([""])

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image src="/icon-rounds.svg" alt="Rounds" width={64} height={64} />
            {roundId ? "Edit Round" : "Create New Round"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Name and Round Level */}
          {/* Tournament Name and Round Level */}
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2 space-y-2 ">
              <Input
                id="tournament-name"
                list="tournament-suggestions"
                placeholder="e.g., Harvard Invitational"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
              <datalist id="tournament-suggestions">
                {tournamentSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2 ">
              <Select value={roundLevel} onValueChange={setRoundLevel}>
                <SelectTrigger id="round-level">
                  <SelectValue placeholder="Select round level" />
                </SelectTrigger>
                <SelectContent>
                  {ROUND_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 flex flex-col items-center pb-2">
              <Label htmlFor="visibility-toggle" className="text-xs text-muted-foreground mb-1">
                {isPublic ? "Public" : "Private"}
              </Label>
              <div className="flex items-center gap-2">
                <Lock className={`h-4 w-4 ${!isPublic ? "text-primary" : "text-muted-foreground"}`} />
                <Switch
                  id="visibility-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>

          {/* Teams - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Affirmative Team */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-500">Affirmative Team</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="aff-school">School (Optional)</Label>
                  <Input
                    id="aff-school"
                    type="text"
                    placeholder="School Name"
                    value={affSchool}
                    onChange={(e) => setAffSchool(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="aff-debater-1">1A Email</Label>
                  <Input
                    id="aff-debater-1"
                    type="email"
                    placeholder="debater1@example.com"
                    value={affDebater1}
                    onChange={(e) => setAffDebater1(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="aff-debater-2"> 2A Email (Optional)</Label>
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

            {/* Negative Team */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-500">Negative Team</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="neg-school">School (Optional)</Label>
                  <Input
                    id="neg-school"
                    type="text"
                    placeholder="School Name"
                    value={negSchool}
                    onChange={(e) => setNegSchool(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="neg-debater-1">1N Email</Label>
                  <Input
                    id="neg-debater-1"
                    type="email"
                    placeholder="debater3@example.com"
                    value={negDebater1}
                    onChange={(e) => setNegDebater1(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="neg-debater-2">2N Email (Optional)</Label>
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
          </div>

          {/* Judges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Judges</h3>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setJudgeEmails([...judgeEmails, ""])}
                  title="Add Judge"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {judgeEmails.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (judgeEmails.length > 1) {
                        setJudgeEmails(judgeEmails.slice(0, -1))
                      }
                    }}
                    title="Remove Judge"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {judgeEmails.map((email, index) => (
                <div key={index}>
                  <Label htmlFor={`judge-${index}`}>Judge {index + 1} Email</Label>
                  <Input
                    id={`judge-${index}`}
                    type="email"
                    placeholder={`judge${index + 1}@example.com`}
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...judgeEmails]
                      newEmails[index] = e.target.value
                      setJudgeEmails(newEmails)
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Winner Selection - Only show when editing */}
          {roundId && (
            <div className="space-y-2">
              <Label htmlFor="winner">Winner</Label>
              <Select value={winner} onValueChange={(value) => setWinner(value as "aff" | "neg" | "none")}>
                <SelectTrigger id="winner">
                  <SelectValue placeholder="Select winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Undecided</SelectItem>
                  <SelectItem value="aff">Aff</SelectItem>
                  <SelectItem value="neg">Neg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Create Button */}
          <div className="pt-4 pb-2">
            <Button onClick={handleCreateRound} className="w-full" size="lg">
              {roundId ? "Update Round" : "Create Round & Invite"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog >
  )
}
