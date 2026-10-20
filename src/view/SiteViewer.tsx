import { useEffect, useMemo, useState } from 'react'
import { loadChromePrefs, localeDir } from '../editor/chromePrefs.ts'
import { translate } from '../editor/i18n.ts'
import { resolvePage } from '../editor/pages.ts'
import { savePersistedSession } from '../editor/persist.ts'
import { renderPageHtml } from '../editor/render.ts'
import {
  decodeSharePayload,
  findPublishedSite,
  parseShareLocation,
} from '../editor/share.ts'
import type { Project } from '../editor/types.ts'

type Status = 'loading' | 'ready' | 'missing'

export function SiteViewer() {
  const locale = loadChromePrefs().locale
  const dir = localeDir(locale)
  const t = (key: string) => translate(locale, key)
  const search = typeof window === 'undefined' ? '' : window.location.search
  const hash = typeof window === 'undefined' ? '' : window.location.hash
  const [status, setStatus] = useState<Status>(() =>
    parseShareLocation(search, hash) ? 'loading' : 'missing',
  )
  const [project, setProject] = useState<Project | null>(null)
  const [pageId, setPageId] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = dir
  }, [locale, dir])

  useEffect(() => {
    const request = parseShareLocation(search, hash)
    if (!request) return
    let cancelled = false
    const load = async () => {
      if (request.kind === 'catalog') {
        const site = findPublishedSite(request.id)
        if (cancelled) return
        if (!site) {
          setStatus('missing')
          return
        }
        setProject(site.project)
        setPageId(site.project.pages[0]?.id ?? null)
        setStatus('ready')
        return
      }
      const decoded = await decodeSharePayload(request.payload)
      if (cancelled) return
      if (!decoded) {
        setStatus('missing')
        return
      }
      setProject(decoded)
      setPageId(decoded.pages[0]?.id ?? null)
      setStatus('ready')
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [search, hash])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; pageId?: string }
      if (data?.source !== 'qitma-canvas' || data.type !== 'navigate' || !data.pageId) return
      setPageId(data.pageId)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const page = project ? resolvePage(project, pageId) : undefined
  const srcdoc = useMemo(() => {
    if (!project || !page) return ''
    return renderPageHtml(project, page.root, 'preview', page)
  }, [project, page])

  const openInEditor = () => {
    if (!project) return
    savePersistedSession({ project, activePageId: page?.id ?? project.pages[0]?.id ?? null })
    window.location.assign('/')
  }

  return (
    <div dir={dir} className="flex h-screen flex-col bg-neutral-100 text-neutral-900">
      <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-neutral-900 text-[11px] font-bold text-white">
          ق
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{project?.name ?? t('app.name')}</p>
          <p className="truncate text-[11px] text-neutral-500">{t('publish.viewerHint')}</p>
        </div>
        {project ? (
          <button
            type="button"
            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-50"
            onClick={openInEditor}
          >
            {t('publish.openEditor')}
          </button>
        ) : null}
        <a
          href="/"
          className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800"
        >
          {t('publish.backEditor')}
        </a>
      </header>
      {status === 'loading' ? (
        <p className="p-6 text-sm text-neutral-500">{t('publish.loading')}</p>
      ) : null}
      {status === 'missing' ? (
        <div className="m-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <h1 className="mb-2 font-semibold">{t('publish.missingTitle')}</h1>
          <p className="mb-3 text-neutral-600">{t('publish.missingBody')}</p>
          <a href="/" className="text-blue-700 underline">
            {t('publish.backEditor')}
          </a>
        </div>
      ) : null}
      {status === 'ready' && srcdoc ? (
        <iframe
          title={page?.name ?? project?.name ?? t('app.name')}
          className="min-h-0 w-full flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms"
          srcDoc={srcdoc}
        />
      ) : null}
    </div>
  )
}
