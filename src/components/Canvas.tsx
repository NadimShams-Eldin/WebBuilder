import { useEffect, useMemo, useRef, useState } from 'react'
import { renderPageHtml } from '../editor/render.ts'
import { DEVICE_WIDTHS, getActivePage, useEditorStore } from '../editor/store.ts'

export function Canvas() {
  const project = useEditorStore((s) => s.project)
  const device = useEditorStore((s) => s.device)
  const zoom = useEditorStore((s) => s.zoom)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [frameHeight, setFrameHeight] = useState(720)

  const page = getActivePage(project)
  const srcDoc = useMemo(
    () => (page ? renderPageHtml(project, page.root) : ''),
    [project, page],
  )

  const width = DEVICE_WIDTHS[device]

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const syncHeight = () => {
      const doc = iframe.contentDocument
      if (!doc?.documentElement) return
      const next = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0, 480)
      setFrameHeight(next)
    }

    iframe.addEventListener('load', syncHeight)
    syncHeight()
    return () => iframe.removeEventListener('load', syncHeight)
  }, [srcDoc])

  return (
    <div
      className="relative shadow-sm"
      style={{ width: width * zoom, height: frameHeight * zoom }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width, height: frameHeight, transform: `scale(${zoom})` }}
      >
        <iframe
          ref={iframeRef}
          title="معاينة الصفحة"
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          className="block h-full w-full border-0 bg-white"
        />
        <div
          className="pointer-events-none absolute inset-0"
          data-overlay="selection"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
