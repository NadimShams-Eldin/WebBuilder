import { useDroppable } from '@dnd-kit/core'
import { CANVAS_DROPPABLE_ID } from '../editor/dnd.ts'
import { Canvas } from './Canvas'

export function CanvasArea() {
  const { setNodeRef } = useDroppable({ id: CANVAS_DROPPABLE_ID })

  return (
    <main className="flex min-h-0 flex-1 justify-center overflow-auto bg-neutral-100 p-8 dark:bg-neutral-950">
      <div ref={setNodeRef} className="flex w-full justify-center">
        <Canvas />
      </div>
    </main>
  )
}
