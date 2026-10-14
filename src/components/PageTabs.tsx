import { useState } from 'react'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

export function PageTabs() {
  const { t } = useI18n()
  const pages = useEditorStore((s) => s.project.pages)
  const activePageId = useEditorStore((s) => s.activePageId)
  const setActivePage = useEditorStore((s) => s.setActivePage)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const renamePage = useEditorStore((s) => s.renamePage)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const commit = (pageId: string) => {
    if (draft.trim()) renamePage(pageId, draft)
    setEditing(null)
  }

  return (
    <div className="flex items-stretch gap-1 border-b border-neutral-200 bg-neutral-50 px-2 pt-1 dark:border-neutral-800 dark:bg-neutral-950">
      {pages.map((page) => {
        const active = page.id === activePageId
        const isEditing = editing === page.id
        return (
          <div
            key={page.id}
            className={
              active
                ? 'flex items-center gap-2 rounded-t-md border border-b-0 border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
                : 'flex items-center gap-2 rounded-t-md px-3 py-1.5 text-xs text-neutral-500 hover:bg-white dark:text-neutral-400 dark:hover:bg-neutral-900'
            }
          >
            {isEditing ? (
              <input
                autoFocus
                className="w-24 bg-transparent text-xs text-neutral-800 outline-none dark:text-neutral-100"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => commit(page.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commit(page.id)
                  if (event.key === 'Escape') setEditing(null)
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setActivePage(page.id)}
                onDoubleClick={() => {
                  setDraft(page.name)
                  setEditing(page.id)
                }}
                title={page.slug}
              >
                {page.name}
              </button>
            )}
            {active && pages.length > 1 ? (
              <button
                type="button"
                className="text-neutral-400 hover:text-red-600"
                title={t('pages.delete')}
                onClick={() => removePage(page.id)}
              >
                ×
              </button>
            ) : null}
          </div>
        )
      })}
      <button
        type="button"
        className="mb-1 rounded-md px-2 text-sm text-neutral-500 hover:bg-white dark:text-neutral-400 dark:hover:bg-neutral-900"
        title={t('pages.add')}
        onClick={() => addPage()}
      >
        +
      </button>
    </div>
  )
}
