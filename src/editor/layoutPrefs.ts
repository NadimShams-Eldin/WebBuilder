export const LEFT_TABS = ['content', 'style', 'animation', 'interactions'] as const
export type LeftTab = (typeof LEFT_TABS)[number]

export const RIGHT_TABS = ['blocks', 'outline', 'extracted', 'components'] as const
export type RightTab = (typeof RIGHT_TABS)[number]

export type PanelId = 'left' | 'right'

export type EditorPanels = {
  left: boolean
  right: boolean
}

export type PanelWidths = {
  left: number
  right: number
}

export const DENSITIES = ['comfortable', 'compact'] as const
export type Density = (typeof DENSITIES)[number]

export const PANEL_FONT_SCALES = [0.9, 1, 1.1] as const

export type EditorLayout = {
  panels: EditorPanels
  widths: PanelWidths
  gridOverlay: boolean
  leftTab: LeftTab
  rightTab: RightTab
  density: Density
  panelFontScale: number
}

export const LAYOUT_STORAGE_KEY = 'qitma-layout'

export const PANEL_MIN_WIDTH = 200
export const PANEL_MAX_WIDTH = 480
export const PANEL_DEFAULT_WIDTH = 288

export const DEFAULT_LAYOUT: EditorLayout = {
  panels: { left: true, right: true },
  widths: { left: PANEL_DEFAULT_WIDTH, right: PANEL_DEFAULT_WIDTH },
  gridOverlay: false,
  leftTab: 'content',
  rightTab: 'blocks',
  density: 'comfortable',
  panelFontScale: 1,
}

export function clampPanelWidth(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return PANEL_DEFAULT_WIDTH
  return Math.round(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, value)))
}

export function isDensity(value: unknown): value is Density {
  return (DENSITIES as readonly string[]).includes(String(value))
}

export function clampPanelFontScale(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_LAYOUT.panelFontScale
  return Math.min(PANEL_FONT_SCALES[PANEL_FONT_SCALES.length - 1], Math.max(PANEL_FONT_SCALES[0], value))
}

export function isLeftTab(value: unknown): value is LeftTab {
  return (LEFT_TABS as readonly string[]).includes(String(value))
}

export function isRightTab(value: unknown): value is RightTab {
  return (RIGHT_TABS as readonly string[]).includes(String(value))
}

export function isPanelId(value: unknown): value is PanelId {
  return value === 'left' || value === 'right'
}

export function cloneLayout(layout: EditorLayout): EditorLayout {
  return {
    panels: { ...layout.panels },
    widths: { ...layout.widths },
    gridOverlay: layout.gridOverlay,
    leftTab: layout.leftTab,
    rightTab: layout.rightTab,
    density: layout.density,
    panelFontScale: layout.panelFontScale,
  }
}

export function coerceLayout(value: unknown): EditorLayout {
  const parsed = (value ?? {}) as {
    panels?: { left?: unknown; right?: unknown }
    widths?: { left?: unknown; right?: unknown }
    gridOverlay?: unknown
    leftTab?: unknown
    rightTab?: unknown
    density?: unknown
    panelFontScale?: unknown
  }
  return {
    panels: {
      left: typeof parsed.panels?.left === 'boolean' ? parsed.panels.left : DEFAULT_LAYOUT.panels.left,
      right:
        typeof parsed.panels?.right === 'boolean' ? parsed.panels.right : DEFAULT_LAYOUT.panels.right,
    },
    widths: {
      left: clampPanelWidth(parsed.widths?.left),
      right: clampPanelWidth(parsed.widths?.right),
    },
    gridOverlay:
      typeof parsed.gridOverlay === 'boolean' ? parsed.gridOverlay : DEFAULT_LAYOUT.gridOverlay,
    leftTab: isLeftTab(parsed.leftTab) ? parsed.leftTab : DEFAULT_LAYOUT.leftTab,
    rightTab: isRightTab(parsed.rightTab) ? parsed.rightTab : DEFAULT_LAYOUT.rightTab,
    density: isDensity(parsed.density) ? parsed.density : DEFAULT_LAYOUT.density,
    panelFontScale: clampPanelFontScale(parsed.panelFontScale),
  }
}

export function parseLayoutPrefs(raw: string | null): EditorLayout {
  if (!raw) return cloneLayout(DEFAULT_LAYOUT)
  try {
    return coerceLayout(JSON.parse(raw))
  } catch {
    return cloneLayout(DEFAULT_LAYOUT)
  }
}

export function serializeLayoutPrefs(layout: EditorLayout): string {
  return JSON.stringify(layout)
}

export function loadLayoutPrefs(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): EditorLayout {
  if (!storage) return cloneLayout(DEFAULT_LAYOUT)
  try {
    return parseLayoutPrefs(storage.getItem(LAYOUT_STORAGE_KEY))
  } catch {
    return cloneLayout(DEFAULT_LAYOUT)
  }
}

export function saveLayoutPrefs(
  layout: EditorLayout,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): void {
  if (!storage) return
  try {
    storage.setItem(LAYOUT_STORAGE_KEY, serializeLayoutPrefs(layout))
  } catch {
    /* ignore quota / private-mode errors */
  }
}
