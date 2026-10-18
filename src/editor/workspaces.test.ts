import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_LAYOUT } from './layoutPrefs.ts'
import {
  BUILTIN_WORKSPACES,
  CONTENT_WORKSPACE,
  CUSTOM_WORKSPACE_ID,
  DEFAULT_WORKSPACES_PREFS,
  DESIGN_WORKSPACE,
  FOCUS_WORKSPACE,
  findWorkspace,
  isBuiltinWorkspaceId,
  loadWorkspacesPrefs,
  parseWorkspacesPrefs,
  saveWorkspacesPrefs,
  serializeWorkspacesPrefs,
  workspaceIdForLayout,
  workspaceList,
  WORKSPACE_STORAGE_KEY,
} from './workspaces.ts'

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe('builtin workspaces', () => {
  it('exposes three distinct presets', () => {
    assert.equal(BUILTIN_WORKSPACES.length, 3)
    const ids = BUILTIN_WORKSPACES.map((item) => item.id)
    assert.deepEqual(ids, ['design', 'content', 'focus'])
    assert.ok(BUILTIN_WORKSPACES.every((item) => item.builtin))
  })

  it('each preset changes something meaningful', () => {
    assert.equal(DESIGN_WORKSPACE.layout.leftTab, 'style')
    assert.equal(CONTENT_WORKSPACE.layout.rightTab, 'outline')
    assert.deepEqual(FOCUS_WORKSPACE.layout.panels, { left: false, right: false })
    assert.equal(FOCUS_WORKSPACE.layout.density, 'compact')
  })

  it('returns copies so callers cannot mutate the presets', () => {
    const list = workspaceList(null)
    list[0].layout.widths.left = 999
    assert.notEqual(BUILTIN_WORKSPACES[0].layout.widths.left, 999)
  })
})

describe('custom workspace', () => {
  const custom = {
    ...DEFAULT_LAYOUT,
    panels: { left: true, right: false },
    widths: { left: 333, right: 222 },
  }

  it('appears only when saved', () => {
    assert.equal(workspaceList(null).length, 3)
    const list = workspaceList(custom)
    assert.equal(list.length, 4)
    assert.equal(list[3].id, CUSTOM_WORKSPACE_ID)
    assert.equal(list[3].builtin, false)
  })

  it('is found by id and recognized from a layout', () => {
    assert.equal(findWorkspace(CUSTOM_WORKSPACE_ID, custom)?.id, CUSTOM_WORKSPACE_ID)
    assert.equal(findWorkspace(CUSTOM_WORKSPACE_ID, null), null)
    assert.equal(workspaceIdForLayout(custom, custom), CUSTOM_WORKSPACE_ID)
    assert.equal(workspaceIdForLayout(DESIGN_WORKSPACE.layout, custom), 'design')
    assert.equal(workspaceIdForLayout(DEFAULT_LAYOUT, null), CUSTOM_WORKSPACE_ID)
  })
})

describe('workspace prefs persistence', () => {
  it('falls back to defaults for empty or broken input', () => {
    assert.deepEqual(parseWorkspacesPrefs(null), DEFAULT_WORKSPACES_PREFS)
    assert.deepEqual(parseWorkspacesPrefs('{oops'), DEFAULT_WORKSPACES_PREFS)
  })

  it('repairs unknown active ids and invalid customs', () => {
    assert.equal(parseWorkspacesPrefs(JSON.stringify({ activeId: 'nope' })).activeId, 'design')
    assert.equal(
      parseWorkspacesPrefs(JSON.stringify({ activeId: 'custom' })).activeId,
      'design',
    )
    const parsed = parseWorkspacesPrefs(
      JSON.stringify({ activeId: 'custom', custom: { widths: { left: 9999 } } }),
    )
    assert.equal(parsed.activeId, 'custom')
    assert.equal(parsed.custom?.widths.left, 480)
    assert.equal(parsed.custom?.density, 'comfortable')
  })

  it('round-trips through storage', () => {
    const storage = memoryStorage()
    const prefs = { activeId: CUSTOM_WORKSPACE_ID, custom: DESIGN_WORKSPACE.layout }
    saveWorkspacesPrefs(prefs, storage)
    assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), serializeWorkspacesPrefs(prefs))
    const loaded = loadWorkspacesPrefs(storage)
    assert.equal(loaded.activeId, CUSTOM_WORKSPACE_ID)
    assert.deepEqual(loaded.custom, DESIGN_WORKSPACE.layout)
    assert.deepEqual(loadWorkspacesPrefs(null), DEFAULT_WORKSPACES_PREFS)
  })

  it('knows builtin ids', () => {
    assert.equal(isBuiltinWorkspaceId('focus'), true)
    assert.equal(isBuiltinWorkspaceId('custom'), false)
  })
})
