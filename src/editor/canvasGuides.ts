import { isContainerType } from './createNode.ts'
import type { Node } from './types.ts'

export type GuideRect = {
  top: number
  left: number
  width: number
  height: number
}

export function asHtmlElement(value: unknown): HTMLElement | null {
  if (!value || typeof value !== 'object') return null
  const node = value as { nodeType?: number; getBoundingClientRect?: unknown }
  if (node.nodeType !== 1) return null
  if (typeof node.getBoundingClientRect !== 'function') return null
  return value as HTMLElement
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

export function parseTrackSizes(template: string): number[] {
  return splitTracks(template)
    .filter((track) => !/^\[.*\]$/.test(track))
    .map((track) => {
      const sizes = [...track.matchAll(/(-?[\d.]+)px/g)].map((match) => Number(match[1]))
      return sizes.length ? sizes[sizes.length - 1] : 0
    })
}

export function splitTracks(template: string): string[] {
  const tracks: string[] = []
  let depth = 0
  let current = ''
  for (const char of template.trim()) {
    if (char === '(') depth += 1
    if (char === ')') depth = Math.max(0, depth - 1)
    if (/\s/.test(char) && depth === 0) {
      if (current) tracks.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current) tracks.push(current)
  return tracks
}

const REPEAT_PATTERN = /^repeat\(\s*(\d+)\s*,\s*(.+)\)$/i

export function addTrackTemplate(template: string, fallback = '1fr'): string {
  const trimmed = template.trim()
  if (trimmed === '' || trimmed === 'none') return fallback
  const repeat = REPEAT_PATTERN.exec(trimmed)
  if (repeat) return `repeat(${Number(repeat[1]) + 1}, ${repeat[2].trim()})`
  const tracks = splitTracks(trimmed)
  if (tracks.length === 0) return fallback
  return [...tracks, tracks[tracks.length - 1]].join(' ')
}

export function removeTrackTemplate(template: string): string | null {
  const trimmed = template.trim()
  if (trimmed === '' || trimmed === 'none') return null
  const repeat = REPEAT_PATTERN.exec(trimmed)
  if (repeat) {
    const count = Number(repeat[1])
    if (count <= 1) return null
    return `repeat(${count - 1}, ${repeat[2].trim()})`
  }
  const tracks = splitTracks(trimmed)
  if (tracks.length <= 1) return null
  return tracks.slice(0, -1).join(' ')
}

export function resizeTrackPair(
  sizes: number[],
  index: number,
  delta: number,
  min = 24,
): number[] | null {
  if (index < 0 || index >= sizes.length - 1) return null
  const total = sizes[index] + sizes[index + 1]
  if (total < min * 2) return null
  const next = Math.min(total - min, Math.max(min, sizes[index] + delta))
  const result = [...sizes]
  result[index] = next
  result[index + 1] = total - next
  return result
}

export function parseCssLength(value: string, rootFontPx = 16): number {
  const match = /^(-?\d*\.?\d+)\s*(px|rem|em|pt)?$/i.exec(value.trim())
  if (!match) return 0
  const size = Number(match[1])
  if (!Number.isFinite(size)) return 0
  const unit = (match[2] ?? 'px').toLowerCase()
  if (unit === 'rem' || unit === 'em') return size * rootFontPx
  if (unit === 'pt') return (size * 96) / 72
  return size
}

export function snapValue(value: number, step = 4): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export type Distance = { horizontal: number; vertical: number }

export function distanceBetween(a: GuideRect, b: GuideRect): Distance {
  const horizontal = Math.max(0, Math.max(b.left - (a.left + a.width), a.left - (b.left + b.width)))
  const vertical = Math.max(0, Math.max(b.top - (a.top + a.height), a.top - (b.top + b.height)))
  return { horizontal, vertical }
}

export type MeasureSegment = {
  axis: 'horizontal' | 'vertical'
  start: number
  end: number
  at: number
  length: number
}

export function measureSegments(a: GuideRect, b: GuideRect): MeasureSegment[] {
  const segments: MeasureSegment[] = []
  const centerY = (a.top + a.height / 2 + b.top + b.height / 2) / 2
  const centerX = (a.left + a.width / 2 + b.left + b.width / 2) / 2

  if (a.left + a.width <= b.left) {
    segments.push({
      axis: 'horizontal',
      start: a.left + a.width,
      end: b.left,
      at: centerY,
      length: b.left - (a.left + a.width),
    })
  } else if (b.left + b.width <= a.left) {
    segments.push({
      axis: 'horizontal',
      start: b.left + b.width,
      end: a.left,
      at: centerY,
      length: a.left - (b.left + b.width),
    })
  }

  if (a.top + a.height <= b.top) {
    segments.push({
      axis: 'vertical',
      start: a.top + a.height,
      end: b.top,
      at: centerX,
      length: b.top - (a.top + a.height),
    })
  } else if (b.top + b.height <= a.top) {
    segments.push({
      axis: 'vertical',
      start: b.top + b.height,
      end: a.top,
      at: centerX,
      length: a.top - (b.top + b.height),
    })
  }

  return segments
}

export function trackLineOffsets(
  template: string,
  gap: number,
  start: number,
  total?: number,
  rtl = false,
): number[] {
  const tracks = parseTrackSizes(template)
  if (tracks.length < 2) return []
  const lines: number[] = []
  if (rtl && total !== undefined) {
    let pos = start + total
    for (let i = 0; i < tracks.length - 1; i += 1) {
      pos -= tracks[i]
      lines.push(pos)
      pos -= gap
    }
    return lines
  }
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
  rtl = false,
): { vertical: number[]; horizontal: number[] } {
  return {
    vertical: trackLineOffsets(columns, columnGap, rect.left, rect.width, rtl),
    horizontal: trackLineOffsets(rows, rowGap, rect.top),
  }
}

export function floatingMenuPosition(
  rect: GuideRect,
  frameWidth: number,
  rtl = true,
): { top: number; left: number } {
  const menuWidth = 260
  const gap = 4
  const above = rect.top - 28 - gap
  const top = above >= 0 ? above : rect.top + gap
  const left = rtl
    ? Math.max(0, rect.left + rect.width - menuWidth)
    : Math.max(0, Math.min(rect.left, frameWidth - menuWidth))
  return { top, left }
}
