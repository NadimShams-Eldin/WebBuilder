import { isContainerType } from './createNode.ts'
import type { Node } from './types.ts'

export type GuideRect = {
  top: number
  left: number
  width: number
  height: number
}

export function collectEmptyContainerIds(root: Node): string[] {
  const ids: string[] = []
  const walk = (node: Node) => {
    if (isContainerType(node.type) && node.children.length === 0) ids.push(node.id)
    for (const child of node.children) walk(child)
  }
  walk(root)
  return ids
}

export function parsePxTracks(template: string): number[] {
  return [...template.matchAll(/(-?[\d.]+)px/g)].map((match) => Number(match[1]))
}

export function trackLineOffsets(template: string, gap: number, start: number): number[] {
  const tracks = parsePxTracks(template)
  if (tracks.length < 2) return []
  const lines: number[] = []
  let pos = start
  for (let i = 0; i < tracks.length - 1; i += 1) {
    pos += tracks[i]
    lines.push(pos)
    pos += gap
  }
  return lines
}

export function gridOverlayLines(
  rect: GuideRect,
  columns: string,
  rows: string,
  columnGap = 0,
  rowGap = 0,
): { vertical: number[]; horizontal: number[] } {
  return {
    vertical: trackLineOffsets(columns, columnGap, rect.left),
    horizontal: trackLineOffsets(rows, rowGap, rect.top),
  }
}

export function floatingMenuPosition(
  rect: GuideRect,
  frameWidth: number,
  rtl = true,
): { top: number; left: number } {
  const menuWidth = 168
  const gap = 4
  const above = rect.top - 28 - gap
  const top = above >= 0 ? above : rect.top + gap
  const left = rtl
    ? Math.max(0, rect.left + rect.width - menuWidth)
    : Math.max(0, Math.min(rect.left, frameWidth - menuWidth))
  return { top, left }
}
