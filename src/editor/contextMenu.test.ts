import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildContextMenu,
  clampMenuPosition,
  firstEnabledIndex,
  nextMenuIndex,
} from './contextMenu.ts'

const base = { isRoot: false, hasChildren: true, hasStyleClipboard: false }

function itemActions(options: Parameters<typeof buildContextMenu>[0]) {
  return buildContextMenu(options)
    .filter((entry) => entry.kind === 'item')
    .map((entry) => (entry.kind === 'item' ? `${entry.action}:${entry.disabled ? 'off' : 'on'}` : ''))
}

describe('buildContextMenu', () => {
  it('offers node actions for a normal node', () => {
    const actions = itemActions(base)
    assert.ok(actions.includes('duplicate:on'))
    assert.ok(actions.includes('wrap-flex:on'))
    assert.ok(actions.includes('select-parent:on'))
    assert.equal(actions.includes('paste-style:on'), false)
    assert.ok(actions.includes('paste-style:off'))
  })

  it('disables mutation actions on the page root', () => {
    const actions = itemActions({ ...base, isRoot: true })
    assert.ok(actions.includes('duplicate:off'))
    assert.ok(actions.includes('delete:off'))
    assert.ok(actions.includes('wrap-grid:off'))
    assert.ok(actions.includes('select-parent:off'))
    assert.ok(actions.includes('open-properties:on'))
  })

  it('enables paste when a style is on the clipboard', () => {
    const actions = itemActions({ ...base, hasStyleClipboard: true })
    assert.ok(actions.includes('paste-style:on'))
  })

  it('disables child selection for leaves', () => {
    const actions = itemActions({ ...base, hasChildren: false })
    assert.ok(actions.includes('select-child:off'))
  })
})

describe('menu keyboard navigation', () => {
  const entries = buildContextMenu({ ...base, hasStyleClipboard: true })

  it('skips separators and disabled items', () => {
    const start = firstEnabledIndex(entries)
    assert.equal(start, 0)
    const next = nextMenuIndex(entries, start, 1)
    assert.equal(entries[next].kind === 'item' && entries[next].action, 'wrap-container')
  })

  it('wraps around at the end', () => {
    const last = entries.length - 1
    const next = nextMenuIndex(entries, last, 1)
    assert.equal(next, firstEnabledIndex(entries))
  })

  it('does not loop when asked', () => {
    const last = entries.length - 1
    assert.equal(nextMenuIndex(entries, last, 1, false), last)
  })

  it('returns -1 for an empty menu', () => {
    assert.equal(nextMenuIndex([], 0, 1), -1)
    assert.equal(firstEnabledIndex([]), -1)
  })
})

describe('clampMenuPosition', () => {
  it('keeps the menu inside the viewport', () => {
    assert.deepEqual(clampMenuPosition(500, 400, 200, 300, 800, 600), { x: 500, y: 292 })
  })

  it('pulls negative positions back to the margin', () => {
    assert.deepEqual(clampMenuPosition(-20, -30, 100, 100, 800, 600), { x: 8, y: 8 })
  })

  it('stays at the margin when the viewport is too small', () => {
    assert.deepEqual(clampMenuPosition(50, 50, 400, 400, 300, 300), { x: 8, y: 8 })
  })
})
