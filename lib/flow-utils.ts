import type { Flow, Box } from "./types"
import { debateStyles, debateStyleMap } from "./debate-styles"

let flowIdCounter = 0

export function newBox(index: number, level: number, focus = false): Box {
  return {
    content: "",
    children: [],
    index,
    level,
    focus,
    empty: false,
  }
}

export function newFlow(
  index: number,
  type: "primary" | "secondary",
  switchSpeakers: boolean,
  debateStyleIndex: number,
): Flow | null {
  const debateStyle = debateStyles[debateStyleMap[debateStyleIndex]]

  if (type === "secondary" && !debateStyle.secondary) {
    return null
  }

  const flowConfig = type === "primary" ? debateStyle.primary : debateStyle.secondary!
  const columns = switchSpeakers && flowConfig.columnsSwitch ? flowConfig.columnsSwitch : flowConfig.columns

  const starterBoxes: Box[] = []
  if (flowConfig.starterBoxes) {
    flowConfig.starterBoxes.forEach((content, i) => {
      starterBoxes.push({
        content,
        children: [],
        index: i,
        level: 1,
        focus: false,
        empty: false,
      })
    })
  }

  const flow: Flow = {
    content: flowConfig.name,
    level: 0,
    columns,
    invert: flowConfig.invert,
    focus: false,
    index,
    lastFocus: [],
    children: starterBoxes,
    id: flowIdCounter++,
  }

  return flow
}

export function boxFromPath<T extends { children: Box[] }, B extends Box>(
  root: T,
  path: number[],
  scope = 0,
): B | T | null {
  if (path.length === 0 && scope >= 1) {
    return null
  }

  let current: T | Box = root
  for (let i = 0; i < path.length - scope; i++) {
    if (!current.children || !current.children[path[i]]) {
      return null
    }
    current = current.children[path[i]]
  }
  return current as B | T
}
