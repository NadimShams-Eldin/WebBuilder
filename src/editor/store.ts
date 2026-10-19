import { create } from 'zustand'
import {
  loadChromePrefs,
  saveChromePrefs,
  type EditorTheme,
  type Locale,
} from './chromePrefs.ts'
import { addAssetToProject, readFileAsAsset, removeAssetFromProject } from './assets.ts'
import { createDemoProject } from './demoProject.ts'
import { isDemoRequest } from './demoMode.ts'
import {
  clampPanelFontScale,
  clampPanelWidth,
  cloneLayout,
  DEFAULT_LAYOUT,
  loadLayoutPrefs,
  saveLayoutPrefs,
  type Density,
  type EditorLayout,
  type EditorPanels,
  type LeftTab,
  type PanelId,
  type PanelWidths,
  type RightTab,
} from './layoutPrefs.ts'
import {
  CUSTOM_WORKSPACE_ID,
  findWorkspace,
  loadWorkspacesPrefs,
  matchingWorkspaceId,
  saveWorkspacesPrefs,
  workspaceList,
  type WorkspacePreset,
} from './workspaces.ts'
import { loadPersistedSession, savePersistedSession } from './persist.ts'
import { parseProjectJson, serializeProject } from './projectJson.ts'
import {
  canRedo,
  canUndo,
  emptyHistory,
  pushHistory,
  redoHistory,
  shouldCoalesceUpdate,
  snapshotOf,
  undoHistory,
  type CoalesceState,
  type HistoryState,
} from './history.ts'
import { translate } from './i18n.ts'
import {
  addPageToProject,
  removePageFromProject,
  renamePageInProject,
  resolvePage,
  setPageSlugInProject,
} from './pages.ts'
import {
  createComponentFromNode,
  deleteComponent,
  detachInstance,
  insertComponentInstance,
  renameComponent,
  updateComponentInstances,
} from './components.ts'
import {
  addNodeToProject,
  clearPageInProject,
  findNode,
  findParent,
  getAncestorIds,
  insertAtDropInProject,
  moveNodeInProject,
  duplicateNodeInProject,
  removeNodeInProject,
  updateNodeInProject,
  wrapNodeInProject,
  type DropIntent,
  type NodePatch,
} from './tree.ts'
import type { Asset, NodeStyle, NodeType, Page, Project } from './types.ts'
import {
  clampZoom,
  DEVICE_WIDTHS,
  loadViewportPrefs,
  saveViewportPrefs,
  type Device,
} from './viewport.ts'

export type { Device }
export { DEVICE_WIDTHS }

export type { LeftTab, RightTab } from './layoutPrefs.ts'

export type WorkspaceMode = 'compose' | 'preview'

export type EditorState = {
  project: Project
  selectedId: string | null
  activePageId: string | null
  paletteOpen: boolean
  shortcutsOpen: boolean
  demoMode: boolean
  device: Device
  zoom: number
  lastInsertError: string | null
  workspace: WorkspaceMode
  rightTab: RightTab
  leftTab: LeftTab
  panels: EditorPanels
  panelWidths: PanelWidths
  gridOverlay: boolean
  density: Density
  panelFontScale: number
  activeWorkspaceId: string
  hasCustomWorkspace: boolean
  dropPreview: DropIntent | null
  history: HistoryState
  theme: EditorTheme
  locale: Locale
  setProject: (project: Project) => void
  setSelectedId: (id: string | null) => void
  setActivePage: (pageId: string) => void
  setPaletteOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setDevice: (device: Device) => void
  setZoom: (zoom: number) => void
  setWorkspace: (mode: WorkspaceMode) => void
  setRightTab: (tab: RightTab) => void
  setLeftTab: (tab: LeftTab) => void
  setPanelVisible: (panel: PanelId, visible: boolean) => void
  setPanelWidth: (panel: PanelId, width: number) => void
  togglePanel: (panel: PanelId) => void
  setGridOverlay: (on: boolean) => void
  toggleGridOverlay: () => void
  resetLayout: () => void
  setDensity: (density: Density) => void
  setPanelFontScale: (scale: number) => void
  applyWorkspace: (id: string) => boolean
  saveCustomWorkspace: () => void
  workspacePresets: () => WorkspacePreset[]
  setDropPreview: (preview: DropIntent | null) => void
  setTheme: (theme: EditorTheme) => void
  setLocale: (locale: Locale) => void
  addBlock: (type: NodeType) => boolean
  dropBlock: (type: NodeType, intent: DropIntent) => boolean
  moveNodeTo: (nodeId: string, intent: DropIntent) => boolean
  updateSelected: (patch: NodePatch) => void
  updateNodeById: (id: string, patch: NodePatch) => void
  duplicateSelected: () => boolean
  deleteSelected: () => boolean
  duplicateNodes: (ids: string[]) => boolean
  deleteNodes: (ids: string[]) => boolean
  wrapSelected: (type: NodeType) => boolean
  createComponentFromSelected: (name?: string) => boolean
  insertComponent: (componentId: string) => boolean
  detachSelectedComponent: () => boolean
  renameComponentDef: (componentId: string, name: string) => boolean
  deleteComponentDef: (componentId: string) => boolean
  styleClipboard: NodeStyle | null
  copySelectedStyle: () => boolean
  pasteStyleToSelected: () => boolean
  selectParentOfSelected: () => boolean
  selectFirstChildOfSelected: () => boolean
  clearPage: () => boolean
  addPage: (name?: string) => boolean
  removePage: (pageId?: string) => boolean
  renamePage: (pageId: string, name: string) => boolean
  setPageSlug: (pageId: string, slug: string) => boolean
  loadDemo: () => void
  importProjectJson: (raw: string) => boolean
  exportProjectJson: () => string
  exportSiteZip: () => Promise<boolean>
  addAsset: (file: File) => Promise<Asset | null>
  removeAsset: (assetId: string) => boolean
  undo: () => boolean
  redo: () => boolean
}

let coalesce: CoalesceState = null

export const useEditorStore = create<EditorState>((set, get) => {
  const commit = (
    patch: { project: Project; selectedId?: string | null; activePageId?: string | null } & Record<
      string,
      unknown
    >,
    coalesceId?: string | null,
  ) => {
    const state = get()
    const selectedId = patch.selectedId !== undefined ? patch.selectedId : state.selectedId
    const activePageId = patch.activePageId !== undefined ? patch.activePageId : state.activePageId
    const now = Date.now()
    const reuse = Boolean(coalesceId) && shouldCoalesceUpdate(coalesce, coalesceId ?? null, now)
    const history = reuse
      ? state.history
      : pushHistory(state.history, snapshotOf(state.project, state.selectedId, state.activePageId))
    coalesce = coalesceId ? { kind: 'update', id: coalesceId, at: now } : null
    set({ ...patch, selectedId, activePageId, history })
    persistProject({ project: patch.project, activePageId })
  }

  const initialViewport = loadViewportPrefs()
  const initialChrome = loadChromePrefs()
  const initialLayout = loadLayoutPrefs()
  const initialWorkspaces = loadWorkspacesPrefs()
  let customWorkspace = initialWorkspaces.custom
  const activeWorkspaceId =
    matchingWorkspaceId(initialLayout, initialWorkspaces.custom) ?? initialWorkspaces.activeId
  const persistChrome = (theme: EditorTheme, locale: Locale) => {
    saveChromePrefs({ theme, locale })
  }
  const layoutOf = (state: EditorState): EditorLayout => ({
    panels: state.panels,
    widths: state.panelWidths,
    gridOverlay: state.gridOverlay,
    leftTab: state.leftTab,
    rightTab: state.rightTab,
    density: state.density,
    panelFontScale: state.panelFontScale,
  })
  const persistLayout = (state: EditorState) => {
    const layout = layoutOf(state)
    saveLayoutPrefs(layout)
    const match = workspaceList(customWorkspace).find(
      (item) => JSON.stringify(item.layout) === JSON.stringify(layout),
    )
    if (match && match.id !== state.activeWorkspaceId) set({ activeWorkspaceId: match.id })
  }
  const demoMode = isDemoRequest(
    typeof window === 'undefined' ? '' : window.location.search,
  )
  const persisted = demoMode ? null : loadPersistedSession()
  const initialProject = persisted?.project ?? createDemoProject()
  const persistProject = (session: { project: Project; activePageId: string | null }) => {
    if (demoMode) return
    savePersistedSession(session)
  }

  return {
    project: initialProject,
    selectedId: null,
    activePageId: persisted?.activePageId ?? initialProject.pages[0]?.id ?? null,
    paletteOpen: false,
    shortcutsOpen: false,
    demoMode,
    device: initialViewport.device,
    zoom: initialViewport.zoom,
    lastInsertError: null,
    workspace: 'compose',
    rightTab: initialLayout.rightTab,
    leftTab: initialLayout.leftTab,
    panels: initialLayout.panels,
    panelWidths: initialLayout.widths,
    gridOverlay: initialLayout.gridOverlay,
    density: initialLayout.density,
    panelFontScale: initialLayout.panelFontScale,
    activeWorkspaceId,
    hasCustomWorkspace: customWorkspace !== null,
    dropPreview: null,
    history: emptyHistory(),
    theme: initialChrome.theme,
    locale: initialChrome.locale,
    setProject: (project) => {
      commit({
        project,
        activePageId: project.pages[0]?.id ?? null,
        selectedId: null,
        lastInsertError: null,
      })
    },
    setSelectedId: (selectedId) => {
      coalesce = null
      set({ selectedId, lastInsertError: null })
    },
    setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
    setActivePage: (pageId) => {
      const state = get()
      const page = resolvePage(state.project, pageId)
      if (!page) return
      coalesce = null
      set({ activePageId: page.id, selectedId: null, lastInsertError: null, dropPreview: null })
      persistProject({ project: state.project, activePageId: page.id })
    },
    setDevice: (device) => {
      saveViewportPrefs({ device, zoom: get().zoom })
      set({ device })
    },
    setZoom: (zoom) => {
      const next = clampZoom(zoom)
      saveViewportPrefs({ device: get().device, zoom: next })
      set({ zoom: next })
    },
    setWorkspace: (workspace) => {
      coalesce = null
      if (workspace === 'preview') {
        set({ workspace, selectedId: null, dropPreview: null, lastInsertError: null })
        return
      }
      set({ workspace })
    },
    setRightTab: (rightTab) => {
      set({ rightTab })
      persistLayout(get())
    },
    setLeftTab: (leftTab) => {
      set({ leftTab })
      persistLayout(get())
    },
    setPanelVisible: (panel, visible) => {
      set({ panels: { ...get().panels, [panel]: visible } })
      persistLayout(get())
    },
    setPanelWidth: (panel, width) => {
      const panelWidths = { ...get().panelWidths, [panel]: clampPanelWidth(width) }
      set({ panelWidths })
      persistLayout(get())
    },
    togglePanel: (panel) => {
      const panels = get().panels
      set({ panels: { ...panels, [panel]: !panels[panel] } })
      persistLayout(get())
    },
    setGridOverlay: (gridOverlay) => {
      set({ gridOverlay })
      persistLayout(get())
    },
    toggleGridOverlay: () => {
      set({ gridOverlay: !get().gridOverlay })
      persistLayout(get())
    },
    resetLayout: () => {
      const layout = cloneLayout(DEFAULT_LAYOUT)
      set({
        panels: layout.panels,
        panelWidths: layout.widths,
        gridOverlay: layout.gridOverlay,
        leftTab: layout.leftTab,
        rightTab: layout.rightTab,
        density: layout.density,
        panelFontScale: layout.panelFontScale,
        activeWorkspaceId: matchingWorkspaceId(layout, customWorkspace) ?? 'design',
      })
      persistLayout(get())
    },
    setDensity: (density) => {
      set({ density })
      persistLayout(get())
    },
    setPanelFontScale: (scale) => {
      set({ panelFontScale: clampPanelFontScale(scale) })
      persistLayout(get())
    },
    applyWorkspace: (id) => {
      const preset = findWorkspace(id, customWorkspace)
      if (!preset) return false
      const layout = cloneLayout(preset.layout)
      set({
        panels: layout.panels,
        panelWidths: layout.widths,
        gridOverlay: layout.gridOverlay,
        leftTab: layout.leftTab,
        rightTab: layout.rightTab,
        density: layout.density,
        panelFontScale: layout.panelFontScale,
        activeWorkspaceId: preset.id,
      })
      persistLayout(get())
      saveWorkspacesPrefs({ activeId: preset.id, custom: customWorkspace })
      return true
    },
    saveCustomWorkspace: () => {
      customWorkspace = cloneLayout(layoutOf(get()))
      set({
        hasCustomWorkspace: true,
        activeWorkspaceId: CUSTOM_WORKSPACE_ID,
      })
      saveWorkspacesPrefs({ activeId: CUSTOM_WORKSPACE_ID, custom: customWorkspace })
    },
    workspacePresets: () => workspaceList(customWorkspace),
    setDropPreview: (dropPreview) => set({ dropPreview }),
    setTheme: (theme) => {
      persistChrome(theme, get().locale)
      set({ theme })
    },
    setLocale: (locale) => {
      persistChrome(get().theme, locale)
      set({ locale })
    },
    addBlock: (type) => {
      const { project, selectedId, activePageId, locale } = get()
      const result = addNodeToProject(project, selectedId, type, activePageId)
      if (!result) {
        set({ lastInsertError: translate(locale, 'error.insert') })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.node.id,
        lastInsertError: null,
      })
      return true
    },
    dropBlock: (type, intent) => {
      const { project, activePageId, locale } = get()
      const result = insertAtDropInProject(project, type, intent, activePageId)
      if (!result) {
        set({ lastInsertError: translate(locale, 'error.drop'), dropPreview: null })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.node.id,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    moveNodeTo: (nodeId, intent) => {
      const { project, activePageId, locale } = get()
      const next = moveNodeInProject(project, nodeId, intent, activePageId)
      if (!next) {
        set({ lastInsertError: translate(locale, 'error.move'), dropPreview: null })
        return false
      }
      commit({
        project: next,
        selectedId: nodeId,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    updateSelected: (patch) => {
      const { selectedId } = get()
      if (selectedId) get().updateNodeById(selectedId, patch)
    },
    updateNodeById: (id, patch) => {
      const { project, activePageId } = get()
      const linked = updateComponentInstances(project, id, patch, activePageId)
      const next = linked ?? updateNodeInProject(project, id, patch, activePageId)
      if (next) commit({ project: next, selectedId: id }, id)
    },
    duplicateNodes: (ids) => {
      const { project, activePageId } = get()
      if (ids.length === 0) return false
      let next = project
      const created: string[] = []
      for (const id of ids) {
        const result = duplicateNodeInProject(next, id, activePageId)
        if (!result) continue
        next = result.project
        created.push(result.node.id)
      }
      if (created.length === 0) return false
      commit({
        project: next,
        selectedId: created[created.length - 1],
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    duplicateSelected: () => {
      const { selectedId } = get()
      return selectedId ? get().duplicateNodes([selectedId]) : false
    },
    deleteNodes: (ids) => {
      const { project, activePageId, locale } = get()
      if (ids.length === 0) return false
      const page = resolvePage(project, activePageId)
      const root = page?.root ?? null
      const ordered = root
        ? [...ids].sort((a, b) => getAncestorIds(root, b).length - getAncestorIds(root, a).length)
        : [...ids]
      let next = project
      let removed = false
      for (const id of ordered) {
        const result = removeNodeInProject(next, id, activePageId)
        if (result) {
          next = result.project
          removed = true
        }
      }
      if (!removed) {
        set({ lastInsertError: translate(locale, 'error.deleteRoot') })
        return false
      }
      const primaryId = ids[ids.length - 1]
      const parentCandidate = page && primaryId ? findParent(page.root, primaryId) : null
      const nextPage = resolvePage(next, activePageId)
      const parent =
        parentCandidate && nextPage && findNode(nextPage.root, parentCandidate.id)
          ? parentCandidate
          : null
      commit({
        project: next,
        selectedId: parent?.id ?? null,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    deleteSelected: () => {
      const { selectedId } = get()
      return selectedId ? get().deleteNodes([selectedId]) : false
    },
    wrapSelected: (type) => {
      const { project, selectedId, activePageId } = get()
      if (!selectedId) return false
      const result = wrapNodeInProject(project, selectedId, type, activePageId)
      if (!result) return false
      commit({
        project: result.project,
        selectedId: result.wrapper.id,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    createComponentFromSelected: (name) => {
      const { project, selectedId, activePageId, locale } = get()
      if (!selectedId) return false
      const result = createComponentFromNode(project, selectedId, activePageId, name)
      if (!result) {
        set({ lastInsertError: translate(locale, 'error.component') })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.node.id,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    insertComponent: (componentId) => {
      const { project, selectedId, activePageId, locale } = get()
      const result = insertComponentInstance(project, componentId, selectedId, activePageId)
      if (!result) {
        set({ lastInsertError: translate(locale, 'error.insert') })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.node.id,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    detachSelectedComponent: () => {
      const { project, selectedId, activePageId } = get()
      if (!selectedId) return false
      const next = detachInstance(project, selectedId, activePageId)
      if (!next) return false
      commit({ project: next, selectedId, lastInsertError: null, dropPreview: null })
      return true
    },
    renameComponentDef: (componentId, name) => {
      const { project } = get()
      const next = renameComponent(project, componentId, name)
      if (!next) return false
      commit({ project: next })
      return true
    },
    deleteComponentDef: (componentId) => {
      const { project } = get()
      const next = deleteComponent(project, componentId)
      if (!next) return false
      commit({ project: next })
      return true
    },
    styleClipboard: null,
    copySelectedStyle: () => {
      const { project, selectedId, activePageId } = get()
      const page = resolvePage(project, activePageId)
      const node = page && selectedId ? findNode(page.root, selectedId) : null
      if (!node) return false
      set({ styleClipboard: { ...node.style } })
      return true
    },
    pasteStyleToSelected: () => {
      const { styleClipboard, selectedId } = get()
      if (!styleClipboard || !selectedId) return false
      get().updateNodeById(selectedId, { style: { ...styleClipboard } })
      return true
    },
    selectParentOfSelected: () => {
      const { project, activePageId, selectedId } = get()
      if (!selectedId) return false
      const page = resolvePage(project, activePageId)
      if (!page || page.root.id === selectedId) return false
      const parent = findParent(page.root, selectedId)
      if (!parent) return false
      set({ selectedId: parent.id, lastInsertError: null, dropPreview: null })
      return true
    },
    selectFirstChildOfSelected: () => {
      const { project, activePageId, selectedId } = get()
      if (!selectedId) return false
      const page = resolvePage(project, activePageId)
      const node = page ? findNode(page.root, selectedId) : null
      const child = node?.children[0]
      if (!child) return false
      set({ selectedId: child.id, lastInsertError: null, dropPreview: null })
      return true
    },
    clearPage: () => {
      const { project, activePageId } = get()
      const page = resolvePage(project, activePageId)
      if (!page) return false
      const next = clearPageInProject(project, page.id)
      if (!next) return false
      commit({
        project: next,
        selectedId: page.root.id,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    addPage: (name) => {
      const { project, locale } = get()
      const label = name?.trim() || translate(locale, 'pages.new')
      const result = addPageToProject(project, label)
      commit({
        project: result.project,
        activePageId: result.page.id,
        selectedId: null,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    removePage: (pageId) => {
      const { project, activePageId, locale } = get()
      const result = removePageFromProject(project, pageId ?? activePageId ?? '')
      if (!result) {
        set({ lastInsertError: translate(locale, 'error.deleteLastPage') })
        return false
      }
      commit({
        project: result.project,
        activePageId: result.activePageId,
        selectedId: null,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    renamePage: (pageId, name) => {
      const { project } = get()
      const next = renamePageInProject(project, pageId, name)
      if (!next) return false
      commit({ project: next })
      return true
    },
    setPageSlug: (pageId, slug) => {
      const { project } = get()
      const next = setPageSlugInProject(project, pageId, slug)
      if (!next) return false
      commit({ project: next })
      return true
    },
    loadDemo: () => {
      const project = createDemoProject()
      commit({
        project,
        activePageId: project.pages[0]?.id ?? null,
        selectedId: null,
        lastInsertError: null,
        dropPreview: null,
      })
    },
    importProjectJson: (raw) => {
      const { locale } = get()
      const parsed = parseProjectJson(raw)
      if (!parsed.ok) {
        set({ lastInsertError: translate(locale, `error.import.${parsed.error}`) })
        return false
      }
      commit({
        project: parsed.project,
        activePageId: parsed.project.pages[0]?.id ?? null,
        selectedId: null,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    exportProjectJson: () => serializeProject(get().project),
    exportSiteZip: async () => {
      const { project, locale } = get()
      try {
        const { downloadSiteZip } = await import('../export/zip.ts')
        await downloadSiteZip(project)
        set({ lastInsertError: null })
        return true
      } catch {
        set({ lastInsertError: translate(locale, 'error.export.failed') })
        return false
      }
    },
    addAsset: async (file) => {
      const { project, locale } = get()
      const result = await readFileAsAsset(file)
      if (!result.ok) {
        set({ lastInsertError: translate(locale, `error.asset.${result.error}`) })
        return null
      }
      const next = addAssetToProject(project, result.asset)
      const asset = next.assets[next.assets.length - 1]
      commit({ project: next, lastInsertError: null })
      return asset
    },
    removeAsset: (assetId) => {
      const { project } = get()
      if (!project.assets.some((asset) => asset.id === assetId)) return false
      commit({ project: removeAssetFromProject(project, assetId) })
      return true
    },
    undo: () => {
      const state = get()
      const result = undoHistory(
        state.history,
        snapshotOf(state.project, state.selectedId, state.activePageId),
      )
      if (!result) return false
      coalesce = null
      set({
        project: result.snapshot.project,
        selectedId: result.snapshot.selectedId,
        activePageId: result.snapshot.activePageId,
        history: result.history,
        lastInsertError: null,
        dropPreview: null,
      })
      persistProject({
        project: result.snapshot.project,
        activePageId: result.snapshot.activePageId,
      })
      return true
    },
    redo: () => {
      const state = get()
      const result = redoHistory(
        state.history,
        snapshotOf(state.project, state.selectedId, state.activePageId),
      )
      if (!result) return false
      coalesce = null
      set({
        project: result.snapshot.project,
        selectedId: result.snapshot.selectedId,
        activePageId: result.snapshot.activePageId,
        history: result.history,
        lastInsertError: null,
        dropPreview: null,
      })
      persistProject({
        project: result.snapshot.project,
        activePageId: result.snapshot.activePageId,
      })
      return true
    },
  }
})

export function getActivePage(project: Project, activePageId?: string | null): Page | undefined {
  return resolvePage(project, activePageId)
}

export function selectActivePage(state: EditorState): Page | undefined {
  return resolvePage(state.project, state.activePageId)
}

export function selectCanUndo(state: EditorState): boolean {
  return canUndo(state.history)
}

export function selectCanRedo(state: EditorState): boolean {
  return canRedo(state.history)
}
