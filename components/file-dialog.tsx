"use client"

import type React from "react"

import { useState } from "react"
import { useFlowStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"

interface FileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FileDialog({ open, onOpenChange }: FileDialogProps) {
  const { flows, setFlows } = useFlowStore()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleDownload = () => {
    const dataStr = JSON.stringify(flows, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `debate-flows-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)

        if (Array.isArray(parsed)) {
          if (flows.length === 0 || confirm("This will overwrite your current flows. Continue?")) {
            setFlows(parsed)
            setUploadError(null)
            onOpenChange(false)
          }
        } else {
          setUploadError("Invalid file format")
        }
      } catch (error) {
        setUploadError("Failed to parse file")
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>File Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Export Flows</h3>
            <p className="text-sm text-muted-foreground mb-3">Download all your flows as a JSON file</p>
            <Button onClick={handleDownload} className="w-full" disabled={flows.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download Flows
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Import Flows</h3>
            <p className="text-sm text-muted-foreground mb-3">Upload a previously exported JSON file</p>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Flows
            </Button>
            <input id="file-upload" type="file" accept=".json" onChange={handleUpload} className="hidden" />
            {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Local Storage</h3>
            <p className="text-sm text-muted-foreground">
              Your flows are automatically saved to your browser&apos;s local storage
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
