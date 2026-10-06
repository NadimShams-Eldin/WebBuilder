import { useEffect } from 'react'
import { selectCanRedo, selectCanUndo, useEditorStore } from '../editor/store.ts'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function AppHeader() {
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore(selectCanUndo)
  const canRedo = useEditorStore(selectCanRedo)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      if (isEditableTarget(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
        return
      }
      if (key === 'z') {
        event.preventDefault()
        undo()
        return
      }
      if (key === 'y') {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-neutral-900">قطمة</span>
        <nav className="flex items-center gap-1 text-sm">
          <button className="rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900">
            لوحة التركيب
          </button>
          <button className="rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50">
            معاينة حية
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-neutral-200">
          <button
            type="button"
            className={
              canUndo
                ? 'px-2 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                : 'px-2 py-1.5 text-neutral-300'
            }
            title="تراجع (Ctrl+Z)"
            disabled={!canUndo}
            onClick={() => undo()}
          >
            ↷
          </button>
          <button
            type="button"
            className={
              canRedo
                ? 'px-2 py-1.5 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                : 'px-2 py-1.5 text-neutral-300'
            }
            title="إعادة (Ctrl+Y)"
            disabled={!canRedo}
            onClick={() => redo()}
          >
            ↶
          </button>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          Publish
        </button>
      </div>
    </header>
  )
}
