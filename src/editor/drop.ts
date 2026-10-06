import { isContainerType } from './createNode.ts'
import type { DropIntent, DropPlacement } from './tree.ts'
import { NODE_TYPES, type NodeType } from './types.ts'

export type RectLike = {
  top: number
  left: number
  width: number
  height: number
}

export type DropAxis = 'vertical' | 'horizontal'

const CONTAINER_EDGE = 0.28

export function placementFromPoint(
  rect: RectLike,
  x: number,
  y: number,
  isContainer: boolean,
  axis: DropAxis = 'vertical',
  rtl = true,
): DropPlacement {
  const width = rect.width || 1
  const height = rect.height || 1

  if (axis === 'horizontal') {
    const t = (x - rect.left) / width
    if (isContainer && t >= CONTAINER_EDGE && t <= 1 - CONTAINER_EDGE) return 'inside'
    if (rtl) return t > 0.5 ? 'before' : 'after'
    return t < 0.5 ? 'before' : 'after'
  }

  const t = (y - rect.top) / height
  if (isContainer && t >= CONTAINER_EDGE && t <= 1 - CONTAINER_EDGE) return 'inside'
  return t < 0.5 ? 'before' : 'after'
}

export function axisFromComputed(style: {
  display: string
  flexDirection: string
}): DropAxis {
  const row = style.flexDirection === 'row' || style.flexDirection === 'row-reverse'
  if ((style.display === 'flex' || style.display === 'inline-flex') && row) {
    return 'horizontal'
  }
  return 'vertical'
}

function isNodeType(value: string | null): value is NodeType {
  return Boolean(value && (NODE_TYPES as readonly string[]).includes(value))
}

export function hitTestCanvas(
  doc: Document,
  x: number,
  y: number,
  rootId: string,
): DropIntent {
  const raw = doc.elementFromPoint(x, y)
  const el = raw && 'closest' in raw ? raw.closest('[data-qid]') : null
  if (!(el instanceof HTMLElement)) {
    return { targetId: rootId, placement: 'inside', axis: 'vertical', rtl: true }
  }

  const id = el.getAttribute('data-qid')
  const qtype = el.getAttribute('data-qtype')
  if (!id || !isNodeType(qtype) || id === rootId) {
    return { targetId: rootId, placement: 'inside', axis: 'vertical', rtl: true }
  }

  const parentEl = el.parentElement?.closest('[data-qid]')
  const parentStyle = parentEl instanceof HTMLElement ? getComputedStyle(parentEl) : null
  const axis = parentStyle ? axisFromComputed(parentStyle) : 'vertical'
  const rtl = (parentStyle ?? getComputedStyle(el)).direction !== 'ltr'
  const rect = el.getBoundingClientRect()

  return {
    targetId: id,
    placement: placementFromPoint(rect, x, y, isContainerType(qtype), axis, rtl),
    axis,
    rtl,
  }
}

export type IndicatorBox = {
  top: number
  left: number
  width: number
  height: number
  kind: 'line' | 'inside'
}

export function indicatorBox(
  rect: RectLike,
  placement: DropPlacement,
  axis: DropAxis = 'vertical',
  rtl = true,
): IndicatorBox {
  const thickness = 3
  if (placement === 'inside') {
    return {
      top: rect.top,
      left: rect.left,
      width: Math.max(rect.width, 1),
      height: Math.max(rect.height, 1),
      kind: 'inside',
    }
  }
  if (axis === 'horizontal') {
    const atStart = placement === 'before' ? rtl : !rtl
    return {
      top: rect.top,
      left: atStart ? rect.left + rect.width - thickness : rect.left,
      width: thickness,
      height: Math.max(rect.height, 1),
      kind: 'line',
    }
  }
  return {
    top: placement === 'before' ? rect.top : rect.top + rect.height - thickness,
    left: rect.left,
    width: Math.max(rect.width, 1),
    height: thickness,
    kind: 'line',
  }
}

export function clientToIframePoint(
  iframe: HTMLIFrameElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = iframe.getBoundingClientRect()
  const width = rect.width || 1
  const height = rect.height || 1
  return {
    x: ((clientX - rect.left) / width) * iframe.clientWidth,
    y: ((clientY - rect.top) / height) * iframe.clientHeight,
  }
}
