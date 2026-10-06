import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { NODE_TYPE_LABELS } from '../editor/createNode.ts'
import { outlineDragId } from '../editor/dnd.ts'
import { getAncestorIds, type DropIntent } from '../editor/tree.ts'
import type { Node } from '../editor/types.ts'

type LayerTreeProps = {
  root: Node
  selectedId: string | null
  dropPreview: DropIntent | null
  onSelect: (id: string) => void
}

function LayerItem({
  node,
  selectedId,
  dropPreview,
  collapsed,
  onSelect,
  onToggle,
  depth,
  disableDrag,
}: {
  node: Node
  selectedId: string | null
  dropPreview: DropIntent | null
  collapsed: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  depth: number
  disableDrag: boolean
}) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsed.has(node.id)
  const selected = selectedId === node.id
  const label = node.name || NODE_TYPE_LABELS[node.type]
  const preview = dropPreview?.targetId === node.id ? dropPreview : null

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: outlineDragId(node.id),
    data: { kind: 'node', id: node.id },
    disabled: disableDrag,
  })
  const { setNodeRef: setDropRef } = useDroppable({
    id: outlineDragId(node.id),
    data: { kind: 'node', id: node.id },
  })

  const setRef = (el: HTMLDivElement | null) => {
    setDragRef(el)
    setDropRef(el)
  }

  return (
    <div>
      <div
        ref={setRef}
        className={
          selected
            ? 'relative flex items-center gap-1 rounded-md bg-blue-50 text-blue-800'
            : 'relative flex items-center gap-1 rounded-md hover:bg-neutral-50'
        }
        style={{
          paddingInlineStart: `${0.25 + depth * 0.75}rem`,
          opacity: isDragging ? 0.45 : 1,
        }}
      >
        {preview?.placement === 'before' ? (
          <span className="pointer-events-none absolute inset-x-1 top-0 h-0.5 bg-blue-500" />
        ) : null}
        {preview?.placement === 'after' ? (
          <span className="pointer-events-none absolute inset-x-1 bottom-0 h-0.5 bg-blue-500" />
        ) : null}
        {preview?.placement === 'inside' ? (
          <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset ring-blue-500" />
        ) : null}
        {hasChildren ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400"
            onClick={(event) => {
              event.stopPropagation()
              onToggle(node.id)
            }}
            aria-label={isCollapsed ? 'توسيع' : 'طي'}
          >
            {isCollapsed ? '+' : '−'}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="min-w-0 flex-1 cursor-grab truncate py-1 text-right text-xs"
          {...listeners}
          {...attributes}
        >
          <span className="font-medium">{label}</span>
          <span className="mr-1 text-neutral-400">{node.type}</span>
        </button>
      </div>
      {hasChildren && !isCollapsed
        ? node.children.map((child) => (
            <LayerItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              dropPreview={dropPreview}
              collapsed={collapsed}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
              disableDrag={false}
            />
          ))
        : null}
    </div>
  )
}

export function LayerTree({ root, selectedId, dropPreview, onSelect }: LayerTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const visibleCollapsed = useMemo(() => {
    const next = new Set(collapsed)
    if (!selectedId) return next
    for (const id of getAncestorIds(root, selectedId)) next.delete(id)
    return next
  }, [collapsed, root, selectedId])

  const onToggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <LayerItem
      node={root}
      selectedId={selectedId}
      dropPreview={dropPreview}
      collapsed={visibleCollapsed}
      onSelect={onSelect}
      onToggle={onToggle}
      depth={0}
      disableDrag
    />
  )
}
