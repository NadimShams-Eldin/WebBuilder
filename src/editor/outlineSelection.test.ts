import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  flattenVisible,
  matchingIdsWithAncestors,
  rangeSelection,
} from './outlineSelection.ts'
import type { Node, NodeType } from './types.ts'

function node(id: string, type: NodeType, children: Node[] = []): Node {
  return { id, type, name: id, props: {}, style: {}, animation: null, children }
}

const tree = node('root', 'container', [
  node('a', 'heading', [node('a1', 'text'), node('a2', 'text')]),
  node('b', 'image'),
  node('c', 'grid', [node('c1', 'button')]),
])

describe('matchingIdsWithAncestors', () => {
  it('includes matches and their ancestors', () => {
    const ids = matchingIdsWithAncestors(tree, (n) => n.id === 'a1')
    assert.deepEqual([...ids].sort(), ['a', 'a1', 'root'])
  })

  it('returns an empty set when nothing matches', () => {
    assert.equal(matchingIdsWithAncestors(tree, () => false).size, 0)
  })
})

describe('flattenVisible', () => {
  it('walks the whole tree when everything is open', () => {
    const ids = flattenVisible(tree, () => true, null).map((n) => n.id)
    assert.deepEqual(ids, ['root', 'a', 'a1', 'a2', 'b', 'c', 'c1'])
  })

  it('skips collapsed subtrees', () => {
    const ids = flattenVisible(tree, (n) => n.id !== 'a', null).map((n) => n.id)
    assert.deepEqual(ids, ['root', 'a', 'b', 'c', 'c1'])
  })

  it('honors the visible filter during search', () => {
    const visible = matchingIdsWithAncestors(tree, (n) => n.id === 'c1')
    const ids = flattenVisible(tree, () => true, visible).map((n) => n.id)
    assert.deepEqual(ids, ['root', 'c', 'c1'])
  })
})

describe('rangeSelection', () => {
  const flat = flattenVisible(tree, () => true, null)

  it('selects an inclusive range in order', () => {
    assert.deepEqual(rangeSelection(flat, 'a', 'b'), ['a', 'a1', 'a2', 'b'])
  })

  it('handles a backwards range', () => {
    assert.deepEqual(rangeSelection(flat, 'c1', 'c'), ['c', 'c1'])
  })

  it('returns nothing when an endpoint is missing', () => {
    assert.deepEqual(rangeSelection(flat, 'a', 'missing'), [])
  })
})
