import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import { addPageToProject } from './pages.ts'
import {
  addNodeToPage,
  addNodeToProject,
  canDrop,
  clearPageInProject,
  findNode,
  getAncestorIds,
  getPathNodes,
  insertAtDrop,
  moveNode,
  cloneNode,
  duplicateNode,
  duplicateNodeInProject,
  wrapNode,
  removeNode,
  removeNodeInProject,
  resolveInsertTarget,
  updateNode,
  updateNodeInProject,
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

describe('getPathNodes', () => {
  it('returns root-to-node nodes', () => {
    const text = createNode('text', 't')
    const flex = createNode('flex', 'f')
    flex.children = [text]
    const root = createNode('container', 'r')
    root.children = [flex]
    assert.deepEqual(
      getPathNodes(root, 't').map((node) => node.id),
      ['r', 'f', 't'],
    )
    assert.deepEqual(getPathNodes(root, 'r').map((node) => node.id), ['r'])
    assert.deepEqual(getPathNodes(root, 'missing'), [])
  })
})

describe('wrapNode', () => {
  it('wraps a nested node in a new container at the same position', () => {
    const first = createNode('heading', 'a')
    const second = createNode('text', 'b')
    const root = createNode('container', 'r')
    root.children = [first, second]
    const result = wrapNode(root, 'b', 'flex')
    assert.ok(result)
    assert.equal(result.root.children.length, 2)
    assert.equal(result.root.children[1].id, result.wrapper.id)
    assert.equal(result.wrapper.type, 'flex')
    assert.deepEqual(
      result.wrapper.children.map((child) => child.id),
      ['b'],
    )
  })

  it('rejects wrapping the root or a missing node', () => {
    const root = createNode('container', 'r')
    assert.equal(wrapNode(root, 'r', 'flex'), null)
    assert.equal(wrapNode(root, 'missing', 'flex'), null)
  })

  it('rejects non-container wrappers', () => {
    const text = createNode('text', 't')
    const root = createNode('container', 'r')
    root.children = [text]
    assert.equal(wrapNode(root, 't', 'heading'), null)
  })
})

describe('drop and move', () => {
  function sample() {
    const a = createNode('heading', 'a')
    const b = createNode('text', 'b')
    const inner = createNode('flex', 'inner')
    inner.children = [b]
    const root = createNode('container', 'root')
    root.children = [a, inner]
    return { root, a, b, inner }
  }

  it('inserts before, after, and inside a container', () => {
    const { root } = sample()
    const before = insertAtDrop(root, createNode('button', 'x'), { targetId: 'a', placement: 'before' })
    assert.ok(before)
    assert.deepEqual(before.children.map((n) => n.id), ['x', 'a', 'inner'])

    const after = insertAtDrop(root, createNode('button', 'y'), { targetId: 'a', placement: 'after' })
    assert.ok(after)
    assert.deepEqual(after.children.map((n) => n.id), ['a', 'y', 'inner'])

    const inside = insertAtDrop(root, createNode('button', 'z'), { targetId: 'inner', placement: 'inside' })
    assert.ok(inside)
    const nextInner = findNode(inside, 'inner')
    assert.ok(nextInner)
    assert.deepEqual(nextInner.children.map((n) => n.id), ['b', 'z'])
  })

  it('rejects inside a leaf and before/after the root', () => {
    const { root } = sample()
    assert.equal(canDrop(root, { targetId: 'a', placement: 'inside' }), false)
    assert.equal(insertAtDrop(root, createNode('text', 'n'), { targetId: 'a', placement: 'inside' }), null)
    assert.equal(canDrop(root, { targetId: 'root', placement: 'before' }), false)
    assert.equal(canDrop(root, { targetId: 'root', placement: 'inside' }), true)
  })

  it('reorders siblings and moves a node into a container', () => {
    const { root } = sample()
    const reordered = moveNode(root, 'inner', { targetId: 'a', placement: 'before' })
    assert.ok(reordered)
    assert.deepEqual(reordered.children.map((n) => n.id), ['inner', 'a'])

    const nested = moveNode(root, 'a', { targetId: 'inner', placement: 'inside' })
    assert.ok(nested)
    assert.equal(nested.children.length, 1)
    assert.equal(nested.children[0].id, 'inner')
    const nextInner = findNode(nested, 'inner')
    assert.ok(nextInner)
    assert.deepEqual(nextInner.children.map((n) => n.id), ['b', 'a'])
  })

  it('rejects dropping a node onto itself or into its descendant', () => {
    const { root } = sample()
    assert.equal(canDrop(root, { targetId: 'a', placement: 'after' }, 'a'), false)
    assert.equal(moveNode(root, 'inner', { targetId: 'b', placement: 'after' }), null)
    assert.equal(canDrop(root, { targetId: 'b', placement: 'inside' }, 'inner'), false)
  })
})

describe('clone and duplicate', () => {
  it('clones a subtree with new ids', () => {
    const text = createNode('text', 't')
    text.props = { text: 'نسخة', items: ['أ'] }
    const flex = createNode('flex', 'f')
    flex.children = [text]
    const copy = cloneNode(flex)
    assert.notEqual(copy.id, 'f')
    assert.equal(copy.type, 'flex')
    assert.equal(copy.children.length, 1)
    assert.notEqual(copy.children[0].id, 't')
    assert.equal(copy.children[0].props.text, 'نسخة')
    copy.props.items = ['ب']
    assert.deepEqual(text.props.items, ['أ'])
  })

  it('duplicates a node after its sibling and refuses the root', () => {
    const heading = createNode('heading', 'h')
    heading.props = { text: 'عنوان' }
    const root = createNode('container', 'root')
    root.children = [heading]
    const result = duplicateNode(root, 'h')
    assert.ok(result)
    assert.equal(result.root.children.length, 2)
    assert.equal(result.root.children[0].id, 'h')
    assert.equal(result.node.props.text, 'عنوان')
    assert.notEqual(result.node.id, 'h')
    assert.equal(duplicateNode(root, 'root'), null)
  })

  it('duplicates inside a project page', () => {
    const project = createProject()
    const added = addNodeToProject(project, null, 'heading')
    assert.ok(added)
    const dup = duplicateNodeInProject(added.project, added.node.id)
    assert.ok(dup)
    assert.equal(dup.project.pages[0].root.children.length, 2)
    assert.equal(dup.node.type, 'heading')
  })
})

describe('remove and clear', () => {
  it('removes a node and refuses to delete the root', () => {
    const heading = createNode('heading', 'h')
    const root = createNode('container', 'root')
    root.children = [heading]
    const next = removeNode(root, 'h')
    assert.ok(next)
    assert.equal(next.root.children.length, 0)
    assert.equal(removeNode(root, 'root'), null)
  })

  it('clears the active page children in a project', () => {
    const heading = createNode('heading', 'h')
    const root = createNode('container', 'root')
    root.children = [heading]
    const project = createProject()
    project.pages[0].root = root
    const removed = removeNodeInProject(project, 'h')
    assert.ok(removed)
    assert.equal(removed.project.pages[0].root.children.length, 0)
    assert.equal(removed.parentId, 'root')
    assert.equal(removeNodeInProject(project, 'root'), null)

    const filled = createProject()
    filled.pages[0].root.children = [createNode('text', 't')]
    const cleared = clearPageInProject(filled)
    assert.ok(cleared)
    assert.equal(cleared.pages[0].root.children.length, 0)
  })

  it('mutates only the targeted page in a multi-page project', () => {
    const start = createProject()
    const added = addPageToProject(start, 'About')
    const aboutId = added.page.id
    const inserted = addNodeToProject(added.project, null, 'heading', aboutId)
    assert.ok(inserted)
    assert.equal(inserted.project.pages[0].root.children.length, 0)
    assert.equal(inserted.project.pages[1].root.children.length, 1)
    const patched = updateNodeInProject(
      inserted.project,
      inserted.node.id,
      { props: { text: 'من نحن' } },
      aboutId,
    )
    assert.ok(patched)
    assert.equal(patched.pages[1].root.children[0].props.text, 'من نحن')
    const cleared = clearPageInProject(patched, aboutId)
    assert.ok(cleared)
    assert.equal(cleared.pages[1].root.children.length, 0)
  })
})
