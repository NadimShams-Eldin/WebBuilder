import { useRef } from 'react'
import { projectFileName } from '../editor/projectJson.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

function downloadJson(name: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function ProjectIO() {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const exportProjectJson = useEditorStore((s) => s.exportProjectJson)
  const exportSiteZip = useEditorStore((s) => s.exportSiteZip)
  const importProjectJson = useEditorStore((s) => s.importProjectJson)
  const project = useEditorStore((s) => s.project)

  return (
    <div className="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        className="px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
        title={t('project.exportSite')}
        onClick={() => {
          void exportSiteZip()
        }}
      >
        {t('project.exportSite')}
      </button>
      <button
        type="button"
        className="border-s border-neutral-200 px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        title={t('project.export')}
        onClick={() => downloadJson(projectFileName(project), exportProjectJson())}
      >
        {t('project.export')}
      </button>
      <button
        type="button"
        className="border-s border-neutral-200 px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        title={t('project.import')}
        onClick={() => inputRef.current?.click()}
      >
        {t('project.import')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          file.text().then((raw) => importProjectJson(raw))
        }}
      />
    </div>
  )
}
