import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createDemoProject } from './demoProject.ts'
import { internalHref } from './pages.ts'
import { renderCss, renderExportedPages, renderHtml } from './render.ts'

describe('demo project', () => {
  it('renders a formatted page from the sample tree', () => {
    const project = createDemoProject()
    const root = project.pages[0].root
    const html = renderHtml(root)
    const css = renderCss(project)

    assert.equal(root.type, 'container')
    assert.ok(root.children.length >= 3)
    assert.ok(html.includes('أهلاً بك في قطمة'))
    assert.ok(html.includes('data-qtype="grid"'))
    assert.ok(html.includes('data-qtype="form"'))
    assert.ok(html.includes('type="email"'))
    assert.ok(css.includes('direction: rtl'))
    assert.ok(css.includes(`q-${root.id}`))
  })

  it('links two pages that export as separate html files', () => {
    const project = createDemoProject()
    assert.equal(project.pages.length, 2)
    const [home, about] = project.pages
    assert.ok(renderHtml(home.root).includes(internalHref(about.id)))
    const files = renderExportedPages(project)
    assert.deepEqual(
      files.map((file) => file.fileName),
      ['index.html', 'about.html'],
    )
    assert.ok(files[0].html.includes('href="about.html"'))
    assert.ok(files[1].html.includes('href="index.html"'))
  })
})
