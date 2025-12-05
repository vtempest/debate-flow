"use client"

import type React from "react"
import { useRef, useEffect, useState, type KeyboardEvent } from "react"
import type { Box } from "@/lib/types"
import { Plus, Trash2, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { settings } from "@/lib/settings"

interface FlowBoxProps {
  content: string
  children: Box[]
  index: number
  level: number
  focus: boolean
  path: number[]
  columnCount: number
  invert: boolean
  root?: boolean
  empty?: boolean
  crossed?: boolean
  placeholder?: string
  parentIsEmpty?: boolean
  currentColumn?: number // Added currentColumn prop to track which column this box is in
  onUpdate: (path: number[], updates: Partial<Box>) => void
  onAddSibling: (path: number[], direction: number) => void
  onDeleteSelf: (path: number[]) => void
  onFocusChange: (path: number[], focused: boolean) => void
  onCrossToggle: (path: number[]) => void
  onNavigate?: (path: number[], direction: "up" | "down" | "left" | "right") => void
}

export function FlowBox({
  content,
  children,
  index,
  level,
  focus,
  path,
  columnCount,
  invert,
  root = false,
  empty = false,
  crossed = false,
  placeholder = "",
  parentIsEmpty = false,
  currentColumn = 0, // Default to column 0
  onUpdate,
  onAddSibling,
  onDeleteSelf,
  onFocusChange,
  onCrossToggle,
  onNavigate,
}: FlowBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(content)
  const [isHovered, setIsHovered] = useState(false)
  const [showBoxCreation, setShowBoxCreation] = useState(true)
  const [showBoxFormat, setShowBoxFormat] = useState(true)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    if (focus && textareaRef.current && level >= 1) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
    }
  }, [focus, level])

  useEffect(() => {
    const unsubscribe = settings.subscribe(["showBoxCreationButtons", "showBoxFormatButtons"], (key) => {
      if (key === "showBoxCreationButtons" && settings.data.showBoxCreationButtons) {
        setShowBoxCreation(settings.data.showBoxCreationButtons.value as boolean)
      }
      if (key === "showBoxFormatButtons" && settings.data.showBoxFormatButtons) {
        setShowBoxFormat(settings.data.showBoxFormatButtons.value as boolean)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (textareaRef.current && localContent) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [localContent])

  const palette = (level % 2 === 0 && !invert) || (level % 2 === 1 && invert) ? "accent-secondary" : "accent"
  const outsidePalette = palette === "accent-secondary" ? "accent" : "accent-secondary"

  console.log("[v0] FlowBox render", { path, level, content, childrenCount: children.length, empty })

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey

    if (e.key === "ArrowUp" && !e.shiftKey && !isCtrlOrCmd) {
      e.preventDefault()
      onNavigate?.(path, "up")
      return
    } else if (e.key === "ArrowDown" && !e.shiftKey && !isCtrlOrCmd) {
      e.preventDefault()
      onNavigate?.(path, "down")
      return
    } else if (e.key === "ArrowLeft" && !e.shiftKey && !isCtrlOrCmd) {
      e.preventDefault()
      onNavigate?.(path, "left")
      return
    } else if (e.key === "ArrowRight" && !e.shiftKey && !isCtrlOrCmd) {
      e.preventDefault()
      onNavigate?.(path, "right")
      return
    }

    if (e.key === "Enter") {
      e.preventDefault()
      if (e.shiftKey) {
        // Add child (next column)
        addChild(0)
      } else if (e.altKey) {
        // Add sibling above
        onAddSibling(path, 0)
      } else if (isCtrlOrCmd) {
        if (children.length > 0) {
          onNavigate?.(path, "right")
        } else {
          addChild(0)
        }
      } else {
        onNavigate?.(path, "down")
      }
    } else if (e.key === "Backspace" && isCtrlOrCmd) {
      e.preventDefault()
      onDeleteSelf(path)
    } else if (e.key === "Backspace" && localContent.length === 0 && children.length === 0) {
      e.preventDefault()
      onDeleteSelf(path)
    } else if (e.key === "/" && isCtrlOrCmd) {
      e.preventDefault()
      onCrossToggle(path)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    onUpdate(path, { content: newContent })

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }

  const addChild = (childIndex: number) => {
    if (currentColumn < columnCount - 1) {
      const newChild: Box = {
        content: "",
        children: [],
        index: children.length,
        level: level + 1,
        focus: true,
        empty: false,
      }
      onUpdate(path, { children: [...children, newChild] })
    }
  }

  const handleChildUpdate = (childPath: number[], updates: Partial<Box>) => {
    onUpdate(path, { children: updateChildInArray(children, childPath.slice(path.length + 1), updates) })
  }

  if (empty) {
    return (
      <li className="opacity-0 pointer-events-none h-0 overflow-hidden">
        <ul className="list-none p-0 m-0">
          {children.map((child) => (
            <FlowBox
              key={child.index}
              {...child}
              path={[...path, child.index]}
              columnCount={columnCount}
              invert={invert}
              onUpdate={handleChildUpdate}
              onAddSibling={onAddSibling}
              onDeleteSelf={onDeleteSelf}
              onFocusChange={onFocusChange}
              onCrossToggle={onCrossToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </li>
    )
  }

  return (
    <li className="list-none w-full">
      <div
        className={cn("grid gap-0 w-full h-auto overflow-visible items-start group", `palette-${palette}`)}
        style={{ gridTemplateAreas: "'a b'", gridTemplateRows: "min-content" }}
      >
        <div
          className={cn(
            "relative flex flex-row w-full",
            "transition-colors duration-[var(--transition-speed)]",
            "rounded-[calc(var(--border-radius)/2)]",
            children.length > 0 && "rounded-r-none",
            index === 0 && level > 1 && !parentIsEmpty && "rounded-l-none",
          )}
          style={{
            width: "100%",
            gridArea: "a",
            background: "var(--this-background)",
            color: "var(--this-text)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full">
            {/* Top line for adding sibling above */}

            {(showBoxCreation || showBoxFormat) && isHovered && (
              <div
                className={cn(
                  "absolute right-0 top-0 flex gap-1 p-1 z-10 bg-[var(--background)]/80 rounded backdrop-blur-sm",
                  "transition-opacity duration-200",
                )}
                style={{ transform: "translateX(calc(100% + 4px))" }}
              >
                {showBoxFormat && (
                  <button
                    className={cn(
                      "p-1.5 rounded opacity-80 hover:opacity-100 transition-all hover:scale-110",
                      "bg-[var(--this-background)] text-[var(--this-text)] shadow-sm",
                      crossed && "bg-[var(--this-color)] text-white",
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      onCrossToggle(path)
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Cross out (Cmd+/)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
                {showBoxCreation && (
                  <button
                    className={cn(
                      "p-1.5 rounded opacity-80 hover:opacity-100 transition-all hover:scale-110",
                      "bg-red-500/90 text-white shadow-sm",
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      onDeleteSelf(path)
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    title="Delete box (Cmd+Backspace)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className={cn("p-[var(--padding)] relative", crossed && "line-through opacity-60")}>
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => onFocusChange(path, true)}
                onBlur={() => onFocusChange(path, false)}
                placeholder={placeholder}
                className="w-full bg-transparent border-none outline-none resize-none overflow-hidden font-[inherit] text-[inherit]"
                style={{ minHeight: "1.2em" }}
                rows={1}
              />
            </div>

            {/* Bottom line for adding sibling below */}
            {showBoxCreation && isHovered && (
              <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: "100%" }}>
                <button
                  className={cn(
                    "p-1 rounded-full transition-all duration-200",
                    "bg-[var(--this-color)] text-white shadow-md",
                    "hover:scale-110 hover:shadow-lg",
                    "flex items-center justify-center",
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    onAddSibling(path, 1)
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Add sibling below (Enter)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {children.length > 0 && (
          <ul className="list-none p-0 m-0 hidden">
            {children.map((child) => (
              <FlowBox
                key={child.index}
                {...child}
                path={[...path, child.index]}
                columnCount={columnCount}
                invert={invert}
                parentIsEmpty={empty}
                currentColumn={currentColumn + 1}
                onUpdate={handleChildUpdate}
                onAddSibling={onAddSibling}
                onDeleteSelf={onDeleteSelf}
                onFocusChange={onFocusChange}
                onCrossToggle={onCrossToggle}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function updateChildInArray(children: Box[], relativePath: number[], updates: Partial<Box>): Box[] {
  if (relativePath.length === 0) {
    return children
  }

  const [firstIndex, ...restPath] = relativePath

  if (restPath.length === 0) {
    return children.map((child, idx) => (idx === firstIndex ? { ...child, ...updates } : child))
  }

  return children.map((child, idx) =>
    idx === firstIndex ? { ...child, children: updateChildInArray(child.children, restPath, updates) } : child,
  )
}
