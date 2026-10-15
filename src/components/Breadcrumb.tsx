import { Fragment } from 'react'
import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { getPathNodes } from '../editor/tree.ts'
import { useI18n } from '../editor/useI18n.ts'

export function Breadcrumb() {
  const { t } = useI18n()
  const page = useEditorStore(selectActivePage)
  const selectedId = useEditorStore((s) => s.selectedId)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)

  if (!page) return null

  const path = selectedId
    ? getPathNodes(page.root, selectedId).filter((node) => node.id !== page.root.id)
    : []

  return (
    <nav
      aria-label={t('breadcrumb.label')}
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-t border-neutral-200 bg-white px-3 py-1.5 text-xs dark:border-neutral-800 dark:bg-neutral-900"
    >
      <button
        type="button"
        onClick={() => setSelectedId(page.root.id)}
        className="shrink-0 rounded px-1 py-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        {page.name}
      </button>
      {path.map((node, index) => {
        const label = node.name || t(`block.${node.type}`)
        const current = index === path.length - 1
        return (
          <Fragment key={node.id}>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            {current ? (
              <span className="shrink-0 rounded px-1 py-0.5 font-medium text-neutral-800 dark:text-neutral-100">
                {label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedId(node.id)}
                className="shrink-0 rounded px-1 py-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                {label}
              </button>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
