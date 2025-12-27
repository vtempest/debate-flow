"use client"

import type React from "react"

import { useState } from "react"
import type { Flow } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Edit2, Archive, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FlowTabProps {
  flow: Flow
  selected: boolean
  onClick: () => void
  onRename?: (newName: string) => void
  onArchive?: () => void
  onDelete?: () => void
}

export function FlowTab({ flow, selected, onClick, onRename, onArchive, onDelete }: FlowTabProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(flow.content || "Untitled Flow")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleRename = () => {
    setIsEditing(true)
  }

  const handleRenameSubmit = () => {
    onRename?.(editValue)
    setIsEditing(false)
  }

  const handleRenameCancel = () => {
    setEditValue(flow.content || "Untitled Flow")
    setIsEditing(false)
  }

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation()
    onArchive?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    onDelete?.()
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        className={cn(
          "w-full text-left p-[var(--padding)] rounded-[var(--border-radius)]",
          "transition-colors duration-[var(--transition-speed)]",
          "hover:bg-[var(--background-indent)]",
          "flex items-center justify-between group cursor-pointer",
          selected && "bg-[var(--background-active)] font-bold",
          flow.archived && "opacity-50",
        )}
      >
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRenameSubmit()
              } else if (e.key === "Escape") {
                handleRenameCancel()
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border-none outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate">
            {flow.content || "Untitled Flow"}
            {flow.archived && " (Archived)"}
          </span>
        )}

        {isHovered && !isEditing && (
          <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleRename} title="Rename flow">
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleArchive}
              title={flow.archived ? "Unarchive flow" : "Archive flow"}
            >
              <Archive className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDelete}
              title="Delete flow"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{flow.content || "Untitled Flow"}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
