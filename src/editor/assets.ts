import { createId } from './createNode.ts'
import type { Asset, Project } from './types.ts'

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

export function removeAssetFromProject(project: Project, assetId: string): Project {
  return {
    ...project,
    assets: project.assets.filter((asset) => asset.id !== assetId),
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
