import { useEffect } from 'react'
import { selectActivePage, selectCanRedo, selectCanUndo, useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'
import { PageSwitcher } from './PageSwitcher.tsx'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function AppHeader() {
  const { t, locale } = useI18n()
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore(selectCanUndo)
  const canRedo = useEditorStore(selectCanRedo)
  const theme = useEditorStore((s) => s.theme)
  const setTheme = useEditorStore((s) => s.setTheme)
  const setLocale = useEditorStore((s) => s.setLocale)
  const selectedId = useEditorStore((s) => s.selectedId)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const clearPage = useEditorStore((s) => s.clearPage)
  const loadDemo = useEditorStore((s) => s.loadDemo)
  const page = useEditorStore(selectActivePage)
  const canDelete = Boolean(selectedId && page && selectedId !== page.root.id)
  const canClear = Boolean(page && page.root.children.length > 0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase()
        if (key === 'z' && event.shiftKey) {
          event.preventDefault()
          redo()
          return
        }
        if (key === 'z') {
          event.preventDefault()
          undo()
          return
        }
        if (key === 'y') {
          event.preventDefault()
          redo()
          return
        }
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!canDelete) return
        event.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, canDelete, deleteSelected])

  const chromeBtn =
    'rounded-md px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
  const chromeBtnActive =
    'rounded-md bg-neutral-100 px-2 py-1.5 text-xs font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t('app.name')}</span>
        <nav className="flex items-center gap-1 text-sm">
          <button className="rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
            {t('header.compose')}
          </button>
          <button className="rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800">
            {t('header.preview')}
          </button>
          </nav>
        <PageSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            className={
              canDelete
                ? 'px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
                : 'px-2 py-1.5 text-xs text-neutral-300 dark:text-neutral-600'
            }
            title={t('tools.delete')}
            disabled={!canDelete}
            onClick={() => deleteSelected()}
          >
            {t('tools.delete')}
          </button>
          <button
            type="button"
            className={
              canClear
                ? 'px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800'
                : 'px-2 py-1.5 text-xs text-neutral-300 dark:text-neutral-600'
            }
            title={t('tools.clear')}
            disabled={!canClear}
            onClick={() => clearPage()}
          >
            {t('tools.clear')}
          </button>
          <button
            type="button"
            className="px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
            title={t('tools.demo')}
            onClick={() => loadDemo()}
          >
            {t('tools.demo')}
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            className={theme === 'light' ? chromeBtnActive : chromeBtn}
            onClick={() => setTheme('light')}
          >
            {t('header.theme.light')}
          </button>
          <button
            type="button"
            className={theme === 'dark' ? chromeBtnActive : chromeBtn}
            onClick={() => setTheme('dark')}
          >
            {t('header.theme.dark')}
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            className={locale === 'ar' ? chromeBtnActive : chromeBtn}
            onClick={() => setLocale('ar')}
          >
            {t('header.locale.ar')}
          </button>
          <button
            type="button"
            className={locale === 'en' ? chromeBtnActive : chromeBtn}
            onClick={() => setLocale('en')}
          >
            {t('header.locale.en')}
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            className={
              canUndo
                ? 'px-2 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
                : 'px-2 py-1.5 text-neutral-300 dark:text-neutral-600'
            }
            title={`${t('header.undo')} (Ctrl+Z)`}
            disabled={!canUndo}
            onClick={() => undo()}
          >
            ↷
          </button>
          <button
            type="button"
            className={
              canRedo
                ? 'px-2 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
                : 'px-2 py-1.5 text-neutral-300 dark:text-neutral-600'
            }
            title={`${t('header.redo')} (Ctrl+Y)`}
            disabled={!canRedo}
            onClick={() => redo()}
          >
            ↶
          </button>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          {t('header.publish')}
        </button>
      </div>
    </header>
  )
}
