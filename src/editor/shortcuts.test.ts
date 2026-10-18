import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveShortcut, SHORTCUT_GROUPS, type ShortcutInput } from './shortcuts.ts'

const base: ShortcutInput = {
  key: '',
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
}

const press = (partial: Partial<ShortcutInput>) => resolveShortcut({ ...base, ...partial })

describe('resolveShortcut', () => {
  it('maps undo and redo variants', () => {
    assert.equal(press({ key: 'z', ctrlKey: true }), 'undo')
    assert.equal(press({ key: 'z', metaKey: true }), 'undo')
    assert.equal(press({ key: 'z', ctrlKey: true, shiftKey: true }), 'redo')
    assert.equal(press({ key: 'y', ctrlKey: true }), 'redo')
  })

  it('maps duplicate and delete', () => {
    assert.equal(press({ key: 'd', ctrlKey: true }), 'duplicate')
    assert.equal(press({ key: 'D', metaKey: true }), 'duplicate')
    assert.equal(press({ key: 'Delete' }), 'delete')
    assert.equal(press({ key: 'Backspace' }), 'delete')
  })

  it('maps style clipboard shortcuts', () => {
    assert.equal(press({ key: 'c', ctrlKey: true, altKey: true }), 'copy-style')
    assert.equal(press({ key: 'v', ctrlKey: true, altKey: true }), 'paste-style')
  })

  it('maps zoom shortcuts', () => {
    assert.equal(press({ key: '=', ctrlKey: true }), 'zoom-in')
    assert.equal(press({ key: '+', ctrlKey: true }), 'zoom-in')
    assert.equal(press({ key: '-', ctrlKey: true }), 'zoom-out')
    assert.equal(press({ key: '0', ctrlKey: true }), 'zoom-reset')
  })

  it('maps escape to exiting preview', () => {
    assert.equal(press({ key: 'Escape' }), 'exit-preview')
  })

  it('maps the command palette, shortcuts, and preview toggles', () => {
    assert.equal(press({ key: 'k', ctrlKey: true }), 'command-palette')
    assert.equal(press({ key: 'K', metaKey: true }), 'command-palette')
    assert.equal(press({ key: '?' }), 'shortcuts')
    assert.equal(press({ key: 'Enter', ctrlKey: true }), 'toggle-preview')
  })

  it('ignores plain typing and unknown combos', () => {
    assert.equal(press({ key: 'd' }), null)
    assert.equal(press({ key: 'a', ctrlKey: true }), null)
    assert.equal(press({ key: 'c', ctrlKey: true, altKey: true, shiftKey: true }), 'copy-style')
  })
})

describe('SHORTCUT_GROUPS', () => {
  it('covers every resolved action exactly once', () => {
    const listed = SHORTCUT_GROUPS.flatMap((group) => group.items.map((item) => item.action))
    assert.equal(new Set(listed).size, listed.length)
    assert.ok(listed.includes('command-palette'))
    assert.ok(listed.includes('duplicate'))
    assert.ok(listed.includes('zoom-reset'))
  })
})
