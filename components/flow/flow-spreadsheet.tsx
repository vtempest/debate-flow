"use client"
import React, { useMemo, useCallback, useRef, useState, useEffect } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import type {
    ColDef,
    CellValueChangedEvent,
    GridReadyEvent,
    GetContextMenuItemsParams,
    MenuItemDef,
    CellKeyDownEvent,
    RowDragEndEvent,
    IHeaderParams
} from "ag-grid-community"
import type { Flow, Box } from "@/lib/types"
import { ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule])

interface FlowSpreadsheetProps {
    flow: Flow
    onUpdate: (updates: Partial<Flow>) => void
    onOpenSpeechPanel?: (speechName: string) => void
}

// Custom Header Component with Speech Icon
const CustomHeader = (props: IHeaderParams & { onOpenSpeechPanel?: (speechName: string) => void }) => {
    const handleSpeechClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (props.onOpenSpeechPanel && props.displayName) {
            props.onOpenSpeechPanel(props.displayName)
        }
    }

    return (
        <div className="flex items-center justify-between w-full h-full">
            <span className="flex-1 truncate">{props.displayName}</span>
            <button
                onClick={handleSpeechClick}
                className="ml-1 p-0.5 hover:bg-accent rounded transition-colors flex-shrink-0"
                title={`Open ${props.displayName} speech document`}
            >
                <FileText className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
        </div>
    )
}

// Tree node structure for AG Grid using parent-child relationships
interface TreeNode {
    id: string
    parentId?: string
    [key: string]: any
}

// Helper: flatten a Box chain into an array of contents, one per level/column
function flattenBoxChain(root: Box | undefined, depth: number): string[] {
    const values: string[] = []
    let current: Box | undefined = root
    for (let i = 0; i < depth; i++) {
        values.push(current?.content ?? "")
        current = current?.children?.[0]
    }
    return values
}

// Helper: rebuild a Box chain from an array of contents
function buildBoxChain(existing: Box | undefined, values: string[], level = 0): Box {
    const currentContent = values[level] ?? ""
    const base: Box = existing
        ? { ...existing }
        : {
            content: "",
            children: [],
            index: 0,
            level: level + 1,
            focus: false,
            empty: true,
        }
    const updated: Box = {
        ...base,
        content: currentContent,
        empty: !currentContent.trim(),
        level: level + 1,
    }
    if (level < values.length - 1) {
        const nextChild = updated.children?.[0]
        const child = buildBoxChain(nextChild, values, level + 1)
        return {
            ...updated,
            children: [child, ...(updated.children?.slice(1) ?? [])],
        }
    }
    return updated
}

// Convert flat row list to tree structure using parent IDs
function buildTreeData(boxes: Box[], columns: string[]): TreeNode[] {
    const depth = columns.length
    const nodes: TreeNode[] = []

    boxes.forEach((box, index) => {
        const values = flattenBoxChain(box, depth)
        const node: TreeNode = {
            id: `row-${index}`,
            originalIndex: index,
            // parentId is undefined initially - will be set by user interaction
        }

        // Add all column values to the node
        values.forEach((v, i) => {
            node[`col_${i}`] = v
        })

        nodes.push(node)
    })

    return nodes
}

// Convert tree structure back to flat Box array (preserving tree order)
function flattenTreeData(nodes: TreeNode[], columns: string[]): Box[] {
    const boxes: Box[] = []

    // Sort nodes to maintain order
    const sortedNodes = [...nodes].sort((a, b) => {
        const aIdx = a.originalIndex ?? 0
        const bIdx = b.originalIndex ?? 0
        return aIdx - bIdx
    })

    sortedNodes.forEach((node, index) => {
        const depth = columns.length
        const values: string[] = []
        for (let i = 0; i < depth; i++) {
            values.push(node[`col_${i}`] ?? "")
        }

        const box = buildBoxChain(undefined, values, 0)
        boxes.push(box)
    })

    return boxes
}

export function FlowSpreadsheet({ flow, onUpdate, onOpenSpeechPanel }: FlowSpreadsheetProps) {
    const gridRef = useRef<AgGridReact>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [currentColumnIndex, setCurrentColumnIndex] = useState(0)

    // Build tree data from flow children
    const [treeData, setTreeData] = useState<TreeNode[]>(() =>
        buildTreeData(flow.children, flow.columns)
    )

    // Update tree data when flow children change externally
    useEffect(() => {
        setTreeData(buildTreeData(flow.children, flow.columns))
    }, [flow.children, flow.columns])

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Auto group column definition (first column with tree structure)
    const autoGroupColumnDef = useMemo<ColDef>(() => {
        const colName = flow.columns[0] || "Column 1";
        const hasN = colName.toUpperCase().includes('N');
        const hasA = colName.toUpperCase().includes('A');

        return {
            headerName: colName,
            field: "col_0",
            rowDrag: true,
            flex: 1,
            minWidth: 100,
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellEditorParams: {
                maxLength: 1000,
            },
            cellClass: hasN ? 'text-red-500 dark:text-red-400' : hasA ? 'text-blue-500 dark:text-blue-400' : '',
            headerComponent: CustomHeader,
            headerComponentParams: {
                onOpenSpeechPanel
            },
        }
    }, [flow.columns, onOpenSpeechPanel])

    // Create column definitions for remaining columns
    const columnDefs = useMemo<ColDef[]>(() => {
        return flow.columns.slice(1).map((colName, idx) => {
            const colIndex = idx + 1
            const hasN = colName.toUpperCase().includes('N');
            const hasA = colName.toUpperCase().includes('A');

            return {
                field: `col_${colIndex}`,
                headerName: colName,
                editable: true,
                flex: 1,
                minWidth: 100,
                cellEditor: 'agTextCellEditor',
                cellEditorParams: {
                    maxLength: 1000,
                },
                wrapText: true,
                autoHeight: false,
                cellClass: hasN ? 'text-red-500 dark:text-red-400' : hasA ? 'text-blue-500 dark:text-blue-400' : '',
                headerComponent: CustomHeader,
                headerComponentParams: {
                    onOpenSpeechPanel
                },
            }
        })
    }, [flow.columns, onOpenSpeechPanel])

    // Default column definition
    const defaultColDef = useMemo<ColDef>(() => ({
        editable: true,
        sortable: false,
        filter: false,
        resizable: true,
    }), [])

    // Get row ID for tree data
    const getRowId = useCallback((params: any) => params.data.id, [])

    // Handle cell value changes
    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent) => {
            const { api } = event
            const allNodes: TreeNode[] = []

            // Collect all nodes from the grid
            api.forEachNode((node) => {
                if (node.data) {
                    allNodes.push(node.data)
                }
            })

            // Update local tree data
            setTreeData([...allNodes])

            // Convert tree back to flat Box array and update flow
            const newChildren = flattenTreeData(allNodes, flow.columns)
            onUpdate({ children: newChildren })
        },
        [flow.columns, onUpdate]
    )

    // Handle row drag end
    const onRowDragEnd = useCallback((event: RowDragEndEvent) => {
        const { api } = event
        const allNodes: TreeNode[] = []
        let nodeIndex = 0

        // Collect all nodes in their new order and update indices
        api.forEachNode((node) => {
            if (node.data) {
                const updatedNode = {
                    ...node.data,
                    originalIndex: nodeIndex++
                }
                allNodes.push(updatedNode)
            }
        })

        // Update tree data
        setTreeData([...allNodes])

        // Convert tree back to flat Box array and update flow
        const newChildren = flattenTreeData(allNodes, flow.columns)
        onUpdate({ children: newChildren })
    }, [flow.columns, onUpdate])

    const onGridReady = useCallback((params: GridReadyEvent) => {
        // Auto-size columns on initial load
        params.api.sizeColumnsToFit()
    }, [])

    // Navigate to previous column
    const scrollToPreviousColumn = useCallback(() => {
        if (!gridRef.current || currentColumnIndex === 0) return

        const newIndex = currentColumnIndex - 1
        setCurrentColumnIndex(newIndex)

        // Scroll to the column
        const columnId = newIndex === 0 ? 'ag-Grid-AutoColumn' : `col_${newIndex}`
        gridRef.current.api.ensureColumnVisible(columnId)
    }, [currentColumnIndex])

    // Navigate to next column
    const scrollToNextColumn = useCallback(() => {
        if (!gridRef.current || currentColumnIndex >= flow.columns.length - 1) return

        const newIndex = currentColumnIndex + 1
        setCurrentColumnIndex(newIndex)

        // Scroll to the column
        const columnId = `col_${newIndex}`
        gridRef.current.api.ensureColumnVisible(columnId)
    }, [currentColumnIndex, flow.columns.length])

    // Handle Tab key for indenting
    const onCellKeyDown = useCallback((event: CellKeyDownEvent) => {
        const { event: keyEvent, node, api } = event

        if (keyEvent instanceof KeyboardEvent && keyEvent.key === 'Tab' && node?.data) {
            keyEvent.preventDefault()
            keyEvent.stopPropagation()

            const currentNode = node
            const currentData = currentNode.data as TreeNode

            if (keyEvent.shiftKey) {
                // Shift+Tab: Outdent (move to parent's level)
                if (currentData.parentId) {
                    // Find parent and remove parent relationship
                    const parentNode = api.getRowNode(currentData.parentId)
                    if (parentNode?.data) {
                        currentData.parentId = (parentNode.data as TreeNode).parentId
                        api.applyTransaction({ update: [currentData] })

                        // Save changes
                        const allNodes: TreeNode[] = []
                        api.forEachNode((n) => {
                            if (n.data) allNodes.push(n.data)
                        })
                        setTreeData([...allNodes])
                        const newChildren = flattenTreeData(allNodes, flow.columns)
                        onUpdate({ children: newChildren })
                    }
                }
            } else {
                // Tab: Indent (make child of previous sibling)
                // Find the node above in visual order
                let prevNode: any = null
                let foundCurrent = false

                api.forEachNode((n) => {
                    if (foundCurrent && !prevNode) return
                    if (n.data?.id === currentData.id) {
                        foundCurrent = true
                        return
                    }
                    if (!foundCurrent) {
                        prevNode = n
                    }
                })

                if (prevNode && prevNode.data) {
                    // Make current node a child of the previous node
                    currentData.parentId = prevNode.data.id
                    api.applyTransaction({ update: [currentData] })

                    // Save changes
                    const allNodes: TreeNode[] = []
                    api.forEachNode((n) => {
                        if (n.data) allNodes.push(n.data)
                    })
                    setTreeData([...allNodes])
                    const newChildren = flattenTreeData(allNodes, flow.columns)
                    onUpdate({ children: newChildren })
                }
            }
        }
    }, [flow.columns, onUpdate])

    // Context menu for tree operations
    const getContextMenuItems = useCallback((params: GetContextMenuItemsParams): MenuItemDef[] => {
        const currentNode = params.node
        if (!currentNode?.data) return []

        const currentData = currentNode.data as TreeNode

        return [
            {
                name: 'Indent (Tab)',
                action: () => {
                    if (!params.api) return

                    // Find previous sibling
                    let prevNode: any = null
                    let foundCurrent = false

                    params.api.forEachNode((n) => {
                        if (foundCurrent && !prevNode) return
                        if (n.data?.id === currentData.id) {
                            foundCurrent = true
                            return
                        }
                        if (!foundCurrent) {
                            prevNode = n
                        }
                    })

                    if (prevNode && prevNode.data) {
                        currentData.parentId = prevNode.data.id
                        params.api.applyTransaction({ update: [currentData] })

                        const allNodes: TreeNode[] = []
                        params.api.forEachNode((n) => {
                            if (n.data) allNodes.push(n.data)
                        })
                        setTreeData([...allNodes])
                        const newChildren = flattenTreeData(allNodes, flow.columns)
                        onUpdate({ children: newChildren })
                    }
                }
            },
            {
                name: 'Outdent (Shift+Tab)',
                disabled: !currentData.parentId,
                action: () => {
                    if (!params.api || !currentData.parentId) return

                    const parentNode = params.api.getRowNode(currentData.parentId)
                    if (parentNode?.data) {
                        currentData.parentId = (parentNode.data as TreeNode).parentId
                        params.api.applyTransaction({ update: [currentData] })

                        const allNodes: TreeNode[] = []
                        params.api.forEachNode((n) => {
                            if (n.data) allNodes.push(n.data)
                        })
                        setTreeData([...allNodes])
                        const newChildren = flattenTreeData(allNodes, flow.columns)
                        onUpdate({ children: newChildren })
                    }
                }
            },
            {
                name: 'Move to Root Level',
                disabled: !currentData.parentId,
                action: () => {
                    if (!params.api) return

                    currentData.parentId = undefined
                    params.api.applyTransaction({ update: [currentData] })

                    const allNodes: TreeNode[] = []
                    params.api.forEachNode((n) => {
                        if (n.data) allNodes.push(n.data)
                    })
                    setTreeData([...allNodes])
                    const newChildren = flattenTreeData(allNodes, flow.columns)
                    onUpdate({ children: newChildren })
                }
            },
            {
                name: 'Copy',
                action: () => {
                    if (params.api) {
                        params.api.copySelectedRowsToClipboard()
                    }
                }
            },
        ]
    }, [flow.columns, onUpdate])

    return (
        <div className="w-full h-full flex flex-col">
            {/* Mobile navigation header */}
            {isMobile && (
                <div className="flex items-center justify-between p-2 border-b border-border bg-background">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={scrollToPreviousColumn}
                        disabled={currentColumnIndex === 0}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                        {flow.columns[currentColumnIndex] || `Column ${currentColumnIndex + 1}`}
                        <span className="text-muted-foreground ml-2">
                            ({currentColumnIndex + 1}/{flow.columns.length})
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={scrollToNextColumn}
                        disabled={currentColumnIndex >= flow.columns.length - 1}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* AG Grid spreadsheet */}
            <div className="flex-1">
                <AgGridReact
                    theme={themeQuartz}
                    ref={gridRef}
                    rowData={treeData}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    defaultColDef={defaultColDef}
                    getRowId={getRowId}
                    onCellValueChanged={onCellValueChanged}
                    onRowDragEnd={onRowDragEnd}
                    onGridReady={onGridReady}
                    onCellKeyDown={onCellKeyDown}
                    getContextMenuItems={getContextMenuItems}
                    rowHeight={40}
                    headerHeight={40}
                    // Tree data settings using parent ID field
                    treeData={true}
                    treeDataParentIdField="parentId"
                    groupDefaultExpanded={-1}
                    rowDragManaged={true}
                    suppressMoveWhenRowDragging={true}
                    // Excel-style Enter key navigation
                    enterNavigatesVertically={true}
                    enterNavigatesVerticallyAfterEdit={true}
                    // Other settings
                    suppressMovableColumns={true}
                    suppressCellFocus={false}
                    singleClickEdit={true}
                    stopEditingWhenCellsLoseFocus={true}
                    suppressHorizontalScroll={false}
                    domLayout="normal"
                    // Enable context menu
                    allowContextMenuWithControlKey={true}
                    // Enable row selection
                    rowSelection="single"
                />
            </div>
        </div>
    )
}
