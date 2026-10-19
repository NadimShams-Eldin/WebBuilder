import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clampPanelWidth,
  DEFAULT_LAYOUT,
  LAYOUT_STORAGE_KEY,
  loadLayoutPrefs,
  PANEL_MAX_WIDTH,
  PANEL_MIN_WIDTH,
  parseLayoutPrefs,
  saveLayoutPrefs,
  serializeLayoutPrefs,
  type EditorLayout,
} from './layoutPrefs.ts'

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe('layout prefs', () => {
  it('falls back to defaults for empty or broken input', () => {
    assert.deepEqual(parseLayoutPrefs(null), DEFAULT_LAYOUT)
    assert.deepEqual(parseLayoutPrefs('{ not json'), DEFAULT_LAYOUT)
  })

  it('keeps valid fields and repairs invalid ones', () => {
    const parsed = parseLayoutPrefs(
      JSON.stringify({
        panels: { left: false, right: 'yes' },
        gridOverlay: true,
        leftTab: 'interactions',
        rightTab: 'nope',
      }),
    )
    assert.equal(parsed.panels.left, false)
    assert.equal(parsed.panels.right, DEFAULT_LAYOUT.panels.right)
    assert.equal(parsed.gridOverlay, true)
    assert.equal(parsed.leftTab, 'interactions')
    assert.equal(parsed.rightTab, DEFAULT_LAYOUT.rightTab)
  })

  it('clamps panel widths within bounds', () => {
    assert.equal(clampPanelWidth(1000), PANEL_MAX_WIDTH)
    assert.equal(clampPanelWidth(50), PANEL_MIN_WIDTH)
    assert.equal(clampPanelWidth('wide'), DEFAULT_LAYOUT.widths.left)
    const parsed = parseLayoutPrefs(JSON.stringify({ widths: { left: 999, right: 120 } }))
    assert.equal(parsed.widths.left, PANEL_MAX_WIDTH)
    assert.equal(parsed.widths.right, PANEL_MIN_WIDTH)
  })

  it('round-trips through a storage stub', () => {
    const storage = memoryStorage()
    const layout: EditorLayout = {
      panels: { left: false, right: true },
      widths: { left: 320, right: 240 },
      gridOverlay: true,
      leftTab: 'style',
      rightTab: 'outline',
      density: 'compact',
      panelFontScale: 0.9,
    }
    saveLayoutPrefs(layout, storage)
    assert.equal(storage.getItem(LAYOUT_STORAGE_KEY), serializeLayoutPrefs(layout))
    assert.deepEqual(loadLayoutPrefs(storage), layout)
  })

  it('returns defaults when storage is unavailable', () => {
    assert.deepEqual(loadLayoutPrefs(null), DEFAULT_LAYOUT)
  })
})
