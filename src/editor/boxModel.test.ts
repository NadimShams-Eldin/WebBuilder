import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  boxModelFromRect,
  expandRect,
  formatBoxSize,
  hasBoxSides,
  insetRect,
  readBoxSides,
  ringStrips,
} from './boxModel.ts'

const borderBox = { top: 40, left: 20, width: 200, height: 100 }

describe('box model', () => {
  it('reads computed side lengths', () => {
    const sides = readBoxSides({
      marginTop: '8px',
      marginRight: '1rem',
      marginBottom: '0',
      marginLeft: '4px',
      paddingTop: '12px',
      paddingRight: '12px',
      paddingBottom: '12px',
      paddingLeft: '12px',
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
    })
    assert.equal(sides.margin.top, 8)
    assert.equal(sides.margin.right, 16)
    assert.equal(sides.padding.left, 12)
    assert.equal(sides.border.top, 1)
    assert.equal(hasBoxSides(sides.margin), true)
    assert.equal(hasBoxSides({ top: 0, right: 0, bottom: 0, left: 0 }), false)
  })

  it('builds margin and content boxes from the border box', () => {
    const model = boxModelFromRect(borderBox, {
      margin: { top: 10, right: 5, bottom: 10, left: 5 },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      border: { top: 2, right: 2, bottom: 2, left: 2 },
    })
    assert.deepEqual(model.marginBox, { top: 30, left: 15, width: 210, height: 120 })
    assert.deepEqual(model.contentBox, { top: 50, left: 30, width: 180, height: 80 })
  })

  it('insets and expands rectangles by sides', () => {
    assert.deepEqual(insetRect(borderBox, { top: 10, right: 20, bottom: 10, left: 20 }), {
      top: 50,
      left: 40,
      width: 160,
      height: 80,
    })
    assert.deepEqual(expandRect(borderBox, { top: 4, right: 6, bottom: 4, left: 6 }), {
      top: 36,
      left: 14,
      width: 212,
      height: 108,
    })
  })

  it('builds visible margin and padding strips', () => {
    const model = boxModelFromRect(borderBox, {
      margin: { top: 10, right: 0, bottom: 10, left: 0 },
      padding: { top: 0, right: 8, bottom: 0, left: 8 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    const margin = ringStrips(model.marginBox, model.borderBox, model.margin)
    assert.equal(margin.length, 2)
    assert.equal(margin[0].side, 'top')
    assert.equal(margin[0].height, 10)
    assert.equal(margin[1].side, 'bottom')
    const padding = ringStrips(model.borderBox, model.contentBox, model.padding)
    assert.equal(padding.length, 2)
    assert.equal(padding[0].side, 'left')
    assert.equal(padding[0].width, 8)
  })

  it('formats sizes with optional tenths', () => {
    assert.equal(formatBoxSize(720, 500), '720 × 500')
    assert.equal(formatBoxSize(720.44, 500.4), '720.4 × 500.4')
  })
})
