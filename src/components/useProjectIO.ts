import { useMemo } from 'react'
import { projectFileName } from '../editor/projectJson.ts'
import { useEditorStore } from '../editor/store.ts'

function downloadJson(name: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function useProjectIO() {
  const project = useEditorStore((s) => s.project)
  const exportProjectJson = useEditorStore((s) => s.exportProjectJson)
  const exportSiteZip = useEditorStore((s) => s.exportSiteZip)
  const publishSite = useEditorStore((s) => s.publishSite)
  const importProjectJson = useEditorStore((s) => s.importProjectJson)

  return useMemo(
    () => ({
      importProject: () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json,.json'
        input.addEventListener('change', () => {
          const file = input.files?.[0]
          if (!file) return
          void file.text().then((raw) => importProjectJson(raw))
        })
        input.click()
      },
      exportProject: () => downloadJson(projectFileName(project), exportProjectJson()),
      exportSite: async () => exportSiteZip(),
      publishSite: async () => publishSite(),
    }),
    [project, exportProjectJson, exportSiteZip, publishSite, importProjectJson],
  )
}
