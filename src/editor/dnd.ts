import type { Active, CollisionDetection, Over } from '@dnd-kit/core'
import { pointerWithin } from '@dnd-kit/core'
import { NODE_TYPES, type NodeType } from './types.ts'

export const CANVAS_DROPPABLE_ID = 'qitma-canvas-drop'
export const BLOCK_DRAG_PREFIX = 'block:'
export const OUTLINE_DRAG_PREFIX = 'outline:'

export type BlockDragData = {
  kind: 'block'
  type: NodeType
}

export type NodeDragData = {
  kind: 'node'
  id: string
}

export type DragData = BlockDragData | NodeDragData

let canvasIframeEl: HTMLIFrameElement | null = null

export function registerCanvasIframe(el: HTMLIFrameElement | null): void {
  canvasIframeEl = el
}

export function getCanvasIframe(): HTMLIFrameElement | null {
  return canvasIframeEl
}

export function blockDragId(type: NodeType): string {
  return `${BLOCK_DRAG_PREFIX}${type}`
}

export function outlineDragId(id: string): string {
  return `${OUTLINE_DRAG_PREFIX}${id}`
}

export function parseNodeType(value: string): NodeType | null {
  return (NODE_TYPES as readonly string[]).includes(value) ? (value as NodeType) : null
}

export function getDragData(active: Active | null): DragData | null {
  const data = active?.data.current
  if (!data || typeof data !== 'object') return null
  if ('kind' in data && data.kind === 'block' && 'type' in data) {
    const type = parseNodeType(String(data.type))
    return type ? { kind: 'block', type } : null
  }
  if ('kind' in data && data.kind === 'node' && 'id' in data) {
    return { kind: 'node', id: String(data.id) }
  }
  return null
}

export function outlineTargetId(over: Over | null): string | null {
  if (!over) return null
  const id = String(over.id)
  if (id.startsWith(OUTLINE_DRAG_PREFIX)) return id.slice(OUTLINE_DRAG_PREFIX.length)
  return null
}

export function pointerFromDelta(
  activatorEvent: Event,
  delta: { x: number; y: number },
): { x: number; y: number } | null {
  if (!('clientX' in activatorEvent) || !('clientY' in activatorEvent)) return null
  const event = activatorEvent as PointerEvent
  return { x: event.clientX + delta.x, y: event.clientY + delta.y }
}

export const editorCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args)
  if (collisions.length <= 1) return collisions
  const nested = collisions.filter((item) => item.id !== CANVAS_DROPPABLE_ID)
  const pool = nested.length > 0 ? nested : collisions
  const sorted = [...pool].sort((a, b) => {
    const ra = a.data?.droppableContainer?.rect.current
    const rb = b.data?.droppableContainer?.rect.current
    const areaA = ra ? ra.width * ra.height : Number.POSITIVE_INFINITY
    const areaB = rb ? rb.width * rb.height : Number.POSITIVE_INFINITY
    return areaA - areaB
  })
  return sorted.slice(0, 1)
}
