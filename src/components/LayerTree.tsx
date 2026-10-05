import { useMemo, useState } from 'react'
import { NODE_TYPE_LABELS } from '../editor/createNode.ts'
import { getAncestorIds } from '../editor/tree.ts'
import type { Node } from '../editor/types.ts'

type LayerTreeProps = {
  root: Node
  selectedId: string | null
  onSelect: (id: string) => void
}

function LayerItem({
  node,
  selectedId,
  collapsed,
  onSelect,
  onToggle,
  depth,
}: {
  node: Node
  selectedId: string | null
  collapsed: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  depth: number
}) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsed.has(node.id)
  const selected = selectedId === node.id
  const label = node.name || NODE_TYPE_LABELS[node.type]

  return (
    <div>
      <div
        className={
          selected
            ? 'flex items-center gap-1 rounded-md bg-blue-50 text-blue-800'
            : 'flex items-center gap-1 rounded-md hover:bg-neutral-50'
        }
        style={{ paddingInlineStart: `${0.25 + depth * 0.75}rem` }}
      >
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
          className="min-w-0 flex-1 truncate py-1 text-right text-xs"
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
              collapsed={collapsed}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  )
}

export function LayerTree({ root, selectedId, onSelect }: LayerTreeProps) {
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
      collapsed={visibleCollapsed}
      onSelect={onSelect}
      onToggle={onToggle}
      depth={0}
    />
  )
}
