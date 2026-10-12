import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collectEmptyContainerIds,
  floatingMenuPosition,
  gridOverlayLines,
  parsePxTracks,
  trackLineOffsets,
} from './canvasGuides.ts'
import { createNode } from './createNode.ts'

describe('collectEmptyContainerIds', () => {
  it('lists empty containers and skips filled ones', () => {
    const empty = createNode('flex', 'empty')
    const filled = createNode('grid', 'filled')
    filled.children = [createNode('text', 't')]
    const root = createNode('container', 'root')
    root.children = [empty, filled]
    assert.deepEqual(collectEmptyContainerIds(root), ['empty'])
  })

  it('includes an empty root', () => {
    const root = createNode('container', 'root')
    assert.deepEqual(collectEmptyContainerIds(root), ['root'])
  })
})

describe('grid overlay', () => {
  it('parses pixel tracks and places interior lines', () => {
    assert.deepEqual(parsePxTracks('256px 256px 128px'), [256, 256, 128])
    assert.deepEqual(trackLineOffsets('100px 50px 50px', 8, 10), [110, 168])
    const lines = gridOverlayLines(
      { top: 0, left: 0, width: 300, height: 200 },
      '100px 100px 100px',
      '80px 80px',
      0,
      0,
    )
    assert.deepEqual(lines.vertical, [100, 200])
    assert.deepEqual(lines.horizontal, [80])
  })
})

describe('floatingMenuPosition', () => {
  it('places the menu at the start edge and above when there is room', () => {
    const rtl = floatingMenuPosition({ top: 40, left: 20, width: 200, height: 80 }, 400, true)
    assert.equal(rtl.top, 8)
    assert.equal(rtl.left, 52)
    const ltr = floatingMenuPosition({ top: 0, left: 10, width: 80, height: 40 }, 400, false)
    assert.equal(ltr.top, 4)
    assert.equal(ltr.left, 10)
  })
})
