import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import { renderHtml, renderPageHtml } from './render.ts'
import { buildSite, needsSiteScript } from '../export/site.ts'
import {
  collectInteractions,
  collectNamedNodes,
  createInteraction,
  hasInteractions,
  interactionAttr,
  normalizeInteractions,
  pruneInteractions,
} from './interactions.ts'
import { cloneNode, updateNode } from './tree.ts'

describe('normalizeInteractions', () => {
  it('drops invalid rows and fills missing ids', () => {
    const next = normalizeInteractions([
      { event: 'click', action: 'play', targetId: 'n_1' },
      { event: 'nope', action: 'play', targetId: 'n_1' },
      { event: 'hover', action: 'pause', targetId: '  ' },
      { id: 'ix_a', event: 'leave', action: 'restart', targetId: 'n_2' },
    ])
    assert.equal(next.length, 2)
    assert.equal(next[0].event, 'click')
    assert.equal(next[0].action, 'play')
    assert.equal(next[0].targetId, 'n_1')
    assert.ok(next[0].id)
    assert.equal(next[1].id, 'ix_a')
    assert.equal(next[1].event, 'leave')
  })
})

describe('collect and prune', () => {
  it('collects nested interactions and prunes dangling targets', () => {
    const heading = createNode('heading', 'h')
    heading.animation = {
      trigger: 'load',
      effect: 'fade',
      delay: 0,
      duration: 0.5,
      easing: 'ease',
    }
    const button = createNode('button', 'b')
    button.interactions = [
      { id: 'ix_1', event: 'click', action: 'play', targetId: 'h' },
      { id: 'ix_2', event: 'click', action: 'play', targetId: 'missing' },
    ]
    const root = createNode('container', 'root')
    root.children = [heading, button]
    assert.equal(collectInteractions(root).length, 2)
    assert.equal(hasInteractions(root), true)
    const names = collectNamedNodes(root)
    assert.equal(names.length, 3)
    const pruned = pruneInteractions(root)
    assert.equal(pruned.children[1].interactions.length, 1)
    assert.equal(pruned.children[1].interactions[0].targetId, 'h')
  })
})

describe('clone interactions', () => {
  it('gives cloned nodes fresh interaction ids and remaps in-tree targets', () => {
    const heading = createNode('heading', 'h')
    const button = createNode('button', 'b')
    button.interactions = [{ id: 'ix_1', event: 'click', action: 'restart', targetId: 'h' }]
    const root = createNode('flex', 'wrap')
    root.children = [heading, button]
    const copy = cloneNode(root)
    assert.notEqual(copy.id, root.id)
    assert.equal(copy.children[1].interactions.length, 1)
    assert.notEqual(copy.children[1].interactions[0].id, 'ix_1')
    assert.equal(copy.children[1].interactions[0].targetId, copy.children[0].id)
  })
})

describe('updateNode interactions', () => {
  it('patches the list on the matching node', () => {
    const button = createNode('button', 'b')
    const root = createNode('container', 'root')
    root.children = [button]
    const next = updateNode(root, 'b', {
      interactions: [createInteraction('h')],
    })
    assert.ok(next)
    assert.equal(next.children[0].interactions.length, 1)
    assert.equal(next.children[0].interactions[0].targetId, 'h')
  })
})

describe('render interactions', () => {
  it('emits data-qix and a runtime script in preview and export', () => {
    const heading = createNode('heading', 'h')
    heading.animation = {
      trigger: 'load',
      effect: 'fade',
      delay: 0,
      duration: 0.5,
      easing: 'ease',
    }
    const button = createNode('button', 'b')
    button.interactions = [{ id: 'ix_1', event: 'click', action: 'play', targetId: 'h' }]
    const root = createNode('container', 'root')
    root.children = [heading, button]
    const html = renderHtml(button)
    assert.ok(html.includes('data-qix='))
    assert.ok(html.includes('&quot;e&quot;:&quot;click&quot;'))
    assert.equal(interactionAttr(button).includes('h'), true)

    const project = createProject()
    project.pages[0].root = root
    const page = renderPageHtml(project, root, 'export')
    assert.ok(page.includes('data-qix='))
    assert.ok(page.includes('animationPlayState'))
    assert.equal(needsSiteScript(project), true)
    const files = buildSite(project)
    assert.ok(files.some((file) => file.path === 'script.js'))
    const script = String(files.find((file) => file.path === 'script.js')?.content)
    assert.ok(script.includes('data-qix'))
    assert.ok(script.includes('IntersectionObserver'))
  })
})
