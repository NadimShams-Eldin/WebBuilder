import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addTrackTemplate,
  asHtmlElement,
  collectEmptyContainerIds,
  distanceBetween,
  floatingMenuPosition,
  gridOverlayLines,
  measureSegments,
  parseCssLength,
  parsePxTracks,
  parseTrackSizes,
  removeTrackTemplate,
  resizeTrackPair,
  snapValue,
  splitTracks,
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

describe('grid track editing', () => {
  it('splits tracks while respecting nested functions', () => {
    assert.deepEqual(splitTracks('minmax(0, 1fr) 120px auto'), ['minmax(0, 1fr)', '120px', 'auto'])
    assert.deepEqual(splitTracks(''), [])
  })

  it('reads resolved sizes and skips line names', () => {
    assert.deepEqual(parseTrackSizes('[a] 120px [b] minmax(0, 80px) auto'), [120, 80, 0])
    assert.deepEqual(parseTrackSizes(''), [])
  })

  it('adds and removes repeat() tracks', () => {
    assert.equal(addTrackTemplate('repeat(2, minmax(0, 1fr))'), 'repeat(3, minmax(0, 1fr))')
    assert.equal(addTrackTemplate('120px 80px'), '120px 80px 80px')
    assert.equal(addTrackTemplate('', 'auto'), 'auto')
    assert.equal(removeTrackTemplate('repeat(3, minmax(0, 1fr))'), 'repeat(2, minmax(0, 1fr))')
    assert.equal(removeTrackTemplate('120px 80px'), '120px')
    assert.equal(removeTrackTemplate('120px'), null)
    assert.equal(removeTrackTemplate('none'), null)
  })

  it('resizes adjacent tracks with a minimum size', () => {
    assert.deepEqual(resizeTrackPair([200, 100, 50], 0, 40), [240, 60, 50])
    assert.deepEqual(resizeTrackPair([200, 100], 0, 500), [276, 24])
    assert.deepEqual(resizeTrackPair([200, 100], 0, -500), [24, 276])
    assert.equal(resizeTrackPair([200, 100], 1, 20), null)
    assert.equal(resizeTrackPair([10, 10], 0, 5), null)
  })

  it('places rtl interior lines from the start edge', () => {
    const lines = gridOverlayLines(
      { top: 0, left: 0, width: 300, height: 100 },
      '100px 100px 100px',
      '100px',
      0,
      0,
      true,
    )
    assert.deepEqual(lines.vertical, [200, 100])
  })
})

describe('css lengths and snapping', () => {
  it('parses px and rem values', () => {
    assert.equal(parseCssLength('16px'), 16)
    assert.equal(parseCssLength('1rem'), 16)
    assert.equal(parseCssLength('2rem', 10), 20)
    assert.equal(parseCssLength('12pt'), 16)
    assert.equal(parseCssLength('auto'), 0)
  })

  it('snaps to a step', () => {
    assert.equal(snapValue(13, 4), 12)
    assert.equal(snapValue(14, 4), 16)
    assert.equal(snapValue(13, 0), 13)
  })
})

describe('distanceBetween', () => {
  it('measures gaps on both axes', () => {
    const a = { top: 0, left: 0, width: 100, height: 50 }
    const b = { top: 80, left: 140, width: 60, height: 40 }
    assert.deepEqual(distanceBetween(a, b), { horizontal: 40, vertical: 30 })
  })

  it('returns zero when boxes overlap', () => {
    const a = { top: 0, left: 0, width: 100, height: 100 }
    const b = { top: 20, left: 20, width: 100, height: 100 }
    assert.deepEqual(distanceBetween(a, b), { horizontal: 0, vertical: 0 })
  })
})

describe('measureSegments', () => {
  it('builds horizontal and vertical segments between boxes', () => {
    const a = { top: 0, left: 0, width: 100, height: 50 }
    const b = { top: 80, left: 140, width: 60, height: 40 }
    const segments = measureSegments(a, b)
    assert.deepEqual(segments, [
      { axis: 'horizontal', start: 100, end: 140, at: 62.5, length: 40 },
      { axis: 'vertical', start: 50, end: 80, at: 110, length: 30 },
    ])
  })

  it('returns nothing for overlapping boxes', () => {
    const a = { top: 0, left: 0, width: 100, height: 100 }
    const b = { top: 20, left: 20, width: 10, height: 10 }
    assert.deepEqual(measureSegments(a, b), [])
  })
})

describe('asHtmlElement', () => {
  it('accepts element-like nodes without relying on instanceof', () => {
    const fake = {
      nodeType: 1,
      getBoundingClientRect() {
        return { top: 0, left: 0, width: 10, height: 10 }
      },
    }
    assert.equal(asHtmlElement(fake), fake)
    assert.equal(asHtmlElement(null), null)
    assert.equal(asHtmlElement({ nodeType: 3, getBoundingClientRect() {} }), null)
  })
})

describe('floatingMenuPosition', () => {
  it('places the menu at the start edge and above when there is room', () => {
    const rtl = floatingMenuPosition({ top: 40, left: 20, width: 200, height: 80 }, 400, true)
    assert.equal(rtl.top, 8)
    assert.equal(rtl.left, 0)
    const ltr = floatingMenuPosition({ top: 0, left: 10, width: 80, height: 40 }, 400, false)
    assert.equal(ltr.top, 4)
    assert.equal(ltr.left, 10)
  })
})
