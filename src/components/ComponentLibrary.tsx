import { countInstances } from '../editor/components.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

export function ComponentLibrary() {
  const { t } = useI18n()
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedId)
  const createComponentFromSelected = useEditorStore((s) => s.createComponentFromSelected)
  const insertComponent = useEditorStore((s) => s.insertComponent)
  const renameComponentDef = useEditorStore((s) => s.renameComponentDef)
  const deleteComponentDef = useEditorStore((s) => s.deleteComponentDef)
  const setRightTab = useEditorStore((s) => s.setRightTab)
  const components = project.components

  const saveSelection = () => {
    if (!selectedId) return
    const name = window.prompt(t('comp.promptName')) ?? ''
    if (createComponentFromSelected(name)) setRightTab('components')
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={!selectedId}
        onClick={saveSelection}
        className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-blue-400"
      >
        {t('comp.save')}
      </button>

      {components.length === 0 ? (
        <p className="text-xs leading-6 text-neutral-400">{t('comp.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {components.map((component) => {
            const count = countInstances(project, component.id)
            return (
              <li
                key={component.id}
                className="rounded-md border border-neutral-200 p-2 dark:border-neutral-700"
              >
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    {component.name}
                  </p>
                  <span className="shrink-0 text-[10px] text-neutral-400">
                    {t('comp.instances').replace('{count}', String(count))}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="rounded bg-neutral-900 px-2 py-1 text-[11px] text-white dark:bg-neutral-100 dark:text-neutral-900"
                    onClick={() => insertComponent(component.id)}
                  >
                    {t('comp.insert')}
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => {
                      const next = window.prompt(t('comp.promptName'), component.name)
                      if (next) renameComponentDef(component.id, next)
                    }}
                  >
                    {t('comp.rename')}
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => deleteComponentDef(component.id)}
                  >
                    {t('comp.delete')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
