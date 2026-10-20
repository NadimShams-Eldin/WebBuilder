import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createProject } from './createProject.ts'
import {
  base64UrlToBytes,
  buildPublishHrefs,
  bytesToBase64Url,
  compressToBase64Url,
  decodeSharePayload,
  decompressFromBase64Url,
  encodeSharePayload,
  findPublishedSite,
  isShareRequest,
  loadPublishedSites,
  parseShareLocation,
  publishProject,
  removePublishedSite,
  SHARE_HASH_PREFIX,
  SHARE_ID_PARAM,
  upsertPublishedSite,
} from './share.ts'

function memoryStorage(initial: Record<string, string> = {}): {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
} {
  const data = { ...initial }
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

describe('share encoding', () => {
  it('round-trips gzip base64url payloads', async () => {
    const original = 'مرحبا Qitma {"ok":true}'
    const encoded = await compressToBase64Url(original)
    assert.equal(encoded.includes('+'), false)
    assert.equal(encoded.includes('/'), false)
    assert.equal(encoded.includes('='), false)
    assert.equal(await decompressFromBase64Url(encoded), original)
  })

  it('encodes and decodes a project payload', async () => {
    const project = createProject('موقع منشور')
    const payload = await encodeSharePayload(project)
    const decoded = await decodeSharePayload(payload)
    assert.ok(decoded)
    assert.equal(decoded.name, 'موقع منشور')
    assert.equal(decoded.pages.length, 1)
  })

  it('converts bytes through base64url', () => {
    const bytes = new Uint8Array([1, 2, 250, 255])
    assert.deepEqual(base64UrlToBytes(bytesToBase64Url(bytes)), bytes)
  })
})

describe('share location', () => {
  it('reads a catalog id from the query string', () => {
    assert.deepEqual(parseShareLocation(`?${SHARE_ID_PARAM}=sabc&x=1`, ''), {
      kind: 'catalog',
      id: 'sabc',
    })
    assert.equal(isShareRequest('?p=sabc'), true)
  })

  it('reads a portable payload from the hash', () => {
    assert.deepEqual(parseShareLocation('', `#${SHARE_HASH_PREFIX}aaa`), {
      kind: 'payload',
      payload: 'aaa',
    })
    assert.equal(isShareRequest('', '#q=aaa'), true)
    assert.equal(isShareRequest('?demo=1', ''), false)
  })

  it('prefers the catalog id over the hash', () => {
    assert.deepEqual(parseShareLocation('?p=local', '#q=remote'), {
      kind: 'catalog',
      id: 'local',
    })
  })

  it('builds local and portable hrefs', () => {
    const portable = buildPublishHrefs('https://app.example', '/', 's1', 'abc', 100)
    assert.equal(portable.localHref, 'https://app.example/?p=s1')
    assert.equal(portable.shareHref, 'https://app.example/#q=abc')
    assert.equal(portable.portable, true)

    const local = buildPublishHrefs('https://app.example', '/editor/', 's1', 'too-long', 3)
    assert.equal(local.shareHref, 'https://app.example/editor/?p=s1')
    assert.equal(local.portable, false)
  })
})

describe('published catalog', () => {
  it('upserts by project id and lists newest first', () => {
    const storage = memoryStorage()
    const project = createProject('الأول')
    const first = upsertPublishedSite(project, storage, 10)
    assert.ok(first)
    const updated = upsertPublishedSite({ ...project, name: 'محدّث' }, storage, 20)
    assert.ok(updated)
    assert.equal(updated.id, first.id)
    assert.equal(updated.name, 'محدّث')
    const other = upsertPublishedSite(createProject('ثانٍ'), storage, 30)
    assert.ok(other)
    const list = loadPublishedSites(storage)
    assert.equal(list[0]?.name, 'ثانٍ')
    assert.equal(list.length, 2)
    assert.equal(findPublishedSite(first.id, storage)?.name, 'محدّث')
    assert.equal(removePublishedSite(first.id, storage), true)
    assert.equal(loadPublishedSites(storage).length, 1)
  })

  it('publishes a portable link for a small project', async () => {
    const storage = memoryStorage()
    const project = createProject('مشاركة')
    const result = await publishProject(
      project,
      { origin: 'http://localhost:5173', pathname: '/' },
      storage,
    )
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.hrefs.portable, true)
    assert.ok(result.hrefs.shareHref.includes('#q='))
    assert.ok(result.hrefs.localHref.includes('?p='))
    assert.equal(loadPublishedSites(storage).length, 1)
  })

  it('falls back to a local link when the payload exceeds the hash limit', async () => {
    const storage = memoryStorage()
    const project = createProject('كبير')
    const result = await publishProject(
      project,
      { origin: 'http://localhost:5173', pathname: '/' },
      storage,
      1,
    )
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.hrefs.portable, false)
    assert.equal(result.hrefs.shareHref, result.hrefs.localHref)
  })
})
