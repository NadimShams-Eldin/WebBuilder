import { parseProjectJson, sanitizeProject } from './projectJson.ts'
import type { Project } from './types.ts'

export const PUBLISHED_STORAGE_KEY = 'qitma-published'
export const SHARE_ID_PARAM = 'p'
export const SHARE_HASH_PREFIX = 'q='
export const MAX_SHARE_HASH_LENGTH = 100_000
export const MAX_PUBLISHED_SITES = 8

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type PublishedSite = {
  id: string
  projectId: string
  name: string
  createdAt: number
  updatedAt: number
  project: Project
}

export type ShareRequest =
  | { kind: 'catalog'; id: string }
  | { kind: 'payload'; payload: string }

export type PublishHrefs = {
  localHref: string
  shareHref: string
  portable: boolean
}

export type PublishResult =
  | { ok: true; site: PublishedSite; hrefs: PublishHrefs }
  | { ok: false; error: 'quota' | 'encode' }

function defaultStorage(): StorageLike | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}

export function createPublishId(now = Date.now()): string {
  return `s${now.toString(36)}`
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const bin = atob(padded + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function blobFromBytes(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer])
}

export async function compressToBase64Url(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const stream = blobFromBytes(bytes).stream().pipeThrough(new CompressionStream('gzip'))
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
  return bytesToBase64Url(compressed)
}

export async function decompressFromBase64Url(payload: string): Promise<string> {
  const bytes = base64UrlToBytes(payload)
  const stream = blobFromBytes(bytes).stream().pipeThrough(new DecompressionStream('gzip'))
  return new TextDecoder().decode(await new Response(stream).arrayBuffer())
}

export async function encodeSharePayload(project: Project): Promise<string> {
  return compressToBase64Url(JSON.stringify(project))
}

export async function decodeSharePayload(payload: string): Promise<Project | null> {
  try {
    const json = await decompressFromBase64Url(payload)
    const parsed = parseProjectJson(json)
    return parsed.ok ? parsed.project : null
  } catch {
    return null
  }
}

export function parseShareLocation(search: string, hash = ''): ShareRequest | null {
  const id = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(SHARE_ID_PARAM)
  if (id) return { kind: 'catalog', id }
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw.startsWith(SHARE_HASH_PREFIX)) {
    const payload = raw.slice(SHARE_HASH_PREFIX.length)
    if (payload) return { kind: 'payload', payload }
  }
  return null
}

export function isShareRequest(search: string, hash = ''): boolean {
  return parseShareLocation(search, hash) !== null
}

export function buildPublishHrefs(
  origin: string,
  pathname: string,
  id: string,
  payload: string | null,
  maxHash = MAX_SHARE_HASH_LENGTH,
): PublishHrefs {
  const base = `${origin}${pathname}`
  const localHref = `${base}?${SHARE_ID_PARAM}=${encodeURIComponent(id)}`
  const portable = Boolean(payload && payload.length <= maxHash)
  const shareHref = portable ? `${base}#${SHARE_HASH_PREFIX}${payload}` : localHref
  return { localHref, shareHref, portable }
}

export function parsePublishedCatalog(raw: string | null): PublishedSite[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as { sites?: unknown }
    if (!Array.isArray(parsed.sites)) return []
    const sites: PublishedSite[] = []
    for (const item of parsed.sites) {
      if (!item || typeof item !== 'object') continue
      const rec = item as Record<string, unknown>
      const parsedProject = sanitizeProject(rec.project)
      if (!parsedProject) continue
      if (typeof rec.id !== 'string' || !rec.id) continue
      sites.push({
        id: rec.id,
        projectId: typeof rec.projectId === 'string' ? rec.projectId : parsedProject.id,
        name: typeof rec.name === 'string' && rec.name ? rec.name : parsedProject.name,
        createdAt: typeof rec.createdAt === 'number' ? rec.createdAt : 0,
        updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : 0,
        project: parsedProject,
      })
    }
    return sites.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function loadPublishedSites(storage: StorageLike | null = defaultStorage()): PublishedSite[] {
  if (!storage) return []
  try {
    return parsePublishedCatalog(storage.getItem(PUBLISHED_STORAGE_KEY))
  } catch {
    return []
  }
}

export function findPublishedSite(
  id: string,
  storage: StorageLike | null = defaultStorage(),
): PublishedSite | null {
  return loadPublishedSites(storage).find((site) => site.id === id) ?? null
}

function writeCatalog(sites: PublishedSite[], storage: StorageLike): boolean {
  try {
    storage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify({ sites }))
    return true
  } catch {
    return false
  }
}

export function upsertPublishedSite(
  project: Project,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): PublishedSite | null {
  if (!storage) return null
  const sites = loadPublishedSites(storage)
  const existing = sites.find((site) => site.projectId === project.id)
  const site: PublishedSite = existing
    ? {
        ...existing,
        name: project.name,
        updatedAt: now,
        project,
      }
    : {
        id: createPublishId(now),
        projectId: project.id,
        name: project.name,
        createdAt: now,
        updatedAt: now,
        project,
      }
  const next = [site, ...sites.filter((item) => item.id !== site.id)].slice(0, MAX_PUBLISHED_SITES)
  if (writeCatalog(next, storage)) return site
  const trimmed = next.slice(0, Math.max(1, next.length - 1))
  if (writeCatalog(trimmed, storage)) return site
  return null
}

export function removePublishedSite(
  id: string,
  storage: StorageLike | null = defaultStorage(),
): boolean {
  if (!storage) return false
  const sites = loadPublishedSites(storage)
  const next = sites.filter((site) => site.id !== id)
  if (next.length === sites.length) return false
  return writeCatalog(next, storage)
}

export async function publishProject(
  project: Project,
  location: { origin: string; pathname: string },
  storage: StorageLike | null = defaultStorage(),
  maxHash = MAX_SHARE_HASH_LENGTH,
): Promise<PublishResult> {
  const site = upsertPublishedSite(project, storage)
  if (!site) return { ok: false, error: 'quota' }
  let payload: string | null = null
  try {
    payload = await encodeSharePayload(project)
  } catch {
    payload = null
  }
  return {
    ok: true,
    site,
    hrefs: buildPublishHrefs(location.origin, location.pathname, site.id, payload, maxHash),
  }
}
