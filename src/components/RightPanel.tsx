import { useDraggable } from '@dnd-kit/core'
import { BLOCK_GROUPS, type BlockDef } from '../blocks/registry.ts'
import { blockDragId } from '../editor/dnd.ts'
import { selectActivePage, useEditorStore, type RightTab } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'
import { ExtractedContent } from './ExtractedContent'
import { LayerTree } from './LayerTree'

function BlockButton({ item, onAdd, label }: { item: BlockDef; onAdd: () => void; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: blockDragId(item.type),
    data: { kind: 'block', type: item.type },
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onAdd}
      className="cursor-grab rounded-md border border-neutral-200 bg-neutral-50 px-2 py-3 text-center text-xs text-neutral-600 hover:border-blue-400 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-blue-400 dark:hover:bg-neutral-700"
      style={{ opacity: isDragging ? 0.45 : 1 }}
      {...listeners}
      {...attributes}
    >
      {label}
    </button>
  )
}

export function RightPanel() {
  const { t } = useI18n()
  const addBlock = useEditorStore((s) => s.addBlock)
  const lastInsertError = useEditorStore((s) => s.lastInsertError)
  const selectedId = useEditorStore((s) => s.selectedId)
  const dropPreview = useEditorStore((s) => s.dropPreview)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const tab = useEditorStore((s) => s.rightTab)
  const setTab = useEditorStore((s) => s.setRightTab)
  const page = useEditorStore(selectActivePage)
  const tabClass = (id: RightTab) =>
    tab === id
      ? 'flex-1 rounded-md bg-neutral-100 px-2 py-1.5 text-xs font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
      : 'flex-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-1 border-b border-neutral-200 p-2 text-sm dark:border-neutral-800">
        <button type="button" onClick={() => setTab('blocks')} className={tabClass('blocks')}>
          {t('tabs.blocks')}
        </button>
        <button type="button" onClick={() => setTab('outline')} className={tabClass('outline')}>
          {t('tabs.outline')}
        </button>
        <button type="button" onClick={() => setTab('extracted')} className={tabClass('extracted')}>
          {t('tabs.extracted')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'blocks' ? (
          <>
            {lastInsertError ? (
              <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                {lastInsertError}
              </p>
            ) : null}
            {BLOCK_GROUPS.map((group) => (
              <section key={group.id} className="mb-4">
                <h3 className="mb-2 text-xs font-semibold text-neutral-400">{t(`group.${group.id}`)}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <BlockButton
                      key={item.type}
                      item={item}
                      label={t(`block.${item.type}`)}
                      onAdd={() => addBlock(item.type)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : !page ? (
          <p className="text-xs text-neutral-400">{t('panel.noPage')}</p>
        ) : tab === 'outline' ? (
          <LayerTree
            root={page.root}
            selectedId={selectedId}
            dropPreview={dropPreview}
            onSelect={setSelectedId}
          />
        ) : (
          <ExtractedContent root={page.root} />
        )}
      </div>
    </aside>
  )
}
