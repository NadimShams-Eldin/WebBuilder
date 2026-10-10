import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from '../editor/createNode.ts'
import { createProject } from '../editor/createProject.ts'
import { addPageToProject, internalHref } from '../editor/pages.ts'
import { buildSite, decodeDataUrl, needsSiteScript, siteZipName } from './site.ts'

const PNG_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('decodeDataUrl', () => {
  it('decodes base64 and URI data URLs', () => {
    const png = decodeDataUrl(PNG_DATA)
    assert.ok(png)
    assert.equal(png[0], 0x89)
    assert.equal(png[1], 0x50)

    const svg = decodeDataUrl('data:image/svg+xml,' + encodeURIComponent('<svg></svg>'))
    assert.ok(svg)
    assert.equal(new TextDecoder().decode(svg), '<svg></svg>')
    assert.equal(decodeDataUrl('https://ex.com/a.png'), null)
  })
})

describe('buildSite', () => {
  it('emits linked html, shared css, and resolved page links', () => {
    const start = createProject('موقع تجريبي')
    const added = addPageToProject(start, 'About')
    const home = added.project.pages[0]
    const about = added.project.pages[1]
    home.root.children = [
      {
        ...createNode('link', 'to-about'),
        props: { text: 'About', href: internalHref(about.id), target: '_self' },
      },
    ]
    about.root.children = [
      {
        ...createNode('link', 'to-home'),
        props: { text: 'Home', href: internalHref(home.id), target: '_self' },
      },
    ]
    const project = { ...added.project, pages: [home, about] }
    const files = buildSite(project)
    const paths = files.map((file) => file.path)
    assert.deepEqual(paths.sort(), ['about.html', 'index.html', 'styles.css'].sort())

    const index = files.find((file) => file.path === 'index.html')
    assert.ok(index)
    assert.equal(typeof index.content, 'string')
    const html = String(index.content)
    assert.ok(html.includes('href="styles.css"'))
    assert.ok(html.includes('href="about.html"'))
    assert.equal(html.includes('page:'), false)
    assert.equal(html.includes('<style>'), false)
    assert.equal(html.includes('script.js'), false)
    assert.equal(html.includes('qitma-canvas'), false)

    const css = files.find((file) => file.path === 'styles.css')
    assert.ok(css)
    assert.ok(String(css.content).includes('direction: rtl'))
    assert.equal(siteZipName(project), 'موقع-تجريبي-site.zip')
  })

  it('writes assets as files and rewrites media src', () => {
    const project = createProject()
    project.assets = [
      { id: 'logo', name: 'Logo.PNG', mimeType: 'image/png', src: PNG_DATA },
      { id: 'dup', name: 'Logo.PNG', mimeType: 'image/png', src: PNG_DATA },
    ]
    project.pages[0].root.children = [
      {
        ...createNode('image', 'hero'),
        props: { src: 'asset:logo', alt: 'شعار' },
      },
      {
        ...createNode('image', 'copy'),
        props: { src: 'asset:dup', alt: 'نسخة' },
      },
      {
        ...createNode('image', 'remote'),
        props: { src: 'https://ex.com/a.png', alt: 'خارجي' },
      },
    ]
    const files = buildSite(project)
    const paths = files.map((file) => file.path)
    assert.ok(paths.includes('assets/logo.png'))
    assert.ok(paths.includes('assets/logo-2.png'))
    const index = String(files.find((file) => file.path === 'index.html')?.content)
    assert.ok(index.includes('src="assets/logo.png"'))
    assert.ok(index.includes('src="assets/logo-2.png"'))
    assert.ok(index.includes('src="https://ex.com/a.png"'))
    assert.equal(index.includes('asset:'), false)
    assert.equal(index.includes('data:image/png'), false)
    const bytes = files.find((file) => file.path === 'assets/logo.png')?.content
    assert.ok(bytes instanceof Uint8Array)
    assert.equal(bytes[0], 0x89)
  })

  it('adds script.js only when a page uses scroll animation', () => {
    const project = createProject()
    const heading = createNode('heading', 'h')
    heading.animation = {
      trigger: 'scroll',
      effect: 'fade',
      delay: 0,
      duration: 0.6,
      easing: 'ease',
    }
    project.pages[0].root.children = [heading]
    assert.equal(needsSiteScript(project), true)
    const files = buildSite(project)
    assert.ok(files.some((file) => file.path === 'script.js'))
    const index = String(files.find((file) => file.path === 'index.html')?.content)
    assert.ok(index.includes('src="script.js"'))
    assert.ok(String(files.find((file) => file.path === 'script.js')?.content).includes('IntersectionObserver'))

    heading.animation = {
      trigger: 'load',
      effect: 'fade',
      delay: 0,
      duration: 0.6,
      easing: 'ease',
    }
    const noScroll = buildSite(project)
    assert.equal(noScroll.some((file) => file.path === 'script.js'), false)
  })
})
