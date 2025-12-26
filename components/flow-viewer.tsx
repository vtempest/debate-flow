"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { FlowBox } from "./flow-box"
import type { Flow, Box } from "@/lib/types"
import { Plus, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { useFlowStore } from "@/lib/store"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable"

interface FlowViewerProps {
  flow: Flow
  onUpdate: (updates: Partial<Flow>) => void
  onOpenSpeechPanel: (speechName: string) => void
}

export function FlowViewer({ flow, onUpdate, onOpenSpeechPanel }: FlowViewerProps) {
  const { getHistory } = useFlowStore()
  const [linePositions, setLinePositions] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const collectPositions = () => {
      if (!containerRef.current) return

      const firstColumnBoxes = containerRef.current.querySelectorAll('[data-first-column-box="true"]')
      const positions: number[] = []

      firstColumnBoxes.forEach((element) => {
        const box = element as HTMLElement
        const content = box.getAttribute("data-box-content") || ""

        if (content.trim().length > 0) {
          const rect = box.getBoundingClientRect()
          const containerRect = containerRef.current!.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top
          positions.push(relativeTop)
        }
      })

      setLinePositions(positions)
    }

    collectPositions()
    // Recollect on any update
    const timer = setTimeout(collectPositions, 100)
    return () => clearTimeout(timer)
  }, [flow.children])

  const handleBoxUpdate = (path: number[], updates: Partial<Box>) => {
    console.log("[v0] FlowViewer handleBoxUpdate", { path, updates, flowId: flow.id })

    if (path.length === 0) {
      // Update root
      onUpdate(updates)
      return
    }

    const updatedChildren = updateBoxInTree(flow.children, path, updates)
    const history = getHistory(flow.id)
    const box = getBoxAtPath(flow.children, path)
    if (box) {
      history.add("edit", path, { before: box, after: { ...box, ...updates } })
    }
    onUpdate({ children: updatedChildren })
  }

  const handleAddSibling = (path: number[], direction: number) => {
    const parentPath = path.slice(0, -1)
    const index = path[path.length - 1]
    const newIndex = index + direction

    const newBox: Box = {
      content: "",
      children: [],
      index: newIndex,
      level: path.length,
      focus: true,
      empty: false,
    }

    const history = getHistory(flow.id)
    history.add("add", [...parentPath, newIndex])

    if (parentPath.length === 0) {
      const newChildren = [...flow.children]
      newChildren.splice(newIndex, 0, newBox)
      for (let i = newIndex; i < newChildren.length; i++) {
        newChildren[i].index = i
      }
      onUpdate({ children: newChildren })
    } else {
      const updatedChildren = addSiblingInTree(flow.children, parentPath, index, direction, newBox)
      onUpdate({ children: updatedChildren })
    }
  }

  const handleDeleteBox = (path: number[]) => {
    if (path.length === 0) return // Can't delete root

    const parentPath = path.slice(0, -1)
    const index = path[path.length - 1]

    const history = getHistory(flow.id)
    const boxToDelete = parentPath.length === 0 ? flow.children[index] : getBoxAtPath(flow.children, path)

    if (boxToDelete) {
      history.add("deleteBox", path, { box: boxToDelete })
    }

    if (parentPath.length === 0) {
      if (flow.children.length > 1 || flow.level >= 1) {
        const newChildren = flow.children.filter((_, idx) => idx !== index)
        for (let i = 0; i < newChildren.length; i++) {
          newChildren[i].index = i
        }
        onUpdate({ children: newChildren })
      }
    } else {
      const updatedChildren = deleteBoxInTree(flow.children, path)
      onUpdate({ children: updatedChildren })
    }
  }

  const handleFocusChange = (path: number[], focused: boolean) => {
    if (focused) {
      const history = getHistory(flow.id)
      history.addFocus(path)
      onUpdate({ lastFocus: path })
    }
  }

  const handleCrossToggle = (path: number[]) => {
    const box = getBoxAtPath(flow.children, path)
    if (!box) return

    const history = getHistory(flow.id)
    history.add("cross", path, { crossed: !box.crossed })

    const updatedChildren = toggleCrossInTree(flow.children, path)
    onUpdate({ children: updatedChildren })
  }

  const addEmptyBox = (columnIndex: number) => {
    console.log("[v0] Adding box to column", columnIndex)

    const newBox: Box = {
      content: "",
      children: [],
      index: 0,
      level: 1,
      focus: true,
      empty: false,
    }

    if (columnIndex > 0) {
      let currentBox = newBox
      for (let i = 0; i < columnIndex; i++) {
        const isLast = i === columnIndex - 1
        currentBox.children = [
          {
            content: "",
            children: [],
            index: 0,
            level: i + 2,
            focus: isLast,
            empty: !isLast,
          },
        ]
        currentBox = currentBox.children[0]
      }
    }

    const history = getHistory(flow.id)
    history.add("add", [0])

    const newChildren = [newBox, ...flow.children]
    for (let i = 0; i < newChildren.length; i++) {
      newChildren[i].index = i
    }
    onUpdate({ children: newChildren })
  }

  const scrollColumns = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 300
    const newScrollLeft =
      scrollContainerRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount)
    scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" })
  }


  const handleNavigate = (currentPath: number[], direction: "up" | "down" | "left" | "right") => {
    let targetPath: number[] | null = null

    if (direction === "down") {
      targetPath = getNextSiblingPath(flow.children, currentPath, 1)

      if (!targetPath) {
        handleAddSibling(currentPath, 1)
        return
      }
    } else if (direction === "up") {
      // Move to previous sibling above
      targetPath = getNextSiblingPath(flow.children, currentPath, -1)
    } else if (direction === "right") {
      const currentBox = getBoxAtPath(flow.children, currentPath)
      if (currentBox) {
        if (currentBox.children && currentBox.children.length > 0) {
          targetPath = [...currentPath, 0]
        } else {
          // Create child in next column
          const newChild: Box = {
            content: "",
            children: [],
            index: 0,
            level: currentBox.level + 1,
            focus: true,
            empty: false,
          }
          const updatedChildren = updateBoxInTree(flow.children, currentPath, {
            children: [newChild],
          })
          onUpdate({ children: updatedChildren, lastFocus: [...currentPath, 0] })
          return
        }
      }
    } else if (direction === "left") {
      if (currentPath.length > 1) {
        targetPath = currentPath.slice(0, -1)
      } else if (currentPath.length === 1) {
        // At first column, try to navigate to a box in an earlier column
        // or create one if doesn't exist
        const currentIndex = currentPath[0]
        if (currentIndex > 0) {
          targetPath = [currentIndex - 1]
        }
      }
    }

    if (targetPath) {
      // Clear focus from all boxes
      clearAllFocus(flow.children)
      // Set focus to target box
      const updatedChildren = setFocusAtPath(flow.children, targetPath)
      onUpdate({ children: updatedChildren, lastFocus: targetPath })
    }
  }

  console.log("[v0] FlowViewer render", {
    flowId: flow.id,
    columns: flow.columns,
    childrenCount: flow.children.length,
  })

  return (
    <>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="flex items-center gap-2 px-2 py-1 bg-[var(--background)] border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => scrollColumns("left")} className="h-6 w-6">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs text-[var(--text-weak)]">Scroll columns</div>
          <Button variant="ghost" size="icon" onClick={() => scrollColumns("right")} className="h-6 w-6">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollContainerRef} className="w-full h-full overflow-x-auto overflow-y-hidden relative">
          <div ref={containerRef} className="w-full h-full relative">
            {linePositions.map((top, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 h-px bg-border/50 z-[1] pointer-events-none"
                style={{ top: `${top}px` }}
              />
            ))}

            <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          {flow.columns.map((columnName, index) => {
            const palette = !!(index % 2) === flow.invert ? "accent" : "accent-secondary"
            const palettePlain = !!(index % 2) === flow.invert ? "plain" : "plain-secondary"

            return (
              <>
                <ResizablePanel
                  key={index}
                  defaultSize={100 / flow.columns.length}
                  minSize={10}
                  className="relative flex flex-col"
                >
                  <div
                    className={`palette-${palette} rounded-t-[var(--border-radius)] bg-[var(--this-background)] text-[var(--this-text)] z-[3] shrink-0`}
                  >
                    <div className="relative h-[calc(var(--button-size)+var(--padding)*2)] text-center box-border select-none flex justify-center items-center flex-row gap-2">
                      <div className="p-[var(--padding)]">{columnName}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-70 hover:opacity-100"
                        onClick={() => onOpenSpeechPanel(columnName)}
                        title={`Open document for ${columnName}`}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div
                    className={`relative flex-1 palette-${palettePlain} bg-[var(--this-background)] overflow-y-auto overflow-x-hidden pb-[calc(var(--view-height)*0.4)] pt-[var(--padding)] cursor-pointer`}
                    onClick={(e) => {
                      if (e.target === e.currentTarget || (e.target as HTMLElement).closest(".column-content-area")) {
                        addEmptyBox(index)
                      }
                    }}
                  >
                    <div className="relative px-[var(--padding)] column-content-area">
                      {flow.children.length > 0 ? (
                        <ul className="list-none p-0 m-0 w-full">
                          {renderBoxesForColumn(flow.children, index, flow, {
                            columnCount: flow.columns.length,
                            invert: flow.invert,
                            isFirstColumn: index === 0,
                            onUpdate: handleBoxUpdate,
                            onAddSibling: handleAddSibling,
                            onDeleteSelf: handleDeleteBox,
                            onFocusChange: handleFocusChange,
                            onCrossToggle: handleCrossToggle,
                            onNavigate: handleNavigate,
                          })}
                        </ul>
                      ) : (
                        index === 0 && (
                          <div className="p-[var(--padding)] text-[var(--text-weak)] text-center">
                            Click below to add your first box
                          </div>
                        )
                      )}
                    </div>

                  </div>
                </ResizablePanel>

                {index < flow.columns.length - 1 && (
                  <ResizableHandle className="w-px bg-border hover:bg-primary hover:w-1 transition-all data-[resize-handle-active]:bg-primary data-[resize-handle-active]:w-1" />
                )}
              </>
            )
          })}
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </>
  )
}

function updateBoxInTree(children: Box[], path: number[], updates: Partial<Box>): Box[] {
  const [firstIndex, ...restPath] = path

  if (restPath.length === 0) {
    return children.map((child, idx) => (idx === firstIndex ? { ...child, ...updates } : child))
  }

  return children.map((child, idx) =>
    idx === firstIndex ? { ...child, children: updateBoxInTree(child.children, restPath, updates) } : child,
  )
}

function addSiblingInTree(children: Box[], parentPath: number[], index: number, direction: number, newBox: Box): Box[] {
  if (parentPath.length === 0) {
    const newChildren = [...children]
    const newIndex = index + direction
    newChildren.splice(newIndex, 0, newBox)
    for (let i = newIndex; i < newChildren.length; i++) {
      newChildren[i].index = i
    }
    return newChildren
  }

  const [firstIndex, ...restPath] = parentPath
  return children.map((child, idx) =>
    idx === firstIndex
      ? { ...child, children: addSiblingInTree(child.children, restPath, index, direction, newBox) }
      : child,
  )
}

function deleteBoxInTree(children: Box[], path: number[]): Box[] {
  const [firstIndex, ...restPath] = path

  if (restPath.length === 0) {
    const newChildren = children.filter((_, idx) => idx !== firstIndex)
    for (let i = 0; i < newChildren.length; i++) {
      newChildren[i].index = i
    }
    return newChildren
  }

  return children.map((child, idx) =>
    idx === firstIndex ? { ...child, children: deleteBoxInTree(child.children, restPath) } : child,
  )
}

function toggleCrossInTree(children: Box[], path: number[]): Box[] {
  const [firstIndex, ...restPath] = path

  if (restPath.length === 0) {
    return children.map((child, idx) => (idx === firstIndex ? { ...child, crossed: !child.crossed } : child))
  }

  return children.map((child, idx) =>
    idx === firstIndex ? { ...child, children: toggleCrossInTree(child.children, restPath) } : child,
  )
}

function getBoxAtPath(children: Box[], path: number[]): Box | null {
  if (path.length === 0) return null

  const [firstIndex, ...restPath] = path
  const child = children[firstIndex]

  if (!child) return null
  if (restPath.length === 0) return child

  return getBoxAtPath(child.children, restPath)
}

function renderBoxesForColumn(
  boxes: Box[],
  targetColumn: number,
  flow: Flow,
  handlers: {
    columnCount: number
    invert: boolean
    isFirstColumn: boolean
    onUpdate: (path: number[], updates: Partial<Box>) => void
    onAddSibling: (path: number[], direction: number) => void
    onDeleteSelf: (path: number[]) => void
    onFocusChange: (path: number[], focused: boolean) => void
    onCrossToggle: (path: number[]) => void
    onNavigate: (path: number[], direction: "up" | "down" | "left" | "right") => void
  },
  currentDepth = 0,
  parentPath: number[] = [],
): React.ReactNode {
  const result: React.ReactNode[] = []

  boxes.forEach((box, idx) => {
    const boxPath = [...parentPath, idx]
    const boxColumn = currentDepth

    if (boxColumn === targetColumn) {
      result.push(
        <div
          key={idx}
          className="relative"
          data-first-column-box={handlers.isFirstColumn}
          data-box-content={box.content}
        >
          <FlowBox
            content={box.content}
            children={box.children}
            index={box.index}
            level={box.level}
            focus={box.focus}
            empty={box.empty}
            crossed={box.crossed}
            path={boxPath}
            columnCount={handlers.columnCount}
            invert={handlers.invert}
            currentColumn={targetColumn}
            onUpdate={handlers.onUpdate}
            onAddSibling={handlers.onAddSibling}
            onDeleteSelf={handlers.onDeleteSelf}
            onFocusChange={handlers.onFocusChange}
            onCrossToggle={handlers.onCrossToggle}
            onNavigate={handlers.onNavigate}
          />
        </div>,
      )
    }

    // Recursively check children for boxes in target column
    if (box.children.length > 0) {
      const childBoxes = renderBoxesForColumn(box.children, targetColumn, flow, handlers, currentDepth + 1, boxPath)
      if (childBoxes) {
        result.push(childBoxes)
      }
    }
  })

  return result.length > 0 ? result : null
}

function getColumnForBox(box: Box, currentLevel: number): number {
  return currentLevel
}

function getNextSiblingPath(children: Box[], currentPath: number[], offset: number): number[] | null {
  if (currentPath.length === 0) return null

  const parentPath = currentPath.slice(0, -1)
  const currentIndex = currentPath[currentPath.length - 1]
  const targetIndex = currentIndex + offset

  // Get siblings array
  const siblings = parentPath.length === 0 ? children : getBoxAtPath(children, parentPath)?.children || []

  // Check if target sibling exists
  if (targetIndex >= 0 && targetIndex < siblings.length) {
    return [...parentPath, targetIndex]
  }

  return null
}

function clearAllFocus(boxes: Box[]): void {
  boxes.forEach((box) => {
    box.focus = false
    if (box.children) {
      clearAllFocus(box.children)
    }
  })
}

function setFocusAtPath(children: Box[], path: number[]): Box[] {
  if (path.length === 0) return children

  const [firstIndex, ...restPath] = path

  return children.map((child, idx) => {
    if (idx === firstIndex) {
      if (restPath.length === 0) {
        return { ...child, focus: true }
      } else {
        return { ...child, children: setFocusAtPath(child.children, restPath) }
      }
    }
    return child
  })
}
