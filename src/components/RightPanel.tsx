import { BLOCK_GROUPS } from '../blocks/registry.ts'
import { getActivePage, useEditorStore } from '../editor/store.ts'
import { LayerTree } from './LayerTree'

export function RightPanel() {
  const addBlock = useEditorStore((s) => s.addBlock)
  const lastInsertError = useEditorStore((s) => s.lastInsertError)
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedId)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const tab = useEditorStore((s) => s.rightTab)
  const setTab = useEditorStore((s) => s.setRightTab)
  const page = getActivePage(project)

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex items-center gap-1 border-b border-neutral-200 p-2 text-sm">
        <button
          type="button"
          onClick={() => setTab('blocks')}
          className={
            tab === 'blocks'
              ? 'flex-1 rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900'
              : 'flex-1 rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50'
          }
        >
          Blocks
        </button>
        <button
          type="button"
          onClick={() => setTab('outline')}
          className={
            tab === 'outline'
              ? 'flex-1 rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900'
              : 'flex-1 rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50'
          }
        >
          Outline
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'blocks' ? (
          <>
            {lastInsertError ? (
              <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
                {lastInsertError}
              </p>
            ) : null}
            {BLOCK_GROUPS.map((group) => (
              <section key={group.id} className="mb-4">
                <h3 className="mb-2 text-xs font-semibold text-neutral-400">{group.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      draggable
                      onClick={() => addBlock(item.type)}
                      className="cursor-grab rounded-md border border-neutral-200 bg-neutral-50 px-2 py-3 text-center text-xs text-neutral-600 hover:border-blue-400 hover:bg-blue-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : page ? (
          <LayerTree root={page.root} selectedId={selectedId} onSelect={setSelectedId} />
        ) : (
          <p className="text-xs text-neutral-400">لا توجد صفحة</p>
        )}
      </div>
    </aside>
  )
}
