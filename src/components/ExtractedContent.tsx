import { collectExtractedFields, propsFromExtractedValue } from '../editor/extractedContent.ts'
import { useEditorStore } from '../editor/store.ts'
import type { Node } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'

export function ExtractedContent({ root }: { root: Node }) {
  const { t } = useI18n()
  const selectedId = useEditorStore((s) => s.selectedId)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const updateNodeById = useEditorStore((s) => s.updateNodeById)
  const fields = collectExtractedFields(root)

  if (fields.length === 0) {
    return <p className="text-xs text-neutral-400">{t('extracted.empty')}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => {
        const selected = selectedId === field.nodeId
        const typeLabel = t(`block.${field.nodeType}`)
        const name = field.nodeName || typeLabel
        return (
          <label
            key={field.id}
            className={
              selected
                ? 'flex flex-col gap-1 rounded-md bg-blue-50 p-2 dark:bg-blue-950'
                : 'flex flex-col gap-1 rounded-md p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }
            onFocus={() => setSelectedId(field.nodeId)}
            onClick={() => setSelectedId(field.nodeId)}
          >
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {name}
              {name !== typeLabel ? ` · ${typeLabel}` : ''}
            </span>
            {field.kind === 'textarea' ? (
              <textarea
                rows={3}
                className={FIELD_CLASS}
                value={field.value}
                onChange={(event) =>
                  updateNodeById(field.nodeId, {
                    props: propsFromExtractedValue(field.key, event.target.value),
                  })
                }
              />
            ) : (
              <input
                type="text"
                className={FIELD_CLASS}
                value={field.value}
                onChange={(event) =>
                  updateNodeById(field.nodeId, {
                    props: propsFromExtractedValue(field.key, event.target.value),
                  })
                }
              />
            )}
          </label>
        )
      })}
    </div>
  )
}
