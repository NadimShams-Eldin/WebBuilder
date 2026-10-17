import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  addTrackTemplate,
  gridOverlayLines,
  parseCssLength,
  parseTrackSizes,
  removeTrackTemplate,
  resizeTrackPair,
  snapValue,
} from '../editor/canvasGuides.ts'
import type { Node, NodeStyle } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'

export type GuideRect = { top: number; left: number; width: number; height: number }

type DragState =
  | {
      kind: 'track'
      axis: 'column' | 'row'
      index: number
      startX: number
      startY: number
      sizes: number[]
      pending: string
      moved: boolean
    }
  | {
      kind: 'gap'
      axis: 'grid' | 'flex'
      startX: number
      startY: number
      columnGap: number
      rowGap: number
      pending: NodeStyle
      moved: boolean
    }

const CONTROL_CLASS =
  'pointer-events-auto flex h-5 items-center gap-0.5 rounded border border-neutral-300 bg-white/95 px-1 text-[10px] text-neutral-700 shadow-sm dark:border-neutral-600 dark:bg-neutral-900/95 dark:text-neutral-200'

const BUTTON_CLASS =
  'flex h-4 w-4 items-center justify-center rounded text-[11px] leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800'

const JUSTIFY_OPTIONS = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around']
const ALIGN_OPTIONS = ['stretch', 'flex-start', 'center', 'flex-end']

function elementFor(frame: HTMLIFrameElement | null, id: string): HTMLElement | null {
  try {
    const el = frame?.contentDocument?.querySelector(`[data-qid="${CSS.escape(id)}"]`)
    return el instanceof HTMLElement ? el : null
  } catch {
    return null
  }
}

function FlexPreview({ value }: { value: string }) {
  const isStretch = value === 'stretch'
  return (
    <span
      className="flex h-3 w-4 rounded-[2px] border border-current/40 p-[1px]"
      style={{
        justifyContent: JUSTIFY_OPTIONS.includes(value) ? value : 'flex-start',
        alignItems: ALIGN_OPTIONS.includes(value) ? value : 'center',
        gap: '1px',
        opacity: 0.8,
      }}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="rounded-[1px] bg-current"
          style={{
            width: '2px',
            height: isStretch ? '100%' : '60%',
          }}
        />
      ))}
    </span>
  )
}

export function CanvasGuides({
  frame,
  node,
  rect,
  zoom,
  rtl,
  onCommit,
}: {
  frame: HTMLIFrameElement | null
  node: Node
  rect: GuideRect
  zoom: number
  rtl: boolean
  onCommit: (style: NodeStyle) => void
}) {
  const { t } = useI18n()
  const drag = useRef<DragState | null>(null)
  const [hud, setHud] = useState<string | null>(null)

  const el = elementFor(frame, node.id)
  let display = String(node.style.display ?? '')
  let columnTemplate = ''
  let rowTemplate = ''
  let columnGap = parseCssLength(String(node.style.columnGap ?? node.style.gap ?? '0'))
  let rowGap = parseCssLength(String(node.style.rowGap ?? node.style.gap ?? '0'))

  if (el) {
    try {
      const computed = getComputedStyle(el)
      display = computed.display
      columnTemplate = computed.gridTemplateColumns
      rowTemplate = computed.gridTemplateRows === 'none' ? '' : computed.gridTemplateRows
      columnGap = parseCssLength(computed.columnGap)
      rowGap = parseCssLength(computed.rowGap)
    } catch {
      return null
    }
  }

  const mode = display.includes('grid') ? 'grid' : display.includes('flex') ? 'flex' : null
  if (!mode) return null

  const columnSizes = parseTrackSizes(columnTemplate)
  const rowSizes = parseTrackSizes(rowTemplate)
  const lines = gridOverlayLines(
    rect,
    columnTemplate,
    rowTemplate,
    columnGap,
    rowGap,
    rtl,
  )

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current
    if (!state) return
    drag.current = null
    setHud(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!state.moved) return
    if (state.kind === 'track') {
      onCommit(
        state.axis === 'column'
          ? { gridTemplateColumns: state.pending }
          : { gridTemplateRows: state.pending },
      )
    } else {
      onCommit(state.pending)
    }
  }

  const startTrackDrag = (axis: 'column' | 'row', index: number) => (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const sizes = axis === 'column' ? columnSizes : rowSizes
    const template = axis === 'column' ? columnTemplate : rowTemplate
    if (sizes.length < 2 || sizes[index] === undefined) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      kind: 'track',
      axis,
      index,
      startX: event.clientX,
      startY: event.clientY,
      sizes,
      pending: template,
      moved: false,
    }
  }

  const onTrackMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (state?.kind !== 'track') return
    const target = elementFor(frame, node.id)
    if (!target) return
    const raw =
      state.axis === 'column'
        ? (event.clientX - state.startX) / zoom
        : (event.clientY - state.startY) / zoom
    const delta = snapValue(state.axis === 'column' && rtl ? -raw : raw, 4)
    if (delta === 0) return
    const next = resizeTrackPair(state.sizes, state.index, delta)
    if (!next) return
    const template = next.map((size) => `${Math.round(size)}px`).join(' ')
    drag.current = { ...state, pending: template, moved: true }
    if (state.axis === 'column') target.style.gridTemplateColumns = template
    else target.style.gridTemplateRows = template
    setHud(`${Math.round(next[state.index])} × ${Math.round(next[state.index + 1])}`)
  }

  const startGapDrag = (axis: 'grid' | 'flex') => (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      kind: 'gap',
      axis,
      startX: event.clientX,
      startY: event.clientY,
      columnGap,
      rowGap,
      pending: {},
      moved: false,
    }
  }

  const onGapMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (state?.kind !== 'gap') return
    const target = elementFor(frame, node.id)
    if (!target) return
    const dx = snapValue((event.clientX - state.startX) / zoom, 4)
    const dy = snapValue((event.clientY - state.startY) / zoom, 4)
    if (state.axis === 'flex') {
      if (dx === 0) return
      const gap = Math.max(0, state.columnGap + dx)
      drag.current = { ...state, pending: { gap: `${gap}px` }, moved: true }
      target.style.gap = `${gap}px`
      setHud(`${gap}px`)
      return
    }
    if (dx === 0 && dy === 0) return
    const nextColumn = Math.max(0, state.columnGap + dx)
    const nextRow = Math.max(0, state.rowGap + dy)
    drag.current = {
      ...state,
      pending: { columnGap: `${nextColumn}px`, rowGap: `${nextRow}px` },
      moved: true,
    }
    target.style.columnGap = `${nextColumn}px`
    target.style.rowGap = `${nextRow}px`
    setHud(`${nextColumn} / ${nextRow}`)
  }

  const addColumn = () => {
    const source = String(node.style.gridTemplateColumns ?? '') || columnTemplate
    onCommit({ gridTemplateColumns: addTrackTemplate(source, '1fr') })
  }

  const removeColumn = () => {
    const source = String(node.style.gridTemplateColumns ?? '') || columnTemplate
    const next = removeTrackTemplate(source)
    if (next) onCommit({ gridTemplateColumns: next })
  }

  const addRow = () => {
    const source = String(node.style.gridTemplateRows ?? '')
    onCommit({ gridTemplateRows: addTrackTemplate(source, 'auto') })
  }

  const removeRow = () => {
    const declared = String(node.style.gridTemplateRows ?? '')
    const source = declared || (rowSizes.length ? rowTemplate : '')
    const next = removeTrackTemplate(source)
    if (next) {
      onCommit({ gridTemplateRows: next })
      return
    }
    if (declared) onCommit({ gridTemplateRows: undefined })
  }

  const boxStyle = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }

  return (
    <div className="pointer-events-none absolute" style={boxStyle} data-guide="interactive">
      {mode === 'grid' ? (
        <>
          {lines.vertical.map((left, index) => (
            <div
              key={`divider-${index}`}
              role="separator"
              aria-orientation="vertical"
              aria-label={t('guides.resizeColumn')}
              title={t('guides.resizeColumn')}
              data-guide="grid-divider"
              onPointerDown={startTrackDrag('column', index)}
              onPointerMove={onTrackMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="group pointer-events-auto absolute top-0 flex h-full w-2 -translate-x-1/2 cursor-col-resize justify-center"
              style={{ left }}
            >
              <span className="my-2 w-0.5 rounded bg-sky-500/60 transition-colors group-hover:bg-sky-500" />
            </div>
          ))}
          {lines.horizontal.map((top, index) => (
            <div
              key={`divider-row-${index}`}
              role="separator"
              aria-orientation="horizontal"
              aria-label={t('guides.resizeRow')}
              title={t('guides.resizeRow')}
              data-guide="grid-divider-row"
              onPointerDown={startTrackDrag('row', index)}
              onPointerMove={onTrackMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="group pointer-events-auto absolute left-0 flex w-full -translate-y-1/2 cursor-row-resize items-center"
              style={{ top }}
            >
              <span className="mx-2 h-0.5 flex-1 rounded bg-sky-500/50 transition-colors group-hover:bg-sky-500" />
            </div>
          ))}

          <div
            className="pointer-events-auto absolute top-1 flex flex-wrap items-start gap-1"
            style={{ ...(rtl ? { right: 4 } : { left: 4 }), maxWidth: rect.width - 8 }}
          >
            <div className={CONTROL_CLASS}>
              <span className="px-0.5 text-neutral-500 dark:text-neutral-400">{t('guides.columns')}</span>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={removeColumn}
                title={t('guides.removeColumn')}
                aria-label={t('guides.removeColumn')}
              >
                −
              </button>
              <span className="min-w-3 text-center font-medium">{columnSizes.length}</span>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={addColumn}
                title={t('guides.addColumn')}
                aria-label={t('guides.addColumn')}
              >
                +
              </button>
            </div>
            <div className={CONTROL_CLASS}>
              <span className="px-0.5 text-neutral-500 dark:text-neutral-400">{t('guides.rows')}</span>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={removeRow}
                title={t('guides.removeRow')}
                aria-label={t('guides.removeRow')}
              >
                −
              </button>
              <span className="min-w-3 text-center font-medium">{rowSizes.length}</span>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={addRow}
                title={t('guides.addRow')}
                aria-label={t('guides.addRow')}
              >
                +
              </button>
            </div>
            <div
              className={`${CONTROL_CLASS} cursor-col-resize`}
              role="slider"
              aria-label={t('guides.gap')}
              title={t('guides.gap')}
              onPointerDown={startGapDrag('grid')}
              onPointerMove={onGapMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <span className="text-neutral-500 dark:text-neutral-400">{t('guides.gap')}</span>
              <span className="font-medium">
                {hud ?? `${Math.round(columnGap)} / ${Math.round(rowGap)}`}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div
          className="pointer-events-auto absolute top-1 flex flex-wrap items-center gap-1 rounded-md border border-violet-300 bg-white/95 p-1 shadow-sm dark:border-violet-700 dark:bg-neutral-900/95"
          style={{ ...(rtl ? { right: 4 } : { left: 4 }), maxWidth: rect.width - 8 }}
          data-guide="flex-guides"
        >
          <span className="px-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            {t('guides.justify')}
          </span>
          {JUSTIFY_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              title={value}
              aria-label={value}
              onClick={() => onCommit({ justifyContent: value })}
              className={`flex h-5 w-6 items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                node.style.justifyContent === value ? 'bg-violet-100 dark:bg-violet-900' : ''
              }`}
            >
              <FlexPreview value={value} />
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
          <span className="px-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            {t('guides.align')}
          </span>
          {ALIGN_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              title={value}
              aria-label={value}
              onClick={() => onCommit({ alignItems: value })}
              className={`flex h-5 w-6 items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                node.style.alignItems === value ? 'bg-violet-100 dark:bg-violet-900' : ''
              }`}
            >
              <FlexPreview value={value} />
            </button>
          ))}
          <div
            className={`${CONTROL_CLASS} cursor-col-resize`}
            role="slider"
            aria-label={t('guides.gap')}
            title={t('guides.gap')}
            onPointerDown={startGapDrag('flex')}
            onPointerMove={onGapMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="text-neutral-500 dark:text-neutral-400">{t('guides.gap')}</span>
            <span className="font-medium">{hud ?? `${Math.round(columnGap)}px`}</span>
          </div>
        </div>
      )}
    </div>
  )
}
