import { create } from 'zustand'
import {
  loadChromePrefs,
  saveChromePrefs,
  type EditorTheme,
  type Locale,
} from './chromePrefs.ts'
import { addAssetToProject, readFileAsAsset, removeAssetFromProject } from './assets.ts'
import { createDemoProject } from './demoProject.ts'
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
  addNodeToProject,
  clearPageInProject,
  insertAtDropInProject,
  moveNodeInProject,
  removeNodeInProject,
  updateNodeInProject,
  type DropIntent,
  type NodePatch,
} from './tree.ts'
import type { Asset, NodeType, Page, Project } from './types.ts'
import {
  clampZoom,
  DEVICE_WIDTHS,
  loadViewportPrefs,
  saveViewportPrefs,
  type Device,
} from './viewport.ts'

export type { Device }
export { DEVICE_WIDTHS }

export type RightTab = 'blocks' | 'outline' | 'extracted'

export type EditorState = {
  project: Project
  selectedId: string | null
  activePageId: string | null
  device: Device
  zoom: number
  lastInsertError: string | null
  rightTab: RightTab
  dropPreview: DropIntent | null
  history: HistoryState
  theme: EditorTheme
  locale: Locale
  setProject: (project: Project) => void
  setSelectedId: (id: string | null) => void
  setActivePage: (pageId: string) => void
  setDevice: (device: Device) => void
  setZoom: (zoom: number) => void
  setRightTab: (tab: RightTab) => void
  setDropPreview: (preview: DropIntent | null) => void
  setTheme: (theme: EditorTheme) => void
  setLocale: (locale: Locale) => void
  addBlock: (type: NodeType) => boolean
  dropBlock: (type: NodeType, intent: DropIntent) => boolean
  moveNodeTo: (nodeId: string, intent: DropIntent) => boolean
  updateSelected: (patch: NodePatch) => void
  updateNodeById: (id: string, patch: NodePatch) => void
  deleteSelected: () => boolean
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
    savePersistedSession({ project: patch.project, activePageId })
  }

  const initialViewport = loadViewportPrefs()
  const initialChrome = loadChromePrefs()
  const persistChrome = (theme: EditorTheme, locale: Locale) => {
    saveChromePrefs({ theme, locale })
  }
  const persisted = loadPersistedSession()
  const initialProject = persisted?.project ?? createDemoProject()

  return {
    project: initialProject,
    selectedId: null,
    activePageId: persisted?.activePageId ?? initialProject.pages[0]?.id ?? null,
    device: initialViewport.device,
    zoom: initialViewport.zoom,
    lastInsertError: null,
    rightTab: 'blocks',
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
    setActivePage: (pageId) => {
      const state = get()
      const page = resolvePage(state.project, pageId)
      if (!page) return
      coalesce = null
      set({ activePageId: page.id, selectedId: null, lastInsertError: null, dropPreview: null })
      savePersistedSession({ project: state.project, activePageId: page.id })
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
    setRightTab: (rightTab) => set({ rightTab }),
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
      const { project, selectedId, activePageId } = get()
      if (!selectedId) return
      const next = updateNodeInProject(project, selectedId, patch, activePageId)
      if (next) commit({ project: next }, selectedId)
    },
    updateNodeById: (id, patch) => {
      const { project, activePageId } = get()
      const next = updateNodeInProject(project, id, patch, activePageId)
      if (next) commit({ project: next, selectedId: id }, id)
    },
    deleteSelected: () => {
      const { project, selectedId, activePageId, locale } = get()
      if (!selectedId) return false
      const result = removeNodeInProject(project, selectedId, activePageId)
      if (!result) {
        set({ lastInsertError: translate(locale, 'error.deleteRoot') })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.parentId,
        lastInsertError: null,
        dropPreview: null,
      })
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
      savePersistedSession({
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
      savePersistedSession({
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
