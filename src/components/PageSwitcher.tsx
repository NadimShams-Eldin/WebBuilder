import { useState } from 'react'
import type { Page } from '../editor/types.ts'
import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

function PageSwitcherInner({ page }: { page: Page }) {
  const { t } = useI18n()
  const pages = useEditorStore((s) => s.project.pages)
  const setActivePage = useEditorStore((s) => s.setActivePage)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const renamePage = useEditorStore((s) => s.renamePage)
  const setPageSlug = useEditorStore((s) => s.setPageSlug)
  const [name, setName] = useState(page.name)
  const [slug, setSlug] = useState(page.slug)
  const canDelete = pages.length > 1

  return (
    <div className="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700">
      <label className="sr-only" htmlFor="qitma-page-select">
        {t('pages.label')}
      </label>
      <select
        id="qitma-page-select"
        className="max-w-36 bg-transparent px-2 py-1.5 text-xs text-neutral-800 dark:text-neutral-100"
        value={page.id}
        onChange={(event) => setActivePage(event.target.value)}
      >
        {pages.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <input
        className="w-24 border-s border-neutral-200 bg-transparent px-2 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
        value={name}
        title={t('pages.rename')}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          if (name.trim() && name.trim() !== page.name) renamePage(page.id, name)
          else setName(page.name)
        }}
      />
      <input
        className="w-20 border-s border-neutral-200 bg-transparent px-2 py-1.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
        value={slug}
        title={t('pages.slug')}
        onChange={(event) => setSlug(event.target.value)}
        onBlur={() => {
          if (slug.trim() && slug.trim() !== page.slug) setPageSlug(page.id, slug)
          else setSlug(page.slug)
        }}
      />
      <button
        type="button"
        className="border-s border-neutral-200 px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        title={t('pages.add')}
        onClick={() => addPage()}
      >
        +
      </button>
      <button
        type="button"
        className={
          canDelete
            ? 'border-s border-neutral-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950'
            : 'border-s border-neutral-200 px-2 py-1.5 text-xs text-neutral-300 dark:border-neutral-700 dark:text-neutral-600'
        }
        title={t('pages.delete')}
        disabled={!canDelete}
        onClick={() => removePage(page.id)}
      >
        ×
      </button>
    </div>
  )
}

export function PageSwitcher() {
  const activePage = useEditorStore(selectActivePage)
  if (!activePage) return null
  return <PageSwitcherInner key={activePage.id} page={activePage} />
}
