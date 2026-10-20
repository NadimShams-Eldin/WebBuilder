import { createId, createNode } from './createNode.ts'
import { resolvePage } from './pages.ts'
import { insertChild, resolveInsertTarget } from './tree.ts'
import type { Asset, Node, Project } from './types.ts'

export const ASSET_PREFIX = 'asset:'
export const MAX_ASSET_BYTES = 1_500_000
export const ALLOWED_ASSET_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

export type AssetError = 'too-large' | 'unsupported-type' | 'read-failed'

export function isAssetHref(value: string | undefined): boolean {
  return Boolean(value?.startsWith(ASSET_PREFIX))
}

export function assetHref(id: string): string {
  return `${ASSET_PREFIX}${id}`
}

export function parseAssetHref(value: string | undefined): string | null {
  if (!isAssetHref(value) || !value) return null
  const id = value.slice(ASSET_PREFIX.length)
  return id || null
}

export function findAsset(project: Project, id: string | null | undefined): Asset | undefined {
  if (!id) return undefined
  return project.assets.find((asset) => asset.id === id)
}

export function resolveMediaSrc(project: Project | undefined, src: string | undefined): string {
  if (!src) return ''
  const assetId = parseAssetHref(src)
  if (!assetId || !project) return src
  return findAsset(project, assetId)?.src ?? ''
}

export function isAllowedAssetType(mimeType: string): boolean {
  return (ALLOWED_ASSET_TYPES as readonly string[]).includes(mimeType)
}

export function addAssetToProject(project: Project, asset: Omit<Asset, 'id'> & { id?: string }): Project {
  const next: Asset = {
    id: asset.id ?? createId('a'),
    name: asset.name,
    mimeType: asset.mimeType,
    src: asset.src,
  }
  return { ...project, assets: [...project.assets, next] }
}

const MEDIA_KEYS = ['src', 'poster'] as const

export type AssetUsage = {
  pageId: string
  nodeId: string
  field: (typeof MEDIA_KEYS)[number]
}

function mapTree(node: Node, mapper: (item: Node) => Node): Node {
  const next = mapper(node)
  const children = next.children.map((child) => mapTree(child, mapper))
  const sameChildren = children.every((child, index) => child === next.children[index])
  if (next === node && sameChildren) return node
  return { ...next, children }
}

function mapProjectTrees(project: Project, mapper: (node: Node) => Node): Project {
  return {
    ...project,
    pages: project.pages.map((page) => ({ ...page, root: mapTree(page.root, mapper) })),
    components: project.components.map((component) => ({
      ...component,
      root: mapTree(component.root, mapper),
    })),
  }
}

function clearAssetProps(node: Node, assetId: string): Node {
  let changed = false
  const props = { ...node.props }
  for (const key of MEDIA_KEYS) {
    if (parseAssetHref(props[key]) === assetId) {
      props[key] = ''
      changed = true
    }
  }
  return changed ? { ...node, props } : node
}

export function uniqueAssetName(project: Project, desired: string, excludeId?: string): string {
  const base = desired.trim() || 'أصل'
  const taken = new Set(
    project.assets.filter((item) => item.id !== excludeId).map((item) => item.name),
  )
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export function renameAssetInProject(
  project: Project,
  assetId: string,
  name: string,
): Project | null {
  if (!project.assets.some((asset) => asset.id === assetId)) return null
  const nextName = uniqueAssetName(project, name, assetId)
  return {
    ...project,
    assets: project.assets.map((asset) =>
      asset.id === assetId ? { ...asset, name: nextName } : asset,
    ),
  }
}

export function replaceAssetInProject(
  project: Project,
  assetId: string,
  patch: { name?: string; mimeType?: string; src?: string },
): Project | null {
  if (!project.assets.some((asset) => asset.id === assetId)) return null
  return {
    ...project,
    assets: project.assets.map((asset) => {
      if (asset.id !== assetId) return asset
      return {
        ...asset,
        name: patch.name !== undefined ? uniqueAssetName(project, patch.name, assetId) : asset.name,
        mimeType: patch.mimeType ?? asset.mimeType,
        src: patch.src ?? asset.src,
      }
    }),
  }
}

export function collectAssetUsages(project: Project, assetId: string): AssetUsage[] {
  const items: AssetUsage[] = []
  const walk = (pageId: string, node: Node) => {
    for (const field of MEDIA_KEYS) {
      if (parseAssetHref(node.props[field]) === assetId) {
        items.push({ pageId, nodeId: node.id, field })
      }
    }
    for (const child of node.children) walk(pageId, child)
  }
  for (const page of project.pages) walk(page.id, page.root)
  return items
}

export function countAssetUsages(project: Project, assetId: string): number {
  return collectAssetUsages(project, assetId).length
}

export function filterAssets(assets: Asset[], query: string): Asset[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return assets
  return assets.filter((asset) => {
    const haystack = `${asset.name} ${asset.mimeType}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

export function insertAssetImage(
  project: Project,
  assetId: string,
  selectedId: string | null,
  pageId?: string | null,
): { project: Project; node: Node } | null {
  const asset = findAsset(project, assetId)
  const page = resolvePage(project, pageId)
  if (!asset || !page) return null
  const target = resolveInsertTarget(page.root, selectedId)
  if (!target) return null
  const node = createNode('image')
  node.props = { ...node.props, src: assetHref(asset.id), alt: asset.name }
  const root = insertChild(page.root, target.parentId, node, target.index)
  if (!root) return null
  return {
    project: {
      ...project,
      pages: project.pages.map((item) => (item.id === page.id ? { ...item, root } : item)),
    },
    node,
  }
}

export function removeAssetFromProject(project: Project, assetId: string): Project {
  if (!project.assets.some((asset) => asset.id === assetId)) return project
  const unbound = mapProjectTrees(project, (node) => clearAssetProps(node, assetId))
  return {
    ...unbound,
    assets: unbound.assets.filter((asset) => asset.id !== assetId),
  }
}

export function readFileAsAsset(
  file: File,
): Promise<{ ok: true; asset: Omit<Asset, 'id'> } | { ok: false; error: AssetError }> {
  if (!isAllowedAssetType(file.type)) {
    return Promise.resolve({ ok: false, error: 'unsupported-type' })
  }
  if (file.size > MAX_ASSET_BYTES) {
    return Promise.resolve({ ok: false, error: 'too-large' })
  }
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : ''
      if (!src) {
        resolve({ ok: false, error: 'read-failed' })
        return
      }
      resolve({
        ok: true,
        asset: { name: file.name, mimeType: file.type || 'image/png', src },
      })
    }
    reader.onerror = () => resolve({ ok: false, error: 'read-failed' })
    reader.readAsDataURL(file)
  })
}
