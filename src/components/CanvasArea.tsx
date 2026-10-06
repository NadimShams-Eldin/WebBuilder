import { useDroppable } from '@dnd-kit/core'
import { CANVAS_DROPPABLE_ID } from '../editor/dnd.ts'
import { DEVICE_WIDTHS, useEditorStore, type Device } from '../editor/store.ts'
import { Canvas } from './Canvas'

const DEVICES: { id: Device; label: string }[] = [
  { id: 'desktop', label: 'حاسوب' },
  { id: 'tablet', label: 'لوحي' },
  { id: 'phone', label: 'هاتف' },
]

export function CanvasArea() {
  const device = useEditorStore((s) => s.device)
  const zoom = useEditorStore((s) => s.zoom)
  const setDevice = useEditorStore((s) => s.setDevice)
  const setZoom = useEditorStore((s) => s.setZoom)
  const { setNodeRef } = useDroppable({ id: CANVAS_DROPPABLE_ID })

  return (
    <main className="flex h-full flex-1 flex-col bg-neutral-100">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDevice(item.id)}
              className={
                device === item.id
                  ? 'rounded border border-neutral-200 bg-neutral-100 px-2 py-1 text-neutral-900'
                  : 'rounded px-2 py-1 hover:bg-neutral-50'
              }
            >
              {item.label}
            </button>
          ))}
          <span className="text-neutral-400">{DEVICE_WIDTHS[device]}px</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <button
            type="button"
            className="rounded border border-neutral-200 px-2 py-1"
            onClick={() => setZoom(zoom - 0.1)}
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="rounded border border-neutral-200 px-2 py-1"
            onClick={() => setZoom(zoom + 0.1)}
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
