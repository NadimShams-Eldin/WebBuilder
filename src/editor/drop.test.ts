import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { axisFromComputed, indicatorBox, placementFromPoint } from './drop.ts'

describe('placementFromPoint', () => {
  const rect = { top: 0, left: 0, width: 100, height: 100 }

  it('uses the top half as before on a leaf', () => {
    assert.equal(placementFromPoint(rect, 50, 10, false, 'vertical'), 'before')
    assert.equal(placementFromPoint(rect, 50, 90, false, 'vertical'), 'after')
  })

  it('uses the middle band as inside on a container', () => {
    assert.equal(placementFromPoint(rect, 50, 10, true, 'vertical'), 'before')
    assert.equal(placementFromPoint(rect, 50, 50, true, 'vertical'), 'inside')
    assert.equal(placementFromPoint(rect, 50, 90, true, 'vertical'), 'after')
  })

  it('maps RTL horizontal edges to before/after', () => {
    assert.equal(placementFromPoint(rect, 90, 50, false, 'horizontal', true), 'before')
    assert.equal(placementFromPoint(rect, 10, 50, false, 'horizontal', true), 'after')
    assert.equal(placementFromPoint(rect, 50, 50, true, 'horizontal', true), 'inside')
  })

  it('maps LTR horizontal edges to before/after', () => {
    assert.equal(placementFromPoint(rect, 10, 50, false, 'horizontal', false), 'before')
    assert.equal(placementFromPoint(rect, 90, 50, false, 'horizontal', false), 'after')
  })
})

describe('axisFromComputed', () => {
  it('treats row flex as horizontal and everything else as vertical', () => {
    assert.equal(axisFromComputed({ display: 'flex', flexDirection: 'row' }), 'horizontal')
    assert.equal(axisFromComputed({ display: 'flex', flexDirection: 'column' }), 'vertical')
    assert.equal(axisFromComputed({ display: 'grid', flexDirection: 'row' }), 'vertical')
  })
})

describe('indicatorBox', () => {
  const rect = { top: 10, left: 20, width: 100, height: 40 }

  it('draws a top or bottom line for vertical placement', () => {
    assert.equal(indicatorBox(rect, 'before', 'vertical').top, 10)
    assert.equal(indicatorBox(rect, 'after', 'vertical').top, 47)
  })

  it('draws a right-edge line for RTL before', () => {
    const box = indicatorBox(rect, 'before', 'horizontal', true)
    assert.equal(box.left, 117)
    assert.equal(box.kind, 'line')
  })
})
