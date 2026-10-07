import { useDndContext } from '@dnd-kit/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { registerCanvasIframe } from '../editor/dnd.ts'
import { indicatorBox, type IndicatorBox } from '../editor/drop.ts'
import { renderPageHtml } from '../editor/render.ts'
import { DEVICE_WIDTHS, getActivePage, useEditorStore } from '../editor/store.ts'

type OverlayRect = { top: number; left: number; width: number; height: number }

type CanvasMessage = {
  source?: string
  type?: string
  id?: string | null
}

function queryNodeRect(doc: Document, id: string): OverlayRect | null {
  const el = doc.querySelector(`[data-qid="${CSS.escape(id)}"]`)
  if (!(el instanceof HTMLElement)) return null
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: Math.max(rect.width, 1),
    height: Math.max(rect.height, 1),
  }
}

export function Canvas() {
  const project = useEditorStore((s) => s.project)
  const device = useEditorStore((s) => s.device)
  const zoom = useEditorStore((s) => s.zoom)
  const selectedId = useEditorStore((s) => s.selectedId)
  const dropPreview = useEditorStore((s) => s.dropPreview)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const setRightTab = useEditorStore((s) => s.setRightTab)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { active } = useDndContext()
  const dragging = Boolean(active)
  const [frameHeight, setFrameHeight] = useState(720)
  const [overlay, setOverlay] = useState<OverlayRect | null>(null)
  const [dropBox, setDropBox] = useState<IndicatorBox | null>(null)

  const page = getActivePage(project)
  const srcDoc = useMemo(
    () => (page ? renderPageHtml(project, page.root, true) : ''),
    [project, page],
  )

  const width = DEVICE_WIDTHS[device]

  const syncHeight = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc?.documentElement) return
    const next = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0, 480)
    setFrameHeight(next)
  }, [])

  const syncOverlay = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !selectedId) {
      setOverlay(null)
      return
    }
    setOverlay(queryNodeRect(doc, selectedId))
  }, [selectedId])

  const syncDrop = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !dropPreview) {
      setDropBox(null)
      return
    }
    const rect = queryNodeRect(doc, dropPreview.targetId)
    if (!rect) {
      setDropBox(null)
      return
    }
    setDropBox(
      indicatorBox(rect, dropPreview.placement, dropPreview.axis ?? 'vertical', dropPreview.rtl ?? true),
    )
  }, [dropPreview])

  useEffect(() => {
    registerCanvasIframe(iframeRef.current)
    return () => registerCanvasIframe(null)
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      syncHeight()
      syncOverlay()
      syncDrop()
    }
    iframe.addEventListener('load', onLoad)
    onLoad()
    return () => iframe.removeEventListener('load', onLoad)
  }, [srcDoc, syncHeight, syncOverlay, syncDrop])

  useEffect(() => {
    syncOverlay()
  }, [syncOverlay, zoom, device])

  useEffect(() => {
    syncDrop()
  }, [syncDrop, zoom, device])

  useEffect(() => {
    const onMessage = (event: MessageEvent<CanvasMessage>) => {
      if (event.data?.source !== 'qitma-canvas' || event.data.type !== 'select') return
      setSelectedId(event.data.id ?? null)
      if (event.data.id) setRightTab('outline')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setSelectedId, setRightTab])

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
          sandbox="allow-scripts allow-same-origin"
          className="block h-full w-full border-0 bg-white"
          data-device={device}
          data-width={width}
          style={{ pointerEvents: dragging ? 'none' : 'auto' }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          data-overlay="selection"
          aria-hidden="true"
        >
          {overlay && !dropBox ? (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/5"
              style={{
                top: overlay.top,
                left: overlay.left,
                width: overlay.width,
                height: overlay.height,
              }}
            />
          ) : null}
          {dropBox ? (
            <div
              className={
                dropBox.kind === 'inside'
                  ? 'absolute border-2 border-blue-500 bg-blue-500/10'
                  : 'absolute bg-blue-500'
              }
              style={{
                top: dropBox.top,
                left: dropBox.left,
                width: dropBox.width,
                height: dropBox.height,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
