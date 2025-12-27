"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"

interface SpeechDocDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  speechName: string
  content: string
  onUpdate: (content: string) => void
}

export function SpeechDocDialog({ open, onOpenChange, speechName, content, onUpdate }: SpeechDocDialogProps) {
  const [localContent, setLocalContent] = useState(content)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  const handleSave = () => {
    onUpdate(localContent)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{speechName} </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <Textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            placeholder="Write your speech notes here using markdown..."
            className="h-full w-full resize-none font-mono"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded bg-[var(--background)] hover:bg-[var(--background-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
