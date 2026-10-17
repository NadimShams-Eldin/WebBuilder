import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { outlineDragId } from '../editor/dnd.ts'
import {
  flattenVisible,
  matchingIdsWithAncestors,
  rangeSelection,
} from '../editor/outlineSelection.ts'
import { getAncestorIds, type DropIntent } from '../editor/tree.ts'
import type { Node, NodeType } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'
import { useEditorStore } from '../editor/store.ts'
import { ContextMenu } from './ContextMenu'
import { useNodeContextMenu } from './useNodeContextMenu'

type LayerTreeProps = {
  root: Node
  selectedId: string | null
  dropPreview: DropIntent | null
  onSelect: (id: string) => void
}

const BADGE_GROUP: Record<string, string> = {
  container: 'layout',
  flex: 'layout',
  grid: 'layout',
  spacer: 'layout',
  divider: 'layout',
  heading: 'content',
  text: 'content',
  list: 'content',
  link: 'content',
  image: 'content',
  icon: 'content',
  video: 'content',
  button: 'interaction',
  input: 'interaction',
  form: 'interaction',
}

const BADGE_COLOR: Record<string, string> = {
  layout: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200',
  content: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
  interaction: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
}

function typeBadge(type: NodeType): { label: string; className: string } {
  const group = BADGE_GROUP[type] ?? 'layout'
  return {
    label: type.slice(0, 1).toUpperCase(),
    className: BADGE_COLOR[group] ?? BADGE_COLOR.layout,
  }
}

function matchesQuery(node: Node, label: string, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return label.toLowerCase().includes(needle) || node.type.toLowerCase().includes(needle)
}

function LayerItem({
  node,
  selectedId,
  multiIds,
  dropPreview,
  collapsed,
  visibleIds,
  searching,
  onSelect,
  onToggle,
  onContextMenu,
  depth,
  disableDrag,
}: {
  node: Node
  selectedId: string | null
  multiIds: Set<string>
  dropPreview: DropIntent | null
  collapsed: Set<string>
  visibleIds: Set<string> | null
  searching: boolean
  onSelect: (id: string, event: ReactMouseEvent) => void
  onToggle: (id: string) => void
  onContextMenu: (id: string, event: ReactMouseEvent) => void
  depth: number
  disableDrag: boolean
}) {
  const { t, locale } = useI18n()
  const hasChildren = node.children.length > 0
  const childIds = node.children.map((child) => child.id)
  const filteredChildren =
    visibleIds === null ? childIds : childIds.filter((childId) => visibleIds.has(childId))
  const isCollapsed = collapsed.has(node.id)
  const open = searching ? filteredChildren.length > 0 : !isCollapsed
  const primary = selectedId === node.id
  const multi = !primary && multiIds.has(node.id)
  const label = node.name || t(`block.${node.type}`)
  const preview = dropPreview?.targetId === node.id ? dropPreview : null
  const badge = typeBadge(node.type)

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

  const rowClass = primary
    ? 'relative flex items-center gap-1 rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
    : multi
      ? 'relative flex items-center gap-1 rounded-md bg-blue-100/70 text-blue-800 dark:bg-blue-900/60 dark:text-blue-100'
      : 'relative flex items-center gap-1 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800'

  return (
    <div>
      <div
        ref={setRef}
        className={rowClass}
        onContextMenu={(event) => onContextMenu(node.id, event)}
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
            aria-label={isCollapsed ? t('outline.expand') : t('outline.collapse')}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={(event) => onSelect(node.id, event)}
          className={`flex min-w-0 flex-1 cursor-grab items-center gap-1 py-1 text-xs ${
            locale === 'ar' ? 'text-right' : 'text-left'
          }`}
          {...listeners}
          {...attributes}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          {hasChildren ? (
            <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {node.children.length}
            </span>
          ) : null}
        </button>
      </div>
      {hasChildren && open
        ? node.children
            .filter((child) => visibleIds === null || visibleIds.has(child.id))
            .map((child) => (
              <LayerItem
                key={child.id}
                node={child}
                selectedId={selectedId}
                multiIds={multiIds}
                dropPreview={dropPreview}
                collapsed={collapsed}
                visibleIds={visibleIds}
                searching={searching}
                onSelect={onSelect}
                onToggle={onToggle}
                onContextMenu={onContextMenu}
                depth={depth + 1}
                disableDrag={false}
              />
            ))
        : null}
    </div>
  )
}

export function LayerTree({ root, selectedId, dropPreview, onSelect }: LayerTreeProps) {
  const { t } = useI18n()
  const deleteNodes = useEditorStore((s) => s.deleteNodes)
  const duplicateNodes = useEditorStore((s) => s.duplicateNodes)
  const { menu, openMenu, closeMenu } = useNodeContextMenu()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [multi, setMulti] = useState<Set<string>>(() => new Set())
  const searching = query.trim() !== ''

  const visibleCollapsed = useMemo(() => {
    const next = new Set(collapsed)
    if (!selectedId) return next
    for (const id of getAncestorIds(root, selectedId)) next.delete(id)
    return next
  }, [collapsed, root, selectedId])

  const visibleIds = useMemo(() => {
    if (!searching) return null
    return matchingIdsWithAncestors(root, (node) =>
      matchesQuery(node, node.name || t(`block.${node.type}`), query),
    )
  }, [searching, query, root, t])

  const open = (node: Node) => {
    if (searching) {
      const childIds = node.children.map((child) => child.id)
      return childIds.some((id) => visibleIds?.has(id))
    }
    return !visibleCollapsed.has(node.id)
  }

  const flat = flattenVisible(root, open, visibleIds)

  const effective = useMemo(() => {
    const ids = new Set(multi)
    if (selectedId) ids.add(selectedId)
    return ids
  }, [multi, selectedId])

  const onToggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelect = (id: string, event: ReactMouseEvent) => {
    if ((event.ctrlKey || event.metaKey) && selectedId) {
      if (id === selectedId) return
      setMulti((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      return
    }
    if (event.shiftKey && selectedId && selectedId !== id) {
      const range = rangeSelection(flat, selectedId, id)
      if (range.length > 0) {
        setMulti(new Set(range.filter((rangeId) => rangeId !== selectedId)))
        return
      }
    }
    setMulti(new Set())
    onSelect(id)
  }

  const handleContextMenu = (id: string, event: ReactMouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setMulti(new Set())
    openMenu(id, event.clientX, event.clientY)
  }

  const selection = [...effective]
  const isBulk = selection.length > 1
  const runBulk = (action: 'duplicate' | 'delete') => {
    const ok = action === 'duplicate' ? duplicateNodes(selection) : deleteNodes(selection)
    if (ok) setMulti(new Set())
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={query}
        placeholder={t('outline.search')}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />

      {isBulk ? (
        <div className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1.5 dark:bg-blue-950">
          <span className="text-[11px] text-blue-700 dark:text-blue-200">
            {t('outline.selectedCount').replace('{count}', String(selection.length))}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => runBulk('duplicate')}
              className="rounded px-1.5 py-0.5 text-[11px] text-blue-700 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-900"
            >
              {t('guide.duplicate')}
            </button>
            <button
              type="button"
              onClick={() => runBulk('delete')}
              className="rounded px-1.5 py-0.5 text-[11px] text-red-600 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950"
            >
              {t('guide.delete')}
            </button>
          </div>
        </div>
      ) : null}

      {searching && visibleIds && visibleIds.size === 0 ? (
        <p className="text-xs text-neutral-400">{t('outline.noMatch')}</p>
      ) : (
        <LayerItem
          node={root}
          selectedId={selectedId}
          multiIds={multi}
          dropPreview={dropPreview}
          collapsed={visibleCollapsed}
          visibleIds={visibleIds}
          searching={searching}
          onSelect={handleSelect}
          onToggle={onToggle}
          onContextMenu={handleContextMenu}
          depth={0}
          disableDrag
        />
      )}
      {menu ? <ContextMenu menu={menu} onClose={closeMenu} /> : null}
    </div>
  )
}
