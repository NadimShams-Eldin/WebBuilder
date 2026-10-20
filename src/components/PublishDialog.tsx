import { useEffect, useId, useState } from 'react'
import { localeDir } from '../editor/chromePrefs.ts'
import { loadPublishedSites, removePublishedSite, SHARE_ID_PARAM } from '../editor/share.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'
import { useProjectIO } from './useProjectIO.ts'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function PublishDialog() {
  const { t } = useI18n()
  const open = useEditorStore((s) => s.publishOpen)
  const setOpen = useEditorStore((s) => s.setPublishOpen)
  const lastPublish = useEditorStore((s) => s.lastPublish)
  const lastInsertError = useEditorStore((s) => s.lastInsertError)
  const locale = useEditorStore((s) => s.locale)
  const io = useProjectIO()
  const titleId = useId()
  const [copied, setCopied] = useState<{ id: string; kind: 'share' | 'local' } | null>(null)
  const [catalogTick, setCatalogTick] = useState(0)
  const sites = catalogTick >= 0 ? loadPublishedSites() : []
  const publishId = lastPublish?.siteId ?? ''
  const copiedKind = copied?.id === publishId ? copied.kind : null

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

  const hrefs = lastPublish?.hrefs
  const onCopy = async (kind: 'share' | 'local', value: string) => {
    const ok = await copyText(value)
    if (ok) setCopied({ id: publishId, kind })
  }

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
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <h2 id={titleId} className="text-sm font-semibold">
            {t('publish.title')}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {t('shortcut.close')}
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          <p className="text-neutral-600 dark:text-neutral-300">{t('publish.intro')}</p>
          {lastInsertError ? <p className="text-xs text-red-600">{lastInsertError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              onClick={() => void io.publishSite()}
            >
              {t('publish.action')}
            </button>
            <button
              type="button"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
              onClick={() => void io.exportSite()}
            >
              {t('project.exportSite')}
            </button>
          </div>
          {hrefs ? (
            <div className="space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
              <p className="text-xs font-semibold text-neutral-500">{t('publish.ready')}</p>
              <label className="block space-y-1">
                <span className="text-xs text-neutral-500">{t('publish.shareLink')}</span>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={hrefs.shareHref}
                    className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-800"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-600"
                    onClick={() => void onCopy('share', hrefs.shareHref)}
                  >
                    {copiedKind === 'share' ? t('publish.copied') : t('publish.copy')}
                  </button>
                </div>
              </label>
              <p className="text-xs text-neutral-500">
                {hrefs.portable ? t('publish.portableHint') : t('publish.localHint')}
              </p>
              {hrefs.portable ? (
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">{t('publish.localLink')}</span>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={hrefs.localHref}
                      className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-800"
                    />
                    <button
                      type="button"
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-600"
                      onClick={() => void onCopy('local', hrefs.localHref)}
                    >
                      {copiedKind === 'local' ? t('publish.copied') : t('publish.copy')}
                    </button>
                  </div>
                </label>
              ) : null}
              <a
                href={hrefs.shareHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                {t('publish.open')}
              </a>
            </div>
          ) : null}
          {sites.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                {t('publish.history')}
              </h3>
              <ul className="space-y-1">
                {sites.map((site) => (
                  <li
                    key={site.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  >
                    <a
                      className="min-w-0 flex-1 truncate text-xs text-blue-700 dark:text-blue-300"
                      href={`?${SHARE_ID_PARAM}=${encodeURIComponent(site.id)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {site.name}
                    </a>
                    <button
                      type="button"
                      className="text-[11px] text-neutral-500 hover:text-red-600"
                      onClick={() => {
                        removePublishedSite(site.id)
                        setCatalogTick((n) => n + 1)
                      }}
                    >
                      {t('publish.unpublish')}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
