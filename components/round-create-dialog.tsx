"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { DebateRound } from "@/lib/types"

interface RoundCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateRound: (round: Omit<DebateRound, "id" | "createdAt" | "updatedAt">) => void
}

export function RoundCreateDialog({ open, onOpenChange, onCreateRound }: RoundCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    debaterAff1: "",
    debaterAff2: "",
    debaterNeg1: "",
    debaterNeg2: "",
    judgeName: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateRound({
      ...formData,
      flowIds: [],
      speechIds: [],
    })
    // Reset form
    setFormData({
      name: "",
      description: "",
      debaterAff1: "",
      debaterAff2: "",
      debaterNeg1: "",
      debaterNeg2: "",
      judgeName: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Debate Round</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Round Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Finals Round 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description or notes about this round"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Affirmative Team</Label>
              <Input
                value={formData.debaterAff1}
                onChange={(e) => setFormData({ ...formData, debaterAff1: e.target.value })}
                placeholder="Debater 1"
              />
              <Input
                value={formData.debaterAff2}
                onChange={(e) => setFormData({ ...formData, debaterAff2: e.target.value })}
                placeholder="Debater 2"
              />
            </div>

            <div className="space-y-2">
              <Label>Negative Team</Label>
              <Input
                value={formData.debaterNeg1}
                onChange={(e) => setFormData({ ...formData, debaterNeg1: e.target.value })}
                placeholder="Debater 1"
              />
              <Input
                value={formData.debaterNeg2}
                onChange={(e) => setFormData({ ...formData, debaterNeg2: e.target.value })}
                placeholder="Debater 2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judge">Judge Name</Label>
            <Input
              id="judge"
              value={formData.judgeName}
              onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
              placeholder="Judge name"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Round</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
