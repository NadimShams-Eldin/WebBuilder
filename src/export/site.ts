import { ANIMATION_SCRIPT_BODY, hasScrollAnimation } from '../editor/animation.ts'
import { pageFileName } from '../editor/pages.ts'
import { renderCss, renderLinkedPageHtml } from '../editor/render.ts'
import type { Asset, Project } from '../editor/types.ts'

export type SiteFile = {
  path: string
  content: string | Uint8Array
}

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

function extFor(asset: Asset): string {
  const fromMime = MIME_EXT[asset.mimeType]
  if (fromMime) return fromMime
  const match = asset.name.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : 'bin'
}

function safeBaseName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  const slug = base
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'asset'
}

function uniqueAssetPath(used: Set<string>, asset: Asset): string {
  const ext = extFor(asset)
  const base = safeBaseName(asset.name)
  let fileName = `${base}.${ext}`
  let index = 2
  while (used.has(fileName)) {
    fileName = `${base}-${index}.${ext}`
    index += 1
  }
  used.add(fileName)
  return `assets/${fileName}`
}

export function decodeDataUrl(src: string): Uint8Array | null {
  if (!src.startsWith('data:')) return null
  const comma = src.indexOf(',')
  if (comma < 0) return null
  const header = src.slice(5, comma)
  const data = src.slice(comma + 1)
  try {
    if (header.includes(';base64')) {
      const binary = atob(data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
      return bytes
    }
    return new TextEncoder().encode(decodeURIComponent(data))
  } catch {
    return null
  }
}

export function collectSiteAssets(project: Project): {
  files: { id: string; path: string; content: Uint8Array }[]
  urlById: Map<string, string>
} {
  const used = new Set<string>()
  const files: { id: string; path: string; content: Uint8Array }[] = []
  const urlById = new Map<string, string>()
  for (const asset of project.assets) {
    const content = decodeDataUrl(asset.src)
    if (!content) continue
    const path = uniqueAssetPath(used, asset)
    files.push({ id: asset.id, path, content })
    urlById.set(asset.id, path)
  }
  return { files, urlById }
}

export function needsSiteScript(project: Project): boolean {
  return project.pages.some((page) => hasScrollAnimation(page.root))
}

export function buildSite(project: Project): SiteFile[] {
  const { files: assetFiles, urlById } = collectSiteAssets(project)
  const withScript = needsSiteScript(project)
  const files: SiteFile[] = [{ path: 'styles.css', content: `${renderCss(project)}\n` }]
  if (withScript) {
    files.push({ path: 'script.js', content: ANIMATION_SCRIPT_BODY })
  }
  const assetUrl = (id: string) => urlById.get(id) ?? ''
  for (const page of project.pages) {
    files.push({
      path: pageFileName(page),
      content: renderLinkedPageHtml(project, page, {
        stylesheetHref: 'styles.css',
        scriptHref: withScript ? 'script.js' : undefined,
        assetUrl,
      }),
    })
  }
  for (const asset of assetFiles) {
    files.push({ path: asset.path, content: asset.content })
  }
  return files
}

export function siteZipName(project: Project): string {
  const slug = project.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'qitma'}-site.zip`
}
