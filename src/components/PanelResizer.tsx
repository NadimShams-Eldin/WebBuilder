import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { clampPanelWidth, type PanelId } from '../editor/layoutPrefs.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

function widthSign(panel: PanelId, locale: string): number {
  const onRightEdge = panel === 'right' ? locale === 'ar' : locale !== 'ar'
  return onRightEdge ? -1 : 1
}

export function PanelResizer({ panel }: { panel: PanelId }) {
  const { t, locale } = useI18n()
  const width = useEditorStore((s) => s.panelWidths[panel])
  const setPanelWidth = useEditorStore((s) => s.setPanelWidth)
  const togglePanel = useEditorStore((s) => s.togglePanel)
  const dragging = useRef(false)
  const start = useRef({ x: 0, width })

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t('panel.resize')}
      title={t('panel.resize')}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        dragging.current = true
        start.current = { x: event.clientX, width }
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        const delta = (event.clientX - start.current.x) * widthSign(panel, locale)
        setPanelWidth(panel, clampPanelWidth(start.current.width + delta))
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onDoubleClick={() => togglePanel(panel)}
      className="group relative w-1.5 shrink-0 cursor-col-resize bg-transparent"
    >
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-neutral-200 transition-colors group-hover:bg-blue-400 dark:bg-neutral-800" />
    </div>
  )
}

export function PanelCollapseStrip({ panel }: { panel: PanelId }) {
  const { t, locale } = useI18n()
  const togglePanel = useEditorStore((s) => s.togglePanel)
  const onRightEdge = panel === 'right' ? locale === 'ar' : locale !== 'ar'

  return (
    <button
      type="button"
      onClick={() => togglePanel(panel)}
      title={t('panel.expand')}
      aria-label={t('panel.expand')}
      className="flex h-full w-6 shrink-0 items-center justify-center border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        {onRightEdge ? (
          <path d="M10 3 5 8l5 5z" />
        ) : (
          <path d="M6 3l5 5-5 5z" />
        )}
      </svg>
    </button>
  )
}
