import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import {
  addPageToProject,
  internalHref,
  pageFileName,
  parseInternalHref,
  removePageFromProject,
  renamePageInProject,
  resolveHref,
  setPageSlugInProject,
  slugify,
  uniqueSlug,
} from './pages.ts'
import { renderExportedPages, renderHtml, renderPageHtml } from './render.ts'

describe('page slugs', () => {
  it('slugifies and keeps unique names', () => {
    assert.equal(slugify('About Us'), 'about-us')
    assert.equal(slugify('  '), 'page')
    const pages = createProject().pages
    assert.equal(uniqueSlug(pages, 'index'), 'index-2')
    assert.equal(uniqueSlug(pages, 'about'), 'about')
  })
})

describe('multi-page project', () => {
  it('adds, renames, and refuses to delete the last page', () => {
    const start = createProject()
    const added = addPageToProject(start, 'About')
    assert.equal(added.project.pages.length, 2)
    assert.equal(added.page.slug, 'about')
    assert.equal(pageFileName(added.page), 'about.html')

    const renamed = renamePageInProject(added.project, added.page.id, 'من نحن')
    assert.ok(renamed)
    assert.equal(renamed.pages[1].name, 'من نحن')
    assert.equal(renamed.pages[1].slug, 'من-نحن')

    const slugged = setPageSlugInProject(renamed, added.page.id, 'about')
    assert.ok(slugged)
    assert.equal(slugged.pages[1].slug, 'about')

    const removed = removePageFromProject(slugged, added.page.id)
    assert.ok(removed)
    assert.equal(removed.project.pages.length, 1)
    assert.equal(removePageFromProject(start, start.pages[0].id), null)
  })

  it('resolves internal links to page files', () => {
    const start = createProject()
    const added = addPageToProject(start, 'About')
    const href = internalHref(added.page.id)
    assert.equal(parseInternalHref(href), added.page.id)
    assert.equal(resolveHref(added.project, href), 'about.html')
    assert.equal(resolveHref(added.project, 'https://ex.com'), 'https://ex.com')
    assert.equal(resolveHref(added.project, internalHref('missing')), '#')
  })

  it('renders exported pages with working internal links', () => {
    const start = createProject()
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

    const editor = renderHtml(home.root)
    assert.ok(editor.includes(`href="${internalHref(about.id)}"`))

    const exported = renderPageHtml(project, home.root, false, home)
    assert.ok(exported.includes('href="about.html"'))
    assert.equal(exported.includes(internalHref(about.id)), false)
    assert.ok(exported.includes(`<title>${home.name}</title>`))

    const files = renderExportedPages(project)
    assert.deepEqual(
      files.map((file) => file.fileName),
      ['index.html', 'about.html'],
    )
    assert.ok(files[1].html.includes('href="index.html"'))
  })
})
