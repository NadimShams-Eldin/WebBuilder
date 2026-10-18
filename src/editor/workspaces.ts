import {
  cloneLayout,
  coerceLayout,
  clampPanelWidth,
  DEFAULT_LAYOUT,
  type EditorLayout,
} from './layoutPrefs.ts'

export const WORKSPACE_STORAGE_KEY = 'qitma-workspaces'
export const CUSTOM_WORKSPACE_ID = 'custom'

export type WorkspacePreset = {
  id: string
  nameKey: string
  builtin: boolean
  layout: EditorLayout
}

function preset(id: string, nameKey: string, layout: EditorLayout): WorkspacePreset {
  return { id, nameKey, builtin: true, layout: cloneLayout(layout) }
}

export const DESIGN_WORKSPACE = preset('design', 'workspace.design', {
  ...DEFAULT_LAYOUT,
  panels: { left: true, right: true },
  widths: { left: 304, right: 288 },
  leftTab: 'style',
  rightTab: 'blocks',
  density: 'comfortable',
  panelFontScale: 1,
})

export const CONTENT_WORKSPACE = preset('content', 'workspace.content', {
  ...DEFAULT_LAYOUT,
  panels: { left: true, right: true },
  widths: { left: 272, right: 304 },
  leftTab: 'content',
  rightTab: 'outline',
  density: 'comfortable',
  panelFontScale: 1,
})

export const FOCUS_WORKSPACE = preset('focus', 'workspace.focus', {
  ...DEFAULT_LAYOUT,
  panels: { left: false, right: false },
  gridOverlay: false,
  leftTab: 'style',
  rightTab: 'outline',
  density: 'compact',
  panelFontScale: 0.9,
})

export const BUILTIN_WORKSPACES: WorkspacePreset[] = [
  DESIGN_WORKSPACE,
  CONTENT_WORKSPACE,
  FOCUS_WORKSPACE,
]

export type WorkspacesPrefs = {
  activeId: string
  custom: EditorLayout | null
}

export const DEFAULT_WORKSPACES_PREFS: WorkspacesPrefs = {
  activeId: DESIGN_WORKSPACE.id,
  custom: null,
}

export function isBuiltinWorkspaceId(id: string): boolean {
  return BUILTIN_WORKSPACES.some((item) => item.id === id)
}

export function workspaceList(custom: EditorLayout | null): WorkspacePreset[] {
  if (!custom) return BUILTIN_WORKSPACES.map((item) => ({ ...item, layout: cloneLayout(item.layout) }))
  return [
    ...BUILTIN_WORKSPACES.map((item) => ({ ...item, layout: cloneLayout(item.layout) })),
    {
      id: CUSTOM_WORKSPACE_ID,
      nameKey: 'workspace.custom',
      builtin: false,
      layout: cloneLayout(custom),
    },
  ]
}

export function findWorkspace(
  id: string,
  custom: EditorLayout | null,
): WorkspacePreset | null {
  return workspaceList(custom).find((item) => item.id === id) ?? null
}

export function matchingWorkspaceId(
  layout: EditorLayout,
  custom: EditorLayout | null,
): string | null {
  const match = workspaceList(custom).find(
    (item) => JSON.stringify(item.layout) === JSON.stringify(layout),
  )
  return match?.id ?? null
}

export function workspaceIdForLayout(layout: EditorLayout, custom: EditorLayout | null): string {
  return matchingWorkspaceId(layout, custom) ?? CUSTOM_WORKSPACE_ID
}

export function parseWorkspacesPrefs(raw: string | null): WorkspacesPrefs {
  if (!raw) return { ...DEFAULT_WORKSPACES_PREFS }
  try {
    const parsed = JSON.parse(raw) as { activeId?: unknown; custom?: unknown }
    const custom = parsed.custom ? coerceLayout(parsed.custom) : null
    const activeId =
      typeof parsed.activeId === 'string' &&
      (isBuiltinWorkspaceId(parsed.activeId) ||
        (parsed.activeId === CUSTOM_WORKSPACE_ID && custom !== null))
        ? parsed.activeId
        : DEFAULT_WORKSPACES_PREFS.activeId
    return { activeId, custom }
  } catch {
    return { ...DEFAULT_WORKSPACES_PREFS }
  }
}

export function serializeWorkspacesPrefs(prefs: WorkspacesPrefs): string {
  return JSON.stringify({
    activeId: prefs.activeId,
    custom: prefs.custom
      ? {
          ...prefs.custom,
          panels: { ...prefs.custom.panels },
          widths: {
            left: clampPanelWidth(prefs.custom.widths.left),
            right: clampPanelWidth(prefs.custom.widths.right),
          },
        }
      : null,
  })
}

export function loadWorkspacesPrefs(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined'
    ? null
    : localStorage,
): WorkspacesPrefs {
  if (!storage) return { ...DEFAULT_WORKSPACES_PREFS }
  try {
    return parseWorkspacesPrefs(storage.getItem(WORKSPACE_STORAGE_KEY))
  } catch {
    return { ...DEFAULT_WORKSPACES_PREFS }
  }
}

export function saveWorkspacesPrefs(
  prefs: WorkspacesPrefs,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined'
    ? null
    : localStorage,
): void {
  if (!storage) return
  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, serializeWorkspacesPrefs(prefs))
  } catch {
    /* ignore quota / private-mode errors */
  }
}
