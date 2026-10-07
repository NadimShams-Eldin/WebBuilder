import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collectAnimated,
  DEFAULT_ANIMATION,
  hasScrollAnimation,
  normalizeAnimation,
  renderAnimationCss,
} from './animation.ts'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import { renderHtml, renderPageHtml } from './render.ts'
import { updateNode } from './tree.ts'

describe('normalizeAnimation', () => {
  it('returns null for empty and clamps invalid values', () => {
    assert.equal(normalizeAnimation(null), null)
    const next = normalizeAnimation({
      trigger: 'scroll',
      effect: 'zoom',
      delay: -1,
      duration: 99,
      easing: 'bounce',
    })
    assert.ok(next)
    assert.equal(next.delay, 0)
    assert.equal(next.duration, 5)
    assert.equal(next.easing, DEFAULT_ANIMATION.easing)
  })
})

describe('renderAnimationCss', () => {
  it('emits keyframes, load animation, hover and scroll rules', () => {
    const load = createNode('heading', 'load')
    load.animation = { trigger: 'load', effect: 'fade', delay: 0.1, duration: 0.5, easing: 'ease-out' }
    const hover = createNode('button', 'hover')
    hover.animation = { trigger: 'hover', effect: 'zoom', delay: 0, duration: 0.3, easing: 'ease' }
    const scroll = createNode('text', 'scroll')
    scroll.animation = { trigger: 'scroll', effect: 'slide-up', delay: 0, duration: 0.6, easing: 'ease' }
    const root = createNode('container', 'root')
    root.children = [load, hover, scroll]
    const project = createProject()
    project.pages[0].root = root

    const css = renderAnimationCss(project)
    assert.ok(css.includes('@keyframes q-anim-fade'))
    assert.ok(css.includes('@keyframes q-anim-zoom'))
    assert.ok(css.includes('@keyframes q-anim-slide-up'))
    assert.ok(css.includes('.q-load { animation: q-anim-fade 0.5s ease-out 0.1s both; }'))
    assert.ok(css.includes('.q-hover:hover, .q-hover:focus-visible'))
    assert.ok(css.includes('.q-scroll.q-in'))
    assert.ok(css.includes('prefers-reduced-motion'))
    assert.equal(hasScrollAnimation(root), true)
    assert.equal(collectAnimated(root).length, 3)
  })
})

describe('render with animation', () => {
  it('adds data attributes and the scroll observer only when needed', () => {
    const heading = createNode('heading', 'h')
    heading.animation = { trigger: 'scroll', effect: 'fade', delay: 0, duration: 0.6, easing: 'ease' }
    const root = createNode('container', 'root')
    root.children = [heading]
    const project = createProject()
    project.pages[0].root = root

    const html = renderHtml(heading)
    assert.ok(html.includes('data-qanim="scroll"'))
    assert.ok(html.includes('data-qeffect="fade"'))

    const page = renderPageHtml(project, root, false)
    assert.ok(page.includes('IntersectionObserver'))
    assert.ok(page.includes('q-anim-fade'))
    assert.equal(page.includes('qitma-canvas'), false)

    const plain = createNode('text', 't')
    const emptyRoot = createNode('container', 'r')
    emptyRoot.children = [plain]
    project.pages[0].root = emptyRoot
    const exported = renderPageHtml(project, emptyRoot, false)
    assert.equal(exported.includes('IntersectionObserver'), false)
  })
})

describe('updateNode animation', () => {
  it('patches and clears animation on the matching node', () => {
    const heading = createNode('heading', 'h')
    const root = createNode('container', 'root')
    root.children = [heading]
    const next = updateNode(root, 'h', { animation: { ...DEFAULT_ANIMATION, effect: 'slide-up' } })
    assert.ok(next)
    assert.equal(next.children[0].animation?.effect, 'slide-up')
    const cleared = updateNode(next, 'h', { animation: null })
    assert.ok(cleared)
    assert.equal(cleared.children[0].animation, null)
  })
})
