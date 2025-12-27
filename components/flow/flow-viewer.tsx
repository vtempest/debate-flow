"use client"
import type { Flow } from "@/lib/types"
import dynamic from "next/dynamic"

const FlowSpreadsheet = dynamic(() => import("./flow-spreadsheet").then(mod => mod.FlowSpreadsheet), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading spreadsheet...</div>
})

interface FlowViewerProps {
  flow: Flow
  onUpdate: (updates: Partial<Flow>) => void
  onOpenSpeechPanel?: (speechName: string) => void
}

export function FlowViewer({ flow, onUpdate, onOpenSpeechPanel }: FlowViewerProps) {
  return (
    <div className="w-full h-full bg-background rounded-md overflow-hidden">
      <FlowSpreadsheet flow={flow} onUpdate={onUpdate} onOpenSpeechPanel={onOpenSpeechPanel} />
    </div>
  )
}

