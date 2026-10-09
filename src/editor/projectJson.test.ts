import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addAssetToProject, assetHref, resolveMediaSrc } from './assets.ts'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import {
  loadPersistedSession,
  parsePersistedSession,
  PROJECT_STORAGE_KEY,
  savePersistedSession,
} from './persist.ts'
import { parseProjectJson, serializeProject } from './projectJson.ts'
import { renderHtml } from './render.ts'

describe('project json', () => {
  it('round-trips a valid project and rejects invalid input', () => {
    const project = createProject('قطمة')
    project.pages[0].root.children = [createNode('heading', 'h1')]
    const raw = serializeProject(project)
    const parsed = parseProjectJson(raw)
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.project.name, 'قطمة')
    assert.equal(parsed.project.pages[0].root.children[0].type, 'heading')

    assert.equal(parseProjectJson('{').ok, false)
    assert.equal(parseProjectJson('null').ok, false)
    assert.equal(parseProjectJson('{"pages":[]}').ok, false)
  })

  it('drops unknown styles and unknown node types', () => {
    const raw = JSON.stringify({
      id: 'prj',
      name: 'x',
      theme: { direction: 'rtl' },
      pages: [
        {
          id: 'p',
          name: 'Home',
          slug: 'index',
          root: {
            id: 'root',
            type: 'container',
            name: 'root',
            props: {},
            style: { display: 'block', evil: 'none' },
            animation: null,
            children: [{ id: 'bad', type: 'script', name: 'x', props: {}, style: {}, children: [] }],
          },
        },
      ],
      assets: [],
    })
    const parsed = parseProjectJson(raw)
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.project.pages[0].root.style.evil, undefined)
    assert.equal(parsed.project.pages[0].root.children.length, 0)
  })
})

describe('persist session', () => {
  it('saves and restores project plus active page', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    const project = createProject()
    const added = {
      ...project,
      pages: [
        ...project.pages,
        { ...project.pages[0], id: 'p2', name: 'About', slug: 'about' },
      ],
    }
    assert.equal(savePersistedSession({ project: added, activePageId: 'p2' }, storage), true)
    assert.ok(store.get(PROJECT_STORAGE_KEY))
    const loaded = loadPersistedSession(storage)
    assert.ok(loaded)
    assert.equal(loaded.activePageId, 'p2')
    assert.equal(loaded.project.pages.length, 2)
    assert.equal(parsePersistedSession('not-json'), null)
  })
})

describe('assets', () => {
  it('resolves asset hrefs when rendering html', () => {
    const project = addAssetToProject(createProject(), {
      id: 'a1',
      name: 'logo.png',
      mimeType: 'image/png',
      src: 'data:image/png;base64,xx',
    })
    const href = assetHref('a1')
    assert.equal(resolveMediaSrc(project, href), 'data:image/png;base64,xx')
    const image = {
      ...createNode('image', 'img'),
      props: { src: href, alt: 'logo' },
    }
    const html = renderHtml(image, project, true)
    assert.ok(html.includes('src="data:image/png;base64,xx"'))
    assert.equal(html.includes(href), false)
  })
})
