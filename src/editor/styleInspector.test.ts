import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { StyleField } from '../components/propertyFields.ts'
import {
  filterStyleFields,
  gridColumnCount,
  isStyleUsed,
  styleBadges,
  styleFieldMatches,
} from './styleInspector.ts'
import type { Node } from './types.ts'

function makeNode(style: Node['style']): Node {
  return { id: 'n1', type: 'box', name: 'Box', props: {}, style, animation: null, children: [] }
}

const fields: StyleField[] = [
  { prop: 'padding', labelKey: 'style.padding', kind: 'text', unit: true },
  { prop: 'gap', labelKey: 'style.gap', kind: 'text' },
  { prop: 'display', labelKey: 'style.display', kind: 'select' },
]

const labelOf = (field: StyleField) =>
  ({ 'style.padding': 'Padding', 'style.gap': 'Gap', 'style.display': 'Display' })[field.labelKey] ??
  field.labelKey

describe('isStyleUsed', () => {
  it('treats empty and whitespace as unused', () => {
    assert.equal(isStyleUsed(makeNode({}), 'gap'), false)
    assert.equal(isStyleUsed(makeNode({ gap: '' }), 'gap'), false)
    assert.equal(isStyleUsed(makeNode({ gap: '   ' }), 'gap'), false)
  })

  it('treats numbers and strings as used', () => {
    assert.equal(isStyleUsed(makeNode({ gap: 0 }), 'gap'), true)
    assert.equal(isStyleUsed(makeNode({ gap: '8px' }), 'gap'), true)
  })
})

describe('styleFieldMatches', () => {
  it('matches on prop name or translated label, case-insensitively', () => {
    assert.equal(styleFieldMatches(fields[0], 'Padding', 'pad'), true)
    assert.equal(styleFieldMatches(fields[0], 'Padding', 'PADDING'), true)
    assert.equal(styleFieldMatches(fields[1], 'Gap', 'pad'), false)
    assert.equal(styleFieldMatches(fields[1], 'Gap', ''), true)
  })
})

describe('filterStyleFields', () => {
  it('keeps only used fields when usedOnly is on', () => {
    const node = makeNode({ gap: '8px' })
    const result = filterStyleFields(fields, node, { query: '', usedOnly: true, labelOf })
    assert.deepEqual(
      result.map((f) => f.prop),
      ['gap'],
    )
  })

  it('keeps all fields when usedOnly is off', () => {
    const node = makeNode({ gap: '8px' })
    const result = filterStyleFields(fields, node, { query: '', usedOnly: false, labelOf })
    assert.equal(result.length, 3)
  })

  it('ignores usedOnly while searching', () => {
    const node = makeNode({})
    const result = filterStyleFields(fields, node, { query: 'pad', usedOnly: true, labelOf })
    assert.deepEqual(
      result.map((f) => f.prop),
      ['padding'],
    )
  })
})

describe('gridColumnCount', () => {
  it('counts whitespace tokens', () => {
    assert.equal(gridColumnCount('1fr 1fr 1fr'), 3)
  })

  it('expands repeat() counts', () => {
    assert.equal(gridColumnCount('repeat(4, 1fr)'), 4)
  })

  it('returns null for empty values', () => {
    assert.equal(gridColumnCount(undefined), null)
    assert.equal(gridColumnCount(''), null)
  })
})

describe('styleBadges', () => {
  it('reports display, gap, and column count', () => {
    const node = makeNode({ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' })
    assert.deepEqual(styleBadges(node), [
      { id: 'display', value: 'grid' },
      { id: 'gap', value: '16px' },
      { id: 'columns', value: '2' },
    ])
  })

  it('omits badges without values', () => {
    assert.deepEqual(styleBadges(makeNode({})), [])
  })
})
