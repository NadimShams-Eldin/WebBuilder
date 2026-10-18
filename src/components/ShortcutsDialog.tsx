import { useEffect, useId } from 'react'
import { localeDir } from '../editor/chromePrefs.ts'
import { SHORTCUT_GROUPS } from '../editor/shortcuts.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

export function ShortcutsDialog() {
  const { t } = useI18n()
  const open = useEditorStore((s) => s.shortcutsOpen)
  const setOpen = useEditorStore((s) => s.setShortcutsOpen)
  const locale = useEditorStore((s) => s.locale)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={localeDir(locale)}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <h2 id={titleId} className="text-sm font-semibold">
            {t('shortcut.title')}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('shortcut.close')}
            className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {t('shortcut.close')}
          </button>
        </header>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.id} className="space-y-1.5">
              <h3 className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
                {t(group.labelKey)}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li
                    key={`${group.id}:${item.action}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  >
                    <span className="text-neutral-700 dark:text-neutral-200">
                      {t(`shortcut.${item.action}`)}
                    </span>
                    <kbd className="shrink-0 rounded border border-neutral-300 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500 dark:border-neutral-600 dark:text-neutral-400">
                      {item.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
