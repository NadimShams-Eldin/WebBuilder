import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import {
  addNodeToPage,
  findNode,
  getAncestorIds,
  resolveInsertTarget,
  updateNode,
} from './tree.ts'

describe('tree insert', () => {
  it('adds a node into the root container', () => {
    const page = createProject().pages[0]
    const result = addNodeToPage(page, null, 'heading')
    assert.ok(result)
    assert.equal(result.page.root.children.length, 1)
    assert.equal(result.page.root.children[0].type, 'heading')
    assert.equal(result.node.type, 'heading')
  })

  it('adds into the selected container', () => {
    const flex = createNode('flex', 'flex1')
    const root = createNode('container', 'root')
    root.children = [flex]
    const page = { id: 'p', name: 'صفحة', slug: 'index', root }
    const result = addNodeToPage(page, 'flex1', 'text')
    assert.ok(result)
    const nextFlex = findNode(result.page.root, 'flex1')
    assert.ok(nextFlex)
    assert.equal(nextFlex.children.length, 1)
    assert.equal(nextFlex.children[0].type, 'text')
    assert.equal(result.page.root.children.length, 1)
  })

  it('inserts after a selected leaf instead of nesting into it', () => {
    const heading = createNode('heading', 'h')
    const root = createNode('container', 'root')
    root.children = [heading]
    const page = { id: 'p', name: 'صفحة', slug: 'index', root }
    const result = addNodeToPage(page, 'h', 'text')
    assert.ok(result)
    assert.equal(result.page.root.children.length, 2)
    assert.equal(result.page.root.children[0].type, 'heading')
    assert.equal(result.page.root.children[1].type, 'text')
  })

  it('rejects insert when the root is a leaf', () => {
    const root = createNode('heading', 'root')
    const target = resolveInsertTarget(root, null)
    assert.equal(target, null)
    const page = { id: 'p', name: 'صفحة', slug: 'index', root }
    const result = addNodeToPage(page, null, 'text')
    assert.equal(result, null)
  })
})

describe('updateNode', () => {
  it('patches props and style on the matching node', () => {
    const heading = createNode('heading', 'h')
    const root = createNode('container', 'root')
    root.children = [heading]
    const next = updateNode(root, 'h', {
      props: { text: 'جديد' },
      style: { color: '#ff0000' },
    })
    assert.ok(next)
    const updated = findNode(next, 'h')
    assert.ok(updated)
    assert.equal(updated.props.text, 'جديد')
    assert.equal(updated.style.color, '#ff0000')
    assert.equal(findNode(root, 'h')?.props.text, 'عنوان')
  })
})

describe('getAncestorIds', () => {
  it('returns the path of parent ids to a nested node', () => {
    const text = createNode('text', 't')
    const flex = createNode('flex', 'f')
    flex.children = [text]
    const root = createNode('container', 'r')
    root.children = [flex]
    assert.deepEqual(getAncestorIds(root, 't'), ['r', 'f'])
    assert.deepEqual(getAncestorIds(root, 'r'), [])
    assert.deepEqual(getAncestorIds(root, 'missing'), [])
  })
})
