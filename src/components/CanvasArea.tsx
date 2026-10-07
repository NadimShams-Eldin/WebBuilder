import { useDroppable } from '@dnd-kit/core'
import { CANVAS_DROPPABLE_ID } from '../editor/dnd.ts'
import { useEditorStore } from '../editor/store.ts'
import {
  DEVICE_LABELS,
  DEVICE_WIDTHS,
  DEVICES,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from '../editor/viewport.ts'
import { Canvas } from './Canvas'

export function CanvasArea() {
  const device = useEditorStore((s) => s.device)
  const zoom = useEditorStore((s) => s.zoom)
  const setDevice = useEditorStore((s) => s.setDevice)
  const setZoom = useEditorStore((s) => s.setZoom)
  const { setNodeRef } = useDroppable({ id: CANVAS_DROPPABLE_ID })
  const atMin = zoom <= ZOOM_MIN
  const atMax = zoom >= ZOOM_MAX

  return (
    <main className="flex h-full flex-1 flex-col bg-neutral-100">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {DEVICES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              aria-pressed={device === id}
              className={
                device === id
                  ? 'rounded border border-neutral-200 bg-neutral-100 px-2 py-1 text-neutral-900'
                  : 'rounded px-2 py-1 hover:bg-neutral-50'
              }
            >
              {DEVICE_LABELS[id]}
            </button>
          ))}
          <span className="text-neutral-400">{DEVICE_WIDTHS[device]}px</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <button
            type="button"
            className={
              atMin
                ? 'rounded border border-neutral-200 px-2 py-1 text-neutral-300'
                : 'rounded border border-neutral-200 px-2 py-1 hover:bg-neutral-50'
            }
            disabled={atMin}
            aria-label="تصغير"
            onClick={() => setZoom(zoom - ZOOM_STEP)}
          >
            −
          </button>
          <button
            type="button"
            className="min-w-12 rounded px-1 py-1 hover:bg-neutral-50"
            title="إعادة التكبير إلى 100%"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className={
              atMax
                ? 'rounded border border-neutral-200 px-2 py-1 text-neutral-300'
                : 'rounded border border-neutral-200 px-2 py-1 hover:bg-neutral-50'
            }
            disabled={atMax}
            aria-label="تكبير"
            onClick={() => setZoom(zoom + ZOOM_STEP)}
          >
            +
          </button>
        </div>
      </div>

      <div ref={setNodeRef} className="flex flex-1 justify-center overflow-auto p-8">
        <Canvas />
      </div>
    </main>
  )
}
