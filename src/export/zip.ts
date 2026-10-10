import JSZip from 'jszip'
import type { Project } from '../editor/types.ts'
import { buildSite, siteZipName } from './site.ts'

export async function buildSiteZip(project: Project): Promise<Blob> {
  const zip = new JSZip()
  for (const file of buildSite(project)) {
    zip.file(file.path, file.content)
  }
  return zip.generateAsync({ type: 'blob' })
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export async function downloadSiteZip(project: Project): Promise<void> {
  const blob = await buildSiteZip(project)
  downloadBlob(siteZipName(project), blob)
}
