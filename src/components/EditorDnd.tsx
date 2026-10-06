import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useCallback, useState, type ReactNode } from 'react'
import { isContainerType, NODE_TYPE_LABELS } from '../editor/createNode.ts'
import {
  CANVAS_DROPPABLE_ID,
  editorCollision,
  getCanvasIframe,
  getDragData,
  outlineTargetId,
  pointerFromDelta,
} from '../editor/dnd.ts'
import { clientToIframePoint, hitTestCanvas, placementFromPoint } from '../editor/drop.ts'
import { getActivePage, useEditorStore } from '../editor/store.ts'
import { canDrop, findNode, type DropIntent } from '../editor/tree.ts'

function resolvePreview(event: DragMoveEvent | DragEndEvent): DropIntent | null {
  const page = getActivePage(useEditorStore.getState().project)
  if (!page || !event.active) return null
  const drag = getDragData(event.active)
  if (!drag) return null
  const draggedId = drag.kind === 'node' ? drag.id : null
  const pointer = event.activatorEvent
    ? pointerFromDelta(event.activatorEvent, event.delta)
    : null
  const overId = event.over ? String(event.over.id) : null

  if (overId === CANVAS_DROPPABLE_ID) {
    const iframe = getCanvasIframe()
    if (!pointer || !iframe?.contentDocument) {
      const fallback: DropIntent = {
        targetId: page.root.id,
        placement: 'inside',
        axis: 'vertical',
        rtl: true,
      }
      return canDrop(page.root, fallback, draggedId) ? fallback : null
    }
    const point = clientToIframePoint(iframe, pointer.x, pointer.y)
    const intent = hitTestCanvas(iframe.contentDocument, point.x, point.y, page.root.id)
    return canDrop(page.root, intent, draggedId) ? intent : null
  }

  const targetId = outlineTargetId(event.over)
  if (!targetId || !pointer) return null
  const rect = event.over?.rect
  if (!rect) return null
  const target = findNode(page.root, targetId)
  if (!target) return null
  const intent: DropIntent = {
    targetId,
    placement:
      targetId === page.root.id
        ? 'inside'
        : placementFromPoint(rect, pointer.x, pointer.y, isContainerType(target.type), 'vertical', true),
    axis: 'vertical',
    rtl: true,
  }
  return canDrop(page.root, intent, draggedId) ? intent : null
}

export function EditorDnd({ children }: { children: ReactNode }) {
  const setDropPreview = useEditorStore((s) => s.setDropPreview)
  const dropBlock = useEditorStore((s) => s.dropBlock)
  const moveNodeTo = useEditorStore((s) => s.moveNodeTo)
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const onDragStart = useCallback((event: DragStartEvent) => {
    const drag = getDragData(event.active)
    if (!drag) {
      setOverlayLabel(null)
      return
    }
    if (drag.kind === 'block') {
      setOverlayLabel(NODE_TYPE_LABELS[drag.type])
      return
    }
    const page = getActivePage(useEditorStore.getState().project)
    const node = page ? findNode(page.root, drag.id) : null
    setOverlayLabel(node?.name || NODE_TYPE_LABELS[node?.type ?? 'text'])
  }, [])

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      setDropPreview(resolvePreview(event))
    },
    [setDropPreview],
  )

  const clearDrag = useCallback(() => {
    setDropPreview(null)
    setOverlayLabel(null)
  }, [setDropPreview])

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const drag = getDragData(event.active)
      const intent = resolvePreview(event)
      setDropPreview(null)
      setOverlayLabel(null)
      if (!drag || !intent) return
      if (drag.kind === 'block') dropBlock(drag.type, intent)
      else moveNodeTo(drag.id, intent)
    },
    [dropBlock, moveNodeTo, setDropPreview],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={editorCollision}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={clearDrag}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {overlayLabel ? (
          <div className="rounded-md border border-blue-400 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-md">
            {overlayLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
