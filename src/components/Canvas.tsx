import { useDndContext } from '@dnd-kit/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collectEmptyContainerIds,
  floatingMenuPosition,
  gridOverlayLines,
  measureSegments,
} from '../editor/canvasGuides.ts'
import { registerCanvasIframe } from '../editor/dnd.ts'
import { indicatorBox, type IndicatorBox } from '../editor/drop.ts'
import { renderPageHtml } from '../editor/render.ts'
import { DEVICE_WIDTHS, getActivePage, useEditorStore } from '../editor/store.ts'
import { findNode } from '../editor/tree.ts'
import { useI18n } from '../editor/useI18n.ts'
import { CanvasGuides } from './CanvasGuides'

type OverlayRect = { top: number; left: number; width: number; height: number }

type GridLines = { vertical: number[]; horizontal: number[] }

type CanvasMessage = {
  source?: string
  type?: string
  id?: string | null
  pageId?: string | null
  alt?: boolean
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

function parseGap(value: string): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function queryGridLines(doc: Document, id: string, rect: OverlayRect): GridLines | null {
  const el = doc.querySelector(`[data-qid="${CSS.escape(id)}"]`)
  if (!(el instanceof HTMLElement)) return null
  const style = getComputedStyle(el)
  if (style.display !== 'grid' && style.display !== 'inline-grid') return null
  const lines = gridOverlayLines(
    rect,
    style.gridTemplateColumns,
    style.gridTemplateRows,
    parseGap(style.columnGap),
    parseGap(style.rowGap),
  )
  if (lines.vertical.length === 0 && lines.horizontal.length === 0) return null
  return lines
}

export function Canvas() {
  const { t } = useI18n()
  const project = useEditorStore((s) => s.project)
  const activePageId = useEditorStore((s) => s.activePageId)
  const device = useEditorStore((s) => s.device)
  const zoom = useEditorStore((s) => s.zoom)
  const selectedId = useEditorStore((s) => s.selectedId)
  const dropPreview = useEditorStore((s) => s.dropPreview)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const setActivePage = useEditorStore((s) => s.setActivePage)
  const setRightTab = useEditorStore((s) => s.setRightTab)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const updateNodeById = useEditorStore((s) => s.updateNodeById)
  const workspace = useEditorStore((s) => s.workspace)
  const gridOverlay = useEditorStore((s) => s.gridOverlay)
  const preview = workspace === 'preview'
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { active } = useDndContext()
  const dragging = Boolean(active)
  const [frameHeight, setFrameHeight] = useState(720)
  const [overlay, setOverlay] = useState<OverlayRect | null>(null)
  const [hoverRect, setHoverRect] = useState<OverlayRect | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [emptyRects, setEmptyRects] = useState<OverlayRect[]>([])
  const [gridLines, setGridLines] = useState<GridLines | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [dropBox, setDropBox] = useState<IndicatorBox | null>(null)
  const [altDown, setAltDown] = useState(false)
  const [frameEl, setFrameEl] = useState<HTMLIFrameElement | null>(null)

  const page = getActivePage(project, activePageId)
  const selectedNode = page && selectedId ? findNode(page.root, selectedId) : null
  const srcDoc = useMemo(
    () => (page ? renderPageHtml(project, page.root, preview ? 'preview' : 'editor', page) : ''),
    [project, page, preview],
  )
  const rtl = project.theme.direction !== 'ltr'
  const canMutateSelected = Boolean(selectedId && page && selectedId !== page.root.id)

  const width = DEVICE_WIDTHS[device]

  const syncHeight = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc?.documentElement) return
    const next = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0, 480)
    setFrameHeight(next)
  }, [])

  const syncOverlay = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !selectedId || preview) {
      setOverlay(null)
      setGridLines(null)
      setMenuPos(null)
      return
    }
    const rect = queryNodeRect(doc, selectedId)
    setOverlay(rect)
    setGridLines(rect ? queryGridLines(doc, selectedId, rect) : null)
    setMenuPos(
      rect && canMutateSelected ? floatingMenuPosition(rect, width, rtl) : null,
    )
  }, [selectedId, preview, canMutateSelected, width, rtl])

  const activeHoverId = preview || dragging ? null : hoveredId
  const syncHover = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !activeHoverId || activeHoverId === selectedId) {
      setHoverRect(null)
      return
    }
    setHoverRect(queryNodeRect(doc, activeHoverId))
  }, [activeHoverId, selectedId])

  const syncEmpty = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !page || preview) {
      setEmptyRects([])
      return
    }
    const rects: OverlayRect[] = []
    for (const id of collectEmptyContainerIds(page.root)) {
      if (id === selectedId) continue
      const rect = queryNodeRect(doc, id)
      if (rect) rects.push(rect)
    }
    setEmptyRects(rects)
  }, [page, preview, selectedId])

  const syncDrop = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !dropPreview || preview) {
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
  }, [dropPreview, preview])

  useEffect(() => {
    const frame = iframeRef.current
    setFrameEl(frame)
    registerCanvasIframe(frame)
    return () => registerCanvasIframe(null)
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      syncHeight()
      syncOverlay()
      syncHover()
      syncEmpty()
      syncDrop()
    }
    iframe.addEventListener('load', onLoad)
    onLoad()
    return () => iframe.removeEventListener('load', onLoad)
  }, [srcDoc, syncHeight, syncOverlay, syncHover, syncEmpty, syncDrop])

  useEffect(() => {
    syncOverlay()
  }, [syncOverlay, zoom, device])

  useEffect(() => {
    syncHover()
  }, [syncHover, zoom, device])

  useEffect(() => {
    syncEmpty()
  }, [syncEmpty, zoom, device])

  useEffect(() => {
    syncDrop()
  }, [syncDrop, zoom, device])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => setAltDown(event.altKey)
    const onBlur = () => setAltDown(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent<CanvasMessage>) => {
      if (event.data?.source !== 'qitma-canvas') return
      if (event.data.type === 'navigate' && event.data.pageId) {
        setActivePage(event.data.pageId)
        return
      }
      if (preview) return
      if (event.data.type === 'modifier') {
        setAltDown(Boolean(event.data.alt))
        return
      }
      if (event.data.type === 'hover') {
        setHoveredId(event.data.id ?? null)
        return
      }
      if (event.data.type !== 'select') return
      setSelectedId(event.data.id ?? null)
      if (event.data.id) setRightTab('outline')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [preview, setSelectedId, setRightTab, setActivePage])

  const showGuides = !preview && !dropBox
  const showGridLines = showGuides && gridOverlay
  const measureTarget =
    showGridLines && altDown && hoverRect && selectedId && hoveredId !== selectedId
      ? hoverRect
      : null
  const measures = overlay && measureTarget ? measureSegments(overlay, measureTarget) : []

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
          title={t('header.preview')}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          className="block h-full w-full border-0 bg-white dark:bg-neutral-900"
          data-device={device}
          data-width={width}
          style={{ pointerEvents: dragging ? 'none' : 'auto' }}
        />
        {preview ? null : (
        <div
          className="pointer-events-none absolute inset-0"
          data-overlay="selection"
          aria-hidden="true"
        >
          {showGuides
            ? emptyRects.map((rect, index) => (
                <div
                  key={`empty-${index}`}
                  className="absolute border border-dashed border-neutral-400/80"
                  data-guide="empty"
                  style={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              ))
            : null}
          {showGuides && hoverRect ? (
            <div
              className="absolute border-2 border-emerald-500 bg-emerald-500/5"
              data-guide="hover"
              style={{
                top: hoverRect.top,
                left: hoverRect.left,
                width: hoverRect.width,
                height: hoverRect.height,
              }}
            />
          ) : null}
          {showGuides && overlay ? (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/5"
              data-guide="selected"
              style={{
                top: overlay.top,
                left: overlay.left,
                width: overlay.width,
                height: overlay.height,
              }}
            />
          ) : null}
          {showGridLines && overlay && gridLines
            ? gridLines.vertical.map((left, index) => (
                <div
                  key={`gv-${index}`}
                  className="absolute w-px bg-sky-400/80"
                  data-guide="grid-col"
                  style={{ top: overlay.top, left, height: overlay.height }}
                />
              ))
            : null}
          {showGridLines && overlay && gridLines
            ? gridLines.horizontal.map((top, index) => (
                <div
                  key={`gh-${index}`}
                  className="absolute h-px bg-sky-400/80"
                  data-guide="grid-row"
                  style={{ top, left: overlay.left, width: overlay.width }}
                />
              ))
            : null}
          {showGridLines ? (
            <>
              <div
                className="pointer-events-none absolute top-0 h-3 w-full border-b border-neutral-300/60 bg-white/70 dark:border-neutral-600/60 dark:bg-neutral-900/70"
                data-guide="ruler-h"
                title={t('guides.measure')}
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, rgba(120,120,120,0.55) 0 1px, transparent 1px 50px)',
                }}
              />
              <div
                className="pointer-events-none absolute h-full w-3 border-e border-neutral-300/60 bg-white/70 dark:border-neutral-600/60 dark:bg-neutral-900/70"
                data-guide="ruler-v"
                style={{
                  top: 0,
                  ...(rtl ? { right: 0 } : { left: 0 }),
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, rgba(120,120,120,0.55) 0 1px, transparent 1px 50px)',
                }}
              />
            </>
          ) : null}
          {showGridLines && overlay && selectedNode ? (
            <CanvasGuides
              frame={frameEl}
              node={selectedNode}
              rect={overlay}
              zoom={zoom}
              rtl={rtl}
              onCommit={(style) => updateNodeById(selectedNode.id, { style })}
            />
          ) : null}
          {measureTarget
            ? measures.map((segment, index) =>
                segment.axis === 'horizontal' ? (
                  <div key={`mh-${index}`} className="pointer-events-none absolute">
                    <div
                      className="absolute h-px bg-emerald-500"
                      style={{
                        top: segment.at,
                        left: Math.min(segment.start, segment.end),
                        width: segment.length,
                      }}
                    />
                    <span
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-emerald-600 px-1 text-[10px] text-white"
                      style={{
                        top: segment.at,
                        left: (segment.start + segment.end) / 2,
                      }}
                    >
                      {Math.round(segment.length)}px
                    </span>
                  </div>
                ) : (
                  <div key={`mv-${index}`} className="pointer-events-none absolute">
                    <div
                      className="absolute w-px bg-emerald-500"
                      style={{
                        left: segment.at,
                        top: Math.min(segment.start, segment.end),
                        height: segment.length,
                      }}
                    />
                    <span
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-emerald-600 px-1 text-[10px] text-white"
                      style={{
                        left: segment.at,
                        top: (segment.start + segment.end) / 2,
                      }}
                    >
                      {Math.round(segment.length)}px
                    </span>
                  </div>
                ),
              )
            : null}
          {showGuides && menuPos && canMutateSelected ? (
            <div
              className="pointer-events-auto absolute z-10 flex overflow-hidden rounded-md border border-neutral-200 bg-white text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
              data-guide="menu"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                type="button"
                className="px-2 py-1 text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => duplicateSelected()}
              >
                {t('guide.duplicate')}
              </button>
              <button
                type="button"
                className="px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                onClick={() => deleteSelected()}
              >
                {t('guide.delete')}
              </button>
            </div>
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
        )}
      </div>
    </div>
  )
}
